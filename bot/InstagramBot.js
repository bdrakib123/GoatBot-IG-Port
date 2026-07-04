'use strict';

const loginNkxica = require('@neoaz07/nkxica').login;
const loginFca = require('./instagram-fca/login-wrapper');
const createDualFca = require('./DualFca');

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const config = require('../config');
const logger = require('../utils/logger');
const CommandLoader = require('../utils/commandLoader');
const EventLoader   = require('../utils/eventLoader');

class InstagramBot {
  constructor() {
    this.fca = null;
    this.nkxica = null;
    this.api = null;
    this.userID = null;
    this.username = null;
    this.commandLoader = new CommandLoader();
    this.eventLoader = new EventLoader(this);
    this.reconnectAttempts = 0;
    this.shouldReconnect = config.AUTO_RECONNECT;
    this.isRunning = false;
    this.watchdogTimer = null;
    this.WATCHDOG_DELAY = 15 * 60 * 1000; // 15 minutes

    // Initialize global GoatBot structure for V2 compatibility
    global.GoatBot = {
        config: config,
        commands: this.commandLoader.commands,
        aliases: this.commandLoader.aliases,
        onReply: new Map(),
        onReaction: new Map(),
        onEvent: [],
        logger: logger,
        instance: this
    };

    global.utils = require('../utils.js');
    global.api = null;
  }

  async start() {
    this.startHealthServer();
    this.keepAlive();

    try {
      await this.commandLoader.loadAll();
      await this.eventLoader.loadAll();

      const database = require('../utils/database');
      await database.ready;

      await this.loadAndLogin();
      logger.reconfigure(config); // Reconfigure logger after config is loaded and login successful

      this._scheduleAutoRestart();
      this._scheduleAutoUptime();
      this.isRunning = true;

      this.eventLoader.handleEvent('ready', this);

    } catch (error) {
      logger.error('Failed to start bot', { error: error.message, stack: error.stack });
      if (this.shouldReconnect && this.reconnectAttempts < config.MAX_RECONNECT_ATTEMPTS) {
        this.scheduleReconnect();
                if (config.AUTO_RESTART_WHEN_MQTT_ERROR) {
                    logger.info("Auto-restart enabled. Exiting process...");
                    setTimeout(() => process.exit(1), 1000);
                }
      } else {
        process.exit(1);
      }
    }
  }

  async loadAndLogin() {
    let credentials = config.ACCOUNT_COOKIES;

    if (!credentials && fs.existsSync(config.ACCOUNT_FILE)) {
        credentials = fs.readFileSync(config.ACCOUNT_FILE, 'utf-8');
    }

    if (!credentials && config.ACCOUNT_EMAIL && config.ACCOUNT_PASSWORD) {
        credentials = {
            email: config.ACCOUNT_EMAIL,
            password: config.ACCOUNT_PASSWORD,
            twoFactorSecret: config.ACCOUNT_2FA_SECRET
        };
    }

    if (!credentials) {
        throw new Error('No credentials found. Please provide IG_COOKIES or set up account.txt / EMAIL & PASSWORD.');
    }

    logger.info('LOGIN', 'Attempting login with nkxica (Primary)...');
    try {
        this.nkxica = await loginNkxica(credentials);
        logger.success('LOGIN', 'nkxica login successful');
    } catch (e) {
        logger.error('LOGIN', 'nkxica login failed', { error: e });
        logger.info('LOGIN', 'Attempting login with Instagram-FCA (Fallback)...');
        try {
            this.fca = await loginFca(credentials, config.OPTIONS_FCA);
            logger.success('LOGIN', 'Instagram-FCA login successful');
        } catch (fcaErr) {
            logger.error('LOGIN', 'Instagram-FCA login failed', { error: fcaErr });
            throw e;
        }
    }

    if (config.EXPERIMENTAL_FCA_ENABLE && !this.fca) {
        try {
            logger.info('Logging in with Instagram-FCA (Secondary)...');
            this.fca = await loginFca(credentials, config.OPTIONS_FCA);
            logger.info('Instagram-FCA login successful');
        } catch (e) {
            logger.warn('Instagram-FCA login failed, continuing with nkxica only.');
        }
    }

    this._afterLogin();
  }

