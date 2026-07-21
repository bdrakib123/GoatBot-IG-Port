const axios = require('axios');

module.exports = {
  config: {
    name: 'hgen',
    version: '1.0',
    author: 'Rifat | nxo_here',
    cooldown: 5,
    role: 0,
    description: 'Generate NSFW images using prompt',
    category: 'nsfw',
    usage: 'hgen <prompt>'
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('❌ | Please provide a prompt to generate the NSFW image.');

    message.reply(`🔞 Generating NSFW image for: "${prompt}"...\nPlease wait...`);
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${Date.now()}`;

      await message.reply({
        body: `✅ | Generated image for: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Hgen error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ | Failed to generate image. Try again later.');
    }
  }
};
