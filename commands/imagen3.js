const axios = require('axios');

module.exports = {
  config: {
    name: 'imagen3',
    version: '1.0',
    author: 'nexo_here',
    cooldown: 10,
    role: 0,
    description: 'Generate image using Imagen 3',
    category: 'ai-image',
    usage: 'imagen3 <prompt>'
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('❌ Please provide a prompt.\nExample: imagen3 a samurai standing in sunset');

    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${Date.now()}`;

      await message.reply({
        attachment: url
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (error) {
      console.error('Imagen3 error:', error.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ Failed to generate image.');
    }
  }
};
