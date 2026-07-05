const log = require('../logger/log.js');

/**
 * Bridge between the V2 consolidated logger and the local utils/logger.
 * This ensures consistency across the codebase.
 */
module.exports = {
    info: (message, meta = {}) => log.info(message, meta),
    success: (message, meta = {}) => log.success(message, meta),
    warn: (message, meta = {}) => log.warn(message, meta),
    error: (message, meta = {}) => log.error(message, meta),
    debug: (message, meta = {}) => log.debug(message, meta),
    command: (name, user, threadID, status = 'EXECUTE') => log.command(name, user, threadID, status),
    event: (name, threadID, details = '') => log.event(name, threadID, details),
    load: (...args) => log.load(...args),
    reconfigure: (config) => {
        if (log.reconfigure) log.reconfigure(config);
        const loggerIndex = require('../logger/index.js');
        if (loggerIndex.reconfigure) loggerIndex.reconfigure(config);
    }
};
