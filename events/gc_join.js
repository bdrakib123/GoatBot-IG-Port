'use strict';

const logger = require('../utils/logger');

module.exports = {
  config: {
    name: 'gc_join',
    version: '1.0.0',
    author: 'Gtajisan'
  },

  async run(bot, event) {
      if (event.type !== 'event' || !event.logMessageType?.includes('join')) return;
      logger.info(`User joined group: ${event.threadID}`);
  }
};
