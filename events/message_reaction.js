const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const database = require('../utils/database');

const ANGER_EMOJIS = ['😠', '😡'];

module.exports = {
  config: { name: 'message_reaction', description: 'Unsend bot messages on anger reaction' },
  async run(bot, event) {
    try {
      const { senderID, threadId, reaction, targetMessageId, reactionStatus, messageID } = event;

      const reactionData = database.getReactionData(messageID) || global.GoatBot.onReaction.get(String(messageID));
      if (reactionData && reactionData.commandName) {
          const command = bot.commandLoader.getCommand(reactionData.commandName);
          if (command) {
              const reactionParams = {
                  api: bot.api, event, bot, commandName: reactionData.commandName,
                  logger, database, usersData: database.usersData,
                  threadsData: database.threadsData,
                  Reaction: reactionData, reactionData
              };
              if (typeof command.onReaction === 'function') await command.onReaction(reactionParams);
              else if (typeof command.handleReaction === 'function') await command.handleReaction(reactionParams);
          }
      }

      if (!reaction || !ANGER_EMOJIS.includes(reaction)) return;
      if (reactionStatus === 'deleted') return;
      if (PermissionManager.getUserRole(senderID) < 2) return;
      const msgs = database.getAllSentMessages(threadId);
      if (!msgs.some(m => m.itemId === targetMessageId)) return;
      await bot.api.unsendMessage(threadId, targetMessageId);
      logger.info('Message unsent via anger reaction', { senderID, threadId, targetMessageId });
    } catch (e) { logger.error('Error in message_reaction event', { error: e.message }); }
  }
};
