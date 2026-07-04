/**
 * Calculate a jitter-augmented exponential-backoff delay.
 *
 * @param {number} attempt - Current attempt number (1-based).
 * @param {number} [base=2000]  - Base delay in ms.
 * @param {number} [max=60000]  - Maximum delay cap in ms.
 * @returns {number}
 */
export function exponentialBackoff(attempt: number, base?: number, max?: number): number;
/**
 * Execute `fn` with automatic retries and exponential backoff.
 *
 * - Auth errors are re-thrown immediately without retrying.
 * - Rate-limit errors use a longer base delay (10s–120s).
 * - Network / unknown errors use a shorter base delay (2s–30s).
 *
 * @param {() => Promise<unknown>} fn - Async function to execute.
 * @param {{maxRetries?: number, label?: string, onRetry?: function}} [options={}]
 * @returns {Promise<unknown>}
 */
export function withRetry(fn: () => Promise<unknown>, options?: {
    maxRetries?: number;
    label?: string;
    onRetry?: Function;
}): Promise<unknown>;
//# sourceMappingURL=retry.d.ts.map