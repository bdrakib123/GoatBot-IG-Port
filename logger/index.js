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

let config = {};
try {
    const configPath = path.join(process.cwd(), 'config', 'default.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.error('Logger: Failed to load config, using defaults.');
}

const logLevel = config.logging?.logLevel || 'info';
const logToFile = config.logging?.logToFile !== false;
const webhookUrl = config.logging?.webhookUrl;

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
        const levelColor = levelColors[level] || 'white';
        const colorFn = colors[levelColor] || (text => text);
        const tagStr = tag ? `[${tag}]` : '';
        const levelStr = level.toUpperCase().padEnd(7);

        const coloredLevel = colorFn(levelStr);
        const coloredTag = tag ? (colors.magenta ? colors.magenta(tagStr) : tagStr) : '';

        // Filter out winston internal meta
        const metaEntries = Object.entries(meta).filter(([key]) => !['timestamp', 'level', 'tag', 'splat'].includes(key));
        let metaStr = '';
        if (metaEntries.length > 0) {
            const cleanMeta = Object.fromEntries(metaEntries);
            metaStr = `\n${colors.gray ? colors.gray(JSON.stringify(cleanMeta, null, 2)) : JSON.stringify(cleanMeta, null, 2)}`;
        }

        return `${colors.gray ? colors.gray(timestamp) : timestamp} ${coloredLevel} ${coloredTag} ${message}${metaStr}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

class WebhookTransport extends winston.Transport {
    constructor(opts) {
        super(opts);
        this.url = opts.url;
    }
    log(info, callback) {
        if (this.url) {
            const tagStr = info.tag ? `[${info.tag}] ` : '';
            axios.post(this.url, {
                embeds: [{
                    title: `${info.level.toUpperCase()} ${tagStr}`,
                    description: info.message,
                    timestamp: info.timestamp,
                    color: info.level === 'error' ? 0xff0000 : (info.level === 'warn' ? 0xffff00 : 0x00ff00),
                    fields: Object.entries(info).filter(([key]) => !['timestamp', 'level', 'tag', 'message', 'splat'].includes(key)).map(([key, value]) => ({
                        name: key,
                        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                        inline: true
                    }))
                }]
            }).catch(() => {});
        }
        callback();
    }
}

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
    transports.push(new WebhookTransport({ level: 'warn', url: webhookUrl }));
}

const logger = winston.createLogger({ levels, transports });
module.exports = logger;
