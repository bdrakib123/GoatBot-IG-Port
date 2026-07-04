/**
 * @module utils/format
 * Formatting and error-classification utilities.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */

/**
 * Convert milliseconds to a human-readable uptime string.
 * e.g. `formatUptime(3665000)` → `"1h 1m 5s"`
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes      = Math.floor(totalSeconds / 60);
  const hours        = Math.floor(minutes / 60);
  const days         = Math.floor(hours / 24);

  if (days    > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours   > 0) return `${hours}h ${minutes % 60}m ${totalSeconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${totalSeconds % 60}s`;
  return `${totalSeconds}s`;
}

/**
 * Classify an error into one of four categories used for retry-backoff decisions.
 *
 * - `auth`      — session expired, login required, checkpoint
 * - `ratelimit` — HTTP 429, throttle, rate-limit
 * - `network`   — HTTP 5xx, ECONNREFUSED, timeout, ENOTFOUND
 * - `unknown`   — anything else
 *
 * @param {unknown} error
 * @returns {'auth'|'ratelimit'|'network'|'unknown'}
 */
export function classifyError(error) {
  const raw    = error;
  const msg    = (typeof raw?.message === 'string' ? raw.message : String(error)).toLowerCase();
  const status = raw?.response?.status ?? raw?.statusCode;

  if (
    status === 401 ||
    msg.includes('login_required') ||
    msg.includes('not authenticated') ||
    msg.includes('checkpoint')
  ) return 'auth';

  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('throttle') ||
    msg.includes('rate limit') ||
    msg.includes('please wait')
  ) return 'ratelimit';

  if (
    (typeof status === 'number' && status >= 500) ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('500') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('enotfound')
  ) return 'network';

  return 'unknown';
}
