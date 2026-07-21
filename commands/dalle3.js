const axios = require("axios");

module.exports = {
  config: {
    name: "dalle3",
    version: "1.0.0",
    author: "Neoaz 🐦",
    cooldown: 5,
    role: 0,
    description: "Generate image using DALL-E 3",
    category: "ai-image",
    usage: "dalle3 <prompt>"
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${Date.now()}`;
      await message.reply({
        body: `✅ | DALL-E 3: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error('dalle3 error:', error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ | Failed to generate DALL-E 3 image.");
    }
  }
};
