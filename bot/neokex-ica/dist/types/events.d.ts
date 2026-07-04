export type EventMap = {
    message: [import("./message.js").MessageEvent];
    pending_request: [{
        count: number;
        threads: import("./thread.js").Thread[];
    }];
    error: [Error];
    login: [{
        userId: string;
        username: string;
    }];
    ratelimit: [{
        retryAfter?: number;
    }];
    typing: [{
        thread_id: string;
        user_id: string;
    }];
    /**
     * 'polling:start'
     */
    "": [{
        interval: number;
    }];
    shutdown: [{
        signal: string;
    }];
};
//# sourceMappingURL=events.d.ts.map