  _afterLogin() {
    const primary = this.nkxica || this.fca;
    if (!primary) throw new Error('No API instance available after login.');

    try {
      const getVal = (v) => (v && typeof v === 'object') ? (v.pk || v.id || v.userId || v.uid || JSON.stringify(v)) : v;

      let rawID = 'unknown';
      if (primary.getCurrentUserID) rawID = primary.getCurrentUserID();
      else rawID = primary.userID || primary.id || (primary.session && (primary.session.userId || primary.session.pk)) || (primary.viewer && (primary.viewer.pk || primary.viewer.id)) || 'unknown';

      this.userID = String(getVal(rawID));

      let rawUsername = this.userID;
      rawUsername = primary.currentUsername || primary.username || (primary.session && primary.session.username) || (primary.viewer && primary.viewer.username) || this.userID;

      this.username = String(getVal(rawUsername));

      if (this.username === '[object Object]') this.username = this.userID;
    } catch (e) {
      this.userID = 'unknown';
      this.username = 'unknown';
    }

    const nkxicaWrapper = this.nkxica ? this.createNkxicaWrapper() : null;

    this.api = nkxicaWrapper || this.fca;

    if (nkxicaWrapper && this.fca) {
        this.api = createDualFca(nkxicaWrapper, this.fca);
    }

    global.GoatBot.fcaApi = this.api;
    global.api = this.api;

    this.api.listen((err, event) => {
        if (err) {
            logger.error('LISTEN', 'Listen error', { error: err });
            // If the listener has a fatal error, we schedule a reconnect
            if (this.isRunning && this.shouldReconnect) {
                logger.warn('LISTEN', 'Fatal listen error detected. Restarting bot...');
                this.isRunning = false;
                this.scheduleReconnect();
                if (config.AUTO_RESTART_WHEN_MQTT_ERROR) {
                    logger.info('LISTEN', "Auto-restart enabled. Exiting process...");
                    setTimeout(() => process.exit(1), 1000);
                }
            }
            return;
        }
        if (event) {
            logger.debug('EVENT', `Received event: ${event.type || "unknown"} from ${event.senderID || event.user_id || "unknown"}`);
        }
        this.resetWatchdog();
        if (!event) return;

        const normalizedEvent = this.normalizeEvent(event);
        this.eventLoader.handleEvent(normalizedEvent.type, normalizedEvent);
    });

    const database = require('../utils/database');
    for (const [name, cmd] of this.commandLoader.commands) {
        if (typeof cmd.onLoad === 'function') {
            try {
                cmd.onLoad({
                    api: this.api,
                    bot: this,
                    database,
                    usersData: database.usersData,
                    threadsData: database.threadsData
                });
            } catch (e) {
                logger.error(`Error in onLoad of ${name}`, { error: e.message });
            }
        }
    }
  }

  normalizeEvent(event) {
      const normalized = { ...event };

      // Ensure threadID is always a string and present as threadID and threadId
      const tid = normalized.threadID || normalized.thread_id || normalized.threadId;
      if (tid) {
          normalized.threadID = String(tid);
          normalized.threadId = String(tid);
      }

      // Ensure senderID is always a string
      const sid = normalized.senderID || normalized.user_id || normalized.userId;
      if (sid) {
          normalized.senderID = String(sid);
      }

      // Ensure messageID is always a string
      const mid = normalized.messageID || normalized.item_id || normalized.itemId;
      if (mid) {
          normalized.messageID = String(mid);
      }

      // Handle body
      normalized.body = normalized.body || normalized.text || '';

      return normalized;
  }

  createNkxicaWrapper() {
    const ig = this.nkxica;
    const self = this;

    const wrapper = {
      sendMessage: async (form, threadID, callback, replyToMessageID) => {
          let finalForm = form;
          if (typeof form === 'string') finalForm = { body: form };
          try {
              const res = await ig.sendMessage(finalForm, threadID, null, replyToMessageID);
              if (callback) callback(null, res);
              return res;
          } catch (e) {
              if (callback) callback(e);
              throw e;
          }
      },
      getUserInfo: async (id) => {
          if (typeof ig.getUserInfo === 'function') return await ig.getUserInfo(id);
          return {};
      },
      unsendMessage: async (id) => {
          if (typeof ig.unsendMessage === 'function') return await ig.unsendMessage(id);
      },
      setMessageReaction: async (emoji, id) => {
          if (typeof ig.sendReaction === 'function') return await ig.sendReaction(emoji, id);
          if (typeof ig.setMessageReaction === 'function') return await ig.setMessageReaction(emoji, id);
      },
      markAsRead: async (threadID) => {
          if (typeof ig.markAsRead === 'function') return await ig.markAsRead(threadID);
      },
      listen: (callback) => {
          if (typeof ig.listen === 'function') return ig.listen(callback);
      },
      getCurrentUserID: () => {
          if (typeof ig.getCurrentUserID === 'function') return ig.getCurrentUserID();
          return ig.userID || ig.id || 'unknown';
      }
    };

    return new Proxy(ig, {
        get(target, prop) {
            if (prop in wrapper) return wrapper[prop];
            const value = target[prop];
            if (typeof value === 'function') return value.bind(target);
            return value;
        }
    });
  }

