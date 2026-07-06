const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";

module.exports = {
  config: {
    name: "say",
    version: "1.8",
    author: "Samir Œ",
    cooldown: 5,
    role: 0,
    category: "tts",
    description: "Convert text to voice with language support",
    usage: "say <text> | <lang_code>"
  },

  onStart: async function ({ api, args, message, event }) {
    let text;
    let lang = 'en';

    if (event.type === "message_reply") {
      text = event.messageReply.body;
      if (args.length > 0) lang = args[0];
    } else {
      if (args && args.length > 0) {
        if (args.join(" ").includes("|")) {
          const splitArgs = args.join(" ").split("|").map(arg => arg.trim());
          text = splitArgs[0];
          lang = splitArgs[1] || 'en';
        } else {
          text = args.join(" ");
        }
      }
    }

    if (!text) {
      return message.reply(`Please provide some text or reply to a message.`);
    }

    const tempPath = path.join(process.cwd(), 'temp', `tts_${Date.now()}.mp3`);
    await fs.ensureDir(path.dirname(tempPath));

    try {
      const chunkSize = 150;
      const getChunks = (str, size) => {
          const res = [];
          for (let i = 0; i < str.length; i += size) {
              res.push(str.substring(i, i + size));
          }
          return res;
      };
      const finalChunks = getChunks(text, chunkSize);

      for (let i = 0; i < finalChunks.length; i++) {
        const response = await axios({
          method: "get",
          url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(finalChunks[i])}`,
          responseType: "arraybuffer",
          headers: {
              "User-Agent": UA
          }
        });
        await fs.appendFile(tempPath, Buffer.from(response.data));
      }

      // Check if file is empty
      const stats = await fs.stat(tempPath);
      if (stats.size === 0) {
          throw new Error("Generated TTS file is empty");
      }

      await message.reply({
        attachment: tempPath
      });

      // Cleanup - InstagramBot.js might also try to cleanup if we pass it as a path and it's in temp
      // But we'll do it ourselves to be safe after a delay
      setTimeout(() => fs.remove(tempPath).catch(() => {}), 60000);

    } catch (err) {
      console.error(err);
      message.reply("An error occurred during TTS conversion.");
      if (fs.existsSync(tempPath)) fs.remove(tempPath).catch(() => {});
    }
  }
};
