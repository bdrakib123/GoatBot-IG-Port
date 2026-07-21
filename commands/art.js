const axios = require("axios");

module.exports = {
  config: {
    name: "art",
    version: "1.0.0",
    author: "Neoaz 🐦",
    cooldown: 5,
    role: 0,
    description: "Generate artistic image from prompt",
    category: "ai-image",
    usage: "art <prompt>"
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent('artistic digital painting ' + prompt)}?nologo=true&seed=${Date.now()}`;
      await message.reply({
        body: `✅ | Generated Art: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error('art error:', error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ | Failed to generate art image.");
    }
  }
};
