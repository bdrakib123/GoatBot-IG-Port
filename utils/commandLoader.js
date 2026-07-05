const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

class CommandLoader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.cooldowns = new Map();

    // Bridge for GoatBot V2 global access
    global.GoatBot = global.GoatBot || {};
    global.GoatBot.commands = this.commands;
    global.GoatBot.aliases = this.aliases;
    global.GoatBot.onReply = new Map();
    global.GoatBot.onReaction = new Map();
    global.GoatBot.onEvent = new Map();
    global.client = global.client || {};
  }

  async loadCommands() {
    const commandsPath = path.resolve(config.COMMANDS_PATH);
    if (!fs.existsSync(commandsPath)) {
      logger.warn('Commands directory not found, creating it');
      fs.mkdirSync(commandsPath, { recursive: true });
      return;
    }
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    logger.info(`Loading ${files.length} commands...`);
    for (const file of files) {
      try {
        const fp = path.join(commandsPath, file);
        delete require.cache[require.resolve(fp)];
        const cmd = require(fp);
        if (!cmd.config || !cmd.config.name) { logger.warn(`Command ${file} missing config.name, skipping`); continue; }

        const name = cmd.config.name.toLowerCase();
        this.commands.set(name, cmd);
        if (cmd.config.aliases) {
            cmd.config.aliases.forEach(a => {
                const alias = a.toLowerCase();
                this.aliases.set(alias, name);
                this.commands.set(alias, cmd);
            });
        }

        logger.info(`Loaded: ${cmd.config.name}`);
      } catch (e) { logger.error(`Failed to load ${file}`, { error: e.message }); }
    }
    logger.info(`Successfully loaded ${this.commands.size} command triggers`);
  }

  getCommand(name) {
      return this.commands.get(name.toLowerCase()) || null;
  }

  checkCooldown(userId, cmdName, ms) {
    const key = `${userId}-${cmdName}`;
    if (!this.cooldowns.has(key)) return 0;
    const exp = this.cooldowns.get(key);
    const now = Date.now();
    if (now < exp) return Math.ceil((exp - now) / 1000);
    this.cooldowns.delete(key);
    return 0;
  }

  setCooldown(userId, cmdName, ms) {
    const key = `${userId}-${cmdName}`;
    this.cooldowns.set(key, Date.now() + ms);
    setTimeout(() => this.cooldowns.delete(key), ms);
  }

  async reloadCommands() { this.commands.clear(); this.aliases.clear(); await this.loadCommands(); }

  getAllCommandNames() {
    const s = new Set();
    this.commands.forEach(c => s.add(c.config.name));
    return Array.from(s);
  }
}

module.exports = CommandLoader;
