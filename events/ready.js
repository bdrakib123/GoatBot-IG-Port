'use strict';

const logger = require('../utils/logger');

module.exports = {
  config: {
    name: 'ready',
    version: '1.0.0',
    author: 'Gtajisan'
  },

  async run(bot) {
    logger.success(`Bot is ready! Logged in as ${bot.username} (${bot.userID})`);
  }
};
