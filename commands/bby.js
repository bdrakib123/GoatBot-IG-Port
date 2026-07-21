const axios = require('axios');

const BASE_URL = 'https://simsimi.cyberbot.top';

module.exports = {
  config: {
    name: 'bby',
    aliases: ['baby', 'bbe', 'babe'],
    description: 'Chat with Baby AI — teach it, manage replies, and more',
    usage: 'bby <message> | teach <msg> - <reply> | remove <msg> - <reply> | list',
    cooldown: 3,
    role: 0,
    category: 'ai'
  },

  async onStart({ api, event, args, bot, logger, database, usersData }) {
    const uid = event.senderID;
    const threadID = event.threadId || event.threadID;

    // Prevent bot from replying to itself
    const currentBotID = bot?.userID || (api?.getCurrentUserID ? api.getCurrentUserID() : null);
    const botIDStr = typeof currentBotID === 'object' ? (currentBotID.userID || currentBotID.userId) : String(currentBotID || '');
    if (event.isSelf || (uid && botIDStr && String(uid) === String(botIDStr))) return;

    if (!global._lastBbyReply) global._lastBbyReply = {};

    // Get user name for SimSimi personalization
    let senderName = 'Jisan';
    try {
      const user = database.getUser(uid);
      if (user && user.name) {
        senderName = user.name;
      } else if (usersData && typeof usersData.getName === 'function') {
        senderName = await usersData.getName(uid);
      }
    } catch (_) {}

    if (args.length === 0) {
      const idle = ['Bolo baby 🥺', 'hum...', 'Type bby help', 'Ki bolbe?'];
      const chosenIdle = idle[Math.floor(Math.random() * idle.length)];
      global._lastBbyReply[threadID] = chosenIdle;
      const res = await api.sendMessage(chosenIdle, threadID);

      if (res && res.messageID) {
        database.setReplyData(res.messageID, { commandName: 'bby' });
      }
      return res;
    }

    const text = args.join(' ');

    // Prevent replying to identical text that bby just sent in this thread (anti-loop)
    if (global._lastBbyReply[threadID] && global._lastBbyReply[threadID].trim().toLowerCase() === text.trim().toLowerCase()) {
      return;
    }

    try {
      if (args[0] === 'remove' || args[0] === 'rm') {
        const query = text.replace(/^(remove|rm)\s*/i, '');
        const parts = query.split(/\s*-\s*/);
        if (parts.length < 2) {
          return api.sendMessage('❌ Invalid format! Usage: bby remove <message> - <reply>', threadID);
        }
        const [ask, ans] = parts.map(p => p.trim());
        const res = await axios.get(`${BASE_URL}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
        const sent = await api.sendMessage(res.data.message || '✅ Reply removed.', threadID);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      if (args[0] === 'list') {
        const res = await axios.get(`${BASE_URL}/list`);
        const data = res.data;
        const sent = await api.sendMessage(
          `♾ Total Questions Learned: ${data.totalQuestions || 'N/A'}\n★ Total Replies Stored: ${data.totalReplies || 'N/A'}\n☠︎︎ Developer: ${data.author || 'ULLASH'}`,
          threadID
        );
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      if (args[0] === 'teach') {
        const query = text.replace(/^teach\s*/i, '');
        const parts = query.split(/\s*-\s*/);
        if (parts.length < 2) {
          return api.sendMessage('❌ Invalid format! Usage: bby teach <message> - <reply>', threadID);
        }
        const [ask, ans] = parts.map(p => p.trim());

        if (typeof database.learnPhrasePair === 'function') {
          database.learnPhrasePair(ask, ans, uid);
        }

        try {
          await axios.get(`${BASE_URL}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}&groupID=${encodeURIComponent(threadID)}`);
        } catch (_) {}

        const sent = await api.sendMessage(`✅ Learned phrase!\n\n❓ Ask: "${ask}"\n💬 Reply: "${ans}"`, threadID);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      // Check local memory & learned phrase pairs first
      if (typeof database.storeChatHistory === 'function') {
        database.storeChatHistory(uid, threadID, text, 'user');
      }

      const localLearned = typeof database.findLearnedPair === 'function' ? database.findLearnedPair(text) : null;
      if (localLearned && localLearned.trim().toLowerCase() !== text.trim().toLowerCase()) {
        global._lastBbyReply[threadID] = localLearned;
        const sent = await api.sendMessage(localLearned, threadID);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, localLearned, 'bot');
        return sent;
      }

function isValidAiResponse(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('<') || trimmed.endsWith('>') || trimmed.startsWith('{') || trimmed.startsWith('<!')) return false;
  if (/<[a-z0-9]+[\s\S]*?>/i.test(trimmed)) return false;
  if (/<!DOCTYPE|<html|<head|<body|<script|fingerprint|simsimi\.net|redirect_link|rdrTimeout|visitorId|cloudflare|just a moment|tr_uuid/i.test(trimmed)) return false;
  if (trimmed.includes('simsimi.net')) return false;
  return true;
}

      // Multi-tier open source API fetch helper for zero downtime
      async function fetchBabyReply(queryText, name) {
        const endpoints = [
          `https://simsimi.cyberbot.top/simsimi?text=${encodeURIComponent(queryText)}&senderName=${encodeURIComponent(name)}`,
          `https://kaiz-apis.gleeze.com/api/simsimi?ask=${encodeURIComponent(queryText)}`,
          `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(queryText)}&botname=Baby&ownername=Jisan`,
          `https://kaiz-apis.gleeze.com/api/gemini-pro?ask=${encodeURIComponent(queryText)}&uid=${uid}`,
          `https://text.pollinations.ai/${encodeURIComponent(queryText)}`
        ];

        for (const ep of endpoints) {
          try {
            const res = await axios.get(ep, { timeout: 8000, headers: { 'Accept': 'application/json' } });
            const rep = res.data?.response || res.data?.reply || res.data?.message || (typeof res.data === 'string' ? res.data : null);
            let finalRep = Array.isArray(rep) ? rep[0] : rep;
            if (isValidAiResponse(finalRep)) {
              return finalRep.trim();
            }
          } catch (_) {}
        }
        return 'Bolo baby 🥺 ki bolbe?';
      }

      const replyText = await fetchBabyReply(text, senderName);
      global._lastBbyReply[threadID] = replyText;
      const sent = await api.sendMessage(replyText, threadID);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, replyText, 'bot');
      return sent;

    } catch (error) {
      logger.error('bby error', { error: error.message });
      const fallbackMsg = 'Bolo baby 🥺 ki bolbe?';
      global._lastBbyReply[threadID] = fallbackMsg;
      return api.sendMessage(fallbackMsg, threadID);
    }
  },

  async handleReply({ api, event, bot, logger, database, usersData }) {
    const uid  = event.senderID;
    const threadID = event.threadId || event.threadID;

    // Self-message check
    const currentBotID = bot?.userID || (api?.getCurrentUserID ? api.getCurrentUserID() : null);
    const botIDStr = typeof currentBotID === 'object' ? (currentBotID.userID || currentBotID.userId) : String(currentBotID || '');
    if (event.isSelf || (uid && botIDStr && String(uid) === String(botIDStr))) return;

    const text = (event.body || '').trim();
    if (!text) return;

    if (!global._lastBbyReply) global._lastBbyReply = {};
    if (global._lastBbyReply[threadID] && global._lastBbyReply[threadID].trim().toLowerCase() === text.toLowerCase()) {
      return;
    }

    let senderName = 'Jisan';
    try {
      const user = database.getUser(uid);
      if (user && user.name) {
        senderName = user.name;
      } else if (usersData && typeof usersData.getName === 'function') {
        senderName = await usersData.getName(uid);
      }
    } catch (_) {}

    if (typeof database.storeChatHistory === 'function') {
      database.storeChatHistory(uid, threadID, text, 'user');
    }

    const localLearned = typeof database.findLearnedPair === 'function' ? database.findLearnedPair(text) : null;
    if (localLearned && localLearned.trim().toLowerCase() !== text.toLowerCase()) {
      global._lastBbyReply[threadID] = localLearned;
      const sent = await api.sendMessage(localLearned, threadID);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, localLearned, 'bot');
      return sent;
    }

    try {
      const endpoints = [
        `https://simsimi.cyberbot.top/simsimi?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`,
        `https://kaiz-apis.gleeze.com/api/simsimi?ask=${encodeURIComponent(text)}`,
        `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(text)}&botname=Baby&ownername=Jisan`,
        `https://kaiz-apis.gleeze.com/api/gemini-pro?ask=${encodeURIComponent(text)}&uid=${uid}`,
        `https://text.pollinations.ai/${encodeURIComponent(text)}`
      ];

      let replyText = 'Bolo baby 🥺';
      for (const ep of endpoints) {
        try {
          const res = await axios.get(ep, { timeout: 8000, headers: { 'Accept': 'application/json' } });
          const rep = res.data?.response || res.data?.reply || res.data?.message || (typeof res.data === 'string' ? res.data : null);
          let finalRep = Array.isArray(rep) ? rep[0] : rep;
          if (isValidAiResponse(finalRep)) {
            replyText = finalRep.trim();
            break;
          }
        } catch (_) {}
      }

      global._lastBbyReply[threadID] = replyText;
      const sent = await api.sendMessage(replyText, threadID);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, replyText, 'bot');
    } catch (error) {
      logger.error('bby handleReply error', { error: error.message });
      const fallbackMsg = 'Bolo baby 🥺';
      global._lastBbyReply[threadID] = fallbackMsg;
      return api.sendMessage(fallbackMsg, threadID);
    }
  }
};
