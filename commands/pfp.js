const axios = require('axios');

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

module.exports = {
  config: {
    name: 'pfp',
    aliases: ['avatar', 'profilepic'],
    description: "Fetch user's profile picture",
    usage: 'pfp [username | @username | link | reply | @tag]',
    cooldown: 5,
    role: 0,
    author: 'Gtajisan',
    category: 'utility'
  },

  async run({ api, event, args, logger, message }) {
    try {
      let targetInput = null;
      let isUid = false;

      // 1. Check explicit arguments
      if (args.length > 0) {
        const input = args[0].trim();
        if (input.includes('instagram.com/')) {
          const match = input.match(/instagram\.com\/([^/?#&]+)/);
          if (match) targetInput = match[1];
        } else {
          // Normalize username: remove all leading @ symbols
          targetInput = input.replace(/^@+/, '');
        }
      }
      // 2. Check mentions
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetInput = Object.keys(event.mentions)[0];
        isUid = true;
      }
      // 3. Check reply
      else if (event.replyToItemId) {
        // For InstagramBot, event.messageReply is often populated if it's a direct reply
        // If not, we might need to fetch it, but let's try the common patterns
        const reply = event.messageReply || {};
        const replyBody = reply.body || '';
        const senderID = reply.senderID || reply.senderId;

        if (senderID) {
          const urlMatch = replyBody.match(/instagram\.com\/([^/?#&]+)/);
          if (urlMatch) {
            targetInput = urlMatch[1];
          } else {
            const atMatch = replyBody.match(/@([a-zA-Z0-9._]+)/);
            if (atMatch) {
              targetInput = atMatch[1];
            } else {
              targetInput = senderID;
              isUid = true;
            }
          }
        }
      }

      // 4. Fallback to sender
      if (!targetInput) {
        targetInput = event.senderID;
        isUid = true;
      }

      if (!isUid && /^\d+$/.test(targetInput)) {
        isUid = true;
      }

      // Check cache
      const cacheKey = `${isUid ? 'uid' : 'user'}:${targetInput}`;
      if (cache.has(cacheKey)) {
        const { data, timestamp } = cache.get(cacheKey);
        if (Date.now() - timestamp < CACHE_TTL) {
          return this.sendProfile(api, event, data, message, logger);
        }
      }

      const fetchingMsg = await message.reply('🔍 Fetching profile picture...');

      const userInfo = await this.fetchWithRetry(async () => {
        return isUid
          ? (await api.getUserInfo(targetInput))[targetInput]
          : await api.getUserInfoByUsername(targetInput);
      }, logger);

      if (!userInfo) {
        return message.reply(`❌ User ${isUid ? targetInput : '@' + targetInput} not found or account is private.`);
      }

      // Store in cache
      cache.set(cacheKey, { data: userInfo, timestamp: Date.now() });

      return this.sendProfile(api, event, userInfo, message, logger);

    } catch (error) {
      logger.error('Error in pfp command', { error: error.message });
      return message.reply(`❌ Error: ${error.message}`);
    }
  },

  async sendProfile(api, event, userInfo, message, logger) {
    const userId = userInfo.userID || userInfo.userId || userInfo.pk;
    const username = userInfo.username;
    const fullName = userInfo.fullName || userInfo.full_name || 'N/A';
    const isPrivate = userInfo.isPrivate ? '🔒 Private' : '🔓 Public';
    const isVerified = userInfo.isVerified ? '✅ Verified' : '❌ Not Verified';

    const pfpUrl = userInfo.profilePicUrlHd ||
                   userInfo.hd_profile_pic_url_info?.url ||
                   userInfo.profile_pic_url_hd ||
                   userInfo.profilePicUrl ||
                   userInfo.profile_pic_url;

    if (!pfpUrl) {
      return message.reply('❌ Could not find a profile picture URL.');
    }

    let caption = `👤 Username: @${username}\n`;
    caption += `📝 Full Name: ${fullName}\n`;
    caption += `🆔 User ID: ${userId}\n`;
    caption += `🛡️ Status: ${isPrivate} | ${isVerified}\n`;
    caption += `🔗 Profile: https://instagram.com/${username}`;

    try {
      const res = await axios.get(pfpUrl, { responseType: 'arraybuffer', timeout: 15000 });
      const imgBuffer = Buffer.from(res.data);
      await message.reply({ body: caption, attachment: imgBuffer });
    } catch (error) {
      logger.error('Failed to send profile picture buffer', { error: error.message });
      try {
        await api.sendPhotoFromUrl(event.threadId || event.threadID, pfpUrl, { caption });
      } catch (err2) {
        await message.reply(caption);
      }
    }
  },

  async fetchWithRetry(fn, logger, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        const errorMsg = error.message.toLowerCase();
        const isRateLimit = errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests') || errorMsg.includes('login_required');

        if (isRateLimit && i < retries - 1) {
          const delay = backoff * Math.pow(2, i);
          logger.warn(`Rate limit or session issue hit fetching profile, retrying in ${delay}ms... (Attempt ${i+1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }
};
