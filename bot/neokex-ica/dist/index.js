/**
 * @fileoverview ica-neokex — Professional Instagram Chat API for Node.js.
 *
 * @module ica-neokex
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 *
 * @example
 * ```js
 * import InstagramChatAPI from 'ica-neokex';
 *
 * const bot = new InstagramChatAPI();
 * await bot.login('username', 'password');
 *
 * bot.on('message', async (event) => {
 *   if (!event.is_from_me) {
 *     await bot.sendMessage(event.thread_id, `Echo: ${event.text}`);
 *   }
 * });
 *
 * await bot.startPolling({ interval: 5000 });
 * ```
 */
import InstagramClientV2 from './InstagramClientV2.js';
import DirectMessageV2 from './DirectMessageV2.js';
import banner from './Banner.js';
/**
 * @typedef {Object} SendResult
 * @property {string} item_id
 * @property {string} thread_id
 * @property {string} timestamp
 * @property {string} [text]
 * @property {'sent'|'failed'} status
 */
/**
 * @typedef {Object} BulkSendResult
 * @property {string}     threadId
 * @property {boolean}    success
 * @property {SendResult} [result]
 * @property {string}     [error]
 */
/**
 * @typedef {Object} MessageEvent
 * @property {string}         thread_id
 * @property {string}         item_id
 * @property {string|number}  user_id
 * @property {string}         text
 * @property {string}         timestamp
 * @property {boolean}        is_from_me
 * @property {string|null}    thread_title
 * @property {unknown[]}      thread_users
 * @property {object}         message       Raw message item from instagram-private-api
 * @property {object}         [messageReply]
 */
/**
 * @typedef {Object} InboxResult
 * @property {unknown[]} threads
 * @property {boolean}   has_older
 * @property {string|null} cursor
 * @property {number}    unseen_count
 * @property {number}    pending_requests_total
 */
/**
 * @typedef {Object} PollingOptions
 * @property {number} [interval=5000]            Starting interval in ms.
 * @property {number} [minInterval=3000]          Minimum interval in ms.
 * @property {number} [maxInterval=30000]         Maximum interval in ms.
 * @property {number} [maxConsecutiveErrors=5]    Errors before circuit breaker opens.
 * @property {number} [circuitCooldown=60000]     Circuit breaker cooldown in ms.
 */
/**
 * @typedef {Object} BotStatus
 * @property {boolean}     isLoggedIn
 * @property {string|null} userId
 * @property {string|null} username
 * @property {boolean}     isPolling
 * @property {object}      pollingStats
 */
/**
 * @typedef {Object} SessionState
 * @property {Record<string,string>} cookies
 * @property {string|null} userId
 * @property {string|null} username
 * @property {string}      [deviceId]
 * @property {string}      [uuid]
 */
/**
 * @typedef {Object} LoginResult
 * @property {object} logged_in_user
 * @property {string} userId
 * @property {string} username
 */
/**
 * @typedef {Object} MediaInfo
 * @property {string}      item_id
 * @property {string}      [item_type]
 * @property {object|null} media
 */
/**
 * @typedef {Object} DownloadedMedia
 * @property {string} path
 * @property {number} size
 * @property {string} type
 * @property {string} url
 */
/**
 * @typedef {Object} SearchAllResult
 * @property {unknown[]} users
 * @property {unknown[]} hashtags
 * @property {unknown[]} locations
 */
const VERSION = '1.0.0';
let bannerShown = false;
/**
 * Professional Instagram Chat API client.
 *
 * Extends InstagramClientV2 with Direct Messaging (DM), an adaptive polling
 * engine, media sending, thread management, and all helper methods.
 *
 * @extends InstagramClientV2
 */
