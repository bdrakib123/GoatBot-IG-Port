export function generateDeviceId(): string;
export function generateUUID(): string;
export function generateRequestId(): string;
export function sleep(ms: any): Promise<any>;
export function getUsernameFromUrl(url: any): any;
export function generateSignature(data: any, key: any): string;
export function signPayload(payload: any, key: any): {
    signed_body: string;
    ig_sig_key_version: string;
};
export function generatePhoneId(): string;
export function generateAdId(): string;
export function generateWaterfallId(): string;
export function formatUptime(ms: any): string;
export function classifyError(error: any): "auth" | "ratelimit" | "network" | "unknown";
export function exponentialBackoff(attempt: any, base?: number, max?: number): number;
export function withTimeout(promise: any, ms: any, label?: string): Promise<any>;
export function withRetry(fn: any, { maxRetries, label, onRetry }?: {
    maxRetries?: number | undefined;
    label?: string | undefined;
    onRetry?: null | undefined;
}): Promise<any>;
//# sourceMappingURL=utils.d.ts.map