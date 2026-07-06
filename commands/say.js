const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";

module.exports = {
  config: {
    name: "say",
    aliases: ["sy", "tts"],
    version: "4.6",
    author: "Farhan, Milan & Jules",
    cooldown: 5,
    role: 0,
    category: "Fun",
    description: "Speak text with anime, celebrity, or random voices",
    usage: "say <voice> <text> or say <text> | <lang_code>"
  },

  onStart: async function ({ api, args, message, event }) {
    if (!args[0]) return message.reply("⚠️ Please enter text or a voice with text.");

    let voiceOrText = args[0].toLowerCase();
    let text = args.slice(1).join(" ");
    let langMode = false;

    // Support for legacy "text | lang" format
    if (args.join(" ").includes("|")) {
        const splitArgs = args.join(" ").split("|").map(arg => arg.trim());
        text = splitArgs[0];
        voiceOrText = splitArgs[1] || 'en';
        langMode = true;
    }
    // Handle single word text (random voice)
    else if (!text) {
        text = voiceOrText;
        voiceOrText = "random";
    }

    try {
      const characterVoices = {
        goku: "Joey", vegeta: "Matthew", naruto: "Justin", sasuke: "Russell", luffy: "Arthur",
        zoro: "Brian", sanji: "Joey", gojo: "George", itachi: "Matthew", tanjiro: "Kevin",
        nezuko: "Kimberly", mikasa: "Emma", eren: "Joey", levi: "Russell", saitama: "Brian",
        bulma: "Salli", hinata: "Kimberly", sakura: "Emma", nami: "Joanna", rem: "Salli",
        zero_two: "Kimberly", trump: "Brian", obama: "Matthew", elon: "Joey", musk: "Joey",
        modi: "Russell", biden: "Brian", putin: "Matthew", taylor: "Salli", selena: "Kimberly",
        billgates: "George", drake: "George", messi: "Arthur", ronaldo: "Matthew",
        batman: "Brian", spiderman: "Joey", spongebob: "Ivy", pikachu: "Emma", joker: "Russell", thanos: "Brian"
      };

      if (voiceOrText === "random") {
        const availableVoices = Object.keys(characterVoices);
        voiceOrText = availableVoices[Math.floor(Math.random() * availableVoices.length)];
        message.reply(`🎲 Random voice selected: ${voiceOrText.toUpperCase()}`);
      }

      const tempPath = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);
      let audioUrl;
      let isHuggingFace = false;

      // Tiered logic: Character -> HuggingFace -> Google TTS (if langMode) -> StreamElements Custom
      if (characterVoices[voiceOrText]) {
        audioUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${characterVoices[voiceOrText]}&text=${encodeURIComponent(text)}`;
      } else if (voiceOrText.startsWith("hf:")) {
        isHuggingFace = true;
      } else if (langMode || voiceOrText.length <= 3) {
        // Fallback to Google TTS logic for short voice names (assumed language codes)
        audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${voiceOrText}&client=tw-ob&q=${encodeURIComponent(text)}`;
      } else {
        audioUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voiceOrText)}&text=${encodeURIComponent(text)}`;
      }

      if (isHuggingFace) {
        const model = voiceOrText.replace("hf:", "");
        const res = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          { inputs: text },
          { headers: { "Accept": "audio/mpeg" }, responseType: "arraybuffer", timeout: 30000 }
        );
        await fs.writeFile(tempPath, Buffer.from(res.data));
      } else {
        // Use multi-tier Google fallback if the first attempt fails and it looks like a language
        try {
            const res = await axios({
                method: "get",
                url: audioUrl,
                responseType: "arraybuffer",
                headers: { "User-Agent": UA, "Referer": "https://translate.google.com/" },
                timeout: 15000
            });
            await fs.writeFile(tempPath, Buffer.from(res.data));
        } catch (e) {
            if (langMode || voiceOrText.length <= 3) {
                const fallbackUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${voiceOrText}&client=gtx&q=${encodeURIComponent(text)}`;
                const res = await axios({
                    method: "get",
                    url: fallbackUrl,
                    responseType: "arraybuffer",
                    headers: { "User-Agent": UA },
                    timeout: 15000
                });
                await fs.writeFile(tempPath, Buffer.from(res.data));
            } else throw e;
        }
      }

      const stats = await fs.stat(tempPath);
      if (stats.size === 0) throw new Error("Generated audio is empty");

      const stream = fs.createReadStream(tempPath);
      stream.name = 'say.mp3';

      await message.reply({
        body: `🎙️ ${voiceOrText.toUpperCase()} says:`,
        attachment: stream
      });

      setTimeout(() => fs.remove(tempPath).catch(() => {}), 30000);

    } catch (err) {
      console.error(err);
      message.reply(`❌ Error: ${err.message || "Failed to generate voice."}`);
    }
  }
};
