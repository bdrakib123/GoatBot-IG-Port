const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "2.0.0",
    author: "Jisan",
    cooldown: 5,
    role: 0,
    description: "Search and download YouTube audio",
    category: "media",
    usage: "sing <song name>"
  },

  onStart: async function ({ message, args, event, api, commandName }) {
    const query = args.join(" ");
    if (!query) return message.reply("❌ Please provide a song name.\nExample: !sing Faded Alan Walker");

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      let searchResults = [];
      try {
        const search = await yts(query);
        if (search && search.videos && search.videos.length > 0) {
          searchResults = search.videos.slice(0, 6).map(v => ({
            title: v.title,
            url: v.url,
            duration: v.timestamp || `${Math.floor(v.seconds / 60)}:${v.seconds % 60}`,
            author: v.author?.name || 'YouTube'
          }));
        }
      } catch (_) {}

      if (searchResults.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ No songs found. Please try another query.");
      }

      let msg = "🎵 **Select a song to download (Reply with 1-6):**\n\n";
      searchResults.forEach((v, i) => {
        msg += `${i + 1}. ${v.title} [${v.duration}]\n`;
      });

      const sent = await message.reply({ body: msg.trim() });
      if (sent && sent.messageID) {
        global.GoatBot.onReply.set(sent.messageID, {
          commandName,
          author: event.senderID,
          results: searchResults
        });
      }
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Search error. Please try again.");
    }
  },

  onReply: async function ({ message, event, Reply, api }) {
    if (event.senderID !== Reply.author) return;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > Reply.results.length) return;

    const selected = Reply.results[choice - 1];
    api.unsendMessage(event.messageReply.messageID).catch(() => {});
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const tempPath = path.join(os.tmpdir(), `sing_${Date.now()}.mp3`);

    try {
      // Primary: Native ytdl-core stream download
      try {
        const stream = ytdl(selected.url, { filter: 'audioonly', quality: 'highestaudio' });
        const writer = fs.createWriteStream(tempPath);
        stream.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const stats = await fs.stat(tempPath);
        if (stats.size > 1000) {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          await message.reply({
            body: `🎵 ${selected.title}`,
            attachment: tempPath
          });
          setTimeout(() => fs.remove(tempPath).catch(() => {}), 30000);
          return;
        }
      } catch (_) {}

      // Fallback: Cobalt / Direct YouTube MP3 APIs
      const dlEndpoints = [
        `https://api.cobalt.tools/api/json`,
        `https://kaiz-apis.gleeze.com/api/ytdl?url=${encodeURIComponent(selected.url)}`
      ];

      for (const ep of dlEndpoints) {
        try {
          let audioUrl = '';
          if (ep.includes('cobalt')) {
            const cobRes = await axios.post(ep, { url: selected.url, downloadMode: 'audio' }, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 15000 });
            audioUrl = cobRes.data?.url;
          } else {
            const res = await axios.get(ep, { timeout: 15000 });
            audioUrl = res.data?.audio || res.data?.downloadUrl;
          }

          if (audioUrl) {
            api.setMessageReaction("✅", event.messageID, () => {}, true);
            await message.reply({
              body: `🎵 ${selected.title}`,
              attachment: audioUrl
            });
            return;
          }
        } catch (_) {}
      }

      throw new Error("Could not fetch audio stream");
    } catch (error) {
      console.error('sing error:', error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply(`❌ Download error: ${error.message}`);
    }
  }
};
