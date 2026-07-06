const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

module.exports = {
  config: {
    name: "say",
    version: "2.2",
    author: "Samir Œ & Jules",
    cooldown: 5,
    role: 0,
    category: "tts",
    description: "Convert text to voice with extreme-resilience fallback",
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

    const tempPath = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);

    try {
      const chunkSize = 200;
      const getChunks = (str, size) => {
          const chunks = [];
          for (let i = 0; i < str.length; i += size) {
              chunks.push(str.substring(i, i + size));
          }
          return chunks;
      };
      const finalChunks = getChunks(text, chunkSize);

      for (let i = 0; i < finalChunks.length; i++) {
        let response;
        let lastError;
        const encodedText = encodeURIComponent(finalChunks[i]);

        const services = [
            {
                name: "Google (tw-ob)",
                url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`
            },
            {
                name: "Google (gtx)",
                url: `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${lang}&client=gtx&q=${encodedText}`
            },
            {
                name: "Google (t-vn)",
                url: `https://translate.google.com.vn/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`
            }
        ];

        let success = false;
        for (const service of services) {
            try {
                response = await axios({
                    method: "get",
                    url: service.url,
                    responseType: "arraybuffer",
                    headers: {
                        "User-Agent": UA,
                        "Referer": "https://translate.google.com/",
                        "Accept": "*/*"
                    },
                    timeout: 10000
                });
                if (response.status === 200 && response.data.length > 0) {
                    success = true;
                    break;
                }
            } catch (e) {
                lastError = `${service.name}: ${e.response ? e.response.status : e.message}`;
            }
        }

        if (!success) {
            throw new Error(`TTS Conversion Failed. ${lastError}`);
        }

        await fs.appendFile(tempPath, Buffer.from(response.data));
      }

      const stats = await fs.stat(tempPath);
      if (stats.size === 0) throw new Error("Generated TTS file is empty");

      const stream = fs.createReadStream(tempPath);
      stream.name = 'tts.mp3';

      await message.reply({
        attachment: stream
      });

      setTimeout(() => fs.remove(tempPath).catch(() => {}), 30000);

    } catch (err) {
      console.error(err);
      message.reply(`❌ Error: ${err.message}`);
      if (fs.existsSync(tempPath)) fs.remove(tempPath).catch(() => {});
    }
  }
};
