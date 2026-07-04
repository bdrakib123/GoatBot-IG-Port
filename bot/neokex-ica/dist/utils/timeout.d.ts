/**
 * @module utils/timeout
 * Hard-deadline wrapper for any promise.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
/**
 * Race a promise against a deadline.
 * Rejects with a descriptive error if `ms` elapses before `promise` settles.
 *
 * @param {Promise<unknown>} promise - The operation to time-limit.
 * @param {number}           ms      - Timeout in milliseconds.
 * @param {string}           [label='operation'] - Label used in the rejection message.
 * @returns {Promise<unknown>}
 */
export function withTimeout(promise: Promise<unknown>, ms: number, label?: string): Promise<unknown>;
//# sourceMappingURL=timeout.d.ts.map