class InstagramChatAPI extends InstagramClientV2 {
    /**
     * @param {object} [options={}]
     * @param {boolean} [options.showBanner=true] Show the startup banner.
     */
    constructor(options = {}) {
        super();
        /** @type {DirectMessageV2} */
        this.dm = new DirectMessageV2(this);
        if (!bannerShown && options.showBanner !== false) {
            banner.showFull(VERSION, 140);
            bannerShown = true;
        }
    }
    // ─── Status ──────────────────────────────────────────────────────────────────
    /**
     * Return a snapshot of the current client state.
     * @returns {BotStatus}
     */
    getStatus() {
        return {
            isLoggedIn: this.isLoggedIn,
            userId: this.userId,
            username: this.username,
            isPolling: this.dm.isPolling,
            pollingStats: this.dm.getPollingStats(),
        };
    }
    /**
     * Return detailed adaptive-polling statistics.
     * @returns {object}
     */
    getPollingStats() {
        return this.dm.getPollingStats();
    }
    // ─── Auth ────────────────────────────────────────────────────────────────────
    /**
     * Log in with a username and password.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<LoginResult>}
     */
    async login(username, password) {
        return super.login(username, password);
    }
    /**
     * Load a Netscape-format cookie file and authenticate via cookies.
     * @param {string} filePath
     * @returns {Promise<Record<string,string>>}
     */
    loadCookiesFromFile(filePath) {
        return super.loadCookiesFromFile(filePath);
    }
    /**
     * Save current session cookies to a Netscape-format file.
     * @param {string} filePath
     * @param {string} [domain='.instagram.com']
     */
    saveCookiesToFile(filePath, domain = '.instagram.com') {
        return super.saveCookiesToFile(filePath, domain);
    }
    /**
     * Merge cookies into the active session.
     * @param {Record<string,string>} cookies
     */
    setCookies(cookies) {
        return super.setCookies(cookies);
    }
    /** @returns {Record<string,string>} */
    getCookies() {
        return super.getCookies();
    }
    /** @returns {string|null} */
    getCurrentUserID() {
        return super.getCurrentUserID();
    }
    /** @returns {string|null} */
    getCurrentUsername() {
        return super.getCurrentUsername();
    }
    /**
     * Return a serialisable snapshot of the current session.
     * @returns {Promise<SessionState>}
     */
    async getSessionState() {
        return super.getSessionState();
    }
    /**
     * Restore a previously saved session snapshot.
     * @param {SessionState} sessionState
     */
    async loadSessionState(sessionState) {
        return super.loadSessionState(sessionState);
    }
    /**
     * Validate the current session against Instagram's API.
     * @returns {Promise<{valid: boolean, userId?: string|null, username?: string|null, error?: string}>}
     */
    async validateSession() {
        return super.validateSession();
    }
    /**
     * Ping the API to check if the session is alive.
     * @returns {Promise<boolean>}
     */
    async pingSession() {
        return super.pingSession();
    }
    /** @returns {import('instagram-private-api').IgApiClient} */
    getIgClient() {
        return super.getIgClient();
    }
    // ─── Polling ─────────────────────────────────────────────────────────────────
    /**
     * Start the adaptive polling loop. Emits `message` events on new DMs.
     * @param {PollingOptions|number} [options=5000]
     * @returns {Promise<void>}
     */
    async startPolling(options = 5000) {
        return this.dm.startPolling(options);
    }
    /**
     * Alias for startPolling — kept for backwards compatibility.
     * @param {PollingOptions|number} [intervalOrOptions=5000]
     * @returns {Promise<void>}
     */
    async startListening(intervalOrOptions = 5000) {
        return this.dm.startPolling(intervalOrOptions);
    }
    /** Stop the polling loop. */
    stopPolling() {
        this.dm.stopPolling();
    }
    /** Alias for stopPolling — kept for backwards compatibility. */
    stopListening() {
        this.dm.stopPolling();
    }
    /**
     * Stop then restart the polling loop, re-seeding seen message IDs.
     * @param {PollingOptions|number} [options]
     * @returns {Promise<void>}
     */
    async restartPolling(options) {
        return this.dm.restartPolling(options);
    }
    // ─── Event helpers ───────────────────────────────────────────────────────────
    /**
     * Register a listener for incoming messages.
     * @param {function(MessageEvent): void|Promise<void>} callback
     */
    onMessage(callback) { this.on('message', callback); }
    /**
     * Register a listener for pending DM requests.
     * @param {function({count: number, threads: unknown[]}): void} callback
     */
    onPendingRequest(callback) { this.on('pending_request', callback); }
    /**
     * Register an error listener.
     * @param {function(Error): void} callback
     */
    onError(callback) { this.on('error', callback); }
    /**
     * Register a listener for successful logins.
     * @param {function({userId: string, username: string}): void} callback
     */
    onLogin(callback) { this.on('login', callback); }
    /**
     * Register a listener for rate-limit events.
     * @param {function({retryAfter?: number}): void} callback
     */
    onRateLimit(callback) { this.on('ratelimit', callback); }
    /**
     * Register a listener for typing indicator events.
     * @param {function({thread_id: string, user_id: string}): void} callback
     */
    onTyping(callback) { this.on('typing', callback); }
    /**
     * @param {function({interval: number}): void} callback
     */
    onPollingStart(callback) { this.on('polling:start', callback); }
    /**
     * @param {function(object): void} callback
     */
    onPollingStop(callback) { this.on('polling:stop', callback); }
    /**
     * @param {function({error: Error}): void} callback
     */
    onSessionExpired(callback) { this.on('session:expired', callback); }
    /**
     * @param {function({consecutiveErrors: number, cooldown: number}): void} callback
     */
    onCircuitOpen(callback) { this.on('circuit:open', callback); }
    /** @param {function(): void} callback */
    onCircuitClosed(callback) { this.on('circuit:closed', callback); }
    /** @param {function({signal: string}): void} callback */
    onShutdown(callback) { this.on('shutdown', callback); }
    // ─── Messaging ───────────────────────────────────────────────────────────────
    /**
     * Send a text message to a thread.
     * @param {string} threadId
     * @param {string} text
     * @param {{replyToItemId?: string, replyTimeout?: number}} [options={}]
     * @returns {Promise<SendResult>}
     */
    async sendMessage(threadId, text, options = {}) {
        return this.dm.sendMessage(threadId, text, options);
    }
    /**
     * Send a text message to a user by their user ID (creates or reuses a DM thread).
     * @param {string} userId
     * @param {string} text
     * @param {{replyToItemId?: string}} [options={}]
     * @returns {Promise<SendResult>}
     */
    async sendMessageToUser(userId, text, options = {}) {
        return this.dm.sendMessageToUser(userId, text, options);
    }
    /**
     * Send the same message to multiple thread IDs in sequence.
     * @param {string[]} threadIds
     * @param {string}   text
     * @param {number}   [delayBetween=1500]   Delay in ms between sends.
     * @returns {Promise<BulkSendResult[]>}
     */
    async sendMessageBulk(threadIds, text, delayBetween = 1500) {
        return this.dm.sendMessageBulk(threadIds, text, delayBetween);
    }
    /**
     * Schedule a message to be sent after a delay. Returns a cancellable promise.
     * @param {string}  threadId
     * @param {string}  text
     * @param {number}  delayMs
     * @param {object}  [options={}]
     * @returns {Promise<SendResult> & {cancel(): void}}
     */
    scheduleMessage(threadId, text, delayMs, options = {}) {
        return this.dm.scheduleMessage(threadId, text, delayMs, options);
    }
    /**
     * Send a message and receive a callback when the recipient replies.
     * @param {string}   threadId
     * @param {string}   text
     * @param {function(MessageEvent): void|Promise<void>} onReplyCallback
     * @param {object}   [options={}]
     * @returns {Promise<SendResult>}
     */
    async sendMessageWithReply(threadId, text, onReplyCallback, options = {}) {
        return this.dm.sendMessageWithReply(threadId, text, onReplyCallback, options);
    }
    /**
     * Send a message to a user and register a reply callback.
     * @param {string}   userId
     * @param {string}   text
     * @param {function(MessageEvent): void|Promise<void>} onReplyCallback
     * @param {object}   [options={}]
     * @returns {Promise<SendResult>}
     */
    async sendMessageToUserWithReply(userId, text, onReplyCallback, options = {}) {
        return this.dm.sendMessageToUserWithReply(userId, text, onReplyCallback, options);
    }
    /**
     * Register a reply callback for a specific sent message item ID.
     * @param {string}   itemId
     * @param {function(MessageEvent): void|Promise<void>} callback
     * @param {number}   [timeout=120000]
     */
    registerReplyHandler(itemId, callback, timeout = 120000) {
        return this.dm.registerReplyHandler(itemId, callback, timeout);
    }
    /**
     * Cancel and remove a reply handler before it fires.
     * @param {string} itemId
     * @returns {boolean}
     */
    clearReplyHandler(itemId) {
        return this.dm.clearReplyHandler(itemId);
    }
    /**
     * Delete (unsend) a sent message.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    async unsendMessage(threadId, itemId) {
        return this.dm.unsendMessage(threadId, itemId);
    }
    /**
     * Edit the text of a previously sent message.
     * @param {string} threadId
     * @param {string} itemId
     * @param {string} newText
     * @returns {Promise<{success: true, item_id: string, new_text: string}>}
     */
    async editMessage(threadId, itemId, newText) {
        return this.dm.editMessage(threadId, itemId, newText);
    }
    /**
     * React to a message with an emoji.
     * @param {string} threadId
     * @param {string} itemId
     * @param {string} emoji
     * @returns {Promise<void>}
     */
    async sendReaction(threadId, itemId, emoji) {
        return this.dm.sendReaction(threadId, itemId, emoji);
    }
    /**
     * Remove your reaction from a message.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    async removeReaction(threadId, itemId) {
        return this.dm.removeReaction(threadId, itemId);
    }
    /**
     * Broadcast a typing indicator to a thread.
     * @param {string}  threadId
     * @param {boolean} [isTyping=true]
     * @returns {Promise<void>}
     */
    async indicateTyping(threadId, isTyping = true) {
        return this.dm.indicateTyping(threadId, isTyping);
    }
    // ─── Inbox & Threads ─────────────────────────────────────────────────────────
    /**
     * Get the first page of the DM inbox.
     * @param {object} [options={}]
     * @returns {Promise<InboxResult>}
     */
    async getInbox(options = {}) {
        return this.dm.getInbox(options);
    }
    /**
     * Get all inbox threads, paginating up to maxPages.
     * @param {number} [maxPages=5]
     * @returns {Promise<{threads: unknown[], total: number}>}
     */
    async getFullInbox(maxPages = 5) {
        return this.dm.getFullInbox(maxPages);
    }
    /**
     * Get threads that have unread messages from others.
     * @returns {Promise<unknown[]>}
     */
    async getUnreadThreads() {
        return this.dm.getUnreadThreads();
    }
    /**
     * Get the pending DM request inbox.
     * @returns {Promise<{threads: unknown[], has_older: boolean}>}
     */
    async getPendingInbox() {
        return this.dm.getPendingInbox();
    }
    /**
     * Fetch a single thread's items and metadata.
     * @param {string} threadId
     * @param {{cursor?: string}} [options={}]
     * @returns {Promise<{thread_id: string, items: unknown[], has_older: boolean, cursor: string|null, users: unknown[]}>}
     */
    async getThread(threadId, options = {}) {
        return this.dm.getThread(threadId, options);
    }
    /**
     * Get recent messages from a thread.
     * @param {string} threadId
     * @param {number} [limit=20]
     * @returns {Promise<unknown[]>}
     */
    async getThreadMessages(threadId, limit = 20) {
        return this.dm.getThreadMessages(threadId, limit);
    }
    /**
     * Get the participants of a thread.
     * @param {string} threadId
     * @returns {Promise<unknown[]>}
     */
    async getThreadParticipants(threadId) {
        return this.dm.getThreadParticipants(threadId);
    }
    /**
     * Resolve a thread ID by username. Creates a new thread if none exists.
     * @param {string} username
     * @returns {Promise<string|null>}
     */
    async getThreadIdByUsername(username) {
        return this.dm.getThreadIdByUsername(username);
    }
    /**
     * Get a flat list of recent messages across multiple threads.
     * @param {number} [limit=20]
     * @returns {Promise<unknown[]>}
     */
    async getRecentMessages(limit = 20) {
        return this.dm.getRecentMessages(limit);
    }
    /**
     * Search messages in a thread for a text query.
     * @param {string} threadId
     * @param {string} query
     * @returns {Promise<unknown[]>}
     */
    async searchMessages(threadId, query) {
        return this.dm.searchMessages(threadId, query);
    }
    /**
     * Create a new group thread with the given user IDs.
     * @param {string[]} userIds
     * @returns {Promise<unknown>}
     */
    async createThread(userIds) {
        return this.dm.createThread(userIds);
    }
    /**
     * Mark a specific message as seen.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    async markAsSeen(threadId, itemId) {
        return this.dm.markAsSeen(threadId, itemId);
    }
    /**
     * Mark the latest message in every inbox thread as seen.
     * @returns {Promise<{marked: number}>}
     */
    async markAllThreadsSeen() {
        return this.dm.markAllThreadsSeen();
    }
    /**
     * Approve a pending DM request.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async approveThread(threadId) {
        return this.dm.approveThread(threadId);
    }
    /**
     * Decline a pending DM request.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async declineThread(threadId) {
        return this.dm.declineThread(threadId);
    }
    /**
     * Mute notifications for a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async muteThread(threadId) {
        return this.dm.muteThread(threadId);
    }
    /**
     * Unmute notifications for a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async unmuteThread(threadId) {
        return this.dm.unmuteThread(threadId);
    }
    /**
     * Hide / delete a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async deleteThread(threadId) {
        return this.dm.deleteThread(threadId);
    }
    /**
     * Archive (hide) a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async archiveThread(threadId) {
        return this.dm.archiveThread(threadId);
    }
    /**
     * Unarchive a previously hidden thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async unarchiveThread(threadId) {
        return this.dm.unarchiveThread(threadId);
    }
    /**
     * Leave a group thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    async leaveThread(threadId) {
        return this.dm.leaveThread(threadId);
    }
    /**
     * Add users to a group thread.
     * @param {string}   threadId
     * @param {string[]} userIds
     * @returns {Promise<void>}
     */
    async addUsersToThread(threadId, userIds) {
        return this.dm.addUsersToThread(threadId, userIds);
    }
    /**
     * Remove a user from a group thread.
     * @param {string} threadId
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async removeUserFromThread(threadId, userId) {
        return this.dm.removeUserFromThread(threadId, userId);
    }
    /**
     * Rename a group thread.
     * @param {string} threadId
     * @param {string} title
     * @returns {Promise<void>}
     */
    async updateThreadTitle(threadId, title) {
        return this.dm.updateThreadTitle(threadId, title);
    }
    // ─── Media Sending ───────────────────────────────────────────────────────────
    /**
     * Send a photo from a local file path.
     * @param {string} threadId
     * @param {string} photoPath
     * @returns {Promise<object>}
     */
    async sendPhoto(threadId, photoPath) {
        return this.dm.sendPhoto(threadId, photoPath);
    }
    /**
     * Send a photo followed by a caption text message.
     * @param {string} threadId
     * @param {string} photoPath
     * @param {string} [caption='']
     * @returns {Promise<object>}
     */
    async sendPhotoWithCaption(threadId, photoPath, caption = '') {
        return this.dm.sendPhotoWithCaption(threadId, photoPath, caption);
    }
    /**
     * Download a photo from a URL and send it.
     * @param {string} threadId
     * @param {string} photoUrl
     * @returns {Promise<object>}
     */
    async sendPhotoFromUrl(threadId, photoUrl) {
        return this.dm.sendPhotoFromUrl(threadId, photoUrl);
    }
    /**
     * Send a video from a local file path.
     * @param {string} threadId
     * @param {string} videoPath
     * @returns {Promise<object>}
     */
    async sendVideo(threadId, videoPath) {
        return this.dm.sendVideo(threadId, videoPath);
    }
    /**
     * Download a video from a URL and send it.
     * @param {string} threadId
     * @param {string} videoUrl
     * @returns {Promise<object>}
     */
    async sendVideoFromUrl(threadId, videoUrl) {
        return this.dm.sendVideoFromUrl(threadId, videoUrl);
    }
    /**
     * Send a voice note from a local audio file.
     * @param {string} threadId
     * @param {string} audioPath
     * @returns {Promise<object>}
     */
    async sendVoiceNote(threadId, audioPath) {
        return this.dm.sendVoiceNote(threadId, audioPath);
    }
    /**
     * Send a sticker by sticker ID.
     * @param {string} threadId
     * @param {string} stickerId
     * @returns {Promise<object>}
     */
    async sendSticker(threadId, stickerId) {
        return this.dm.sendSticker(threadId, stickerId);
    }
    /**
     * Send a GIF by Giphy ID.
     * @param {string} threadId
     * @param {string} giphyId
     * @returns {Promise<object>}
     */
    async sendGif(threadId, giphyId) {
        return this.dm.sendGif(threadId, giphyId);
    }
    /**
     * Send an animated media item by its media ID.
     * @param {string} threadId
     * @param {string} mediaId
     * @returns {Promise<object>}
     */
    async sendAnimatedMedia(threadId, mediaId) {
        return this.dm.sendAnimatedMedia(threadId, mediaId);
    }
    /**
     * Share a feed post into a thread.
     * @param {string} threadId
     * @param {string} mediaId
     * @param {string} [message='']
     * @returns {Promise<object>}
     */
    async shareMediaToThread(threadId, mediaId, message = '') {
        return this.dm.shareMediaToThread(threadId, mediaId, message);
    }
    /**
     * Send a link message.
     * @param {string} threadId
     * @param {string} linkUrl
     * @param {string} [linkText='']
     * @returns {Promise<object>}
     */
    async sendLink(threadId, linkUrl, linkText = '') {
        return this.dm.sendLink(threadId, linkUrl, linkText);
    }
    /**
     * Get URL and metadata for media inside a specific message.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<MediaInfo>}
     */
    async getMessageMediaUrl(threadId, itemId) {
        return this.dm.getMessageMediaUrl(threadId, itemId);
    }
    /**
     * Download media from a message to disk.
     * @param {string}      threadId
     * @param {string}      itemId
     * @param {string|null} [savePath=null]
     * @returns {Promise<DownloadedMedia>}
     */
    async downloadMessageMedia(threadId, itemId, savePath = null) {
        return this.dm.downloadMessageMedia(threadId, itemId, savePath);
    }
    /**
     * Forward a media message from one thread to another.
     * @param {string} fromThreadId
     * @param {string} toThreadId
     * @param {string} itemId
     * @returns {Promise<object>}
     */
    async forwardMessage(fromThreadId, toThreadId, itemId) {
        return this.dm.forwardMessage(fromThreadId, toThreadId, itemId);
    }
    // ─── User Info & Social ──────────────────────────────────────────────────────
    /**
     * Get full user info by numeric or string user ID.
     * @param {string|number} userId
     * @returns {Promise<object>}
     */
    async getUserInfo(userId) {
        return super.getUserInfo(userId);
    }
    /**
     * Get full user info by username.
     * @param {string} username
     * @returns {Promise<object>}
     */
    async getUserInfoByUsername(username) {
        return super.getUserInfoByUsername(username);
    }
    /**
     * Search for users matching a query string.
     * @param {string} query
     * @returns {Promise<object[]>}
     */
    async searchUsers(query) {
        return super.searchUsers(query);
    }
    /**
     * Get the friendship relationship between the session and a user.
     * @param {string|number} userId
     * @returns {Promise<object>}
     */
    async getFriendshipStatus(userId) {
        return super.getFriendshipStatus(userId);
    }
    /**
     * Get friendship statuses for multiple users in one call.
     * @param {string[]} userIds
     * @returns {Promise<Record<string, object>>}
     */
    async getFriendshipStatuses(userIds) {
        return super.getFriendshipStatuses(userIds);
    }
    /**
     * Follow a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    async followUser(userId) {
        return super.followUser(userId);
    }
    /**
     * Unfollow a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    async unfollowUser(userId) {
        return super.unfollowUser(userId);
    }
    /**
     * Block a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    async blockUser(userId) {
        return super.blockUser(userId);
    }
    /**
     * Unblock a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    async unblockUser(userId) {
        return super.unblockUser(userId);
    }
    /**
     * Get the list of blocked users.
     * @returns {Promise<unknown[]>}
     */
    async getBlockedUsers() {
        return super.getBlockedUsers();
    }
    /**
     * Mute a user's posts and/or stories in the feed.
     * @param {string|number} userId
     * @param {boolean} [muteStories=false]
     * @param {boolean} [mutePosts=false]
     * @returns {Promise<void>}
     */
    async muteUser(userId, muteStories = false, mutePosts = false) {
        return super.muteUser(userId, muteStories, mutePosts);
    }
    /**
     * Get the followers of a user, paginating up to maxItems.
     * @param {string|number} userId
     * @param {number} [maxItems=100]
     * @returns {Promise<unknown[]>}
     */
    async getFollowers(userId, maxItems = 100) {
        return super.getFollowers(userId, maxItems);
    }
    /**
     * Get the users a given user follows, paginating up to maxItems.
     * @param {string|number} userId
     * @param {number} [maxItems=100]
     * @returns {Promise<unknown[]>}
     */
    async getFollowing(userId, maxItems = 100) {
        return super.getFollowing(userId, maxItems);
    }
    /**
     * Get accounts suggested by Instagram for the current session.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getSuggestedUsers(maxItems = 30) {
        return super.getSuggestedUsers(maxItems);
    }
    // ─── Feeds ───────────────────────────────────────────────────────────────────
    /**
     * Get the home timeline feed.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getTimelineFeed(maxItems = 30) {
        return super.getTimelineFeed(maxItems);
    }
    /**
     * Get a user's post feed.
     * @param {string|number} userId
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getUserFeed(userId, maxItems = 30) {
        return super.getUserFeed(userId, maxItems);
    }
    /**
     * Get posts tagged with a hashtag.
     * @param {string} hashtag
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getHashtagFeed(hashtag, maxItems = 30) {
        return super.getHashtagFeed(hashtag, maxItems);
    }
    /**
     * Get the Explore / Discover feed.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getExploreFeed(maxItems = 30) {
        return super.getExploreFeed(maxItems);
    }
    /**
     * Get posts from a location by location ID.
     * @param {string|number} locationId
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getLocationFeed(locationId, maxItems = 30) {
        return super.getLocationFeed(locationId, maxItems);
    }
    /**
     * Get posts the current user has liked.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getLikedPosts(maxItems = 30) {
        return super.getLikedPosts(maxItems);
    }
    /**
     * @deprecated Use getNotifications() instead.
     * @returns {Promise<unknown[]>}
     */
    async getActivityFeed() {
        return super.getActivityFeed();
    }
    /**
     * Get the reels tray (stories at the top of the feed).
     * @returns {Promise<unknown[]>}
     */
    async getReelsTrayCandidates() {
        return super.getReelsTrayCandidates();
    }
    // ─── Post Interactions ───────────────────────────────────────────────────────
    /**
     * Like a feed post.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async likePost(mediaId) {
        return super.likePost(mediaId);
    }
    /**
     * Unlike a feed post.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async unlikePost(mediaId) {
        return super.unlikePost(mediaId);
    }
    /**
     * Comment on a post.
     * @param {string} mediaId
     * @param {string} text
     * @returns {Promise<unknown>}
     */
    async commentPost(mediaId, text) {
        return super.commentPost(mediaId, text);
    }
    /**
     * Delete a comment.
     * @param {string} mediaId
     * @param {string} commentId
     * @returns {Promise<void>}
     */
    async deleteComment(mediaId, commentId) {
        return super.deleteComment(mediaId, commentId);
    }
    /**
     * Like a comment.
     * @param {string} mediaId
     * @param {string} commentId
     * @returns {Promise<void>}
     */
    async likeComment(mediaId, commentId) {
        return super.likeComment(mediaId, commentId);
    }
    /**
     * Unlike a comment.
     * @param {string} mediaId
     * @param {string} commentId
     * @returns {Promise<void>}
     */
    async unlikeComment(mediaId, commentId) {
        return super.unlikeComment(mediaId, commentId);
    }
    /**
     * Get comments on a post.
     * @param {string} mediaId
     * @param {number} [maxItems=20]
     * @returns {Promise<unknown[]>}
     */
    async getComments(mediaId, maxItems = 20) {
        return super.getComments(mediaId, maxItems);
    }
    /**
     * Get metadata for a post by media ID.
     * @param {string} mediaId
     * @returns {Promise<unknown>}
     */
    async getMediaInfo(mediaId) {
        return super.getMediaInfo(mediaId);
    }
    /**
     * Delete a post.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async deletePost(mediaId) {
        return super.deletePost(mediaId);
    }
    /**
     * Get posts the current user is tagged in.
     * @param {string|number} userId
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getTaggedPosts(userId, maxItems = 30) {
        return super.getTaggedPosts(userId, maxItems);
    }
    /**
     * Get posts the current user has saved.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    async getSavedPosts(maxItems = 30) {
        return super.getSavedPosts(maxItems);
    }
    /**
     * Save a post to the saved collection.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async savePost(mediaId) {
        return super.savePost(mediaId);
    }
    /**
     * Remove a post from the saved collection.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async unsavePost(mediaId) {
        return super.unsavePost(mediaId);
    }
    // ─── Publishing ──────────────────────────────────────────────────────────────
    /**
     * Upload a photo to the feed.
     * @param {string} photoPath
     * @param {string} [caption='']
     * @returns {Promise<unknown>}
     */
    async uploadPhoto(photoPath, caption = '') {
        return super.uploadPhoto(photoPath, caption);
    }
    /**
     * Upload a video to the feed.
     * @param {string}      videoPath
     * @param {string}      [caption='']
     * @param {string|null} [coverPath=null]
     * @returns {Promise<unknown>}
     */
    async uploadVideo(videoPath, caption = '', coverPath = null) {
        return super.uploadVideo(videoPath, caption, coverPath);
    }
    /**
     * Upload a carousel (album) of photos to the feed.
     * @param {string[]} photoPaths
     * @param {string}   [caption='']
     * @returns {Promise<unknown>}
     */
    async uploadCarousel(photoPaths, caption = '') {
        return super.uploadCarousel(photoPaths, caption);
    }
    // ─── Stories ─────────────────────────────────────────────────────────────────
    /**
     * Get stories for a user.
     * @param {string|number} userId
     * @returns {Promise<unknown[]>}
     */
    async getStories(userId) {
        return super.getStories(userId);
    }
    /**
     * Upload a photo story.
     * @param {string} photoPath
     * @param {object} [options={}]
     * @returns {Promise<unknown>}
     */
    async uploadStory(photoPath, options = {}) {
        return super.uploadStory(photoPath, options);
    }
    /**
     * Upload a video story.
     * @param {string} videoPath
     * @param {object} [options={}]
     * @returns {Promise<unknown>}
     */
    async uploadVideoStory(videoPath, options = {}) {
        return super.uploadVideoStory(videoPath, options);
    }
    /**
     * Delete a story by its media ID.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async deleteStory(mediaId) {
        return super.deleteStory(mediaId);
    }
    /**
     * React to a story with an emoji.
     * @param {string|number} userId
     * @param {string}        storyId
     * @param {string}        emoji
     * @returns {Promise<void>}
     */
    async reactToStory(userId, storyId, emoji) {
        return super.reactToStory(userId, storyId, emoji);
    }
    /**
     * Get stories from the current account's close friends list.
     * @returns {Promise<unknown[]>}
     */
    async getCloseFriendsStories() {
        return super.getCloseFriendsStories();
    }
    // ─── Highlights ──────────────────────────────────────────────────────────────
    /**
     * Get story highlight reels for a user.
     * @param {string|number} userId
     * @returns {Promise<unknown[]>}
     */
    async getUserHighlights(userId) {
        return super.getUserHighlights(userId);
    }
    /**
     * Get the story items inside a specific highlight reel.
     * @param {string} highlightId  e.g. `"highlight:12345678"`
     * @returns {Promise<unknown[]>}
     */
    async getHighlightItems(highlightId) {
        return super.getHighlightItems(highlightId);
    }
    // ─── Profile Management ──────────────────────────────────────────────────────
    /**
     * Edit the current account's profile fields.
     * @param {{username?: string, name?: string, biography?: string, email?: string, phone?: string, website?: string, gender?: number}} [options={}]
     * @returns {Promise<unknown>}
     */
    async editProfile(options = {}) {
        return super.editProfile(options);
    }
    /**
     * Update the profile picture from a local image file.
     * @param {string} photoPath
     * @returns {Promise<unknown>}
     */
    async setProfilePicture(photoPath) {
        return super.setProfilePicture(photoPath);
    }
    /**
     * Remove the current profile picture.
     * @returns {Promise<void>}
     */
    async removeProfilePicture() {
        return super.removeProfilePicture();
    }
    /**
     * Change the account password.
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<void>}
     */
    async changePassword(oldPassword, newPassword) {
        return super.changePassword(oldPassword, newPassword);
    }
    // ─── Search ──────────────────────────────────────────────────────────────────
    /**
     * Search for hashtags matching a query.
     * @param {string} query
     * @returns {Promise<unknown[]>}
     */
    async searchHashtags(query) {
        return super.searchHashtags(query);
    }
    /**
     * Search for locations matching a query.
     * @param {string} query
     * @returns {Promise<unknown[]>}
     */
    async searchLocations(query) {
        return super.searchLocations(query);
    }
    /**
     * Combined search — users, hashtags, and locations in parallel.
     * @param {string} query
     * @returns {Promise<SearchAllResult>}
     */
    async searchAll(query) {
        return super.searchAll(query);
    }
    // ─── Notifications ───────────────────────────────────────────────────────────
    /**
     * Get the activity notification inbox (likes, comments, follows, etc.).
     * @returns {Promise<unknown>}
     */
    async getNotifications() {
        return super.getNotifications();
    }
    /**
     * Mark all activity notifications as seen.
     * @returns {Promise<void>}
     */
    async markNotificationsSeen() {
        return super.markNotificationsSeen();
    }
    /**
     * Get pending follow requests (for private accounts).
     * @returns {Promise<unknown[]>}
     */
    async getFollowRequests() {
        return super.getFollowRequests();
    }
    /**
     * Approve a follow request by user ID.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    async approveFollowRequest(userId) {
        return super.approveFollowRequest(userId);
    }
    /**
     * Reject/deny a follow request by user ID.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    async rejectFollowRequest(userId) {
        return super.rejectFollowRequest(userId);
    }
}
export default InstagramChatAPI;
export { InstagramChatAPI };
//# sourceMappingURL=index.js.map