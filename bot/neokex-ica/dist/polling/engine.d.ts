export class PollingEngine {
    constructor(ig: any, client: any);
    ig: any;
    client: any;
    isPolling: boolean;
    isSeeded: boolean;
    shutdownBound: boolean;
    seenMessageIds: Set<any>;
    seenIdTimestamps: Map<any, any>;
    threadLastItemMap: Map<any, any>;
    replyHandlers: Map<any, any>;
    stats: {
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
    trackSeen(itemId: any): void;
    evictOldSeenIds(): void;
    sweepExpiredReplyHandlers(maxAge?: number): void;
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
    registerShutdownHandlers(): void;
    seedSeenIds(): Promise<void>;
    pollCycle(): Promise<boolean>;
    startPolling(options?: number): Promise<void>;
    stopPolling(): void;
    restartPolling(options: any): Promise<void>;
}
//# sourceMappingURL=engine.d.ts.map