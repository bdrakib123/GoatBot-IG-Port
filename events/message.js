'use strict';

const globalConfig = require('../config');
const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const ConfigManager = require('../utils/configManager');

module.exports = {
  config: {
    name: 'message',
    description: 'Main message handler'
  },
  async run({ api, event, bot, database }) {
    try {
      const { commandLoader } = bot;
      const config = bot.config || globalConfig;

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
                  try {
                      return await command.onReply({
                          api, event, bot, commandName: replyData.commandName,
                          logger, database, usersData: database.usersData,
                          threadsData: database.threadsData,
                          Reply: replyData, replyData, getLang
                      });
                  } catch (err) {
                      logger.error(`Error in onReply of ${replyData.commandName}`, { error: err, threadID: event.threadId, senderID: event.senderID });
                      return api.sendMessage(`❌ Error in onReply: ${err.message}`, event.threadId);
                  }
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
                  try {
                    cmd.onChat({ api, event, bot, database, usersData: database.usersData, threadsData: database.threadsData });
                  } catch (err) {
                    logger.error(`Error in onChat of ${name}`, { error: err, threadID: event.threadId });
                  }
              }
          }
          return;
      }

      let rawBody = event.body;
      if (startsWithPrefix) rawBody = event.body.slice(prefix.length);
      const args = rawBody.trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!commandName) return;

      const command = commandLoader.getCommand(commandName);
      if (command) {
          return await module.exports.executeCommand(command, { api, event, args, bot, commandName: command.config.name, logger, database, config, prefix });
      }

      // Alias check
      for (const [name, cmd] of commandLoader.commands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(commandName)) {
              return await module.exports.executeCommand(cmd, { api, event, args, bot, commandName: cmd.config.name, logger, database, config, prefix });
          }
      }

      // 4. AI Fallback
      if (config.AI_FALLBACK?.enable) {
          const aiCommandName = config.AI_FALLBACK.command || 'gpt';
          const aiCommand = commandLoader.getCommand(aiCommandName);
          if (aiCommand) {
              logger.info(`Command "${commandName}" not found. Routing to AI Fallback (${aiCommandName})`);
              const aiArgs = [commandName, ...args];
              return await module.exports.executeCommand(aiCommand, { api, event, args: aiArgs, bot, commandName: aiCommandName, logger, database, config, prefix });
          }
      }

    } catch (e) {
      logger.error('Error in message handler', { error: e.message, stack: e.stack });
    }
  },

  async executeCommand(command, { api, event, args, bot, commandName, logger, database, config, prefix }) {
      logger.command(commandName, event.senderID, event.threadId);
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

      try {
          if (typeof command.onStart === 'function') {
              await command.onStart(params);
          } else if (typeof command.run === 'function') {
              await command.run(params);
          }
      } catch (e) {
          logger.error(`Error executing command: ${commandName}`, { error: e, threadID: event.threadId, senderID: event.senderID, body: event.body });
          api.sendMessage(`❌ An error occurred while executing command "${commandName}": ${e.message}`, event.threadId);
      }
  }
};
