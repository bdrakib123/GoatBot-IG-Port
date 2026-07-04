export default class DirectMessageV2 {
    constructor(client: any);
    client: any;
    ig: any;
    isPolling: boolean;
    pollingInterval: number;
    seenMessageIds: Set<any>;
    seenIdTimestamps: Map<any, any>;
    threadLastItemMap: Map<any, any>;
    replyHandlers: Map<any, any>;
    isSeeded: boolean;
    _shutdownBound: boolean;
    _stats: {
        startedAt: null;
        totalPolls: number;
        totalErrors: number;
        consecutiveErrors: number;
        lastPollAt: null;
        lastErrorAt: null;
        lastErrorMsg: null;
        circuitOpen: boolean;
        circuitOpenedAt: null;
        currentInterval: number;
    };
    getPollingStats(): {
        uptime: number;
        uptimeFormatted: string;
        seenIdCount: number;
        replyHandlerCount: number;
        trackedThreads: number;
        startedAt: null;
        totalPolls: number;
        totalErrors: number;
        consecutiveErrors: number;
        lastPollAt: null;
        lastErrorAt: null;
        lastErrorMsg: null;
        circuitOpen: boolean;
        circuitOpenedAt: null;
        currentInterval: number;
    };
    _parseResult(result: any): any;
    _trackSeen(itemId: any): void;
    _evictOldSeenIds(): void;
    _registerShutdownHandlers(): void;
    getInbox(options?: {}): Promise<{
        threads: any;
        has_older: any;
        cursor: any;
        unseen_count: any;
        pending_requests_total: number;
    }>;
    getFullInbox(maxPages?: number): Promise<{
        threads: any[];
        total: number;
    }>;
    getUnreadThreads(): Promise<any>;
    getThread(threadId: any, options?: {}): Promise<{
        thread_id: any;
        items: any;
        has_older: any;
        cursor: any;
        users: never[];
    }>;
    getThreadMessages(threadId: any, limit?: number): Promise<any>;
    getThreadParticipants(threadId: any): Promise<any>;
    getThreadIdByUsername(username: any): Promise<any>;
    createThread(userIds: any): Promise<any>;
    sendMessage(threadId: any, text: any, options?: {}): Promise<any>;
    sendMessageToUser(userId: any, text: any, options?: {}): Promise<any>;
    sendMessageBulk(threadIds: any, text: any, delayBetween?: number): Promise<({
        threadId: any;
        success: boolean;
        result: any;
        error?: undefined;
    } | {
        threadId: any;
        success: boolean;
        error: any;
        result?: undefined;
    })[]>;
    scheduleMessage(threadId: any, text: any, delayMs: any, options?: {}): Promise<any>;
    sendMessageWithReply(threadId: any, text: any, onReplyCallback: any, options?: {}): Promise<any>;
    sendMessageToUserWithReply(userId: any, text: any, onReplyCallback: any, options?: {}): Promise<any>;
    registerReplyHandler(itemId: any, callback: any, timeout?: number): void;
    clearReplyHandler(itemId: any): boolean;
    _sweepExpiredReplyHandlers(maxAge?: number): void;
    markAsSeen(threadId: any, itemId: any): Promise<void>;
    markAllThreadsSeen(): Promise<{
        marked: number;
    }>;
    searchMessages(threadId: any, query: any): Promise<any>;
    getPendingInbox(): Promise<{
        threads: any;
        has_older: any;
    }>;
    approveThread(threadId: any): Promise<void>;
    declineThread(threadId: any): Promise<void>;
    sendPhoto(threadId: any, photoPath: any): Promise<any>;
    sendPhotoWithCaption(threadId: any, photoPath: any, caption?: string): Promise<any>;
    sendVideo(threadId: any, videoPath: any): Promise<any>;
    sendVoiceNote(threadId: any, audioPath: any): Promise<any>;
    sendSticker(threadId: any, stickerId: any): Promise<any>;
    sendGif(threadId: any, giphyId: any): Promise<any>;
    sendAnimatedMedia(threadId: any, mediaId: any): Promise<any>;
    shareMediaToThread(threadId: any, mediaId: any, message?: string): Promise<any>;
    sendLink(threadId: any, linkUrl: any, linkText?: string): Promise<any>;
    _downloadToTemp(url: any, ext: any, timeoutMs?: number): Promise<string>;
    sendPhotoFromUrl(threadId: any, photoUrl: any): Promise<any>;
    sendVideoFromUrl(threadId: any, videoUrl: any): Promise<any>;
    getMessageMediaUrl(threadId: any, itemId: any): Promise<{
        item_id: any;
        item_type: any;
        media: null;
    }>;
    downloadMessageMedia(threadId: any, itemId: any, savePath?: null): Promise<{
        path: string;
        size: any;
        type: string;
        url: any;
    }>;
    forwardMessage(fromThreadId: any, toThreadId: any, itemId: any): Promise<any>;
    sendReaction(threadId: any, itemId: any, emoji: any): Promise<void>;
    removeReaction(threadId: any, itemId: any): Promise<void>;
    unsendMessage(threadId: any, itemId: any): Promise<void>;
    editMessage(threadId: any, itemId: any, newText: any): Promise<{
        success: boolean;
        item_id: any;
        new_text: any;
    }>;
    indicateTyping(threadId: any, isTyping?: boolean): Promise<void>;
    muteThread(threadId: any): Promise<void>;
    unmuteThread(threadId: any): Promise<void>;
    deleteThread(threadId: any): Promise<void>;
    archiveThread(threadId: any): Promise<void>;
    unarchiveThread(threadId: any): Promise<void>;
    leaveThread(threadId: any): Promise<void>;
    addUsersToThread(threadId: any, userIds: any): Promise<void>;
    removeUserFromThread(threadId: any, userId: any): Promise<void>;
    updateThreadTitle(threadId: any, title: any): Promise<void>;
    getRecentMessages(limit?: number): Promise<any[]>;
    _seedSeenIds(): Promise<void>;
    startPolling(intervalOrOptions?: number): Promise<void>;
    _pollCycle(): Promise<boolean>;
    stopPolling(): void;
    restartPolling(intervalOrOptions: any): Promise<void>;
}
//# sourceMappingURL=DirectMessageV2.d.ts.map