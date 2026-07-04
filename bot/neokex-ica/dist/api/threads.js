/**
 * @module api/threads
 * Thread and inbox management — get, create, approve, mute, archive, delete.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import logger from '../logger.js';
import { sleep } from '../utils/sleep.js';
import { withTimeout } from '../utils/timeout.js';
const POLL_TIMEOUT = 20_000;
export class ThreadsAPI {
    constructor(ig, userId) {
        this.ig = ig;
        this.userId = userId;
    }
    // ─── Inbox ─────────────────────────────────────────────────────────────────
    async getInbox() {
        try {
            const feed = this.ig.feed.directInbox();
            const threads = await withTimeout(feed.items(), POLL_TIMEOUT, 'getInbox');
            return {
                threads,
                has_older: !!feed.moreAvailable,
                cursor: feed.cursor ?? null,
                unseen_count: threads.filter((t) => {
                    const last = t.items?.[0] ?? t.last_permanent_item;
                    return last?.user_id && String(last.user_id) !== this.userId();
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
        const feed = this.ig.feed.directInbox();
        const all = [];
        let page = 0;
        do {
            const batch = await feed.items();
            all.push(...batch);
            page++;
            if (feed.isMoreAvailable() && page < maxPages)
                await sleep(600);
        } while (feed.isMoreAvailable() && page < maxPages);
        return { threads: all, total: all.length };
    }
    async getUnreadThreads() {
        const inbox = await this.getInbox();
        return inbox.threads.filter((t) => {
            const last = t.items?.[0] ?? t.last_permanent_item;
            return last?.user_id && String(last.user_id) !== this.userId();
        });
    }
    async getPendingInbox() {
        try {
            const feed = this.ig.feed.directPending();
            const threads = await feed.items();
            return { threads, has_older: !!feed.moreAvailable };
        }
        catch (error) {
            logger.error('Failed to get pending inbox:', error.message);
            throw new Error(`Failed to get pending inbox: ${error.message}`);
        }
    }
    // ─── Single thread ─────────────────────────────────────────────────────────
    async getThread(threadId, cursor) {
        try {
            const feed = this.ig.feed.directThread({ thread_id: threadId, oldest_cursor: cursor ?? '' });
            const items = await feed.items();
            return {
                thread_id: threadId,
                items,
                has_older: feed.isMoreAvailable(),
                cursor: feed.cursor ?? null,
                users: [],
            };
        }
        catch (error) {
            logger.error('Failed to get thread:', error.message);
            throw new Error(`Failed to get thread: ${error.message}`);
        }
    }
    async getThreadMessages(threadId, limit = 20) {
        const feed = this.ig.feed.directThread({ thread_id: threadId, oldest_cursor: '' });
        const items = await feed.items();
        return items.slice(0, limit);
    }
    async getThreadParticipants(threadId) {
        const inbox = await this.getInbox();
        const thread = inbox.threads.find((t) => t.thread_id === threadId);
        if (thread)
            return thread.users ?? [];
        throw new Error('Thread not found in inbox');
    }
    async getThreadIdByUsername(username) {
        const uid = await this.ig.user.getIdByUsername(username);
        const inbox = await this.getInbox();
        const thread = inbox.threads.find((t) => t.users?.some((u) => String(u.pk) === String(uid)));
        if (thread)
            return thread.thread_id;
        const newThread = await this.ig.entity.directThread([uid.toString()]);
        return newThread.threadId ?? null;
    }
    async searchMessages(threadId, query) {
        const thread = await this.getThread(threadId);
        const q = query.toLowerCase();
        return thread.items.filter((i) => i['text']?.toLowerCase().includes(q));
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
    // ─── Thread creation ───────────────────────────────────────────────────────
    async createThread(userIds) {
        const ids = userIds.map(String);
        const thread = await this.ig.direct.createGroupThread(ids, '');
        logger.info(`Thread created with users: ${ids.join(', ')}`);
        return thread;
    }
    // ─── Thread actions ────────────────────────────────────────────────────────
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
            const last = thread.items?.[0];
            if (last?.item_id) {
                try {
                    await this.markAsSeen(thread.thread_id, last.item_id);
                    marked++;
                    await sleep(300);
                }
                catch { /* ignore */ }
            }
        }
        logger.info(`Marked ${marked} threads as seen`);
        return { marked };
    }
    async approveThread(threadId) {
        await this.ig.entity.directThread(threadId).approve();
        logger.info(`Thread ${threadId} approved`);
    }
    async declineThread(threadId) {
        await this.ig.entity.directThread(threadId).decline();
        logger.info(`Thread ${threadId} declined`);
    }
    async muteThread(threadId) {
        await this.ig.entity.directThread(threadId).mute();
        logger.info(`Thread ${threadId} muted`);
    }
    async unmuteThread(threadId) {
        await this.ig.entity.directThread(threadId).unmute();
        logger.info(`Thread ${threadId} unmuted`);
    }
    async deleteThread(threadId) {
        await this.ig.entity.directThread(threadId).hide();
        logger.info(`Thread ${threadId} deleted`);
    }
    async archiveThread(threadId) {
        await this.ig.entity.directThread(threadId).hide();
        logger.info(`Thread ${threadId} archived`);
    }
    async unarchiveThread(threadId) {
        await this.ig.entity.directThread(threadId).unhide();
        logger.info(`Thread ${threadId} unarchived`);
    }
    async leaveThread(threadId) {
        await this.ig.entity.directThread(threadId).leave();
        logger.info(`Left thread ${threadId}`);
    }
    async addUsersToThread(threadId, userIds) {
        const ids = userIds.map(String);
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
}
//# sourceMappingURL=threads.js.map