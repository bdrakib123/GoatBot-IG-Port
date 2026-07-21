module.exports = {
  config: {
    name: "unsend",
    aliases: ["u", "un", "del", "delete", "unsent"],
    version: "1.4",
    author: "NTKhang & Gtajisan",
    cooldown: 1,
    role: 0,
    description: "Unsend bot's message",
    category: "utility",
    usage: "reply to the message you want to unsend or just type {pn}"
  },

  async onStart({ message, event, api, database }) {
    const threadID = event.threadId || event.threadID;
    let targetID = null;

    if (event.messageReply) {
      targetID = event.messageReply.messageID || event.messageReply.messageId || event.messageReply.item_id;
    } else if (event.replyToItemId) {
      targetID = event.replyToItemId;
    }

    if (!targetID) {
      const last = database.getLastSentMessage(threadID);
      if (last) {
        targetID = last.messageID || last.messageId || last.itemId;
      }
    }

    if (!targetID) {
      return message.reply('ℹ️ No recent bot message to unsend. Reply to a message to unsend it.');
    }

    try {
      await api.unsendMessage(targetID, threadID);
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Failed to unsend:', err.message);
    }
  }
};