const logger = require('../utils/logger');

module.exports = {
  config: { name: 'error', description: 'Handle bot errors' },
  async run(bot, error) {
    logger.error('Bot error occurred', { error: error.message, stack: error.stack });
    if (bot.shouldReconnect) {
      logger.info('Attempting to reconnect...');
      setTimeout(() => { if (bot.reconnect) bot.reconnect(); }, 5000);
    }
  }
};
