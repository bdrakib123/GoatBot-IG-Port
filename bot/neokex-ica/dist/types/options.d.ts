export type PollingOptions = {
    /**
     * Starting poll interval in ms.
     */
    interval?: number | undefined;
    /**
     * Minimum poll interval.
     */
    minInterval?: number | undefined;
    /**
     * Maximum poll interval.
     */
    maxInterval?: number | undefined;
    /**
     * Errors before circuit breaker opens.
     */
    maxConsecutiveErrors?: number | undefined;
    /**
     * Circuit breaker cooldown ms.
     */
    circuitCooldown?: number | undefined;
};
export type SendOptions = {
    /**
     * Reply to a specific message item ID.
     */
    replyToItemId?: string | undefined;
    /**
     * Timeout ms for the onReply handler.
     */
    replyTimeout?: number | undefined;
};
export type BulkSendOptions = {
    /**
     * Delay in ms between each send.
     */
    delay?: number | undefined;
};
export type EditProfileOptions = {
    username?: string | undefined;
    name?: string | undefined;
    fullName?: string | undefined;
    biography?: string | undefined;
    bio?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    externalUrl?: string | undefined;
    gender?: number | undefined;
};
export type PollingStats = {
    startedAt: number | null;
    totalPolls: number;
    totalErrors: number;
    consecutiveErrors: number;
    lastPollAt: number | null;
    lastErrorAt: number | null;
    lastErrorMsg: string | null;
    circuitOpen: boolean;
    circuitOpenedAt: number | null;
    currentInterval: number;
    uptime: number;
    uptimeFormatted: string;
    seenIdCount: number;
    replyHandlerCount: number;
    trackedThreads: number;
};
export type RetryOptions = {
    maxRetries?: number | undefined;
    label?: string | undefined;
    onRetry?: Function | undefined;
};
export type ErrorKind = "auth" | "ratelimit" | "network" | "unknown";
//# sourceMappingURL=options.d.ts.map