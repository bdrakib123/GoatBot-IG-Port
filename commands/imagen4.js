const axios = require("axios");

module.exports = {
  config: {
    name: "imagen4",
    version: "1.0.0",
    author: "Neoaz 🐦",
    cooldown: 5,
    role: 0,
    description: "Generate image using Imagen4",
    category: "ai-image",
    usage: "imagen4 <prompt>"
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${Date.now()}`;
      await message.reply({
        body: `✅ | Imagen4: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error('imagen4 error:', error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ | Failed to generate Imagen4 image.");
    }
  }
};
