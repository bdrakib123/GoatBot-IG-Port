const axios = require("axios");

module.exports = {
  config: {
    name: "genx",
    version: "1.0.0",
    author: "Neoaz 🐦",
    cooldown: 5,
    role: 0,
    description: "Generate image using GenX",
    category: "ai-image",
    usage: "genx <prompt>"
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${Date.now()}`;
      await message.reply({
        body: `✅ | GenX: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error('genx error:', error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ | Failed to generate GenX image.");
    }
  }
};
