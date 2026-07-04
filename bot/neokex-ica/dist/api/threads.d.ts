export class ThreadsAPI {
    constructor(ig: any, userId: any);
    ig: any;
    userId: any;
    getInbox(): Promise<{
        threads: unknown;
        has_older: boolean;
        cursor: any;
        unseen_count: any;
        pending_requests_total: number;
    }>;
    getFullInbox(maxPages?: number): Promise<{
        threads: any[];
        total: number;
    }>;
    getUnreadThreads(): Promise<any>;
    getPendingInbox(): Promise<{
        threads: any;
        has_older: boolean;
    }>;
    getThread(threadId: any, cursor: any): Promise<{
        thread_id: any;
        items: any;
        has_older: any;
        cursor: any;
        users: never[];
    }>;
    getThreadMessages(threadId: any, limit?: number): Promise<any>;
    getThreadParticipants(threadId: any): Promise<any>;
    getThreadIdByUsername(username: any): Promise<any>;
    searchMessages(threadId: any, query: any): Promise<any>;
    getRecentMessages(limit?: number): Promise<any[]>;
    createThread(userIds: any): Promise<any>;
    markAsSeen(threadId: any, itemId: any): Promise<void>;
    markAllThreadsSeen(): Promise<{
        marked: number;
    }>;
    approveThread(threadId: any): Promise<void>;
    declineThread(threadId: any): Promise<void>;
    muteThread(threadId: any): Promise<void>;
    unmuteThread(threadId: any): Promise<void>;
    deleteThread(threadId: any): Promise<void>;
    archiveThread(threadId: any): Promise<void>;
    unarchiveThread(threadId: any): Promise<void>;
    leaveThread(threadId: any): Promise<void>;
    addUsersToThread(threadId: any, userIds: any): Promise<void>;
    removeUserFromThread(threadId: any, userId: any): Promise<void>;
    updateThreadTitle(threadId: any, title: any): Promise<void>;
}
//# sourceMappingURL=threads.d.ts.map