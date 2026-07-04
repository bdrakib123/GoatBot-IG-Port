export default InstagramChatAPI;
export type SendResult = {
    item_id: string;
    thread_id: string;
    timestamp: string;
    text?: string | undefined;
    status: "sent" | "failed";
};
export type BulkSendResult = {
    threadId: string;
    success: boolean;
    result?: SendResult | undefined;
    error?: string | undefined;
};
export type MessageEvent = {
    thread_id: string;
    item_id: string;
    user_id: string | number;
    text: string;
    timestamp: string;
    is_from_me: boolean;
    thread_title: string | null;
    thread_users: unknown[];
    /**
     * Raw message item from instagram-private-api
     */
    message: object;
    messageReply?: object | undefined;
};
export type InboxResult = {
    threads: unknown[];
    has_older: boolean;
    cursor: string | null;
    unseen_count: number;
    pending_requests_total: number;
};
export type PollingOptions = {
    /**
     * Starting interval in ms.
     */
    interval?: number | undefined;
    /**
     * Minimum interval in ms.
     */
    minInterval?: number | undefined;
    /**
     * Maximum interval in ms.
     */
    maxInterval?: number | undefined;
    /**
     * Errors before circuit breaker opens.
     */
    maxConsecutiveErrors?: number | undefined;
    /**
     * Circuit breaker cooldown in ms.
     */
    circuitCooldown?: number | undefined;
};
export type BotStatus = {
    isLoggedIn: boolean;
    userId: string | null;
    username: string | null;
    isPolling: boolean;
    pollingStats: object;
};
export type SessionState = {
    cookies: Record<string, string>;
    userId: string | null;
    username: string | null;
    deviceId?: string | undefined;
    uuid?: string | undefined;
};
export type LoginResult = {
    logged_in_user: object;
    userId: string;
    username: string;
};
export type MediaInfo = {
    item_id: string;
    item_type?: string | undefined;
    media: object | null;
};
export type DownloadedMedia = {
    path: string;
    size: number;
    type: string;
    url: string;
};
export type SearchAllResult = {
    users: unknown[];
    hashtags: unknown[];
    locations: unknown[];
};
/**
 * Professional Instagram Chat API client.
 *
 * Extends InstagramClientV2 with Direct Messaging (DM), an adaptive polling
 * engine, media sending, thread management, and all helper methods.
 *
 * @extends InstagramClientV2
 */
