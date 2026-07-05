'use strict';

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const CommandLoader = require('../utils/commandLoader');
const EventLoader   = require('../utils/eventLoader');
const Banner        = require('../utils/banner');

// Bridge to ESM neokex-ica
async function createIca() {
    const { InstagramChatAPI } = await import('./neokex-ica/src/index.js');
    return new InstagramChatAPI({ showBanner: true });
}

class InstagramBot {
  constructor() {
    this.api               = null;
    this.ica               = null;
    this.userID            = null;
    this.username          = null;
    this.commandLoader     = new CommandLoader();
    this.eventLoader       = new EventLoader(this);
    this.reconnectAttempts = 0;
    this.shouldReconnect   = config.AUTO_RECONNECT;
    this.isRunning         = false;
    this._reminderTimer     = null;
    this._autoRemoveTimer   = null;
    this._uptimeTimer       = null;
    this._cookieRefreshTimer = null;
    this._healthServer      = null;
    this._initPromise       = null;

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

  startHealthServer() {
    if (this._healthServer) return this._healthServer;

    const port = parseInt(process.env.PORT || config.DASHBOARD_PORT || 3000, 10);
    const dashboardHtml = path.join(__dirname, '..', 'dashboard', 'index.html');

    const recentActivity = [];
    this._logActivity = (text) => {
      recentActivity.unshift({ text, time: Date.now() });
      if (recentActivity.length > 20) recentActivity.pop();
    };

    const server = http.createServer(async (req, res) => {
      const url = req.url.split('?')[0];

      if (url === '/' || url === '/dashboard') {
        try {
          const html = fs.readFileSync(dashboardHtml, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        } catch {
          res.writeHead(500); return res.end('Dashboard not found');
        }
      }

      if (url === '/uptime') {
          res.writeHead(200); return res.end('OK');
      }

      const json = (data) => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(data));
      };

      if (!url.startsWith('/api/')) {
        res.writeHead(404); return res.end('Not Found');
      }

      const route = url.slice(4);

      if (route === '/status') {
        const database = require('../utils/database');
        const mem  = process.memoryUsage();
        const users = database.getAllUsers();
        return json({
          connected:    this.isRunning,
          userID:       this.userID,
          username:     this.username,
          botName:      config.BOT_NAME || config.NICK_NAME_BOT || 'GoatBot-IG',
          version:      config.BOT_VERSION || '1.0.0',
          uptime:       Math.floor(process.uptime()),
          prefix:       config.PREFIX || '!',
          commandCount: this.commandLoader.getAllCommandNames().length,
          eventCount:   this.eventLoader.getAllEventNames().length,
          memory:       { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss },
          nodeVersion:  process.version,
          platform:     process.platform,
          arch:         process.arch,
          totalUsers:   users.length,
          dashboardURL: process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + port,
          uptimeURL:    (process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + port) + '/uptime',
          externalURL:  process.env.RENDER_EXTERNAL_URL || '',
          stats:        database.getAllStats()
        });
      }

      res.writeHead(404); res.end('Not found');
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
          logger.warn(`Health server port ${port} already in use.`);
      } else {
          logger.error('Server error', { error: err.message });
      }
    });

    server.listen(port, '0.0.0.0', () => {
      logger.info(`Dashboard/Health running on port ${port}`);
    });

