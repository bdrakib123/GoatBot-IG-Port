'use strict';

const logger = require('../../utils/logger');

/**
 * Handles and normalizes actions from the Instagram API
 * @param {Object} bot Bot instance
 * @param {Object} api API instance (nkxica, fca, or DualFca)
 */
function handlerAction(bot, api) {
    api.listen((err, event) => {
        if (err) {
            logger.error('Listen error', { error: err.message });
            if (bot.isRunning && bot.shouldReconnect) {
                logger.warn('Fatal listen error detected. Restarting bot...');
                bot.isRunning = false;
                bot.scheduleReconnect();
                if (bot.config.AUTO_RESTART_WHEN_MQTT_ERROR) {
                    logger.info("Auto-restart enabled. Exiting process...");
                    setTimeout(() => process.exit(1), 1000);
                }
            }
            return;
        }

        if (!event) return;

        const normalizedEvent = normalizeEvent(event);

        if (normalizedEvent.type === 'message' || normalizedEvent.type === 'message_reply') {
             logger.event(normalizedEvent.type, normalizedEvent.threadID, normalizedEvent.body?.slice(0, 50));
        }

        bot.resetWatchdog();
        bot.eventLoader.handleEvent(normalizedEvent.type, normalizedEvent);
    });
}

/**
 * Normalizes event object to ensure compatibility with GoatBot V2
 * @param {Object} event Raw event from API
 * @returns {Object} Normalized event
 */
function normalizeEvent(event) {
    const normalized = { ...event };

    // Ensure threadID is always a string and present as threadID and threadId
    const tid = normalized.threadID || normalized.thread_id || normalized.threadId;
    if (tid) {
        normalized.threadID = String(tid);
        normalized.threadId = String(tid);
    }

    // Ensure senderID is always a string
    const sid = normalized.senderID || normalized.user_id || normalized.userId;
    if (sid) {
        normalized.senderID = String(sid);
    }

    // Ensure messageID is always a string
    const mid = normalized.messageID || normalized.item_id || normalized.itemId;
    if (mid) {
        normalized.messageID = String(mid);
    }

    // Handle body
    normalized.body = normalized.body || normalized.text || '';

    return normalized;
}

module.exports = handlerAction;