export class InstagramChatAPI extends InstagramClientV2 {
    /**
     * @param {object} [options={}]
     * @param {boolean} [options.showBanner=true] Show the startup banner.
     */
    constructor(options?: {
        showBanner?: boolean | undefined;
    });
    /** @type {DirectMessageV2} */
    dm: DirectMessageV2;
    /**
     * Return a snapshot of the current client state.
     * @returns {BotStatus}
     */
    getStatus(): BotStatus;
    /**
     * Return detailed adaptive-polling statistics.
     * @returns {object}
     */
    getPollingStats(): object;
    /**
     * Log in with a username and password.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<LoginResult>}
     */
    login(username: string, password: string): Promise<LoginResult>;
    /**
     * Load a Netscape-format cookie file and authenticate via cookies.
     * @param {string} filePath
     * @returns {Promise<Record<string,string>>}
     */
    loadCookiesFromFile(filePath: string): Promise<Record<string, string>>;
    /**
     * Save current session cookies to a Netscape-format file.
     * @param {string} filePath
     * @param {string} [domain='.instagram.com']
     */
    saveCookiesToFile(filePath: string, domain?: string): void;
    /**
     * Merge cookies into the active session.
     * @param {Record<string,string>} cookies
     */
    setCookies(cookies: Record<string, string>): void;
    /** @returns {Record<string,string>} */
    getCookies(): Record<string, string>;
    /** @returns {string|null} */
    getCurrentUserID(): string | null;
    /** @returns {string|null} */
    getCurrentUsername(): string | null;
    /**
     * Return a serialisable snapshot of the current session.
     * @returns {Promise<SessionState>}
     */
    getSessionState(): Promise<SessionState>;
    /**
     * Restore a previously saved session snapshot.
     * @param {SessionState} sessionState
     */
    loadSessionState(sessionState: SessionState): Promise<void>;
    /**
     * Validate the current session against Instagram's API.
     * @returns {Promise<{valid: boolean, userId?: string|null, username?: string|null, error?: string}>}
     */
    validateSession(): Promise<{
        valid: boolean;
        userId?: string | null;
        username?: string | null;
        error?: string;
    }>;
    /**
     * Start the adaptive polling loop. Emits `message` events on new DMs.
     * @param {PollingOptions|number} [options=5000]
     * @returns {Promise<void>}
     */
    startPolling(options?: PollingOptions | number): Promise<void>;
    /**
     * Alias for startPolling — kept for backwards compatibility.
     * @param {PollingOptions|number} [intervalOrOptions=5000]
     * @returns {Promise<void>}
     */
    startListening(intervalOrOptions?: PollingOptions | number): Promise<void>;
    /** Stop the polling loop. */
    stopPolling(): void;
    /** Alias for stopPolling — kept for backwards compatibility. */
    stopListening(): void;
    /**
     * Stop then restart the polling loop, re-seeding seen message IDs.
     * @param {PollingOptions|number} [options]
     * @returns {Promise<void>}
     */
    restartPolling(options?: PollingOptions | number): Promise<void>;
    /**
     * Register a listener for incoming messages.
     * @param {function(MessageEvent): void|Promise<void>} callback
     */
    onMessage(callback: (arg0: MessageEvent) => void | Promise<void>): void;
    /**
     * Register a listener for pending DM requests.
     * @param {function({count: number, threads: unknown[]}): void} callback
     */
    onPendingRequest(callback: (arg0: {
        count: number;
        threads: unknown[];
    }) => void): void;
    /**
     * Register an error listener.
     * @param {function(Error): void} callback
     */
    onError(callback: (arg0: Error) => void): void;
    /**
     * Register a listener for successful logins.
     * @param {function({userId: string, username: string}): void} callback
     */
    onLogin(callback: (arg0: {
        userId: string;
        username: string;
    }) => void): void;
    /**
     * Register a listener for rate-limit events.
     * @param {function({retryAfter?: number}): void} callback
     */
    onRateLimit(callback: (arg0: {
        retryAfter?: number;
    }) => void): void;
    /**
     * Register a listener for typing indicator events.
     * @param {function({thread_id: string, user_id: string}): void} callback
     */
    onTyping(callback: (arg0: {
        thread_id: string;
        user_id: string;
    }) => void): void;
    /**
     * @param {function({interval: number}): void} callback
     */
    onPollingStart(callback: (arg0: {
        interval: number;
    }) => void): void;
    /**
     * @param {function(object): void} callback
     */
    onPollingStop(callback: (arg0: object) => void): void;
    /**
     * @param {function({error: Error}): void} callback
     */
    onSessionExpired(callback: (arg0: {
        error: Error;
    }) => void): void;
    /**
     * @param {function({consecutiveErrors: number, cooldown: number}): void} callback
     */
    onCircuitOpen(callback: (arg0: {
        consecutiveErrors: number;
        cooldown: number;
    }) => void): void;
    /** @param {function(): void} callback */
    onCircuitClosed(callback: () => void): void;
    /** @param {function({signal: string}): void} callback */
    onShutdown(callback: (arg0: {
        signal: string;
    }) => void): void;
    /**
     * Send a text message to a thread.
     * @param {string} threadId
     * @param {string} text
     * @param {{replyToItemId?: string, replyTimeout?: number}} [options={}]
     * @returns {Promise<SendResult>}
     */
    sendMessage(threadId: string, text: string, options?: {
        replyToItemId?: string;
        replyTimeout?: number;
    }): Promise<SendResult>;
    /**
     * Send a text message to a user by their user ID (creates or reuses a DM thread).
     * @param {string} userId
     * @param {string} text
     * @param {{replyToItemId?: string}} [options={}]
     * @returns {Promise<SendResult>}
     */
    sendMessageToUser(userId: string, text: string, options?: {
        replyToItemId?: string;
    }): Promise<SendResult>;
    /**
     * Send the same message to multiple thread IDs in sequence.
     * @param {string[]} threadIds
     * @param {string}   text
     * @param {number}   [delayBetween=1500]   Delay in ms between sends.
     * @returns {Promise<BulkSendResult[]>}
     */
    sendMessageBulk(threadIds: string[], text: string, delayBetween?: number): Promise<BulkSendResult[]>;
    /**
     * Schedule a message to be sent after a delay. Returns a cancellable promise.
     * @param {string}  threadId
     * @param {string}  text
     * @param {number}  delayMs
     * @param {object}  [options={}]
     * @returns {Promise<SendResult> & {cancel(): void}}
     */
    scheduleMessage(threadId: string, text: string, delayMs: number, options?: object): Promise<SendResult> & {
        cancel(): void;
    };
    /**
     * Send a message and receive a callback when the recipient replies.
     * @param {string}   threadId
     * @param {string}   text
     * @param {function(MessageEvent): void|Promise<void>} onReplyCallback
     * @param {object}   [options={}]
     * @returns {Promise<SendResult>}
     */
    sendMessageWithReply(threadId: string, text: string, onReplyCallback: (arg0: MessageEvent) => void | Promise<void>, options?: object): Promise<SendResult>;
    /**
     * Send a message to a user and register a reply callback.
     * @param {string}   userId
     * @param {string}   text
     * @param {function(MessageEvent): void|Promise<void>} onReplyCallback
     * @param {object}   [options={}]
     * @returns {Promise<SendResult>}
     */
    sendMessageToUserWithReply(userId: string, text: string, onReplyCallback: (arg0: MessageEvent) => void | Promise<void>, options?: object): Promise<SendResult>;
    /**
     * Register a reply callback for a specific sent message item ID.
     * @param {string}   itemId
     * @param {function(MessageEvent): void|Promise<void>} callback
     * @param {number}   [timeout=120000]
     */
    registerReplyHandler(itemId: string, callback: (arg0: MessageEvent) => void | Promise<void>, timeout?: number): void;
    /**
     * Cancel and remove a reply handler before it fires.
     * @param {string} itemId
     * @returns {boolean}
     */
    clearReplyHandler(itemId: string): boolean;
    /**
     * Delete (unsend) a sent message.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    unsendMessage(threadId: string, itemId: string): Promise<void>;
    /**
     * Edit the text of a previously sent message.
     * @param {string} threadId
     * @param {string} itemId
     * @param {string} newText
     * @returns {Promise<{success: true, item_id: string, new_text: string}>}
     */
    editMessage(threadId: string, itemId: string, newText: string): Promise<{
        success: true;
        item_id: string;
        new_text: string;
    }>;
    /**
     * React to a message with an emoji.
     * @param {string} threadId
     * @param {string} itemId
     * @param {string} emoji
     * @returns {Promise<void>}
     */
    sendReaction(threadId: string, itemId: string, emoji: string): Promise<void>;
    /**
     * Remove your reaction from a message.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    removeReaction(threadId: string, itemId: string): Promise<void>;
    /**
     * Broadcast a typing indicator to a thread.
     * @param {string}  threadId
     * @param {boolean} [isTyping=true]
     * @returns {Promise<void>}
     */
    indicateTyping(threadId: string, isTyping?: boolean): Promise<void>;
    /**
     * Get the first page of the DM inbox.
     * @param {object} [options={}]
     * @returns {Promise<InboxResult>}
     */
    getInbox(options?: object): Promise<InboxResult>;
    /**
     * Get all inbox threads, paginating up to maxPages.
     * @param {number} [maxPages=5]
     * @returns {Promise<{threads: unknown[], total: number}>}
     */
    getFullInbox(maxPages?: number): Promise<{
        threads: unknown[];
        total: number;
    }>;
    /**
     * Get threads that have unread messages from others.
     * @returns {Promise<unknown[]>}
     */
    getUnreadThreads(): Promise<unknown[]>;
    /**
     * Get the pending DM request inbox.
     * @returns {Promise<{threads: unknown[], has_older: boolean}>}
     */
    getPendingInbox(): Promise<{
        threads: unknown[];
        has_older: boolean;
    }>;
    /**
     * Fetch a single thread's items and metadata.
     * @param {string} threadId
     * @param {{cursor?: string}} [options={}]
     * @returns {Promise<{thread_id: string, items: unknown[], has_older: boolean, cursor: string|null, users: unknown[]}>}
     */
    getThread(threadId: string, options?: {
        cursor?: string;
    }): Promise<{
        thread_id: string;
        items: unknown[];
        has_older: boolean;
        cursor: string | null;
        users: unknown[];
    }>;
    /**
     * Get recent messages from a thread.
     * @param {string} threadId
     * @param {number} [limit=20]
     * @returns {Promise<unknown[]>}
     */
    getThreadMessages(threadId: string, limit?: number): Promise<unknown[]>;
    /**
     * Get the participants of a thread.
     * @param {string} threadId
     * @returns {Promise<unknown[]>}
     */
    getThreadParticipants(threadId: string): Promise<unknown[]>;
    /**
     * Resolve a thread ID by username. Creates a new thread if none exists.
     * @param {string} username
     * @returns {Promise<string|null>}
     */
    getThreadIdByUsername(username: string): Promise<string | null>;
    /**
     * Get a flat list of recent messages across multiple threads.
     * @param {number} [limit=20]
     * @returns {Promise<unknown[]>}
     */
    getRecentMessages(limit?: number): Promise<unknown[]>;
    /**
     * Search messages in a thread for a text query.
     * @param {string} threadId
     * @param {string} query
     * @returns {Promise<unknown[]>}
     */
    searchMessages(threadId: string, query: string): Promise<unknown[]>;
    /**
     * Create a new group thread with the given user IDs.
     * @param {string[]} userIds
     * @returns {Promise<unknown>}
     */
    createThread(userIds: string[]): Promise<unknown>;
    /**
     * Mark a specific message as seen.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    markAsSeen(threadId: string, itemId: string): Promise<void>;
    /**
     * Mark the latest message in every inbox thread as seen.
     * @returns {Promise<{marked: number}>}
     */
    markAllThreadsSeen(): Promise<{
        marked: number;
    }>;
    /**
     * Approve a pending DM request.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    approveThread(threadId: string): Promise<void>;
    /**
     * Decline a pending DM request.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    declineThread(threadId: string): Promise<void>;
    /**
     * Mute notifications for a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    muteThread(threadId: string): Promise<void>;
    /**
     * Unmute notifications for a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    unmuteThread(threadId: string): Promise<void>;
    /**
     * Hide / delete a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    deleteThread(threadId: string): Promise<void>;
    /**
     * Archive (hide) a thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    archiveThread(threadId: string): Promise<void>;
    /**
     * Unarchive a previously hidden thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    unarchiveThread(threadId: string): Promise<void>;
    /**
     * Leave a group thread.
     * @param {string} threadId
     * @returns {Promise<void>}
     */
    leaveThread(threadId: string): Promise<void>;
    /**
     * Add users to a group thread.
     * @param {string}   threadId
     * @param {string[]} userIds
     * @returns {Promise<void>}
     */
    addUsersToThread(threadId: string, userIds: string[]): Promise<void>;
    /**
     * Remove a user from a group thread.
     * @param {string} threadId
     * @param {string} userId
     * @returns {Promise<void>}
     */
    removeUserFromThread(threadId: string, userId: string): Promise<void>;
    /**
     * Rename a group thread.
     * @param {string} threadId
     * @param {string} title
     * @returns {Promise<void>}
     */
    updateThreadTitle(threadId: string, title: string): Promise<void>;
    /**
     * Send a photo from a local file path.
     * @param {string} threadId
     * @param {string} photoPath
     * @returns {Promise<object>}
     */
    sendPhoto(threadId: string, photoPath: string): Promise<object>;
    /**
     * Send a photo followed by a caption text message.
     * @param {string} threadId
     * @param {string} photoPath
     * @param {string} [caption='']
     * @returns {Promise<object>}
     */
    sendPhotoWithCaption(threadId: string, photoPath: string, caption?: string): Promise<object>;
    /**
     * Download a photo from a URL and send it.
     * @param {string} threadId
     * @param {string} photoUrl
     * @returns {Promise<object>}
     */
    sendPhotoFromUrl(threadId: string, photoUrl: string): Promise<object>;
    /**
     * Send a video from a local file path.
     * @param {string} threadId
     * @param {string} videoPath
     * @returns {Promise<object>}
     */
    sendVideo(threadId: string, videoPath: string): Promise<object>;
    /**
     * Download a video from a URL and send it.
     * @param {string} threadId
     * @param {string} videoUrl
     * @returns {Promise<object>}
     */
    sendVideoFromUrl(threadId: string, videoUrl: string): Promise<object>;
    /**
     * Send a voice note from a local audio file.
     * @param {string} threadId
     * @param {string} audioPath
     * @returns {Promise<object>}
     */
    sendVoiceNote(threadId: string, audioPath: string): Promise<object>;
    /**
     * Send a sticker by sticker ID.
     * @param {string} threadId
     * @param {string} stickerId
     * @returns {Promise<object>}
     */
    sendSticker(threadId: string, stickerId: string): Promise<object>;
    /**
     * Send a GIF by Giphy ID.
     * @param {string} threadId
     * @param {string} giphyId
     * @returns {Promise<object>}
     */
    sendGif(threadId: string, giphyId: string): Promise<object>;
    /**
     * Send an animated media item by its media ID.
     * @param {string} threadId
     * @param {string} mediaId
     * @returns {Promise<object>}
     */
    sendAnimatedMedia(threadId: string, mediaId: string): Promise<object>;
    /**
     * Share a feed post into a thread.
     * @param {string} threadId
     * @param {string} mediaId
     * @param {string} [message='']
     * @returns {Promise<object>}
     */
    shareMediaToThread(threadId: string, mediaId: string, message?: string): Promise<object>;
    /**
     * Send a link message.
     * @param {string} threadId
     * @param {string} linkUrl
     * @param {string} [linkText='']
     * @returns {Promise<object>}
     */
    sendLink(threadId: string, linkUrl: string, linkText?: string): Promise<object>;
    /**
     * Get URL and metadata for media inside a specific message.
     * @param {string} threadId
     * @param {string} itemId
     * @returns {Promise<MediaInfo>}
     */
    getMessageMediaUrl(threadId: string, itemId: string): Promise<MediaInfo>;
    /**
     * Download media from a message to disk.
     * @param {string}      threadId
     * @param {string}      itemId
     * @param {string|null} [savePath=null]
     * @returns {Promise<DownloadedMedia>}
     */
    downloadMessageMedia(threadId: string, itemId: string, savePath?: string | null): Promise<DownloadedMedia>;
    /**
     * Forward a media message from one thread to another.
     * @param {string} fromThreadId
     * @param {string} toThreadId
     * @param {string} itemId
     * @returns {Promise<object>}
     */
    forwardMessage(fromThreadId: string, toThreadId: string, itemId: string): Promise<object>;
    /**
     * Get full user info by numeric or string user ID.
     * @param {string|number} userId
     * @returns {Promise<object>}
     */
    getUserInfo(userId: string | number): Promise<object>;
    /**
     * Get full user info by username.
     * @param {string} username
     * @returns {Promise<object>}
     */
    getUserInfoByUsername(username: string): Promise<object>;
    /**
     * Search for users matching a query string.
     * @param {string} query
     * @returns {Promise<object[]>}
     */
    searchUsers(query: string): Promise<object[]>;
    /**
     * Get the friendship relationship between the session and a user.
     * @param {string|number} userId
     * @returns {Promise<object>}
     */
    getFriendshipStatus(userId: string | number): Promise<object>;
    /**
     * Get friendship statuses for multiple users in one call.
     * @param {string[]} userIds
     * @returns {Promise<Record<string, object>>}
     */
    getFriendshipStatuses(userIds: string[]): Promise<Record<string, object>>;
    /**
     * Follow a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    followUser(userId: string | number): Promise<void>;
    /**
     * Unfollow a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    unfollowUser(userId: string | number): Promise<void>;
    /**
     * Block a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    blockUser(userId: string | number): Promise<void>;
    /**
     * Unblock a user.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    unblockUser(userId: string | number): Promise<void>;
    /**
     * Get the list of blocked users.
     * @returns {Promise<unknown[]>}
     */
    getBlockedUsers(): Promise<unknown[]>;
    /**
     * Mute a user's posts and/or stories in the feed.
     * @param {string|number} userId
     * @param {boolean} [muteStories=false]
     * @param {boolean} [mutePosts=false]
     * @returns {Promise<void>}
     */
    muteUser(userId: string | number, muteStories?: boolean, mutePosts?: boolean): Promise<void>;
    /**
     * Get the followers of a user, paginating up to maxItems.
     * @param {string|number} userId
     * @param {number} [maxItems=100]
     * @returns {Promise<unknown[]>}
     */
    getFollowers(userId: string | number, maxItems?: number): Promise<unknown[]>;
    /**
     * Get the users a given user follows, paginating up to maxItems.
     * @param {string|number} userId
     * @param {number} [maxItems=100]
     * @returns {Promise<unknown[]>}
     */
    getFollowing(userId: string | number, maxItems?: number): Promise<unknown[]>;
    /**
     * Get accounts suggested by Instagram for the current session.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getSuggestedUsers(maxItems?: number): Promise<unknown[]>;
    /**
     * Get the home timeline feed.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getTimelineFeed(maxItems?: number): Promise<unknown[]>;
    /**
     * Get a user's post feed.
     * @param {string|number} userId
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getUserFeed(userId: string | number, maxItems?: number): Promise<unknown[]>;
    /**
     * Get posts tagged with a hashtag.
     * @param {string} hashtag
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getHashtagFeed(hashtag: string, maxItems?: number): Promise<unknown[]>;
    /**
     * Get the Explore / Discover feed.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getExploreFeed(maxItems?: number): Promise<unknown[]>;
    /**
     * Get posts from a location by location ID.
     * @param {string|number} locationId
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getLocationFeed(locationId: string | number, maxItems?: number): Promise<unknown[]>;
    /**
     * Get posts the current user has liked.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getLikedPosts(maxItems?: number): Promise<unknown[]>;
    /**
     * @deprecated Use getNotifications() instead.
     * @returns {Promise<unknown[]>}
     */
    getActivityFeed(): Promise<unknown[]>;
    /**
     * Get the reels tray (stories at the top of the feed).
     * @returns {Promise<unknown[]>}
     */
    getReelsTrayCandidates(): Promise<unknown[]>;
    /**
     * Like a feed post.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    likePost(mediaId: string): Promise<void>;
    /**
     * Unlike a feed post.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    unlikePost(mediaId: string): Promise<void>;
    /**
     * Comment on a post.
     * @param {string} mediaId
     * @param {string} text
     * @returns {Promise<unknown>}
     */
    commentPost(mediaId: string, text: string): Promise<unknown>;
    /**
     * Delete a comment.
     * @param {string} mediaId
     * @param {string} commentId
     * @returns {Promise<void>}
     */
    deleteComment(mediaId: string, commentId: string): Promise<void>;
    /**
     * Like a comment.
     * @param {string} mediaId
     * @param {string} commentId
     * @returns {Promise<void>}
     */
    likeComment(mediaId: string, commentId: string): Promise<void>;
    /**
     * Unlike a comment.
     * @param {string} mediaId
     * @param {string} commentId
     * @returns {Promise<void>}
     */
    unlikeComment(mediaId: string, commentId: string): Promise<void>;
    /**
     * Get comments on a post.
     * @param {string} mediaId
     * @param {number} [maxItems=20]
     * @returns {Promise<unknown[]>}
     */
    getComments(mediaId: string, maxItems?: number): Promise<unknown[]>;
    /**
     * Get metadata for a post by media ID.
     * @param {string} mediaId
     * @returns {Promise<unknown>}
     */
    getMediaInfo(mediaId: string): Promise<unknown>;
    /**
     * Delete a post.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    deletePost(mediaId: string): Promise<void>;
    /**
     * Get posts the current user is tagged in.
     * @param {string|number} userId
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getTaggedPosts(userId: string | number, maxItems?: number): Promise<unknown[]>;
    /**
     * Get posts the current user has saved.
     * @param {number} [maxItems=30]
     * @returns {Promise<unknown[]>}
     */
    getSavedPosts(maxItems?: number): Promise<unknown[]>;
    /**
     * Save a post to the saved collection.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    savePost(mediaId: string): Promise<void>;
    /**
     * Remove a post from the saved collection.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    unsavePost(mediaId: string): Promise<void>;
    /**
     * Upload a photo to the feed.
     * @param {string} photoPath
     * @param {string} [caption='']
     * @returns {Promise<unknown>}
     */
    uploadPhoto(photoPath: string, caption?: string): Promise<unknown>;
    /**
     * Upload a video to the feed.
     * @param {string}      videoPath
     * @param {string}      [caption='']
     * @param {string|null} [coverPath=null]
     * @returns {Promise<unknown>}
     */
    uploadVideo(videoPath: string, caption?: string, coverPath?: string | null): Promise<unknown>;
    /**
     * Upload a carousel (album) of photos to the feed.
     * @param {string[]} photoPaths
     * @param {string}   [caption='']
     * @returns {Promise<unknown>}
     */
    uploadCarousel(photoPaths: string[], caption?: string): Promise<unknown>;
    /**
     * Get stories for a user.
     * @param {string|number} userId
     * @returns {Promise<unknown[]>}
     */
    getStories(userId: string | number): Promise<unknown[]>;
    /**
     * Upload a photo story.
     * @param {string} photoPath
     * @param {object} [options={}]
     * @returns {Promise<unknown>}
     */
    uploadStory(photoPath: string, options?: object): Promise<unknown>;
    /**
     * Upload a video story.
     * @param {string} videoPath
     * @param {object} [options={}]
     * @returns {Promise<unknown>}
     */
    uploadVideoStory(videoPath: string, options?: object): Promise<unknown>;
    /**
     * Delete a story by its media ID.
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    deleteStory(mediaId: string): Promise<void>;
    /**
     * React to a story with an emoji.
     * @param {string|number} userId
     * @param {string}        storyId
     * @param {string}        emoji
     * @returns {Promise<void>}
     */
    reactToStory(userId: string | number, storyId: string, emoji: string): Promise<void>;
    /**
     * Get stories from the current account's close friends list.
     * @returns {Promise<unknown[]>}
     */
    getCloseFriendsStories(): Promise<unknown[]>;
    /**
     * Get story highlight reels for a user.
     * @param {string|number} userId
     * @returns {Promise<unknown[]>}
     */
    getUserHighlights(userId: string | number): Promise<unknown[]>;
    /**
     * Get the story items inside a specific highlight reel.
     * @param {string} highlightId  e.g. `"highlight:12345678"`
     * @returns {Promise<unknown[]>}
     */
    getHighlightItems(highlightId: string): Promise<unknown[]>;
    /**
     * Edit the current account's profile fields.
     * @param {{username?: string, name?: string, biography?: string, email?: string, phone?: string, website?: string, gender?: number}} [options={}]
     * @returns {Promise<unknown>}
     */
    editProfile(options?: {
        username?: string;
        name?: string;
        biography?: string;
        email?: string;
        phone?: string;
        website?: string;
        gender?: number;
    }): Promise<unknown>;
    /**
     * Update the profile picture from a local image file.
     * @param {string} photoPath
     * @returns {Promise<unknown>}
     */
    setProfilePicture(photoPath: string): Promise<unknown>;
    /**
     * Change the account password.
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<void>}
     */
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
    /**
     * Search for hashtags matching a query.
     * @param {string} query
     * @returns {Promise<unknown[]>}
     */
    searchHashtags(query: string): Promise<unknown[]>;
    /**
     * Search for locations matching a query.
     * @param {string} query
     * @returns {Promise<unknown[]>}
     */
    searchLocations(query: string): Promise<unknown[]>;
    /**
     * Combined search — users, hashtags, and locations in parallel.
     * @param {string} query
     * @returns {Promise<SearchAllResult>}
     */
    searchAll(query: string): Promise<SearchAllResult>;
    /**
     * Get the activity notification inbox (likes, comments, follows, etc.).
     * @returns {Promise<unknown>}
     */
    getNotifications(): Promise<unknown>;
    /**
     * Get pending follow requests (for private accounts).
     * @returns {Promise<unknown[]>}
     */
    getFollowRequests(): Promise<unknown[]>;
    /**
     * Approve a follow request by user ID.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    approveFollowRequest(userId: string | number): Promise<void>;
    /**
     * Reject/deny a follow request by user ID.
     * @param {string|number} userId
     * @returns {Promise<void>}
     */
    rejectFollowRequest(userId: string | number): Promise<void>;
}
import InstagramClientV2 from './InstagramClientV2.js';
import DirectMessageV2 from './DirectMessageV2.js';
//# sourceMappingURL=index.d.ts.map