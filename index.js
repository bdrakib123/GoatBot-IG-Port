'use strict';

// Global GoatBot V2 Ecosystem Setup
global.utils = require('./utils.js');
global.GoatBot = global.GoatBot || {};
global.GoatBot.config = require('./config');
global.GoatBot.commands = new Map();
global.GoatBot.aliases = new Map();
global.GoatBot.onReply = new Map();
global.GoatBot.onReaction = new Map();
global.GoatBot.onEvent = new Map();
global.GoatBot.onChat = new Map();
global.client = global.client || {};

const logger = require('./utils/logger');
const InstagramBot = require('./bot/InstagramBot');

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
});

const bot = new InstagramBot();

bot.start().catch(error => {
  logger.error('Fatal error starting bot', { error: error.message });
  process.exit(1);
});