  startHealthServer() {
      const port = parseInt(process.env.PORT || config.DASHBOARD_PORT || 3000, 10);
      const server = http.createServer(async (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathname = url.pathname;

          // Dashboard HTML
          if (pathname === '/' || pathname === '/index.html') {
              const dashPath = path.join(__dirname, '../dashboard/index.html');
              if (fs.existsSync(dashPath)) {
                  res.writeHead(200, { 'Content-Type': 'text/html' });
                  return res.end(fs.readFileSync(dashPath));
              }
          }

          if (pathname === '/uptime') {
              res.writeHead(200);
              return res.end('OK');
          }

          // API Endpoints (Supports both /api/path and /path for dashboard compatibility)
          const apiPath = pathname.startsWith('/api/') ? pathname.slice(4) : pathname;

          if (pathname.startsWith('/api/') || ['/status', '/threads', '/thread', '/users', '/commands', '/logs'].some(p => pathname.startsWith(p))) {
              res.writeHead(200, { 'Content-Type': 'application/json' });

              if (apiPath === '/status') {
                  return res.end(JSON.stringify({
                      status: this.api ? 'online' : 'offline',
                      uptime: process.uptime(),
                      memory: process.memoryUsage(),
                      platform: process.platform,
                      version: config.BOT_VERSION,
                      botName: config.BOT_NAME
                  }));
              }

              if (apiPath === '/threads' && this.api) {
                  try {
                      const threads = await (this.api.getThreadList ? this.api.getThreadList(20, null, []) : []);
                      return res.end(JSON.stringify({ threads: Array.isArray(threads) ? threads : [] }));
                  } catch (e) {
                      return res.end(JSON.stringify({ threads: [], error: e.message }));
                  }
              }

              if (apiPath.startsWith('/thread/') && this.api) {
                  const tid = apiPath.split('/').pop();
                  try {
                      const info = await (this.api.getThreadInfo ? this.api.getThreadInfo(tid) : {});
                      return res.end(JSON.stringify(info));
                  } catch (e) {
                      return res.end(JSON.stringify({ error: e.message }));
                  }
              }

              if (apiPath === '/users') {
                  const database = require('../utils/database');
                  return res.end(JSON.stringify({
                      users: database.getAllUsers(),
                      economy: database.data.economy || {},
                      banned: [...database.data.bannedUsers]
                  }));
              }

              if (apiPath === '/commands') {
                  const cmds = [];
                  for (const [name, cmd] of this.commandLoader.commands) {
                      cmds.push({ ...cmd.config, name });
                  }
                  return res.end(JSON.stringify({ commands: cmds }));
              }

              if (apiPath === '/logs') {
                  const logDir = path.join(process.cwd(), 'logs');
                  if (fs.existsSync(logDir)) {
                      const files = fs.readdirSync(logDir).filter(f => f.startsWith('combined-') && f.endsWith('.log')).sort().reverse();
                      if (files.length > 0) {
                          const content = fs.readFileSync(path.join(logDir, files[0]), 'utf-8');
                          const lines = content.split('\n').filter(Boolean).slice(-300).map(l => {
                              try { return JSON.parse(l); } catch(e) { return { message: l, level: 'INFO', time: new Date().toISOString() }; }
                          });
                          return res.end(JSON.stringify({ logs: lines }));
                      }
                  }
                  return res.end(JSON.stringify({ logs: [] }));
              }
          }

          res.writeHead(200);
          res.end('Bot is running');
      });
      server.on('error', (e) => {
          if (e.code === 'EADDRINUSE') {
              logger.warn(`Port ${port} in use, health server not started.`);
          }
      });
      server.listen(port);
  }

  resetWatchdog() {
      if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
      this.watchdogTimer = setTimeout(() => {
          logger.warn('Watchdog timeout: No events received for 15 minutes. Reconnecting...');
          this.scheduleReconnect();
                if (config.AUTO_RESTART_WHEN_MQTT_ERROR) {
                    logger.info("Auto-restart enabled. Exiting process...");
                    setTimeout(() => process.exit(1), 1000);
                }
      }, this.WATCHDOG_DELAY);
  }

  scheduleReconnect() {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      logger.info(`Scheduling reconnect in ${delay/1000}s...`);
      setTimeout(() => this.start(), delay);
  }

  keepAlive() {
      process.on('SIGINT', () => process.exit(0));
      process.on('SIGTERM', () => process.exit(0));
  }

  _scheduleAutoRestart() {
      if (config.AUTO_RESTART_TIME) {
          const cron = require('node-cron');
          cron.schedule(config.AUTO_RESTART_TIME, () => {
              logger.info('Auto-restarting bot...');
              process.exit(1);
          });
      }
  }

  _scheduleAutoUptime() {
      if (config.AUTO_UPTIME_ENABLE) {
          const axios = require('axios');
          const uptimeUrl = process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/uptime` : config.AUTO_UPTIME_URL;

          if (!uptimeUrl) return;

          setInterval(async () => {
              try {
                  await axios.get(uptimeUrl);
              } catch (e) {
                  // ignore
              }
          }, (config.AUTO_UPTIME_INTERVAL || 180) * 1000);

          logger.info(`Auto-uptime enabled for: ${uptimeUrl}`);
      }
  }
}

module.exports = InstagramBot;