    this._healthServer = server;
    return server;
  }

  async start() {
    this.startHealthServer();
    this.keepAlive();

    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
        try {
          Banner.display();
          logger.info('Initializing core components...');

          const database = require('../utils/database');
          await database.ready;
          global.db = database;

          await this.commandLoader.loadCommands();
          await this.eventLoader.loadEvents();
          this.eventLoader.registerEvents();

          await this.loginAndStart();

          this._scheduleAutoRestart();
          this._startReminderScheduler();
          this._startAutoRemoveScheduler();
          this._startUptimeMonitor();

        } catch (error) {
          logger.error('Failed to start bot', { error: error.message, stack: error.stack });
          this._initPromise = null;
          if (this.shouldReconnect && this.reconnectAttempts < config.MAX_RECONNECT_ATTEMPTS) {
            this.scheduleReconnect();
          } else {
            process.exit(1);
          }
        }
    })();

    return this._initPromise;
  }

  async loginAndStart() {
    if (!this.ica) {
        logger.info('Initializing neokex-ica...');
        this.ica = await createIca();
    }

    await this.loadAndLogin();
    this.isRunning = true;
    this.eventLoader.handleEvent('ready', this);
  }

  async loadAndLogin() {
    if (!this.ica) throw new Error('ICA instance not initialized');

    const hasCookieFile = fs.existsSync(config.ACCOUNT_FILE);
    const hasCredentials = !!(config.ACCOUNT_EMAIL && config.ACCOUNT_PASSWORD);

    try {
        if (hasCookieFile) {
            logger.info('Logging in with cookies from account.txt...');
            await this.ica.loadCookiesFromFile(config.ACCOUNT_FILE);
            const validate = await this.ica.validateSession();
            if (!validate.valid) {
                if (hasCredentials) {
                    logger.warn('Cookies invalid, attempting password login...');
                    await this.ica.login(config.ACCOUNT_EMAIL, config.ACCOUNT_PASSWORD);
                    await this.ica.saveCookiesToFile(config.ACCOUNT_FILE);
                    const val2 = await this.ica.validateSession();
                    if (!val2.valid) {
                         logger.warn('Login successful but session validation still failed. Proceeding anyway...');
                    }
                } else {
                    if (validate.error && (validate.error.includes('checkpoint') || validate.error.includes('467'))) {
                        logger.error('Account is stuck on a checkpoint or 467 error. Manual intervention in a browser is required.');
                    }
                    logger.warn('Cookies loaded but validation returned error. Proceeding anyway...');
                    // Don't throw here to allow the bot to try its luck if cookies are present.
                }
            }
        } else if (hasCredentials) {
            logger.info('Logging in with email/password...');
            await this.ica.login(config.ACCOUNT_EMAIL, config.ACCOUNT_PASSWORD);
            await this.ica.saveCookiesToFile(config.ACCOUNT_FILE);
        } else {
            throw new Error('No credentials found.');
        }

        this._afterLogin();
    } catch (e) {
        logger.error('Login failed', { error: e.message });
        throw e;
    }
  }

  _afterLogin() {
    if (!this.ica) return;
    this.userID = String(this.ica.getCurrentUserID());
    this.username = this.ica.getCurrentUsername();

    logger.info(`Logged in as ${this.username || 'unknown'} (${this.userID || 'unknown'})`);

    this.api = this.createCompatibilityWrapper(this.ica);
    global.GoatBot.icaApi = this.api;
    global.api = this.api;

    this.ica.on('message', (event) => {
        const normalized = this.normalizeEvent(event);
        this.eventLoader.handleEvent('message', normalized);
    });

    this.ica.on('error', (err) => {
        logger.error('ICA Error event', { error: err.message });
        if (err.message?.includes('session') || err.message?.includes('401')) {
            this.scheduleReconnect();
        }
    });

    this.ica.on('session:expired', () => {
        logger.warn('Session expired, scheduled reconnect...');
        this.scheduleReconnect();
    });

    this.ica.startListening({ interval: 5000 });

    const database = require('../utils/database');
    for (const [name, cmd] of this.commandLoader.commands) {
        if (typeof cmd.onLoad === 'function') {
            try {
                cmd.onLoad({ api: this.api, bot: this, database, usersData: database.usersData, threadsData: database.threadsData });
            } catch (e) {
                logger.error(`Error in onLoad of ${name}`, { error: e.message });
            }
        }
    }
  }

  normalizeEvent(event) {
      return {
          type: 'message',
          threadID: String(event.thread_id),
          threadId: String(event.thread_id),
          messageID: String(event.item_id),
          senderID: String(event.user_id),
          body: event.text || '',
          timestamp: event.timestamp,
          attachments: (event.attachments || []).map(a => ({
              type: a.type,
              url: a.url
          })),
          messageReply: event.messageReply ? {
              messageID: String(event.messageReply.item_id),
              senderID: String(event.messageReply.user_id),
              body: event.messageReply.text,
              attachments: []
          } : null,
          isGroup: !!event.thread_title,
          mentions: event.mentions || {}
      };
  }

  createCompatibilityWrapper(ica) {
    const wrapper = {
      sendMessage: async (form, threadID, callback, replyToMessageID) => {
          let text = typeof form === 'string' ? form : (form.body || '');
          let options = {};
          if (replyToMessageID) options.replyToItemId = replyToMessageID;

          try {
              let res;
              if (typeof form === 'object' && form.attachment) {
                  const attachment = form.attachment;
                  const type = form.type || 'photo';

                  if (typeof attachment === 'string') {
                      if (attachment.startsWith('http')) {
                          if (type === 'video') res = await ica.sendVideoFromUrl(threadID, attachment, { caption: text, ...options });
                          else res = await ica.sendPhotoFromUrl(threadID, attachment, { caption: text, ...options });
                      } else {
                          if (type === 'video') res = await ica.sendVideo(threadID, attachment, { caption: text, ...options });
                          else if (type === 'audio') res = await ica.sendVoiceNote(threadID, attachment, options);
                          else res = await ica.sendPhoto(threadID, attachment, { caption: text, ...options });
                      }
                  } else {
                      if (type === 'video') res = await ica.sendVideo(threadID, attachment, { caption: text, ...options });
                      else if (type === 'audio') res = await ica.sendVoiceNote(threadID, attachment, options);
                      else res = await ica.sendPhoto(threadID, attachment, { caption: text, ...options });
                  }
              } else {
                  res = await ica.sendMessage(threadID, text, options);
              }

              const result = {
                  messageID: res.item_id,
                  threadID: res.thread_id,
                  timestamp: res.timestamp
              };
              if (callback) callback(null, result);
              return result;
          } catch (e) {
              if (callback) callback(e);
              throw e;
          }
      },
      unsendMessage: async (arg1, arg2) => {
          let threadId = null;
          let itemId = arg1;
          let callback = typeof arg2 === 'function' ? arg2 : null;

          try {
              const res = await ica.unsendMessage(threadId, itemId);
              if (callback) callback(null, res);
              return res;
          } catch (e) {
              if (callback) callback(e);
              throw e;
          }
      },
      setMessageReaction: async (emoji, messageID, callback) => {
          try {
              const res = await ica.sendReaction(null, messageID, emoji);
              if (callback) callback(null, res);
              return res;
          } catch (e) {
              if (callback) callback(e);
              throw e;
          }
      },
      getUserInfo: async (id) => {
          const user = await ica.getUserInfo(id);
          const res = {};
          if (user) {
              res[id] = {
                  ...user,
                  userID: user.pk || user.id,
                  fullName: user.full_name,
                  profilePicUrl: user.profile_pic_url,
                  profilePicUrlHd: user.profile_pic_url_hd || user.hd_profile_pic_url_info?.url
              };
          }
          return res;
      },
      getUserInfoByUsername: async (username) => {
          const user = await ica.getUserInfoByUsername(username);
          if (user) {
              user.userID = user.pk || user.id;
              user.profilePicUrlHd = user.profile_pic_url_hd || user.hd_profile_pic_url_info?.url;
          }
          return user;
      },
      getThreadInfo: async (threadID) => {
          const t = await ica.getThread(threadID);
          if (t) {
              t.threadID = t.thread_id || t.id;
              t.participantIDs = t.users?.map(u => String(u.pk || u.id)) || [];
              t.adminIDs = t.participants?.filter(p => p.isAdmin)?.map(p => ({ id: String(p.userID) })) || [];
              t.threadName = t.thread_title || t.name || '';
          }
          return t;
      },
      getThreadList: async (limit, folder) => {
          const inbox = await ica.getInbox();
          return inbox.threads || [];
      },
      markAsRead: async (threadID) => {
          return await ica.markAsSeen(threadID);
      },
      getCurrentUserID: () => ica.getCurrentUserID(),
      listen: (cb) => { /* Started in _afterLogin */ }
    };

    return new Proxy(wrapper, {
        get: (target, prop) => {
            if (prop in target) return target[prop];
            if (typeof ica[prop] === 'function') return ica[prop].bind(ica);
            return ica[prop];
        }
    });
  }

  _startUptimeMonitor() {
      if (this._uptimeTimer) clearInterval(this._uptimeTimer);
      const interval = 5 * 60 * 1000;
      this._uptimeTimer = setInterval(async () => {
          try {
              if (this.ica) await this.ica.pingSession();
              const url = process.env.RENDER_EXTERNAL_URL || config.AUTO_UPTIME?.url;
              if (url) {
                  await axios.get(`${url}/uptime`).catch(() => {});
              }
          } catch (e) {
              logger.warn('Uptime monitor: Ping failed', { error: e.message });
          }
      }, interval);
  }

  _scheduleAutoRestart() {
    const time = config.AUTO_RESTART_TIME;
    if (!time) return;
    if (typeof time === 'string' && cron.validate(time)) {
      cron.schedule(time, () => process.exit(0), { timezone: config.TIMEZONE });
    } else if (parseInt(time) > 0) {
      setTimeout(() => process.exit(0), parseInt(time));
    }
  }

  _startReminderScheduler() {
      if (this._reminderTimer) clearInterval(this._reminderTimer);
      this._reminderTimer = setInterval(async () => {
          try {
              const database = require('../utils/database');
              const due = database.getDueReminders();
              for (const reminder of due) {
                  database.removeReminder(reminder.id);
                  try { if (this.api) await this.api.sendMessage(`⏰ Reminder!\n\n"${reminder.message}"`, reminder.userId); } catch (err) {}
              }
              if (due.length > 0) database.save();
          } catch (err) {}
      }, 30000);
  }

  _startAutoRemoveScheduler() {
      if (this._autoRemoveTimer) clearInterval(this._autoRemoveTimer);
      if (!config.AUTO_REMOVE_ERROR?.enable) return;
      this._autoRemoveTimer = setInterval(async () => {
          try {
              const database = require('../utils/database');
              const expired = database.getExpiredAutoRemoveMessages();
              for (const msg of expired) { try { if (this.api) await this.api.unsendMessage(msg.messageId); } catch (err) {} }
          } catch (err) {}
      }, 5000);
  }

  scheduleReconnect() {
    if (this.isRunning) this.isRunning = false;
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= config.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached. Stopping bot.');
      process.exit(1);
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    logger.info(`Reconnecting in ${delay/1000}s...`);
    setTimeout(() => {
        this.loginAndStart().catch(err => {
            logger.error('Reconnection failed', { error: err.message });
            this.scheduleReconnect();
        });
    }, delay);
  }

  keepAlive() {
    process.on('SIGINT',  () => process.exit(0));
    process.on('SIGTERM', () => process.exit(0));
    process.on('uncaughtException', (e) => logger.error('Uncaught exception', { error: e.message, stack: e.stack }));
    process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
  }
}

module.exports = InstagramBot;
