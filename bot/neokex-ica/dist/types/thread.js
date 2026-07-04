/**
 * @module types/thread
 * Thread and inbox JSDoc typedef definitions.
 * (Runtime no-op — types only; consumed by IDE tooling via JSDoc.)
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
export {};
/**
 * @typedef {Object} ThreadUser
 * @property {number|string} pk
 * @property {string}        username
 * @property {string}        [full_name]
 * @property {string}        [profile_pic_url]
 * @property {boolean}       [is_private]
 */
/**
 * @typedef {Object} Thread
 * @property {string}         thread_id
 * @property {string}         [thread_title]
 * @property {ThreadUser[]}   [users]
 * @property {unknown[]}      [items]
 * @property {unknown}        [last_permanent_item]
 * @property {boolean}        [has_older]
 * @property {string|null}    [cursor]
 */
/**
 * @typedef {Object} InboxResult
 * @property {Thread[]}    threads
 * @property {boolean}     has_older
 * @property {string|null} cursor
 * @property {number}      unseen_count
 * @property {number}      pending_requests_total
 */
/**
 * @typedef {Object} FullInboxResult
 * @property {Thread[]} threads
 * @property {number}   total
 */
/**
 * @typedef {Object} PendingInboxResult
 * @property {Thread[]} threads
 * @property {boolean}  has_older
 */
/**
 * @typedef {Object} ThreadResult
 * @property {string}       thread_id
 * @property {unknown[]}    items
 * @property {boolean}      has_older
 * @property {string|null}  cursor
 * @property {ThreadUser[]} users
 */
//# sourceMappingURL=thread.js.map