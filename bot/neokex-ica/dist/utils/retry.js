/**
 * @module utils/retry
 * Exponential-backoff retry with per-error-kind delays.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import { sleep } from './sleep.js';
import { classifyError } from './format.js';
/**
 * Calculate a jitter-augmented exponential-backoff delay.
 *
 * @param {number} attempt - Current attempt number (1-based).
 * @param {number} [base=2000]  - Base delay in ms.
 * @param {number} [max=60000]  - Maximum delay cap in ms.
 * @returns {number}
 */
export function exponentialBackoff(attempt, base = 2000, max = 60000) {
    const delay = Math.min(base * Math.pow(2, attempt - 1), max);
    const jitter = Math.random() * 1000;
    return Math.round(delay + jitter);
}
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
export async function withRetry(fn, options = {}) {
    const { maxRetries = 3, label = 'request', onRetry } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const kind = classifyError(error);
            if (kind === 'auth')
                throw error;
            if (attempt < maxRetries) {
                const delay = kind === 'ratelimit'
                    ? exponentialBackoff(attempt, 10_000, 120_000)
                    : exponentialBackoff(attempt, 2_000, 30_000);
                onRetry?.({ attempt, maxRetries, delay, error, kind, label });
                await sleep(delay);
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map