/**
 * @module types/user
 * User and social relationship JSDoc typedef definitions.
 * (Runtime no-op — types only; consumed by IDE tooling via JSDoc.)
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */

/**
 * @typedef {Object} UserInfo
 * @property {number|string} pk
 * @property {string}        username
 * @property {string}        full_name
 * @property {string}        [biography]
 * @property {string}        [external_url]
 * @property {number}        [follower_count]
 * @property {number}        [following_count]
 * @property {number}        [media_count]
 * @property {boolean}       [is_private]
 * @property {boolean}       [is_verified]
 * @property {string}        [profile_pic_url]
 */

/**
 * @typedef {Object} FriendshipStatus
 * @property {boolean} following
 * @property {boolean} followed_by
 * @property {boolean} blocking
 * @property {boolean} muting
 * @property {boolean} is_private
 * @property {boolean} incoming_request
 * @property {boolean} outgoing_request
 */

/**
 * @typedef {Object} SessionState
 * @property {Record<string,string>} cookies
 * @property {string|null}           userId
 * @property {string|null}           username
 * @property {string}                [deviceId]
 * @property {string}                [uuid]
 */

/**
 * @typedef {Object} SessionValidationResult
 * @property {boolean}      valid
 * @property {string|null}  [userId]
 * @property {string|null}  [username]
 * @property {string}       [error]
 */

/**
 * @typedef {Object} LoginResult
 * @property {unknown} logged_in_user
 * @property {string}  userId
 * @property {string}  username
 */
