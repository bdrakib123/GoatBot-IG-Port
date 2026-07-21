const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

module.exports = {
  config: {
    name: 'gay',
    version: '2.0',
    author: 'Jisan',
    cooldown: 2,
    role: 0,
    description: 'Generate a dual PFP rainbow canvas image.',
    category: 'fun',
    usage: 'gay @mention @mention OR gay @mention OR reply'
  },

  onStart: async function ({ api, event, message, usersData }) {
    try {
      const mentions = Object.keys(event.mentions || {});
      let uid1, uid2;

      if (mentions.length >= 2) {
        uid1 = mentions[0];
        uid2 = mentions[1];
      } else if (mentions.length === 1) {
        uid1 = event.senderID;
        uid2 = mentions[0];
      } else if (event.messageReply) {
        uid1 = event.senderID;
        uid2 = event.messageReply.senderID;
      } else {
        return message.reply('Please reply to a message or mention one or two users.');
      }

      api.setMessageReaction('⏳', event.messageID, () => {}, true);
      const name1 = await usersData.getName(uid1);
      const name2 = await usersData.getName(uid2);

      const userInfo1 = (await api.getUserInfo(uid1).catch(() => ({})))[uid1] || {};
      const userInfo2 = (await api.getUserInfo(uid2).catch(() => ({})))[uid2] || {};

      const url1 = userInfo1.profilePicUrlHd || userInfo1.hdProfilePicUrlInfo?.url || userInfo1.profile_pic_url_hd || userInfo1.profilePicUrl;
      const url2 = userInfo2.profilePicUrlHd || userInfo2.hdProfilePicUrlInfo?.url || userInfo2.profile_pic_url_hd || userInfo2.profilePicUrl;

      if (!url1 || !url2) throw new Error('Could not retrieve user profile pictures.');

      const [res1, res2] = await Promise.all([
        axios.get(url1, { responseType: 'arraybuffer', timeout: 10000 }),
        axios.get(url2, { responseType: 'arraybuffer', timeout: 10000 })
      ]);

      const [img1, img2] = await Promise.all([
        loadImage(Buffer.from(res1.data)),
        loadImage(Buffer.from(res2.data))
      ]);

      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');

      // Draw Avatars
      ctx.drawImage(img1, 0, 0, 400, 400);
      ctx.drawImage(img2, 400, 0, 400, 400);

      // Rainbow Overlay
      const rainbow = ctx.createLinearGradient(0, 0, 800, 400);
      rainbow.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
      rainbow.addColorStop(0.2, 'rgba(255, 127, 0, 0.4)');
      rainbow.addColorStop(0.4, 'rgba(255, 255, 0, 0.4)');
      rainbow.addColorStop(0.6, 'rgba(0, 255, 0, 0.4)');
      rainbow.addColorStop(0.8, 'rgba(0, 0, 255, 0.4)');
      rainbow.addColorStop(1, 'rgba(139, 0, 255, 0.4)');

      ctx.fillStyle = rainbow;
      ctx.fillRect(0, 0, 800, 400);

      // Draw Badge Label
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🌈 ${name1} 💋 ${name2} 🌈`, 400, 360);

      const buffer = canvas.toBuffer('image/png');
      api.setMessageReaction('✅', event.messageID, () => {}, true);

      return message.reply({
        body: `Oh yeah ${name1} 💋 ${name2}`,
        attachment: buffer
      });
    } catch (e) {
      console.error('Gay error:', e.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Couldn\'t generate image. Try again later.');
    }
  }
};
