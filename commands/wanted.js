const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const toEnglishName = (name) => {
  const map = {
    'আ': 'A', 'ই': 'I', 'উ': 'U', 'এ': 'E', 'ও': 'O',
    'ক': 'K', 'খ': 'Kh', 'গ': 'G', 'ঘ': 'Gh', 'ঙ': 'Ng',
    'চ': 'Ch', 'ছ': 'Chh', 'জ': 'J', 'ঝ': 'Jh', 'ঞ': 'Ny',
    'ট': 'T', 'ঠ': 'Th', 'ড': 'D', 'ঢ': 'Dh', 'ণ': 'N',
    'ত': 'T', 'থ': 'Th', 'দ': 'D', 'ধ': 'Dh', 'ন': 'N',
    'প': 'P', 'ফ': 'Ph', 'ব': 'B', 'ভ': 'Bh', 'ম': 'M',
    'য': 'Y', 'র': 'R', 'ল': 'L', 'শ': 'Sh', 'ষ': 'Sh', 'স': 'S', 'হ': 'H',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ৈ': 'ai', 'ো': 'o', 'ৌ': 'au'
  };
  return name.split('').map(c => map[c] || c).join('').replace(/\s+/g, ' ').trim() || "Unknown";
};

module.exports = {
  config: {
    name: 'wanted',
    version: '1.1',
    author: 'Ajmaul',
    cooldown: 5,
    role: 0,
    description: 'Create a high quality wanted poster.',
    category: 'fun',
    usage: 'wanted @mention'
  },

  onStart: async function ({ event, message, api, usersData }) {
    const mentionID = Object.keys(event.mentions)[0] || (event.type === 'message_reply' ? event.messageReply.senderID : null);
    if (!mentionID) return message.reply('Mention someone or reply to their message!');

    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const rawName = await usersData.getName(mentionID);
      const name = toEnglishName(rawName);

      const userInfoMap = await api.getUserInfo(mentionID).catch(() => ({}));
      const userInfo = userInfoMap[mentionID] || {};
      const photoUrl = userInfo.profilePicUrlHd || userInfo.hdProfilePicUrlInfo?.url || userInfo.profile_pic_url_hd || userInfo.profilePicUrl;

      if (!photoUrl) throw new Error('Could not find photo');

      const res = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      const avatar = await loadImage(Buffer.from(res.data, 'binary'));

      const canvas = createCanvas(700, 900);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, 700, 900);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 700, 150);

      ctx.font = 'bold 100px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('WANTED', 350, 120);

      ctx.fillStyle = '#fff';
      ctx.fillRect(100, 180, 500, 500);
      ctx.save();
      ctx.beginPath();
      ctx.rect(100, 180, 500, 500);
      ctx.clip();
      ctx.drawImage(avatar, 100, 180, 500, 500);
      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000';
      ctx.strokeRect(100, 180, 500, 500);

      ctx.font = 'bold 50px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(name.toUpperCase(), 350, 750);

      const crimes = ['Stealing Hearts', 'Being Too Cool', 'Spreading Chaos', 'Hacking Laughter', 'Breaking Rules', 'Too Much Swag'];
      const crime = crimes[Math.floor(Math.random() * crimes.length)];
      ctx.font = 'italic 32px Arial';
      ctx.fillText('CRIME: ' + crime, 350, 800);

      const rewards = ['$1,000', '$5,000', '$10,000', '$50,000', '$100,000'];
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#d35400';
      ctx.fillText('REWARD: ' + reward, 350, 850);

      await message.reply({
        body: `📜 WANTED POSTER\n👤 Name: ${name}\n💣 Crime: ${crime}\n💰 Reward: ${reward}`,
        attachment: canvas.toBuffer()
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Wanted Error:', err);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Error while generating wanted poster!');
    }
  }
};
