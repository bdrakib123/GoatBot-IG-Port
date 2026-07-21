const axios = require('axios');

module.exports = {
  config: {
    name: 'blur',
    version: '1.0',
    author: 'Ajmaul',
    cooldown: 10,
    role: 0,
    description: 'Apply blur effect to profile picture',
    category: 'fun',
    usage: 'blur [@mention or reply]'
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    let uid;
    const mentions = Object.keys(event.mentions || {});
    if (mentions.length > 0) {
      uid = mentions[0];
    } else if (event.messageReply && (event.messageReply.senderID || event.messageReply.senderId)) {
      uid = event.messageReply.senderID || event.messageReply.senderId;
    } else if (args && args.length > 0) {
      uid = args[0].replace(/^@+/, '');
    } else {
      uid = event.senderID;
    }

    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const avatarURL = await api.getAvatarUrl(uid);
      if (!avatarURL || !avatarURL.startsWith('http')) throw new Error('Could not find profile picture URL');

      const res = await axios.get(`https://api.popcat.xyz/v2/blur?image=${encodeURIComponent(avatarURL)}`, {
        responseType: 'arraybuffer'
      });

      await message.reply({
        body: '🌫️ Here\'s your blurred image!',
        attachment: Buffer.from(res.data, 'binary')
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error(err);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ | Failed to generate blurred image.');
    }
  }
};
