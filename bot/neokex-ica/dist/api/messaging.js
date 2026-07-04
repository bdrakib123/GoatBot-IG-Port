/**
 * @module api/messaging
 * Text messaging — send, schedule, reply, react, edit, unsend, mark seen.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import logger from '../logger.js';
import { withRetry } from '../utils/retry.js';
import { sleep } from '../utils/sleep.js';
export class MessagingAPI {
    constructor(ig, emitter, replyHandlers, trackSeen) {
        this.ig = ig;
        this.emitter = emitter;
        this.replyHandlers = replyHandlers;
        this.trackSeen = trackSeen;
    }
    parseResult(raw) {
        const payload = raw?.['payload'];
        return {
            item_id: payload?.['item_id'] ?? raw['item_id'] ?? '',
            thread_id: payload?.['thread_id'] ?? raw['thread_id'] ?? '',
            timestamp: payload?.['timestamp'] ?? raw['timestamp'] ?? Date.now().toString(),
            status: 'sent',
        };
    }
    // ─── Core send ─────────────────────────────────────────────────────────────
    async sendMessage(threadId, text, options = {}) {
        return withRetry(async () => {
            const thread = this.ig.entity.directThread(threadId);
            const raw = options.replyToItemId
                ? await thread.broadcastText(text, { replyToMessageId: options.replyToItemId })
                : await thread.broadcastText(text);
            const result = this.parseResult(raw);
            result.text = text;
            if (result.item_id)
                this.trackSeen(result.item_id);
            logger.info(`Message sent to thread ${threadId} (item: ${result.item_id})`);
            return result;
        }, {
            maxRetries: 3,
            label: 'sendMessage',
            onRetry: ({ attempt, delay }) => logger.warn(`sendMessage retry ${attempt} in ${(delay / 1000).toFixed(1)}s`),
        });
    }
    async sendMessageToUser(userId, text, options = {}) {
        return withRetry(async () => {
            const raw = await this.ig.entity.directThread([userId.toString()]).broadcastText(text);
            const result = this.parseResult(raw);
            result.text = text;
            if (result.item_id)
                this.trackSeen(result.item_id);
            logger.info(`Message sent to user ${userId} (item: ${result.item_id})`);
            return result;
        }, {
            maxRetries: 3,
            label: 'sendMessageToUser',
            onRetry: ({ attempt, delay }) => logger.warn(`sendMessageToUser retry ${attempt} in ${(delay / 1000).toFixed(1)}s`),
        });
    }
    // ─── Bulk & scheduled ──────────────────────────────────────────────────────
    async sendMessageBulk(targets, text, options = {}) {
        const delay = options.delay ?? 1500;
        const results = [];
        for (let i = 0; i < targets.length; i++) {
            const threadId = targets[i];
            try {
                const result = await this.sendMessage(threadId, text);
                results.push({ threadId, success: true, result });
            }
            catch (error) {
                results.push({ threadId, success: false, error: error.message });
            }
            if (i < targets.length - 1 && delay > 0)
                await sleep(delay);
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
    // ─── Reply handlers ────────────────────────────────────────────────────────
    async sendMessageWithReply(threadId, text, onReply, options = {}) {
        const result = await this.sendMessage(threadId, text, options);
        if (result.item_id) {
            this.registerReplyHandler(result.item_id, onReply, options.replyTimeout ?? 120_000);
        }
        return result;
    }
    async sendMessageToUserWithReply(userId, text, onReply, options = {}) {
        const result = await this.sendMessageToUser(userId, text, options);
        if (result.item_id) {
            this.registerReplyHandler(result.item_id, onReply, options.replyTimeout ?? 120_000);
        }
        return result;
    }
    registerReplyHandler(itemId, callback, timeoutMs = 120_000) {
        const timerId = setTimeout(() => {
            this.replyHandlers.delete(itemId);
            logger.debug(`Reply handler for ${itemId} expired`);
        }, timeoutMs);
        this.replyHandlers.set(itemId, { callback, timerId, registeredAt: Date.now() });
        logger.debug(`Reply handler registered for ${itemId} (expires in ${timeoutMs / 1000}s)`);
    }
    clearReplyHandler(itemId) {
        const entry = this.replyHandlers.get(itemId);
        if (!entry)
            return false;
        clearTimeout(entry.timerId);
        this.replyHandlers.delete(itemId);
        return true;
    }
    // ─── Message actions ───────────────────────────────────────────────────────
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
    async sendReaction(threadId, itemId, emoji) {
        await this.ig.entity.directThread(threadId).broadcastReaction({
            item_id: itemId, emoji_type: 'emoji', reaction: emoji,
        });
        logger.info(`Reaction "${emoji}" sent to message ${itemId}`);
    }
    async removeReaction(threadId, itemId) {
        await this.ig.entity.directThread(threadId).deleteReaction({ item_id: itemId });
        logger.info(`Reaction removed from message ${itemId}`);
    }
    async indicateTyping(threadId, isTyping = true) {
        if (!isTyping)
            return;
        try {
            await this.ig.entity.directThread(threadId).broadcastTypingIndicator();
        }
        catch { /* ignore */ }
    }
}
//# sourceMappingURL=messaging.js.map