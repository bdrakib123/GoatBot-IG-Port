'use strict';

const logger = require('../utils/logger');

module.exports = {
  config: {
    name: 'error',
    version: '1.0.0',
    author: 'Gtajisan'
  },

  async run(bot, error) {
    logger.error('Bot encounter error:', { error: error.message });
  }
};
