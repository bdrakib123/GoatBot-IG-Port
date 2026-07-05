const logger = require('./index.js');

/**
 * Simplifies large objects like Axios errors to prevent log pollution
 */
function simplifyObject(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

    // Check if it's an Axios error or similar large request error
    if (obj.isAxiosError || obj.config || obj.response) {
        return {
            message: obj.message,
            code: obj.code,
            status: obj.response?.status,
            method: obj.config?.method?.toUpperCase(),
            url: obj.config?.url,
            data: typeof obj.response?.data === 'string'
                ? (obj.response.data.length > 500 ? obj.response.data.slice(0, 500) + '...' : obj.response.data)
                : (typeof obj.response?.data === 'object' ? '[Object]' : obj.response?.data)
        };
    }

    // If it's an Error object, extract useful fields
    if (obj instanceof Error) {
        return {
            name: obj.name,
            message: obj.message,
            stack: obj.stack?.split('\n').slice(0, 3).join('\n') + '...'
        };
    }

    return obj;
}

/**
 * Enhanced formatAndLog function to handle various argument styles and inject context
 * @param {string} level The log level (info, success, warn, error, debug)
 * @param {Array} args The arguments passed to the log function
 */
function formatAndLog(level, args) {
    let tag = '';
    let message = '';
    let meta = {};

    if (args.length === 1) {
        message = args[0];
    } else if (args.length >= 2) {
        // If the first argument is a short uppercase string, treat it as a tag
        if (typeof args[0] === 'string' && (args[0] === args[0].toUpperCase() || args[0].length < 15)) {
            tag = args[0];
            message = args[1];
            if (args.length > 2) {
                meta = typeof args[2] === 'object' && !Array.isArray(args[2]) ? args[2] : { details: args.slice(2) };
            }
        } else {
            message = args[0];
            meta = typeof args[1] === 'object' && !Array.isArray(args[1]) ? args[1] : { details: args.slice(1) };
        }
    }

    // Apply simplification to message and meta properties
    const processedMessage = simplifyObject(message);

    // Process meta to simplify nested objects
    const processedMeta = {};
    for (const [key, value] of Object.entries(meta)) {
        processedMeta[key] = simplifyObject(value);
    }

    logger.log({
        level,
        tag,
        message: typeof processedMessage === 'object' ? JSON.stringify(processedMessage, null, 2) : String(processedMessage),
        ...processedMeta
    });
}

const log = {
    err: (...args) => formatAndLog('error', args),
    error: (...args) => formatAndLog('error', args),
    warn: (...args) => formatAndLog('warn', args),
    info: (...args) => formatAndLog('info', args),
    success: (...args) => formatAndLog('success', args),
    succes: (...args) => formatAndLog('success', args), // Compatibility with common typo
    debug: (...args) => formatAndLog('debug', args),

    // Specialized loggers for common bot tasks
    command: (cmdName, userID, threadID, status = 'EXECUTE') => {
        formatAndLog('info', ['COMMAND', `Command ${cmdName} ${status}`, { userID, threadID, commandName: cmdName }]);
    },

    event: (eventName, threadID, details = '') => {
        formatAndLog('info', ['EVENT', `${eventName}${details ? `: ${details}` : ''}`, { threadID, eventName }]);
    },

    master: (...args) => formatAndLog('info', ['MASTER', ...args]),

    dev: (...args) => {
        if (process.env.NODE_ENV === 'development' || global.GoatBot?.config?.logging?.logLevel === 'debug') {
            formatAndLog('debug', ['DEV', ...args]);
        }
    },

    load: (...args) => formatAndLog('info', ['LOAD', ...args])
};

module.exports = log;
