/**
 * @module types/message
 * Message and send operation JSDoc typedef definitions.
 * (Runtime no-op — types only; consumed by IDE tooling via JSDoc.)
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
export {};
/**
 * @typedef {Object} SendResult
 * @property {string} item_id
 * @property {string} thread_id
 * @property {string} timestamp
 * @property {string} [text]
 * @property {'sent'|'failed'} status
 */
/**
 * @typedef {Object} MessageReply
 * @property {string} item_id
 * @property {string} text
 * @property {string|number} user_id
 * @property {string} timestamp
 */
/**
 * @typedef {Object} MessageEvent
 * @property {string}         thread_id
 * @property {string}         item_id
 * @property {string|number}  user_id
 * @property {string}         text
 * @property {string}         timestamp
 * @property {boolean}        is_from_me
 * @property {string|null}    thread_title
 * @property {unknown[]}      thread_users
 * @property {RawMessageItem} message
 * @property {MessageReply}   [messageReply]
 */
/**
 * @typedef {Object} RawMessageItem
 * @property {string}         [item_id]
 * @property {string|number}  [user_id]
 * @property {string}         [text]
 * @property {string}         [timestamp]
 * @property {string}         [item_type]
 * @property {unknown}        [media]
 * @property {RawMessageItem} [replied_to_message]
 */
/**
 * @typedef {Object} BulkSendResult
 * @property {string}     threadId
 * @property {boolean}    success
 * @property {SendResult} [result]
 * @property {string}     [error]
 */
/**
 * @typedef {Promise<SendResult> & {cancel: function(): void}} ScheduledMessage
 */
/**
 * @typedef {Object} ReplyHandlerEntry
 * @property {ReplyCallback} callback
 * @property {*}             timerId
 * @property {number}        registeredAt
 */
/**
 * @typedef {function(MessageEvent): void|Promise<void>} ReplyCallback
 */
/**
 * @typedef {Object} MediaInfo
 * @property {string}  item_id
 * @property {string}  [item_type]
 * @property {object|null} media
 */
/**
 * @typedef {Object} DownloadedMedia
 * @property {string} path
 * @property {number} size
 * @property {string} type
 * @property {string} url
 */
//# sourceMappingURL=message.js.map