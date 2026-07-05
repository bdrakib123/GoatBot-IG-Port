'use strict';

const { login } = require('@neoaz07/nkxica');

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

class InstagramBot {
  constructor() {
    this.ig                = null;
    this.api               = null;
    this.userID            = null;
    this.username          = null;
    this.commandLoader     = new CommandLoader();
    this.eventLoader       = new EventLoader(this);
    this.reconnectAttempts = 0;
    this.shouldReconnect   = config.AUTO_RECONNECT;
    this.isRunning         = false;
    this._mqttRestartTimer  = null;
    this._cookieRefreshTimer = null;
    this._reminderTimer     = null;
    this._autoRemoveTimer   = null;
  }

  startHealthServer() {
    const port = parseInt(process.env.PORT || config.DASHBOARD_PORT || 3000, 10);
    const dashboardHtml = path.join(__dirname, '..', 'dashboard', 'index.html');

    const recentActivity = [];
    this._logActivity = (text) => {
      recentActivity.unshift({ text, time: Date.now() });
      if (recentActivity.length > 20) recentActivity.pop();
    };

    const server = http.createServer(async (req, res) => {
      const url = req.url.split('?')[0];

      // ── Dashboard HTML ──────────────────────────────────────────────
      if (url === '/' || url === '/dashboard') {
        try {
          const html = fs.readFileSync(dashboardHtml, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        } catch {
          res.writeHead(500); return res.end('Dashboard not found');
        }
      }

      // ── API routes ──────────────────────────────────────────────────
      const json = (data) => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(data));
      };

      if (!url.startsWith('/api/')) {
        res.writeHead(404); return res.end('Not Found');
      }

      const route = url.slice(4); // strip /api

      // GET /api/status
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
          stats:        database.getAllStats(),
          recentActivity
        });
      }

      // GET /api/threads
      if (route === '/threads') {
        try {
          const inbox = await this.ig.getInbox({ limit: 40 });
          const threads = (inbox?.threads || inbox?.items || []).map(t => ({
            threadID:        t.thread_id || t.threadID || t.id,
            name:            t.thread_title || t.name || t.title || '',
            isGroup:         t.is_group || t.isGroup || false,
            participantCount: (t.users||t.participants||[]).length,
            snippet:         t.last_permanent_item?.text || t.snippet || ''
          }));
          return json({ threads });
        } catch (e) {
          return json({ threads: [], error: e.message });
        }
      }

      // GET /api/thread/:id
      const threadMatch = route.match(/^\/thread\/(.+)$/);
      if (threadMatch) {
        const threadID = threadMatch[1];
        try {
          const info = await this.ig.getThreadInfo(threadID);
          const raw  = info || {};
          const participants = (raw.users || raw.participants || raw.items || []).map(u => ({
            userID:   u.pk || u.id || u.user_id || u.userID,
            name:     u.full_name || u.fullName || u.name || '',
            username: u.username || '',
            isAdmin:  u.is_admin || u.isAdmin || false,
            nickname: u.nickname || ''
          }));
          return json({ threadID, participants, raw: { name: raw.thread_title || '', isGroup: raw.is_group } });
        } catch (e) {
          return json({ threadID, participants: [], error: e.message });
        }
      }

      // GET /api/users
      if (route === '/users') {
        const database = require('../utils/database');
        const users  = database.getAllUsers().sort((a, b) => (b.messageCount||0) - (a.messageCount||0));
        const economy = database.data.economy || {};
        const banned  = [...(database.data.bannedUsers || [])];
        return json({ users, economy, banned });
      }

      // GET /api/commands
      if (route === '/commands') {
        const cmds = [];
        for (const [key, cmd] of this.commandLoader.commands) {
          if (cmd.config.name !== key) continue;
          cmds.push({
            name:        cmd.config.name,
            description: cmd.config.description || '',
            category:    cmd.config.category || 'other',
            aliases:     cmd.config.aliases || [],
            role:        cmd.config.role || 0,
            cooldown:    cmd.config.cooldown || 0,
            usage:       cmd.config.usage || '',
            prefix:      config.PREFIX || '!'
          });
        }
        return json({ commands: cmds.sort((a,b) => a.name.localeCompare(b.name)) });
      }

      // GET /api/logs
      if (route === '/logs') {
        const moment = require('moment-timezone');
        const today = moment().tz(config.TIMEZONE || 'UTC').format('YYYY-MM-DD');
        const logFile = path.join(process.cwd(), 'logs', `combined-${today}.log`);
        try {
          let raw = '';
          if (fs.existsSync(logFile)) raw = fs.readFileSync(logFile, 'utf-8');
          const logs = raw.trim().split('\n').filter(Boolean).slice(-300).map(line => {
            try {
              const parsed = JSON.parse(line);
              return { time: parsed.timestamp || parsed.time || '', level: parsed.level?.toUpperCase() || 'INFO', message: parsed.message || line };
            } catch {
              const m = line.match(/\[([\d:]+)\].*?(INFO|WARN|ERROR|DEBUG).*?(.+)/);
              return m ? { time: m[1], level: m[2], message: m[3].trim() } : { time: '', level: 'INFO', message: line };
            }
          });
          return json({ logs: logs.reverse() });
        } catch (e) {
          return json({ logs: [], error: e.message });
        }
      }

      res.writeHead(404); res.end('Not found');
    });

    server.listen(port, '0.0.0.0', () => {
      logger.info(`Dashboard running on port ${port} — visit / to open`);
    });
    server.on('error', err => {
      logger.error('Dashboard server error', { error: err.message });
    });
    return server;
  }

  async start() {
      this.startHealthServer();
    try {
      Banner.display();
      logger.info('Starting Instagram Bot...');

      const database = require('../utils/database');
      await database.ready;
      global.db = database;
      global.utils = require('../utils.js');
      global.GoatBot = global.GoatBot || {};
      global.GoatBot.config = config;
      global.GoatBot.instance = this;
      global.client = global.client || {};
      global.client.database = {
          usersData: database.usersData,
          threadsData: database.threadsData,
          globalData: database.globalData
      };
      const path = require('path');
      global.client.dirConfig = path.resolve(__dirname, '../config/default.json');

      await this.commandLoader.loadCommands();
      await this.eventLoader.loadEvents();
      this.eventLoader.registerEvents();

      login.setOptions(config.OPTIONS_FCA);

      await this.loadAndLogin();

      this._scheduleAutoRestart();
      this._scheduleAutoUptime();
    } catch (error) {
      logger.error('Failed to start bot', { error: error.message, stack: error.stack });
      await this.eventLoader.handleEvent('error', error);
      if (this.shouldReconnect && this.reconnectAttempts < config.MAX_RECONNECT_ATTEMPTS) {
        this.scheduleReconnect();
      } else {
        logger.error('Unable to start bot, exiting...');
        process.exit(1);
      }
    }
  }

  async loadAndLogin() {
    const hasCookieFile   = fs.existsSync(config.ACCOUNT_FILE);
    const hasCredentials  = !!(config.ACCOUNT_EMAIL && config.ACCOUNT_PASSWORD);
    const cookieContent   = hasCookieFile ? fs.readFileSync(config.ACCOUNT_FILE, 'utf-8') : '';
    const hasValidCookies = hasCookieFile && this._hasValidCookies(cookieContent);

    if (hasValidCookies) {
      logger.info('Loading cookies from account.txt...');
      this.ig = await login(cookieContent);
    } else if (hasCredentials) {
      logger.info('No valid cookies found — logging in with email/password...');
      this.ig = await login({
        email:    config.ACCOUNT_EMAIL,
        password: config.ACCOUNT_PASSWORD
      });
    } else {
      throw new Error(
        'No valid cookies in account.txt and no email/password configured. ' +
        'Please add Instagram cookies to account.txt or set ACCOUNT_EMAIL/ACCOUNT_PASSWORD.'
      );
    }

    this._afterLogin();

    if (hasCredentials && config.AUTO_REFRESH_FBSTATE && config.INTERVAL_GET_NEW_COOKIE) {
      this._scheduleCookieRefresh();
    }
  }

  _hasValidCookies(content) {
    try {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) return true;
    } catch (_) {}
    return content.split('\n').some(line => {
      const t = line.trim();
      if (!t || (t.startsWith('#') && !t.startsWith('#HttpOnly'))) return false;
      return t.includes('sessionid');
    });
  }

  saveSession() {
    try {
      if (!this.ig || typeof this.ig.getSession !== 'function') return;
      const session = this.ig.getSession();
      if (session) {
        fs.writeFileSync(config.ACCOUNT_FILE, JSON.stringify(session, null, 2), 'utf-8');
        logger.info('Session state saved', { file: config.ACCOUNT_FILE });
      }
    } catch (e) {
      logger.error('Failed to save session', { error: e.message });
    }
  }

  _afterLogin() {
    try {
      const idResult = this.ig.getCurrentUserID();
      this.userID = typeof idResult === 'object'
        ? (idResult.userID || idResult.userId || String(idResult))
        : String(idResult);
    } catch (e) {
      this.userID = 'unknown';
    }

    this.username          = this.userID !== 'unknown' ? this.userID : 'unknown';
    this.api               = this.createAPIWrapper();
    global.GoatBot.fcaApi  = this.api;
    global.GoatBot.instance = this;

    // Call onLoad for commands now that API is ready
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

    // custom.js support
    try {
        const custom = require('./custom.js');
        custom({
            api: this.api,
            bot: this,
            database,
            usersData: database.usersData,
            threadsData: database.threadsData,
            globalData: database.globalData,
            getText: (head, key, ...args) => require('../utils.js').getText(head, key, ...args)
        }).catch(e => logger.error('Error in custom.js', { error: e.message }));
    } catch (e) {
        logger.error('Failed to load custom.js', { error: e.message });
    }

    this.reconnectAttempts = 0;
    this.isRunning         = true;
    logger.info('Connected to Instagram', { userID: this.userID });
    this.saveSession();

    this.eventLoader.handleEvent('ready', {}).then(() => {
      this.startListening();
      this._startReminderScheduler();
      this._startAutoRemoveScheduler();
    });
  }

  startListening() {
    logger.info('Starting message listener...');

    this.ig.listen((err, event) => {
      if (err) {
        const msg = err.message || String(err);
        logger.error('Listen error', { error: msg });

        const isAuthError = /not authorized|login_required|unauthorized/i.test(msg);
        if (isAuthError) {
          logger.error('Session expired or invalid. Update account.txt or credentials in config.');
          this._sendMqttErrorNotification(msg);
          if (config.AUTO_RESTART_WHEN_MQTT_ERROR) {
            this.scheduleReconnect();
          }
        } else if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
        return;
      }

      if (!event) return;

      if (event.type === 'message') {
        this.handleMessage(event).catch(error => {
          logger.error('Error handling message', { error: error.message });
        });
      } else if (event.type === 'event') {
        this.handleThreadEvent(event).catch(error => {
          logger.error('Error handling thread event', { error: error.message });
        });
      } else if (event.type === 'message_reaction') {
        this.handleReactionEvent(event).catch(error => {
          logger.error('Error handling reaction event', { error: error.message });
        });
      }
    });

    if (config.RESTART_LISTEN_MQTT.enable) {
      this._scheduleMqttRestart();
    }

    this.keepAlive();
  }

  _scheduleMqttRestart() {
    if (this._mqttRestartTimer) clearInterval(this._mqttRestartTimer);
    const { timeRestart, delayAfterStopListening, logNoti } = config.RESTART_LISTEN_MQTT;
    this._mqttRestartTimer = setInterval(() => {
      if (logNoti) logger.info('Periodic MQTT listener restart...');
      try { this.ig.stopListening(); } catch (_) {}
      setTimeout(() => {
        if (this.isRunning) this.startListening();
      }, delayAfterStopListening);
    }, timeRestart);
  }

  async handleMessage(event) {
    try {
      const { senderID, threadID, messageID, timestamp } = event;

      if (senderID && senderID === this.userID) return;

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if ((timestamp || 0) < fiveMinutesAgo && timestamp) return;

      const msgKey  = messageID ? `${threadID}-${messageID}` : `${threadID}-${timestamp}`;
      const database = require('../utils/database');
      if (database.isMessageProcessed(msgKey)) return;
      database.markMessageAsProcessed(msgKey);

      if (this._logActivity && event.body) {
        const preview = event.body.slice(0, 60) + (event.body.length > 60 ? '...' : '');
        this._logActivity(`Message from ${senderID} in ${threadID}: "${preview}"`);
      }

      const normalizedEvent = {
        threadID,
        threadId: threadID,
        messageID,
        messageId: messageID,
        senderID,
        senderId: senderID,
        body:           event.body           || '',
        timestamp:      timestamp            || Date.now(),
        type:           event.type           || 'message',
        attachments:    event.attachments    || [],
        isVoiceMessage: event.isVoiceMessage || false,
        isGroup:        event.isGroup        || false,
        replyToItemId:  event.replyTo || (event.messageReply ? event.messageReply.messageID : null),
        messageReply:   event.messageReply   || null
      };

      await this.eventLoader.handleEvent('message', normalizedEvent);

      // Global onChat for GoatBot V2 commands
      for (const [name, cmd] of this.commandLoader.commands) {
        if (typeof cmd.onChat === 'function') {
          cmd.onChat({
            api: this.api,
            event: normalizedEvent,
            bot: this,
            database: require('../utils/database'),
            usersData: require('../utils/database').usersData,
            threadsData: require('../utils/database').threadsData,
            getLang: (...args) => require('../utils.js').getText(cmd.config.name, ...args)
          }).catch(error => logger.error(`onChat error in ${name}`, { error: error.message }));
        }
      }
    } catch (error) {
      logger.error('Error in handleMessage', { error: error.message, stack: error.stack });
    }
  }

  async handleThreadEvent(event) {
    try {
      const threadID = event.threadID;
      const logType  = event.logMessageType || '';
      const database = require('../utils/database');

      // Global onEvent for GoatBot V2 commands
      for (const [name, cmd] of this.commandLoader.commands) {
          if (typeof cmd.onEvent === 'function') {
              cmd.onEvent({
                  api: this.api,
                  event,
                  bot: this,
                  database,
                  usersData: database.usersData,
                  threadsData: database.threadsData
              }).catch(e => logger.error(`onEvent error in ${name}`, { error: e.message }));
          }
      }

      if (logType === 'log:subscribe') {
        const added = event.logMessageData?.addedParticipants || [];
        const botAdded = added.some(p =>
          String(p.userFbId || p.userId || '') === String(this.userID)
        );

        if (botAdded) {
          await this.eventLoader.handleEvent('bot_added', {
            threadID,
            threadId: threadID,
            addedBy: event.author || event.senderID || '',
            addedParticipants: added,
            timestamp: event.timestamp || Date.now()
          });
        } else {
          await this.eventLoader.handleEvent('gc_join', {
            threadID,
            threadId: threadID,
            addedParticipants: added,
            addedBy: event.author || event.senderID || '',
            timestamp: event.timestamp || Date.now()
          });
        }
      } else if (logType === 'log:unsubscribe') {
        const leftUserId = event.logMessageData?.leftParticipantFbId
          || event.logMessageData?.leftParticipantUserFbId
          || '';

        await this.eventLoader.handleEvent('gc_leave', {
          threadID,
          threadId: threadID,
          leftUserId: String(leftUserId),
          timestamp: event.timestamp || Date.now()
        });
      }
    } catch (error) {
      logger.error('Error in handleThreadEvent', { error: error.message });
    }
  }

  async handleReactionEvent(event) {
    try {
      await this.eventLoader.handleEvent('message_reaction', {
        threadID:        event.threadID,
        threadId:        event.threadID,
        senderID:        event.senderID,
        senderId:        event.senderID,
        messageID:       event.messageID,
        messageId:       event.messageID,
        reaction:        event.reaction,
        reactionStatus:  event.reactionStatus,
        targetMessageID: event.targetMessageID,
        targetMessageId: event.targetMessageID,
        timestamp:       event.timestamp || Date.now()
      });
    } catch (error) {
      logger.error('Error in handleReactionEvent', { error: error.message });
    }
  }

  _threadInfoCache = new Map();

  async getThreadInfo(threadID) {
    const cached = this._threadInfoCache.get(String(threadID));
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.data;
    try {
      const info = await this.api.getThread(threadID);
      this._threadInfoCache.set(String(threadID), { data: info, ts: Date.now() });
      return info;
    } catch {
      return null;
    }
  }

  createAPIWrapper() {
    const ig = this.ig;
    const utils = require('../utils.js');

    return {
      sendMessage: async (form, threadID, callback, replyToMessageID) => {
        try {
          if (typeof threadID === 'function') {
              callback = threadID;
              threadID = null;
          }
          if (!threadID) threadID = form.threadID || form.threadId;

          let text = typeof form === 'object' ? (form.body !== undefined ? form.body : '') : String(form);
          let attachment = typeof form === 'object' ? form.attachment : null;

          // Human-like delay
          await utils.humanDelay();

          if (config.TYPING_INDICATOR) {
            try { ig.sendTypingIndicator(threadID); } catch (_) {}
            await this._sleep(config.TYPING_INDICATOR_DURATION);
          }

          let result;
          if (attachment) {
              const attachments = Array.isArray(attachment) ? attachment : [attachment];
              const tempFiles = [];
              for (const item of attachments) {
                  let mediaPath = item.path || (typeof item === 'string' ? item : null);

                  // Handle URL strings as attachments
                  if (typeof item === 'string' && item.startsWith('http')) {
                      try {
                          const stream = await utils.getStreamFromURL(item);
                          const ext = utils.getExtFromMimeType(stream.headers?.['content-type']) || 'png';
                          const tempPath = path.join(process.cwd(), 'temp', `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
                          await fs.ensureDir(path.dirname(tempPath));
                          const writer = fs.createWriteStream(tempPath);
                          stream.pipe(writer);
                          await new Promise((resolve, reject) => {
                              writer.on('finish', resolve);
                              writer.on('error', reject);
                          });
                          mediaPath = tempPath;
                          tempFiles.push(tempPath);
                      } catch (e) {
                          logger.error('Failed to download attachment from URL', { url: item, error: e.message });
                      }
                  }
                  // Handle Streams and Buffers
                  else if (item && (item.readable || item.pipe || Buffer.isBuffer(item))) {
                      const ext = item.filename ? path.extname(item.filename) : (item.name ? path.extname(item.name) : '');
                      const tempPath = path.join(process.cwd(), 'temp', `media_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
                      await fs.ensureDir(path.dirname(tempPath));

                      if (Buffer.isBuffer(item)) {
                          await fs.writeFile(tempPath, item);
                      } else {
                          const writer = fs.createWriteStream(tempPath);
                          item.pipe(writer);
                          await new Promise((resolve, reject) => {
                              writer.on('finish', resolve);
                              writer.on('error', reject);
                          });
                      }
                      mediaPath = tempPath;
                      tempFiles.push(tempPath);
                  }

                  if (mediaPath) {
                      const lowerPath = mediaPath.toLowerCase();
                      const opts = { caption: text };
                      if (replyToMessageID) opts.replyToMessageID = replyToMessageID;

                      if (lowerPath.endsWith('.mp4') || lowerPath.endsWith('.mov') || lowerPath.endsWith('.mkv') || lowerPath.endsWith('.webm')) {
                          result = await ig.sendVideo(threadID, mediaPath, opts);
                      } else if (lowerPath.endsWith('.mp3') || lowerPath.endsWith('.wav') || lowerPath.endsWith('.m4a') || lowerPath.endsWith('.ogg')) {
                          result = await ig.sendVoice(threadID, mediaPath);
                      } else {
                          result = await ig.sendPhoto(threadID, mediaPath, opts);
                      }
                  }
              }
              // Cleanup temp files after sending
              for (const f of tempFiles) {
                  fs.unlink(f).catch(() => {});
              }
          } else {
              if (replyToMessageID) {
                  try {
                      result = await ig.replyToMessage(threadID, text, replyToMessageID);
                  } catch (e) {
                      result = await ig.sendMessage(text, threadID);
                  }
              } else {
                  result = await ig.sendMessage(text, threadID);
              }
          }

          if (result?.messageID || result?.messageId) {
            const mID = result.messageID || result.messageId;
            const db = require('../utils/database');
            db.storeSentMessage(threadID, mID);
          }
          if (typeof callback === 'function') callback(null, result);
          return result;
        } catch (error) {
          logger.error('Failed to send message', { error: error.message, threadID });
          if (/login_required|not authorized|unauthorized/i.test(error.message)) {
            logger.warn('Auth error detected during sendMessage, triggering reconnection...');
            this.scheduleReconnect();
          }
          if (typeof callback === 'function') callback(error);
          throw error;
        }
      },

      sendMessageToUser: async (userID, text) => {
        try {
          return await ig.sendDirectMessage(userID, text);
        } catch (error) {
          logger.error('Failed to send direct message', { error: error.message, userID });
          throw error;
        }
      },

      getThread: async (threadID, callback) => {
        try {
          const info = await ig.getThreadInfo(threadID);
          if (typeof callback === 'function') callback(null, info);
          return info;
        } catch (error) {
          logger.error('Failed to get thread', { error: error.message, threadID });
          if (typeof callback === 'function') callback(error);
          throw error;
        }
      },

      getThreadInfo: async (threadID, callback) => {
        try {
          const info = await ig.getThreadInfo(threadID);
          if (typeof callback === 'function') callback(null, info);
          return info;
        } catch (error) {
          logger.error('Failed to get thread', { error: error.message, threadID });
          if (typeof callback === 'function') callback(error);
          throw error;
        }
      },

      getInbox: async () => {
        try {
          return await ig.getInbox();
        } catch (error) {
          logger.error('Failed to get inbox', { error: error.message });
          throw error;
        }
      },

      markAsSeen: async (threadID) => {
        try {
          return await ig.markAsRead(threadID, true);
        } catch (error) {
          logger.error('Failed to mark as seen', { error: error.message, threadID });
        }
      },

      sendPhoto: async (photoPath, threadID) => {
        try {
          await utils.humanDelay();
          if (config.TYPING_INDICATOR) {
            try { ig.sendTypingIndicator(threadID); } catch (_) {}
            await this._sleep(config.TYPING_INDICATOR_DURATION);
          }
          return await ig.sendPhoto(threadID, photoPath, {});
        } catch (error) {
          logger.error('Failed to send photo', { error: error.message, threadID });
          if (/login_required|not authorized|unauthorized/i.test(error.message)) {
            logger.warn('Auth error detected during sendPhoto, triggering reconnection...');
            this.scheduleReconnect();
          }
          throw error;
        }
      },

      sendVideo: async (videoPath, threadID) => {
        try {
          await utils.humanDelay();
          if (config.TYPING_INDICATOR) {
            try { ig.sendTypingIndicator(threadID); } catch (_) {}
            await this._sleep(config.TYPING_INDICATOR_DURATION);
          }
          return await ig.sendVideo(threadID, videoPath, {});
        } catch (error) {
          logger.error('Failed to send video', { error: error.message, threadID });
          if (/login_required|not authorized|unauthorized/i.test(error.message)) {
            logger.warn('Auth error detected during sendVideo, triggering reconnection...');
            this.scheduleReconnect();
          }
          throw error;
        }
      },

      sendAudio: async (audioPath, threadID) => {
        try {
          await utils.humanDelay();
          if (config.TYPING_INDICATOR) {
            try { ig.sendTypingIndicator(threadID); } catch (_) {}
            await this._sleep(config.TYPING_INDICATOR_DURATION);
          }
          return await ig.sendVoice(threadID, audioPath, {});
        } catch (error) {
          logger.error('Failed to send audio', { error: error.message, threadID });
          if (/login_required|not authorized|unauthorized/i.test(error.message)) {
            logger.warn('Auth error detected during sendAudio, triggering reconnection...');
            this.scheduleReconnect();
          }
          throw error;
        }
      },

      unsendMessage: async (messageID, threadID, callback) => {
        try {
          if (typeof threadID === 'function') {
              callback = threadID;
              threadID = null;
          }
          const res = await ig.unsendMessage(messageID);
          if (typeof callback === 'function') callback(null, res);
          return res;
        } catch (error) {
          logger.error('Failed to unsend message', { error: error.message, messageID });
          if (typeof callback === 'function') callback(error);
          throw error;
        }
      },

      getLastSentMessage: (threadID) => {
        const db = require('../utils/database');
        return db.getLastSentMessage(threadID);
      },

      getUserInfo: async (userID) => {
        try {
          // If userID is array
          if (Array.isArray(userID)) {
              const res = {};
              for (const id of userID) {
                  res[id] = await ig.getUserInfo(id);
              }
              return res;
          }
          const info = await ig.getUserInfo(userID);
          return { [userID]: info };
        } catch (error) {
          logger.error('Failed to get user info', { error: error.message, userID });
          throw error;
        }
      },

      getUserInfoByUsername: async (username) => {
        try {
          return await ig.getUserInfoByUsername(username);
        } catch (error) {
          logger.error('Failed to get user info by username', { error: error.message, username });
          throw error;
        }
      },

      sendPhotoFromUrl: async (threadID, url, opts = {}) => {
        try {
          return await ig.sendPhotoFromUrl(threadID, url, opts);
        } catch (error) {
          logger.error('Failed to send photo from url', { error: error.message, threadID });
          throw error;
        }
      },

      sendVideoFromUrl: async (threadID, url, opts = {}) => {
        try {
          return await ig.sendVideoFromUrl(threadID, url, opts);
        } catch (error) {
          logger.error('Failed to send video from url', { error: error.message, threadID });
          throw error;
        }
      },

      sendVoiceFromUrl: async (threadID, url, opts = {}) => {
        try {
          return await ig.sendVoiceFromUrl(threadID, url, opts);
        } catch (error) {
          logger.error('Failed to send voice from url', { error: error.message, threadID });
          throw error;
        }
      },

      sendReaction: async (reaction, messageID) => {
        try {
          return await ig.sendReaction(reaction, messageID);
        } catch (error) {
          logger.error('Failed to send reaction', { error: error.message, messageID });
        }
      },

      replyToMessage: async (threadID, text, replyToMessageID) => {
        try {
          await utils.humanDelay();
          if (config.TYPING_INDICATOR) {
            try { ig.sendTypingIndicator(threadID); } catch (_) {}
            await this._sleep(config.TYPING_INDICATOR_DURATION);
          }
          return await ig.replyToMessage(threadID, text, replyToMessageID);
        } catch (error) {
          logger.error('Failed to reply to message', { error: error.message, threadID });
          throw error;
        }
      },

      setMessageReaction: async (reaction, messageID, callback, force) => {
          try {
              const res = await ig.sendReaction(reaction, messageID);
              if (typeof callback === 'function') callback(null, res);
              return res;
          } catch (e) {
              logger.error('Failed to set reaction', { error: e.message });
              if (typeof callback === 'function') callback(e);
          }
      },

      changeNickname: async (nickname, threadID, userID) => {
          logger.warn('changeNickname is not fully supported by underlying API');
          return true;
      },

      resolvePhotoUrl: async (photoID) => {
          // Mock for rank card etc.
          return photoID;
      },

      getThreadList: async (limit, timestamp, tags) => {
          try {
              // Map tags to folder if needed, e.g. ['PENDING'] -> 'pending'
              let folder = 'inbox';
              if (tags && tags.includes('PENDING')) folder = 'pending';
              if (tags && tags.includes('OTHER')) folder = 'other';

              const result = await ig.getThreadList(limit, folder);
              // Normalize result to array if it's an object with threads
              return result?.threads || result?.items || result || [];
          } catch (error) {
              logger.error('Failed to get thread list', { error: error.message });
              throw error;
          }
      },

      getCurrentUserID: () => this.userID,

      deleteMessage: async (threadID, messageID) => {
          return await ig.unsendMessage(messageID);
      },

      addUserToGroup: async (userID, threadID) => {
          try {
              if (typeof ig.addUserToGroup === 'function') return await ig.addUserToGroup(userID, threadID);
              if (typeof ig.addParticipant === 'function') return await ig.addParticipant(threadID, userID);
              logger.warn('addUserToGroup not supported by API');
          } catch (e) {
              logger.error('addUserToGroup error', { error: e.message });
              throw e;
          }
      },

      removeUserFromGroup: async (userID, threadID) => {
          try {
              if (typeof ig.removeUserFromGroup === 'function') return await ig.removeUserFromGroup(userID, threadID);
              if (typeof ig.removeParticipant === 'function') return await ig.removeParticipant(threadID, userID);
              logger.warn('removeUserFromGroup not supported by API');
          } catch (e) {
              logger.error('removeUserFromGroup error', { error: e.message });
              throw e;
          }
      },

      setTitle: async (title, threadID) => {
          try {
              if (typeof ig.setThreadTitle === 'function') return await ig.setThreadTitle(threadID, title);
              logger.warn('setTitle not supported by API');
          } catch (e) {
              logger.error('setTitle error', { error: e.message });
          }
      },

      changeAdminStatus: async (threadID, userID, isAdmin) => {
          logger.warn('changeAdminStatus not fully supported');
          return true;
      },

      getThreadHistory: async (threadID, limit) => {
          try {
              return await ig.getThreadHistory(threadID, limit);
          } catch (e) {
              return [];
          }
      },

      shareContact: async (text, senderID, threadID) => {
          return await ig.sendMessage(text, threadID);
      },

      getAvatarUrl: async (userID) => {
          return `https://www.instagram.com/p/avatar/${userID}`;
      },

      sendTypingIndicator: async (threadID) => {
          try {
              return await ig.sendTypingIndicator(threadID);
          } catch (e) {
              return false;
          }
      },

      markAsRead: async (threadID) => {
          try {
              return await ig.markAsRead(threadID);
          } catch (e) {
              return false;
          }
      }
    };
  }

  _startReminderScheduler() {
    if (this._reminderTimer) clearInterval(this._reminderTimer);
    this._reminderTimer = setInterval(async () => {
      try {
        const database = require('../utils/database');
        const due = database.getDueReminders();
        for (const reminder of due) {
          database.removeReminder(reminder.id);
          try {
            await this.api.sendMessageToUser(reminder.userId, `⏰ Reminder!\n\n"${reminder.message}"`);
          } catch (err) {
            logger.warn('Could not deliver reminder', { userId: reminder.userId, error: err.message });
          }
        }
        if (due.length > 0) database.save();
      } catch (err) {
        logger.error('Reminder scheduler error', { error: err.message });
      }
    }, 30000);
    logger.info('Reminder scheduler started (checks every 30s)');
  }


  _startAutoRemoveScheduler() {
    if (this._autoRemoveTimer) clearInterval(this._autoRemoveTimer);
    if (!config.AUTO_REMOVE_ERROR?.enable) return;

    this._autoRemoveTimer = setInterval(async () => {
      try {
        const database = require('../utils/database');
        const expired = database.getExpiredAutoRemoveMessages();
        for (const msg of expired) {
          try {
            await this.api.unsendMessage(msg.messageId);
          } catch (err) {
            // Ignore errors (message might already be unsent or permission issue)
          }
        }
      } catch (err) {
        logger.error('Auto-remove scheduler error', { error: err.message });
      }
    }, 5000); // Check every 5 seconds
    logger.info('Auto-remove scheduler started (checks every 5s)');
  }

  _scheduleAutoRestart() {
    const time = config.AUTO_RESTART_TIME;
    if (!time) return;

    if (typeof time === 'string' && cron.validate(time)) {
      logger.info(`Auto-restart scheduled with cron: ${time}`);
      cron.schedule(time, () => {
        logger.info('Auto-restart triggered by cron.');
        process.exit(0);
      }, { timezone: config.TIMEZONE });
    } else {
      const ms = parseInt(time, 10);
      if (ms > 0) {
        logger.info(`Auto-restart scheduled every ${ms}ms.`);
        setTimeout(() => {
          logger.info('Auto-restart triggered.');
          process.exit(0);
        }, ms);
      }
    }
  }

  _scheduleAutoUptime() {
    if (!config.AUTO_UPTIME_ENABLE) return;
    const intervalMs = config.AUTO_UPTIME_INTERVAL * 1000;
    const url = config.AUTO_UPTIME_URL || process.env.REPLIT_DEV_DOMAIN || '';
    if (!url) return;

    logger.info(`Auto-uptime ping to ${url} every ${config.AUTO_UPTIME_INTERVAL}s`);
    setInterval(() => {
      axios.get(url).catch(() => {});
    }, intervalMs);
  }

  _scheduleCookieRefresh() {
    if (this._cookieRefreshTimer) clearInterval(this._cookieRefreshTimer);
    const intervalMs = (config.INTERVAL_GET_NEW_COOKIE || 1440) * 60 * 1000;
    logger.info(`Cookie auto-refresh scheduled every ${config.INTERVAL_GET_NEW_COOKIE} minutes.`);
    this._cookieRefreshTimer = setInterval(async () => {
      logger.info('Refreshing cookies via email/password login...');
      try {
        this.ig = await login({
          email:    config.ACCOUNT_EMAIL,
          password: config.ACCOUNT_PASSWORD
        });
        this._afterLogin();
        this.saveSession();
        logger.info('Cookie refresh successful.');
      } catch (err) {
        logger.error('Cookie refresh failed.', { error: err.message });
      }
    }, intervalMs);
  }

  async _sendMqttErrorNotification(errorMsg) {
    const { telegram, discordHook } = config.NOTI_MQTT_ERROR;
    if (telegram.enable && telegram.botToken) {
      const chatIds = telegram.chatId.split(/[, ]+/).filter(Boolean);
      for (const chatId of chatIds) {
        axios.post(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
          chat_id: chatId,
          text: `⚠️ Bot MQTT error:\n${errorMsg}`
        }).catch(() => {});
      }
    }
    if (discordHook.enable && discordHook.webhookUrl) {
      const urls = discordHook.webhookUrl.split(/[ ]+/).filter(Boolean);
      for (const url of urls) {
        axios.post(url, { content: `⚠️ Bot MQTT error:\n${errorMsg}` }).catch(() => {});
      }
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= config.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached. Stopping bot.');
      process.exit(1);
    }
    logger.info(`Reconnecting in 5s (attempt ${this.reconnectAttempts}/${config.MAX_RECONNECT_ATTEMPTS})...`);
    setTimeout(() => {
      this.loadAndLogin().catch(err => {
        logger.error('Reconnection failed', { error: err.message });
        this.scheduleReconnect();
      });
    }, 5000);
  }

  reconnect() {
    this.scheduleReconnect();
  }

  keepAlive() {
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down...`);
      this.isRunning       = false;
      this.shouldReconnect = false;
      if (this._mqttRestartTimer)   clearInterval(this._mqttRestartTimer);
      if (this._cookieRefreshTimer) clearInterval(this._cookieRefreshTimer);
      if (this._reminderTimer)      clearInterval(this._reminderTimer);
      if (this._autoRemoveTimer)    clearInterval(this._autoRemoveTimer);
      try { if (this.ig) this.ig.stopListening(); } catch (_) {}
      logger.info('Bot shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason: String(reason) });
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = InstagramBot;
