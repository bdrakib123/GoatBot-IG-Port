import logger from './Logger.js';
import { sleep, withTimeout, withRetry, classifyError, exponentialBackoff, formatUptime } from './utils.js';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import sharp from 'sharp';
import axios from 'axios';
const SEEN_IDS_MAX = 5000;
const SEEN_IDS_EVICT = 2500;
const POLL_TIMEOUT_MS = 20000;
export default class DirectMessageV2 {
    constructor(client) {
        this.client = client;
        this.ig = client.getIgClient();
        this.isPolling = false;
        this.pollingInterval = 5000;
        this.seenMessageIds = new Set();
        this.seenIdTimestamps = new Map();
        this.threadLastItemMap = new Map();
        this.replyHandlers = new Map();
        this.isSeeded = false;
        this._shutdownBound = false;
        this._stats = {
            startedAt: null,
            totalPolls: 0,
            totalErrors: 0,
            consecutiveErrors: 0,
            lastPollAt: null,
            lastErrorAt: null,
            lastErrorMsg: null,
            circuitOpen: false,
            circuitOpenedAt: null,
            currentInterval: 5000,
        };
    }
    getPollingStats() {
        const uptime = this._stats.startedAt ? Date.now() - this._stats.startedAt : 0;
        return {
            ...this._stats,
            uptime,
            uptimeFormatted: formatUptime(uptime),
            seenIdCount: this.seenMessageIds.size,
            replyHandlerCount: this.replyHandlers.size,
            trackedThreads: this.threadLastItemMap.size,
        };
    }
    _parseResult(result) {
        if (!result)
            return result;
        if (result.payload) {
            return {
                ...result,
                item_id: result.payload.item_id || result.item_id,
                thread_id: result.payload.thread_id || result.thread_id,
                timestamp: result.payload.timestamp || result.timestamp,
            };
        }
        return result;
    }
    _trackSeen(itemId) {
        if (!itemId)
            return;
        this.seenMessageIds.add(itemId);
        this.seenIdTimestamps.set(itemId, Date.now());
        this._evictOldSeenIds();
    }
    _evictOldSeenIds() {
        if (this.seenMessageIds.size <= SEEN_IDS_MAX)
            return;
        const sorted = [...this.seenIdTimestamps.entries()]
            .sort((a, b) => a[1] - b[1])
            .slice(0, SEEN_IDS_EVICT);
        for (const [id] of sorted) {
            this.seenMessageIds.delete(id);
            this.seenIdTimestamps.delete(id);
        }
        logger.debug(`Evicted ${SEEN_IDS_EVICT} old seen IDs (${this.seenMessageIds.size} remaining)`);
    }
    _registerShutdownHandlers() {
        if (this._shutdownBound)
            return;
        this._shutdownBound = true;
        const shutdown = async (signal) => {
            logger.warn(`Received ${signal} — stopping bot gracefully...`);
            this.stopPolling();
            this.client.emit('shutdown', { signal });
            await sleep(500);
            process.exit(0);
        };
        process.once('SIGTERM', () => shutdown('SIGTERM'));
        process.once('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught exception:', err.message);
            this.client.emit('error', err);
        });
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection:', String(reason));
            this.client.emit('error', new Error(String(reason)));
        });
    }
    async getInbox(options = {}) {
        try {
            const inboxFeed = this.ig.feed.directInbox();
            const threads = await withTimeout(inboxFeed.items(), POLL_TIMEOUT_MS, 'getInbox');
            return {
                threads,
                has_older: inboxFeed.moreAvailable || false,
                cursor: inboxFeed.cursor || null,
                unseen_count: threads.filter(t => {
                    const last = t.items?.[0] || t.last_permanent_item;
                    return last?.user_id && last.user_id.toString() !== this.client.userId;
                }).length,
                pending_requests_total: 0,
            };
        }
        catch (error) {
            logger.error('Failed to get inbox:', error.message);
            return { threads: [], has_older: false, cursor: null, unseen_count: 0, pending_requests_total: 0 };
        }
    }
    async getFullInbox(maxPages = 5) {
        const inboxFeed = this.ig.feed.directInbox();
        const allThreads = [];
        let page = 0;
        do {
            const batch = await inboxFeed.items();
            allThreads.push(...batch);
            page++;
            if (inboxFeed.isMoreAvailable() && page < maxPages)
                await sleep(600);
        } while (inboxFeed.isMoreAvailable() && page < maxPages);
        return { threads: allThreads, total: allThreads.length };
    }
    async getUnreadThreads() {
        const inbox = await this.getInbox();
        return inbox.threads.filter(t => {
            const last = t.items?.[0] || t.last_permanent_item;
            return last?.user_id && last.user_id.toString() !== this.client.userId;
        });
    }
    async getThread(threadId, options = {}) {
        try {
            const threadFeed = this.ig.feed.directThread({
                thread_id: threadId,
                oldest_cursor: options.cursor || undefined,
            });
            const items = await threadFeed.items();
            return {
                thread_id: threadId,
                items,
                has_older: threadFeed.isMoreAvailable(),
                cursor: threadFeed.cursor || null,
                users: [],
            };
        }
        catch (error) {
            logger.error('Failed to get thread:', error.message);
            throw new Error(`Failed to get thread: ${error.message}`);
        }
    }
    async getThreadMessages(threadId, limit = 20) {
        const feed = this.ig.feed.directThread({ thread_id: threadId });
        const items = await feed.items();
        return items.slice(0, limit);
    }
    async getThreadParticipants(threadId) {
        const inbox = await this.getInbox();
        const thread = inbox.threads.find(t => t.thread_id === threadId);
        if (thread)
            return thread.users || [];
        throw new Error('Thread not found in inbox');
    }
    async getThreadIdByUsername(username) {
        const userId = await this.ig.user.getIdByUsername(username);
        const inbox = await this.getInbox();
        const thread = inbox.threads.find(t => t.users?.some(u => u.pk.toString() === userId.toString()));
        if (thread)
            return thread.thread_id;
        const newThread = await this.ig.entity.directThread([userId.toString()]);
        return newThread.threadId || null;
    }
    async createThread(userIds) {
        const ids = (Array.isArray(userIds) ? userIds : [userIds]).map(String);
        const thread = await this.ig.direct.createGroupThread(ids);
        logger.info(`Thread created with users: ${ids.join(', ')}`);
        return thread;
    }
    async sendMessage(threadId, text, options = {}) {
        return withRetry(async () => {
            let raw;
            if (options.replyToItemId) {
                raw = await this.ig.entity.directThread(threadId).broadcastText(text, {
                    replyToMessageId: options.replyToItemId,
                });
            }
            else {
                raw = await this.ig.entity.directThread(threadId).broadcastText(text);
            }
            const result = this._parseResult(raw);
            const itemId = result.item_id;
            if (itemId)
                this._trackSeen(itemId);
            logger.info(`Message sent to thread ${threadId} (item: ${itemId})`);
            return {
                ...result,
                item_id: itemId,
                thread_id: result.thread_id || threadId,
                text,
                timestamp: result.timestamp || Date.now().toString(),
                status: 'sent',
            };
        }, {
            maxRetries: 3, label: 'sendMessage',
            onRetry: ({ attempt, delay, kind }) => logger.warn(`sendMessage retry ${attempt} in ${(delay / 1000).toFixed(1)}s (${kind})`),
        });
    }
    async sendMessageToUser(userId, text, options = {}) {
        return withRetry(async () => {
            const raw = await this.ig.entity.directThread([userId.toString()]).broadcastText(text);
            const result = this._parseResult(raw);
            const itemId = result.item_id;
            if (itemId)
                this._trackSeen(itemId);
            logger.info(`Message sent to user ${userId} (item: ${itemId})`);
            return {
                ...result,
                item_id: itemId,
                thread_id: result.thread_id,
                text,
                timestamp: result.timestamp || Date.now().toString(),
                status: 'sent',
            };
        }, {
            maxRetries: 3, label: 'sendMessageToUser',
            onRetry: ({ attempt, delay }) => logger.warn(`sendMessageToUser retry ${attempt} in ${(delay / 1000).toFixed(1)}s`),
        });
    }
    async sendMessageBulk(threadIds, text, delayBetween = 1500) {
        const results = [];
        for (let i = 0; i < threadIds.length; i++) {
            const threadId = threadIds[i];
            try {
                const result = await this.sendMessage(threadId, text);
                results.push({ threadId, success: true, result });
            }
            catch (error) {
                results.push({ threadId, success: false, error: error.message });
            }
            if (i < threadIds.length - 1 && delayBetween > 0)
                await sleep(delayBetween);
        }
        return results;
    }
    scheduleMessage(threadId, text, delayMs, options = {}) {
        let timerId;
        const promise = new Promise((resolve, reject) => {
            timerId = setTimeout(async () => {
                try {
                    resolve(await this.sendMessage(threadId, text, options));
                }
                catch (err) {
                    reject(err);
                }
            }, delayMs);
        });
        promise.cancel = () => {
            clearTimeout(timerId);
            logger.debug(`Scheduled message to ${threadId} cancelled`);
        };
        return promise;
    }
    async sendMessageWithReply(threadId, text, onReplyCallback, options = {}) {
        const result = await this.sendMessage(threadId, text, options);
        if (result?.item_id && onReplyCallback) {
            this.registerReplyHandler(result.item_id, onReplyCallback, options.replyTimeout || 120000);
        }
        return result;
    }
    async sendMessageToUserWithReply(userId, text, onReplyCallback, options = {}) {
        const result = await this.sendMessageToUser(userId, text, options);
        if (result?.item_id && onReplyCallback) {
            this.registerReplyHandler(result.item_id, onReplyCallback, options.replyTimeout || 120000);
        }
        return result;
    }
    registerReplyHandler(itemId, callback, timeout = 120000) {
        const timerId = setTimeout(() => {
            if (this.replyHandlers.has(itemId)) {
                this.replyHandlers.delete(itemId);
                logger.debug(`Reply handler for ${itemId} expired`);
            }
        }, timeout);
        this.replyHandlers.set(itemId, { callback, timerId, registeredAt: Date.now() });
        logger.debug(`Reply handler registered for ${itemId} (expires in ${timeout / 1000}s)`);
    }
    clearReplyHandler(itemId) {
        const entry = this.replyHandlers.get(itemId);
        if (entry) {
            clearTimeout(entry.timerId);
            this.replyHandlers.delete(itemId);
            return true;
        }
        return false;
    }
    _sweepExpiredReplyHandlers(maxAge = 300000) {
        const now = Date.now();
        let swept = 0;
        for (const [id, entry] of this.replyHandlers) {
            if (now - entry.registeredAt > maxAge) {
                clearTimeout(entry.timerId);
                this.replyHandlers.delete(id);
                swept++;
            }
        }
        if (swept > 0)
            logger.debug(`Swept ${swept} expired reply handlers`);
    }
    async markAsSeen(threadId, itemId) {
        try {
            await this.ig.entity.directThread(threadId).markItemSeen(itemId);
            logger.info(`Marked message ${itemId} as seen`);
        }
        catch (error) {
            logger.error('Failed to mark as seen:', error.message);
            throw new Error(`Failed to mark as seen: ${error.message}`);
        }
    }
    async markAllThreadsSeen() {
        const inbox = await this.getInbox();
        let marked = 0;
        for (const thread of inbox.threads) {
            const lastItem = thread.items?.[0];
            if (lastItem?.item_id) {
                try {
                    await this.markAsSeen(thread.thread_id, lastItem.item_id);
                    marked++;
                    await sleep(300);
                }
                catch (_) { }
            }
        }
        logger.info(`Marked ${marked} threads as seen`);
        return { marked };
    }
    async searchMessages(threadId, query) {
        const thread = await this.getThread(threadId);
        const q = query.toLowerCase();
        return thread.items.filter(item => item.text?.toLowerCase().includes(q));
    }
    async getPendingInbox() {
        try {
            const feed = this.ig.feed.directPending();
            const threads = await feed.items();
            return { threads, has_older: feed.moreAvailable };
        }
        catch (error) {
            logger.error('Failed to get pending inbox:', error.message);
            throw new Error(`Failed to get pending inbox: ${error.message}`);
        }
    }
    async approveThread(threadId) {
        await this.ig.entity.directThread(threadId).approve();
        logger.info(`Thread ${threadId} approved`);
    }
    async declineThread(threadId) {
        await this.ig.entity.directThread(threadId).decline();
        logger.info(`Thread ${threadId} declined`);
    }
    async sendPhoto(threadId, photoPath) {
        return withRetry(async () => {
            const original = readFileSync(photoPath);
            let buf = original;
            try {
                const img = sharp(original);
                const meta = await img.metadata();
                const resizeOpts = (meta.width > 1080 || meta.height > 1080)
                    ? { width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true }
                    : undefined;
                buf = await img.resize(resizeOpts).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
                if (buf.length > 8 * 1024 * 1024) {
                    buf = await sharp(original).resize(resizeOpts).jpeg({ quality: 65, mozjpeg: true }).toBuffer();
                }
            }
            catch (_) {
                buf = original;
            }
            const raw = await this.ig.entity.directThread(threadId).broadcastPhoto({ file: buf });
            const result = this._parseResult(raw);
            if (result.item_id)
                this._trackSeen(result.item_id);
            logger.success(`Photo sent to thread ${threadId}`);
            return result;
        }, {
            maxRetries: 3, label: 'sendPhoto',
            onRetry: ({ attempt, delay }) => logger.warn(`sendPhoto retry ${attempt} in ${(delay / 1000).toFixed(1)}s`),
        });
    }
    async sendPhotoWithCaption(threadId, photoPath, caption = '') {
        const result = await this.sendPhoto(threadId, photoPath);
        if (caption) {
            await sleep(400);
            await this.sendMessage(threadId, caption);
        }
        return result;
    }
    async sendVideo(threadId, videoPath) {
        return withRetry(async () => {
            const raw = await this.ig.entity.directThread(threadId).broadcastVideo({
                video: readFileSync(videoPath),
            });
            const result = this._parseResult(raw);
            if (result.item_id)
                this._trackSeen(result.item_id);
            logger.info(`Video sent to thread ${threadId}`);
            return result;
        }, { maxRetries: 2, label: 'sendVideo' });
    }
    async sendVoiceNote(threadId, audioPath) {
        return withRetry(async () => {
            const raw = await this.ig.entity.directThread(threadId).broadcastVoice({
                file: readFileSync(audioPath),
            });
            const result = this._parseResult(raw);
            if (result.item_id)
                this._trackSeen(result.item_id);
            logger.info(`Voice note sent to thread ${threadId}`);
            return result;
        }, { maxRetries: 2, label: 'sendVoiceNote' });
    }
    async sendSticker(threadId, stickerId) {
        const raw = await this.ig.entity.directThread(threadId).broadcastSticker({ sticker_id: stickerId });
        const result = this._parseResult(raw);
        if (result.item_id)
            this._trackSeen(result.item_id);
        logger.info(`Sticker sent to thread ${threadId}`);
        return result;
    }
    async sendGif(threadId, giphyId) {
        const raw = await this.ig.entity.directThread(threadId).broadcastGiphy({ giphy_id: giphyId });
        const result = this._parseResult(raw);
        if (result.item_id)
            this._trackSeen(result.item_id);
        logger.info(`GIF sent to thread ${threadId}`);
        return result;
    }
    async sendAnimatedMedia(threadId, mediaId) {
        const raw = await this.ig.entity.directThread(threadId).broadcastAnimatedMedia({ media_id: mediaId });
        const result = this._parseResult(raw);
        if (result.item_id)
            this._trackSeen(result.item_id);
        logger.info(`Animated media sent to thread ${threadId}`);
        return result;
    }
    async shareMediaToThread(threadId, mediaId, message = '') {
        const raw = await this.ig.entity.directThread(threadId).broadcastMediaShare({ media_id: mediaId, text: message });
        const result = this._parseResult(raw);
        if (result.item_id)
            this._trackSeen(result.item_id);
        logger.info(`Media shared to thread ${threadId}`);
        return result;
    }
    async sendLink(threadId, linkUrl, linkText = '') {
        const raw = await this.ig.entity.directThread(threadId).broadcastLink(linkUrl, linkText);
        const result = this._parseResult(raw);
        if (result.item_id)
            this._trackSeen(result.item_id);
        logger.info(`Link sent to thread ${threadId}`);
        return result;
    }
    async _downloadToTemp(url, ext, timeoutMs = 45000) {
        const response = await withTimeout(axios.get(url, { responseType: 'arraybuffer', timeout: timeoutMs, headers: { 'User-Agent': 'Mozilla/5.0' } }), timeoutMs + 5000, 'download');
        const path = `/tmp/${ext}_${Date.now()}.${ext}`;
        writeFileSync(path, response.data);
        return path;
    }
    async sendPhotoFromUrl(threadId, photoUrl) {
        const tempFile = await this._downloadToTemp(photoUrl, 'jpg');
        try {
            return await this.sendPhoto(threadId, tempFile);
        }
        finally {
            try {
                unlinkSync(tempFile);
            }
            catch (_) { }
        }
    }
    async sendVideoFromUrl(threadId, videoUrl) {
        const tempFile = await this._downloadToTemp(videoUrl, 'mp4', 90000);
        try {
            return await this.sendVideo(threadId, tempFile);
        }
        finally {
            try {
                unlinkSync(tempFile);
            }
            catch (_) { }
        }
    }
    async getMessageMediaUrl(threadId, itemId) {
        const thread = await this.getThread(threadId);
        const message = thread.items.find(i => i.item_id === itemId);
        if (!message)
            throw new Error(`Message ${itemId} not found`);
        const out = { item_id: itemId, item_type: message.item_type, media: null };
        if (message.media) {
            out.media = { id: message.media.id, media_type: message.media.media_type };
            if (message.media.image_versions2) {
                out.media.images = message.media.image_versions2.candidates.map(c => ({ url: c.url, width: c.width, height: c.height }));
            }
            if (message.media.video_versions) {
                out.media.videos = message.media.video_versions.map(v => ({ url: v.url, width: v.width, height: v.height, type: v.type }));
            }
            if (message.media.carousel_media) {
                out.media.carousel = message.media.carousel_media.map(i => {
                    const c = { id: i.id };
                    if (i.image_versions2)
                        c.images = i.image_versions2.candidates;
                    if (i.video_versions)
                        c.videos = i.video_versions;
                    return c;
                });
            }
        }
        return out;
    }
    async downloadMessageMedia(threadId, itemId, savePath = null) {
        const info = await this.getMessageMediaUrl(threadId, itemId);
        if (!info.media)
            throw new Error('No media in this message');
        let url = null, ext = 'jpg';
        if (info.media.videos?.length) {
            url = info.media.videos[0].url;
            ext = 'mp4';
        }
        else if (info.media.images?.length) {
            url = info.media.images[0].url;
        }
        else
            throw new Error('No downloadable URL found');
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const path = savePath || `/tmp/media_${Date.now()}.${ext}`;
        writeFileSync(path, res.data);
        logger.success(`Media downloaded to ${path}`);
        return { path, size: res.data.length, type: ext, url };
    }
    async forwardMessage(fromThreadId, toThreadId, itemId) {
        const info = await this.getMessageMediaUrl(fromThreadId, itemId);
        if (info.media?.videos)
            return this.sendVideoFromUrl(toThreadId, info.media.videos[0].url);
        if (info.media?.images)
            return this.sendPhotoFromUrl(toThreadId, info.media.images[0].url);
        throw new Error('Cannot forward this message type');
    }
    async sendReaction(threadId, itemId, emoji) {
        await this.ig.entity.directThread(threadId).broadcastReaction({ item_id: itemId, emoji_type: 'emoji', reaction: emoji });
        logger.info(`Reaction sent to message ${itemId}`);
    }
    async removeReaction(threadId, itemId) {
        await this.ig.entity.directThread(threadId).deleteReaction({ item_id: itemId });
        logger.info(`Reaction removed from message ${itemId}`);
    }
    async unsendMessage(threadId, itemId) {
        await this.ig.entity.directThread(threadId).deleteItem(itemId);
        this.clearReplyHandler(itemId);
        logger.info(`Message ${itemId} unsent`);
    }
    async editMessage(threadId, itemId, newText) {
        await this.ig.entity.directThread(threadId).editMessage(itemId, newText);
        logger.info(`Message ${itemId} edited`);
        return { success: true, item_id: itemId, new_text: newText };
    }
    async indicateTyping(threadId, isTyping = true) {
        try {
            if (isTyping)
                await this.ig.entity.directThread(threadId).broadcastTypingIndicator();
        }
        catch (_) { }
    }
    async muteThread(threadId) { await this.ig.entity.directThread(threadId).mute(); logger.info(`Thread ${threadId} muted`); }
    async unmuteThread(threadId) { await this.ig.entity.directThread(threadId).unmute(); logger.info(`Thread ${threadId} unmuted`); }
    async deleteThread(threadId) { await this.ig.entity.directThread(threadId).hide(); logger.info(`Thread ${threadId} deleted`); }
    async archiveThread(threadId) { await this.ig.entity.directThread(threadId).hide(); logger.info(`Thread ${threadId} archived`); }
    async unarchiveThread(threadId) { await this.ig.entity.directThread(threadId).unhide(); logger.info(`Thread ${threadId} unarchived`); }
    async leaveThread(threadId) { await this.ig.entity.directThread(threadId).leave(); logger.info(`Left thread ${threadId}`); }
    async addUsersToThread(threadId, userIds) {
        const ids = (Array.isArray(userIds) ? userIds : [userIds]).map(String);
        await this.ig.entity.directThread(threadId).addUser(ids);
        logger.info(`Added ${ids.length} user(s) to thread ${threadId}`);
    }
    async removeUserFromThread(threadId, userId) {
        await this.ig.entity.directThread(threadId).removeUser(userId.toString());
        logger.info(`User ${userId} removed from thread ${threadId}`);
    }
    async updateThreadTitle(threadId, title) {
        await this.ig.entity.directThread(threadId).updateTitle(title);
        logger.info(`Thread title updated: "${title}"`);
    }
    async getRecentMessages(limit = 20) {
        const inbox = await this.getInbox();
        const messages = [];
        for (const thread of inbox.threads.slice(0, 5)) {
            if (thread.items)
                messages.push(...thread.items.slice(0, Math.ceil(limit / 5)));
        }
        return messages.slice(0, limit);
    }
    async _seedSeenIds() {
        try {
            logger.info('Seeding existing message IDs...');
            const inbox = await this.getInbox();
            for (const thread of inbox.threads) {
                const lastPerm = thread.last_permanent_item;
                if (lastPerm?.item_id) {
                    this._trackSeen(lastPerm.item_id);
                    this.threadLastItemMap.set(thread.thread_id, lastPerm.item_id);
                }
                for (const item of (thread.items || [])) {
                    if (item?.item_id)
                        this._trackSeen(item.item_id);
                }
            }
            this.isSeeded = true;
            logger.info(`Seeded ${this.seenMessageIds.size} existing message IDs across ${inbox.threads.length} threads`);
        }
        catch (err) {
            logger.warn('Could not seed message IDs:', err.message);
            this.isSeeded = true;
        }
    }
    async startPolling(intervalOrOptions = 5000) {
        if (this.isPolling) {
            logger.warn('Polling already active');
            return;
        }
        const opts = typeof intervalOrOptions === 'number'
            ? { interval: intervalOrOptions }
            : intervalOrOptions;
        const { interval = 5000, minInterval = 3000, maxInterval = 30000, maxConsecutiveErrors = 5, circuitCooldown = 60000, } = opts;
        this.isPolling = true;
        this._stats.startedAt = Date.now();
        this._stats.currentInterval = interval;
        this._stats.circuitOpen = false;
        this._stats.consecutiveErrors = 0;
        this._registerShutdownHandlers();
        await this._seedSeenIds();
        logger.event(`Polling started (interval: ${interval}ms, min: ${minInterval}ms, max: ${maxInterval}ms)`);
        this.client.emit('polling:start', { interval });
        let sweepCounter = 0;
        while (this.isPolling) {
            if (this._stats.circuitOpen) {
                const elapsed = Date.now() - this._stats.circuitOpenedAt;
                if (elapsed < circuitCooldown) {
                    await sleep(Math.min(5000, circuitCooldown - elapsed));
                    continue;
                }
                this._stats.circuitOpen = false;
                this._stats.consecutiveErrors = 0;
                logger.event('Circuit breaker closed — resuming polling');
                this.client.emit('circuit:closed');
            }
            try {
                const hadActivity = await withTimeout(this._pollCycle(), POLL_TIMEOUT_MS + 5000, 'pollCycle');
                this._stats.totalPolls++;
                this._stats.lastPollAt = Date.now();
                this._stats.consecutiveErrors = 0;
                sweepCounter++;
                if (sweepCounter % 20 === 0)
                    this._sweepExpiredReplyHandlers();
                const currentInterval = this._stats.currentInterval;
                const nextInterval = hadActivity
                    ? Math.max(minInterval, currentInterval * 0.75)
                    : Math.min(maxInterval, currentInterval * 1.1);
                this._stats.currentInterval = Math.round(nextInterval);
            }
            catch (error) {
                this._stats.totalErrors++;
                this._stats.consecutiveErrors++;
                this._stats.lastErrorAt = Date.now();
                this._stats.lastErrorMsg = error.message;
                const kind = classifyError(error);
                if (kind === 'auth') {
                    logger.error('Session expired or authentication failed — stopping polling');
                    this.client.emit('session:expired', { error });
                    this.isPolling = false;
                    break;
                }
                logger.error(`Poll error #${this._stats.consecutiveErrors} [${kind}]: ${error.message}`);
                this.client.emit('error', error);
                if (this._stats.consecutiveErrors >= maxConsecutiveErrors) {
                    this._stats.circuitOpen = true;
                    this._stats.circuitOpenedAt = Date.now();
                    logger.warn(`Circuit breaker opened after ${maxConsecutiveErrors} consecutive errors. Cooling down for ${circuitCooldown / 1000}s`);
                    this.client.emit('circuit:open', { consecutiveErrors: this._stats.consecutiveErrors, cooldown: circuitCooldown });
                    continue;
                }
                const backoff = exponentialBackoff(this._stats.consecutiveErrors, 2000, 30000);
                await sleep(backoff);
                continue;
            }
            await sleep(this._stats.currentInterval);
        }
        logger.event('Polling stopped');
        this.client.emit('polling:stop', this.getPollingStats());
    }
    async _pollCycle() {
        const inbox = await this.getInbox();
        if (!inbox.threads?.length)
            return false;
        let hadActivity = false;
        for (const thread of inbox.threads) {
            const threadId = thread.thread_id;
            const lastPerm = thread.last_permanent_item;
            if (!lastPerm?.item_id)
                continue;
            const prevLastId = this.threadLastItemMap.get(threadId);
            if (prevLastId === lastPerm.item_id)
                continue;
            this.threadLastItemMap.set(threadId, lastPerm.item_id);
            for (const item of (thread.items || [])) {
                if (!item?.item_id || this.seenMessageIds.has(item.item_id))
                    continue;
                this._trackSeen(item.item_id);
                const isFromMe = item.user_id?.toString() === this.client.userId;
                const messageEvent = {
                    thread_id: threadId,
                    item_id: item.item_id,
                    user_id: item.user_id,
                    text: item.text || '',
                    timestamp: item.timestamp,
                    message: item,
                    is_from_me: isFromMe,
                    thread_title: thread.thread_title || null,
                    thread_users: thread.users || [],
                };
                if (item.replied_to_message) {
                    messageEvent.messageReply = {
                        item_id: item.replied_to_message.item_id,
                        text: item.replied_to_message.text || '',
                        user_id: item.replied_to_message.user_id,
                        timestamp: item.replied_to_message.timestamp,
                    };
                    const handler = this.replyHandlers.get(item.replied_to_message.item_id);
                    if (handler) {
                        try {
                            await handler.callback(messageEvent);
                            this.clearReplyHandler(item.replied_to_message.item_id);
                        }
                        catch (err) {
                            logger.error('Reply handler error:', err.message);
                        }
                    }
                }
                this.client.emit('message', messageEvent);
                if (!isFromMe) {
                    hadActivity = true;
                    logger.debug(`New msg in ${threadId} from ${item.user_id}: ${(item.text || '(media)').substring(0, 60)}`);
                }
            }
        }
        const pending = await this.getPendingInbox().catch(() => ({ threads: [] }));
        if (pending.threads?.length > 0) {
            this.client.emit('pending_request', { count: pending.threads.length, threads: pending.threads });
        }
        return hadActivity;
    }
    stopPolling() {
        if (!this.isPolling)
            return;
        this.isPolling = false;
        logger.event('Polling stop requested');
    }
    async restartPolling(intervalOrOptions) {
        this.stopPolling();
        await sleep(1000);
        this.isSeeded = false;
        return this.startPolling(intervalOrOptions || this._stats.currentInterval);
    }
}
//# sourceMappingURL=DirectMessageV2.js.map