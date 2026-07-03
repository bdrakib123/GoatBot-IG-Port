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
    logger.debug(`Incoming message from ${event.senderID} in ${event.threadId}: ${event.body}`);
    try {
      const { commandLoader } = bot;

      // 1. Check if user/thread is banned
      if (database.isUserBanned(event.senderID) || database.isThreadBanned(event.threadId)) {
          logger.debug(`Ignoring message from banned user ${event.senderID} or thread ${event.threadId}`);
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

      if (!command) {
          // Alias check
          for (const [name, cmd] of commandLoader.commands) {
              if (cmd.config.aliases && cmd.config.aliases.includes(commandName)) {
                  command = cmd;
                  break;
              }
          }
      }

      if (command) {
          logger.debug('COMMAND', `Executing command: ${command.config.name} for user: ${event.senderID}`, { threadID: event.threadId, senderID: event.senderID });
          await require('../utils.js').humanDelay();
          await this.executeCommand(command, { api, event, args, bot, commandName: command.config.name, logger, database, config, prefix });
      } else if (config.AI_FALLBACK?.enable) {
          const aiCommandName = config.AI_FALLBACK.command || 'gpt';
          const aiCommand = commandLoader.getCommand(aiCommandName);
          if (aiCommand) {
              logger.debug('AI_FALLBACK', `Routing to AI command: ${aiCommandName} for user: ${event.senderID}`, { threadID: event.threadId, senderID: event.senderID });
              const aiArgs = event.body.slice(startsWithPrefix ? prefix.length : 0).trim().split(/ +/);
              await require('../utils.js').humanDelay();
              await this.executeCommand(aiCommand, { api, event, args: aiArgs, bot, commandName: aiCommandName, logger, database, config, prefix });
          }
      }

    } catch (e) {
      logger.error('Error in message handler', { error: e.message });
    }
  },

  async executeCommand(command, { api, event, args, bot, commandName, logger, database, config, prefix }) {
      const getLang = (...args) => require('../utils.js').getText(command.config.name, ...args);
      const startTime = Date.now();

      const messageHelper = {
          reply: async (form, callback) => {
              await require('../utils.js').humanDelay();
              return api.sendMessage(form, event.threadId, callback, event.messageID);
          },
          send: async (form, callback) => {
              await require('../utils.js').humanDelay();
              return api.sendMessage(form, event.threadId, callback);
          },
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

      try {
          if (typeof command.onStart === 'function') {
              await command.onStart(params);
          } else if (typeof command.run === 'function') {
              await command.run(params);
          }
          const duration = Date.now() - startTime;
          logger.success('COMMAND', `${commandName} executed successfully`, { threadID: event.threadId, senderID: event.senderID, duration: `${duration}ms` });
      } catch (e) {
          logger.error('COMMAND', `Error executing ${commandName}`, { error: e.message, threadID: event.threadId, senderID: event.senderID });
          messageHelper.err(e);
      }
  }
};
