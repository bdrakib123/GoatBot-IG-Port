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

  async onStart({ api, event, args, logger, database, usersData }) {
    const uid = event.senderID;
    const threadID = event.threadId || event.threadID;

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
      const res = await api.sendMessage(idle[Math.floor(Math.random() * idle.length)], threadID);

      if (res && res.messageID) {
        database.setReplyData(res.messageID, { commandName: 'bby' });
      }
      return res;
    }

    const text = args.join(' ');

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
      if (localLearned) {
        const sent = await api.sendMessage(localLearned, threadID);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, localLearned, 'bot');
        return sent;
      }

      // Multi-tier open source API fetch helper for zero downtime
      async function fetchBabyReply(queryText, name) {
        const endpoints = [
          `https://api.simsimi.net/v2/?text=${encodeURIComponent(queryText)}&lc=en`,
          `https://simsimi.cyberbot.top/simsimi?text=${encodeURIComponent(queryText)}&senderName=${encodeURIComponent(name)}`,
          `https://kaiz-apis.gleeze.com/api/simsimi?ask=${encodeURIComponent(queryText)}`,
          `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(queryText)}&botname=Baby&ownername=Jisan`,
          `https://kaiz-apis.gleeze.com/api/gemini-pro?ask=${encodeURIComponent(queryText)}&uid=${uid}`,
          `https://text.pollinations.ai/${encodeURIComponent(queryText)}`
        ];

        for (const ep of endpoints) {
          try {
            const res = await axios.get(ep, { timeout: 8000 });
            const rep = res.data?.success || res.data?.response || res.data?.reply || res.data?.message || (typeof res.data === 'string' ? res.data : null);
            if (rep && typeof rep === 'string' && rep.trim()) {
              return Array.isArray(rep) ? rep[0] : rep;
            }
          } catch (_) {}
        }
        return 'Bolo baby 🥺 ki bolbe?';
      }

      const replyText = await fetchBabyReply(text, senderName);
      const sent = await api.sendMessage(replyText, threadID);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, replyText, 'bot');
      return sent;

    } catch (error) {
      logger.error('bby error', { error: error.message });
      return api.sendMessage('Bolo baby 🥺 ki bolbe?', threadID);
    }
  },

  async handleReply({ api, event, logger, database, usersData }) {
    const uid  = event.senderID;
    const threadID = event.threadId || event.threadID;
    const text = (event.body || '').trim();
    if (!text) return;

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
    if (localLearned) {
      const sent = await api.sendMessage(localLearned, threadID);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, localLearned, 'bot');
      return sent;
    }

    try {
      const endpoints = [
        `https://api.simsimi.net/v2/?text=${encodeURIComponent(text)}&lc=en`,
        `https://simsimi.cyberbot.top/simsimi?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`,
        `https://kaiz-apis.gleeze.com/api/simsimi?ask=${encodeURIComponent(text)}`,
        `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(text)}&botname=Baby&ownername=Jisan`,
        `https://kaiz-apis.gleeze.com/api/gemini-pro?ask=${encodeURIComponent(text)}&uid=${uid}`,
        `https://text.pollinations.ai/${encodeURIComponent(text)}`
      ];

      let replyText = 'Bolo baby 🥺';
      for (const ep of endpoints) {
        try {
          const res = await axios.get(ep, { timeout: 8000 });
          const rep = res.data?.success || res.data?.response || res.data?.reply || res.data?.message || (typeof res.data === 'string' ? res.data : null);
          if (rep && typeof rep === 'string' && rep.trim()) {
            replyText = Array.isArray(rep) ? rep[0] : rep;
            break;
          }
        } catch (_) {}
      }

      const sent = await api.sendMessage(replyText, threadID);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      if (typeof database.storeChatHistory === 'function') database.storeChatHistory(uid, threadID, replyText, 'bot');
    } catch (error) {
      logger.error('bby handleReply error', { error: error.message });
      return api.sendMessage('Bolo baby 🥺', threadID);
    }
  }
};
