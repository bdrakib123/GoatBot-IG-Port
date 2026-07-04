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
export function withTimeout(promise, ms, label = 'operation') {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout: ${label} exceeded ${ms}ms`));
        }, ms);
        promise.then((value) => { clearTimeout(timer); resolve(value); }, (err) => { clearTimeout(timer); reject(err); });
    });
}
//# sourceMappingURL=timeout.js.map