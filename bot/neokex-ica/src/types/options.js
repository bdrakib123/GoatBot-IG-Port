/**
 * @module types/options
 * Configuration and option JSDoc typedef definitions.
 * (Runtime no-op — types only; consumed by IDE tooling via JSDoc.)
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */

/**
 * @typedef {Object} PollingOptions
 * @property {number} [interval=5000]            Starting poll interval in ms.
 * @property {number} [minInterval=3000]          Minimum poll interval.
 * @property {number} [maxInterval=30000]         Maximum poll interval.
 * @property {number} [maxConsecutiveErrors=5]    Errors before circuit breaker opens.
 * @property {number} [circuitCooldown=60000]     Circuit breaker cooldown ms.
 */

/**
 * @typedef {Object} SendOptions
 * @property {string} [replyToItemId]  Reply to a specific message item ID.
 * @property {number} [replyTimeout=120000] Timeout ms for the onReply handler.
 */

/**
 * @typedef {Object} BulkSendOptions
 * @property {number} [delay=1500] Delay in ms between each send.
 */

/**
 * @typedef {Object} EditProfileOptions
 * @property {string} [username]
 * @property {string} [name]
 * @property {string} [fullName]
 * @property {string} [biography]
 * @property {string} [bio]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [website]
 * @property {string} [externalUrl]
 * @property {number} [gender]
 */

/**
 * @typedef {Object} PollingStats
 * @property {number|null} startedAt
 * @property {number}      totalPolls
 * @property {number}      totalErrors
 * @property {number}      consecutiveErrors
 * @property {number|null} lastPollAt
 * @property {number|null} lastErrorAt
 * @property {string|null} lastErrorMsg
 * @property {boolean}     circuitOpen
 * @property {number|null} circuitOpenedAt
 * @property {number}      currentInterval
 * @property {number}      uptime
 * @property {string}      uptimeFormatted
 * @property {number}      seenIdCount
 * @property {number}      replyHandlerCount
 * @property {number}      trackedThreads
 */

/**
 * @typedef {Object} RetryOptions
 * @property {number}   [maxRetries=3]
 * @property {string}   [label='request']
 * @property {function} [onRetry]
 */

/**
 * @typedef {'auth'|'ratelimit'|'network'|'unknown'} ErrorKind
 */
