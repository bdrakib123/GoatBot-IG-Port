const axios = require('axios');

module.exports = {
  config: {
    name: 'imggen',
    aliases: ['imgen', 'imagine'],
    version: '1.0',
    author: 'nexo_here',
    cooldown: 10,
    role: 0,
    description: 'Generate AI image using imgen API',
    category: 'ai-image',
    usage: 'imggen <prompt>'
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('❌ | Please provide a prompt.\nExample: imggen A dragon flying over a castle');

    message.reply('🧠 | Generating image with AI, please wait...');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${Date.now()}`;

      await message.reply({
        body: `✅ | Generated Image for: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Imggen error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ | Failed to generate image. Please try again.');
    }
  }
};
