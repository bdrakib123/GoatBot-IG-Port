const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

module.exports = {
  config: {
    name: 'pair',
    aliases: ['pairlove', 'randompair', 'soulmate'],
    version: '1.0',
    author: 'Jisan',
    cooldown: 5,
    role: 0,
    category: 'Fun',
    description: 'Find your random group soulmate pair and generate a dual PFP love card',
    usage: 'pair'
  },

  onStart: async function ({ api, event, message, usersData, threadsData }) {
    const threadID = event.threadId || event.threadID;
    const senderID = event.senderID;

    api.setMessageReaction('💘', event.messageID, () => {}, true);

    try {
      const threadInfo = await api.getThread(threadID).catch(() => null);
      let participantIDs = threadInfo?.participantIDs || [];

      // Filter out bot ID and self
      participantIDs = participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());

      if (participantIDs.length === 0) {
        return message.reply('❌ Not enough members in this thread to pair up!');
      }

      // Pick random soulmate
      const soulmateID = participantIDs[Math.floor(Math.random() * participantIDs.length)];

      const name1 = await usersData.getName(senderID);
      const name2 = await usersData.getName(soulmateID);

      const userInfo1 = (await api.getUserInfo(senderID).catch(() => ({})))[senderID] || {};
      const userInfo2 = (await api.getUserInfo(soulmateID).catch(() => ({})))[soulmateID] || {};

      const url1 = userInfo1.profilePicUrlHd || userInfo1.hdProfilePicUrlInfo?.url || userInfo1.profile_pic_url_hd || userInfo1.profilePicUrl;
      const url2 = userInfo2.profilePicUrlHd || userInfo2.hdProfilePicUrlInfo?.url || userInfo2.profile_pic_url_hd || userInfo2.profilePicUrl;

      if (!url1 || !url2) throw new Error('Could not retrieve member profile pictures.');

      const [res1, res2] = await Promise.all([
        axios.get(url1, { responseType: 'arraybuffer', timeout: 10000 }),
        axios.get(url2, { responseType: 'arraybuffer', timeout: 10000 })
      ]);

      const [img1, img2] = await Promise.all([
        loadImage(Buffer.from(res1.data)),
        loadImage(Buffer.from(res2.data))
      ]);

      const lovePercent = Math.floor(Math.random() * 41) + 60; // 60% to 100%

      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 800, 400);
      bgGrad.addColorStop(0, '#831843');
      bgGrad.addColorStop(1, '#BE185D');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 400);

      // User 1 Avatar (Circle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(180, 200, 100, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img1, 80, 100, 200, 200);
      ctx.restore();

      ctx.lineWidth = 8;
      ctx.strokeStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(180, 200, 104, 0, Math.PI * 2);
      ctx.stroke();

      // User 2 Avatar (Circle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(620, 200, 100, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img2, 520, 100, 200, 200);
      ctx.restore();

      ctx.lineWidth = 8;
      ctx.strokeStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(620, 200, 104, 0, Math.PI * 2);
      ctx.stroke();

      // Heart & Percentage
      ctx.fillStyle = '#F43F5E';
      ctx.shadowColor = '#FDA4AF';
      ctx.shadowBlur = 30;
      ctx.font = 'bold 70px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💖', 400, 190);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`${lovePercent}%`, 400, 250);

      // Footer
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#FCE7F3';
      ctx.fillText(`${name1} 💕 ${name2}`, 400, 350);

      const buffer = canvas.toBuffer('image/png');
      api.setMessageReaction('💘', event.messageID, () => {}, true);

      return message.reply({
        body: `💘 **GROUP SOULMATE PAIR** 💘\n\n👤 ${name1} × 👤 ${name2}\n💖 **Love Match:** ${lovePercent}%`,
        attachment: buffer
      });
    } catch (err) {
      console.error('Pair error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply(`❌ Could not generate pair card: ${err.message}`);
    }
  }
};
