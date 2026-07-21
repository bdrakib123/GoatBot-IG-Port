const axios = require("axios");

module.exports = {
  config: {
    name: "texttoimage",
    aliases: ["midjourney", "openjourney", "text2image"],
    version: "1.3",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Create image from text using Midjourney style",
    category: "ai-image",
    usage: "texttoimage <prompt>"
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("⚠ Please enter a prompt");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent('midjourney style ' + prompt)}?nologo=true&seed=${Date.now()}`;
      await message.reply({
        body: `✅ | Midjourney Style: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error('texttoimage error:', err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("! An error has occurred, please try again later.");
    }
  }
};
