const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { colors } = require('../func/colors.js');

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Custom levels and colors
const levels = {
    error: 0,
    warn: 1,
    success: 2,
    info: 3,
    debug: 4,
};

const levelColors = {
    error: 'red',
    warn: 'yellow',
    success: 'cyan',
    info: 'green',
    debug: 'gray',
};

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, tag, ...meta }) => {
        const colorFn = colors[levelColors[level]] || (text => text);
        const tagStr = tag ? `[${tag}]` : '';
        const levelStr = level.toUpperCase().padEnd(7);

        const coloredLevel = colorFn(levelStr);
        const coloredTag = tag ? (colors.magenta ? colors.magenta(tagStr) : tagStr) : '';
        const timestampStr = colors.gray ? colors.gray(timestamp) : timestamp;

        let metaStr = '';
        const metaEntries = Object.entries(meta).filter(([key]) => !['timestamp', 'level', 'tag', 'splat'].includes(key));
        if (metaEntries.length > 0) {
            metaStr = `\n${colors.gray ? colors.gray(JSON.stringify(Object.fromEntries(metaEntries), null, 2)) : JSON.stringify(Object.fromEntries(metaEntries), null, 2)}`;
        }

        return `${timestampStr} ${coloredLevel} ${coloredTag} ${message}${metaStr}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format(info => {
        info.level = info.level.toUpperCase();
        return info;
    })(),
    winston.format.json()
);

class WebhookTransport extends winston.Transport {
    constructor(opts) {
        super(opts);
        this.url = opts.url;
    }
    async log(info, callback) {
        setImmediate(() => this.emit('logged', info));
        if (this.url && (info.level === 'error' || info.level === 'warn')) {
            try {
                await axios.post(this.url, {
                    embeds: [{
                        title: `Bot Log: ${info.level.toUpperCase()}`,
                        description: info.message,
                        color: info.level === 'error' ? 0xff0000 : 0xffff00,
                        fields: [
                            { name: 'Tag', value: info.tag || 'None', inline: true },
                            { name: 'Timestamp', value: info.timestamp, inline: true }
                        ],
                        footer: { text: 'GoatBot-IG-Port Logging' }
                    }]
                });
            } catch (err) {
                // Ignore webhook errors to prevent infinite loops
            }
        }
        callback();
    }
}

const createLogger = (config = {}) => {
    const logLevel = config.logging?.logLevel || 'info';
    const logToFile = config.logging?.logToFile !== false;
    const webhookUrl = config.logging?.webhookUrl;

    const transports = [
        new winston.transports.Console({
            level: logLevel,
            format: consoleFormat,
        })
    ];

    if (logToFile) {
        transports.push(
            new winston.transports.DailyRotateFile({
                level: 'info',
                filename: path.join(logDir, 'combined-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: fileFormat,
            }),
            new winston.transports.DailyRotateFile({
                level: 'error',
                filename: path.join(logDir, 'error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: fileFormat,
            })
        );
    }

    if (webhookUrl) {
        transports.push(new WebhookTransport({ url: webhookUrl }));
    }

    return winston.createLogger({
        levels,
        transports,
        exitOnError: false
    });
};

// Initial logger instance with default settings
// It will be re-configured once config is loaded in the bot
let logger = createLogger();

module.exports = logger;
module.exports.reconfigure = (config) => {
    const newLogger = createLogger(config);
    logger.configure({
        levels: newLogger.levels,
        transports: newLogger.transports
    });
};
