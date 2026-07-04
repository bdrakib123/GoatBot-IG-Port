/**
 * @module types/events
 * Event payload JSDoc typedef definitions.
 * (Runtime no-op — types only; consumed by IDE tooling via JSDoc.)
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
export {};
/**
 * @typedef {Object} EventMap
 * @property {[import('./message.js').MessageEvent]}                          message
 * @property {[{count: number, threads: import('./thread.js').Thread[]}]}     pending_request
 * @property {[Error]}                                                        error
 * @property {[{userId: string, username: string}]}                          login
 * @property {[{retryAfter?: number}]}                                       ratelimit
 * @property {[{thread_id: string, user_id: string}]}                        typing
 * @property {[{interval: number}]}                                          'polling:start'
 * @property {[import('./options.js').PollingStats]}                         'polling:stop'
 * @property {[{error: Error}]}                                              'session:expired'
 * @property {[{consecutiveErrors: number, cooldown: number}]}               'circuit:open'
 * @property {[]}                                                             'circuit:closed'
 * @property {[{cookieFile: string}]}                                        'cookies:loaded'
 * @property {[{cookieFile: string}]}                                        'cookies:saved'
 * @property {[{signal: string}]}                                            shutdown
 */
//# sourceMappingURL=events.js.map