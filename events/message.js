'use strict';

const config = require('../config');
const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const ConfigManager = require('../utils/configManager');
const moderation = require('../utils/moderation');
const Banner = require('../utils/banner');

module.exports = {
  config: {
    name: 'message',
    description: 'Main message handler'
  },
  async run({ api, event, bot, database }) {
    logger.debug('MESSAGE', `Incoming message from ${event.senderID} in ${event.threadId}: ${event.body}`, {
        threadID: event.threadId,
        senderID: event.senderID
    });
    try {
      const { commandLoader } = bot;

      // 1. Check if user/thread is banned
      if (database.isUserBanned(event.senderID) || database.isThreadBanned(event.threadId)) {
          logger.debug('MESSAGE', `Ignoring message from banned user ${event.senderID} or thread ${event.threadId}`);
          return;
      }

      // 2. Handle onReply
      if (event.replyToItemId) {
          const replyData = database.getReplyData(event.replyToItemId) || global.GoatBot.onReply.get(String(event.replyToItemId));
          if (replyData && replyData.commandName) {
              const command = commandLoader.getCommand(replyData.commandName);
              if (command && typeof command.onReply === 'function') {
                  const getLang = (...args) => require('../utils.js').getText(command.config.name, ...args);
                  return await command.onReply({
                      api, event, bot, commandName: replyData.commandName,
                      logger, database, usersData: database.usersData,
                      threadsData: database.threadsData,
                      Reply: replyData, replyData, getLang
                  });
              }
          }
      }

      const threadData = database.getThreadData(event.threadId);
      const prefix = threadData?.prefix || config.PREFIX;

      // 3. Prefix logic
      const startsWithPrefix = event.body.startsWith(prefix);
      const noPrefixAllowed = config.NO_PREFIX && PermissionManager.canUseNoPrefix(event.senderID);

      if (!startsWithPrefix && !noPrefixAllowed) {
          // Trigger onChat for commands that listen to all messages
          for (const [name, cmd] of commandLoader.commands) {
              if (typeof cmd.onChat === 'function') {
                  cmd.onChat({ api, event, bot, database, usersData: database.usersData, threadsData: database.threadsData });
              }
          }
          return;
      }

      let rawBody = event.body;
      if (startsWithPrefix) rawBody = event.body.slice(prefix.length);
      const args = rawBody.trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!commandName) return;

      let command = commandLoader.getCommand(commandName);
      let isAlias = false;

      if (!command) {
          // Alias check
          for (const [name, cmd] of commandLoader.commands) {
              if (cmd.config.aliases && cmd.config.aliases.includes(commandName)) {
                  command = cmd;
                  isAlias = true;
                  break;
              }
          }
      }

      if (command) {
          const finalCommandName = isAlias ? command.config.name : commandName;
          logger.info('COMMAND', `Executing command: ${finalCommandName}${isAlias ? ` (via alias: ${commandName})` : ''} for user: ${event.senderID}`, {
              threadID: event.threadId,
              senderID: event.senderID
          });
          await this.executeCommand(command, { api, event, args, bot, commandName: finalCommandName, logger, database, config, prefix });
      } else if (config.AI_FALLBACK?.enable) {
          const aiCommandName = config.AI_FALLBACK.command || 'gpt';
          const aiCommand = commandLoader.getCommand(aiCommandName);
          if (aiCommand) {
              logger.info('AI_FALLBACK', `No command found for "${commandName}", falling back to ${aiCommandName}`, {
                  threadID: event.threadId,
                  senderID: event.senderID
              });
              const aiArgs = [commandName, ...args];
              await this.executeCommand(aiCommand, { api, event, args: aiArgs, bot, commandName: aiCommandName, logger, database, config, prefix });
          }
      }

    } catch (e) {
      logger.error('MESSAGE_HANDLER', 'Error in message handler', { error: e });
    }
  },

  async executeCommand(command, { api, event, args, bot, commandName, logger, database, config, prefix }) {
      // Typing indicator
      if (config.typingIndicator?.enable && api.sendTypingIndicator) {
          api.sendTypingIndicator(event.threadId).catch(() => {});
      }

      // Human delay
      if (config.humanDelay?.enable) {
          await global.utils.humanDelay(config.humanDelay.min, config.humanDelay.max);
      }

      const getLang = (...args) => require('../utils.js').getText(command.config.name, ...args);

      const messageHelper = {
          reply: (form, callback) => api.sendMessage(form, event.threadId, callback, event.messageID),
          send: (form, callback) => api.sendMessage(form, event.threadId, callback),
          reaction: (emoji, id) => api.setMessageReaction(emoji, id || event.messageID),
          unsend: (id) => api.unsendMessage(id || event.messageID),
          err: (err) => api.sendMessage(`❌ Error: ${err.message || err}`, event.threadId),
          SyntaxError: () => api.sendMessage(`❌ Syntax Error!\nUse: ${prefix}help ${commandName}`, event.threadId)
      };

      const params = {
          api, event, args, bot, commandName, logger, database,
          usersData: database.usersData, threadsData: database.threadsData,
          config, getLang, message: messageHelper,
          PermissionManager, ConfigManager
      };

      if (typeof command.onStart === 'function') {
          await command.onStart(params);
      } else if (typeof command.run === 'function') {
          await command.run(params);
      }
  }
};
