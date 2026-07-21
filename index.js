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

const InstagramBot = require('./bot/InstagramBot');

const bot = new InstagramBot();

bot.start().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

