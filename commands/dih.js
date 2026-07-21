const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "dih",
    version: "1.3.2",
    author: "Jules (Ported)",
    cooldown: 5,
    role: 0,
    description: "Measure your dih, grow it daily, battle friends!",
    category: "game",
    aliases: ["dihgrow", "dihtop", "dihattack", "dihstats", "dihloan", "dihpvp"]
  },

  async onStart({ args, message, event, usersData, threadsData, api, config, commandName }) {
    const { senderID, threadID } = event;

    // Resolve subcommand
    let command = "grow";
    const nameMap = {
      "dihgrow": "grow",
      "dihtop": "top",
      "dihattack": "attack",
      "dihpvp": "attack",
      "dihstats": "stats",
      "dihloan": "loan"
    };

    if (nameMap[commandName]) {
      command = nameMap[commandName];
    } else if (args[0]) {
      const sub = args[0].toLowerCase();
      const validSubs = ["grow", "top", "leaderboard", "attack", "battle", "fight", "pvp", "stats", "dotd", "loan", "import"];
      if (validSubs.includes(sub)) {
        command = sub;
        if (["leaderboard"].includes(command)) command = "top";
        if (["battle", "fight", "pvp"].includes(command)) command = "attack";
      }
    }

    const userData = await usersData.get(senderID);
    if (!userData.data) userData.data = {};
    if (!userData.data.dih) userData.data.dih = { length: 0, lastGrowth: 0, stats: { wins: 0, losses: 0, totalAttacks: 0 } };

    // Subcommand: GROW
    if (command === "grow") {
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;
      const lastGrowth = userData.data.dih.lastGrowth || 0;

      if (now - lastGrowth < cooldown) {
        const remaining = cooldown - (now - lastGrowth);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return message.reply(`Next attempt in ${hours}h ${minutes}m.`);
      }

      // Range -5 to 10 cm
      let growth = Math.floor(Math.random() * (10 - (-5) + 1)) + (-5);

      // Debt bonus: 0.1% of debt
      if (userData.data.dih.length < 0) {
        const debtBonus = Math.floor(Math.abs(userData.data.dih.length) * 0.001);
        growth += debtBonus;
      }

      userData.data.dih.length = (userData.data.dih.length || 0) + growth;
      userData.data.dih.lastGrowth = now;

      await usersData.set(senderID, { data: userData.data });

      const allUsers = await usersData.getAll();
      const threadData = await threadsData.get(threadID);
      const members = threadData.members || [];
      const memberIDs = members.map(m => String(m.userID));

      const topDihs = allUsers
        .filter(u => memberIDs.includes(String(u.userID)) && u.data?.dih?.length !== undefined)
        .sort((a, b) => b.data.dih.length - a.data.dih.length);

      let rank = topDihs.findIndex(u => String(u.userID) === String(senderID)) + 1;
      if (rank === 0 && memberIDs.length === 0) rank = 1; // Fallback for private chats or empty member list

      let msg = "";
      if (growth > 0) {
        msg = `Your dih 🍆 has grown by ${growth} cm and now it is ${userData.data.dih.length} cm long.`;
      } else if (growth < 0) {
        msg = `Oh no! Your dih 🍆 has shrunk by ${Math.abs(growth)} cm and now it is ${userData.data.dih.length} cm long.`;
      } else {
        msg = `Your dih 🍆 didn't change today. It is still ${userData.data.dih.length} cm long.`;
      }

      msg += `\nYour position in the top is ${rank}.\n\nNext attempt in 24h 0m.`;
      return message.reply(msg);

    // Subcommand: TOP
    } else if (command === "top") {
      const allUsers = await usersData.getAll();
      const threadData = await threadsData.get(threadID);
      const members = threadData.members || [];
      const memberIDs = members.map(m => String(m.userID));

      const topDihs = allUsers
        .filter(u => memberIDs.includes(String(u.userID)) && u.data?.dih?.length !== undefined)
        .sort((a, b) => b.data.dih.length - a.data.dih.length);

      if (topDihs.length === 0) return message.reply("No one has grown a dih in this thread yet!");

      let leaderboardMsg = "🏆 Dih Leaderboard\n\n";
      const displayCount = Math.min(topDihs.length, 100);
      for (let i = 0; i < displayCount; i++) {
        const u = topDihs[i];
        const name = u.name || "Unknown";
        const length = u.data.dih.length;
        const prefix = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        const isSender = String(u.userID) === String(senderID) ? " (You)" : "";
        leaderboardMsg += `${prefix} ${name}: ${length} cm${isSender}\n`;
      }

      return message.reply(leaderboardMsg);

    // Subcommand: ATTACK
    } else if (command === "attack") {
      let targetID;

      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        const mentions = Object.keys(event.mentions);
        targetID = mentions.find(id => id !== senderID) || mentions[0];
      }
      else {
        const potentialID = args.find((a, i) => /^\d+$/.test(a) && (i > 0 || nameMap[commandName]));
        if (potentialID) {
            targetID = potentialID;
        } else {
            const lastArg = args[args.length - 1];
            if (lastArg && lastArg.startsWith("@")) {
                const username = lastArg.replace("@", "");
                try {
                    const info = await api.getUserInfoByUsername(username);
                    if (info) targetID = info.userID || info.userId;
                } catch (e) {}
            }
        }
      }

      if (!targetID || String(targetID) === String(senderID)) {
        return message.reply("Please mention or reply to someone to attack!");
      }

      let targetData;
      try {
        targetData = await usersData.get(targetID);
      } catch (e) {
        targetData = { name: "Opponent", data: {} };
      }

      if (!targetData) targetData = { name: "Opponent", data: {} };
      if (!targetData.data) targetData.data = {};
      if (!targetData.data.dih) {
        targetData.data.dih = { length: Math.floor(Math.random() * 8) + 5, lastGrowth: 0, stats: { wins: 0, losses: 0, totalAttacks: 0 } };
        await usersData.set(targetID, { data: targetData.data });
      }

      if (userData.data.dih.length <= 0) {
        return message.reply("You need a positive dih length to attack someone!");
      }

      let bet = 0;
      const potentialBet = args.find(a => /^\d+$/.test(a) && a !== String(targetID));
      if (potentialBet) bet = parseInt(potentialBet);

      if (bet > 0) {
        if (bet > userData.data.dih.length) {
          return message.reply(`You can't bet more than your dih length (${userData.data.dih.length} cm)!`);
        }
        if (bet > targetData.data.dih.length) {
          return message.reply(`Your opponent's dih is only ${targetData.data.dih.length} cm. You can't bet more than that!`);
        }
      }

      const stolen = bet > 0 ? bet : Math.floor(Math.random() * 10) + 1;
      const winChance = 0.5 + (userData.data.dih.length - targetData.data.dih.length) / 1000;
      const isWin = Math.random() < Math.min(0.9, Math.max(0.1, winChance));

      userData.data.dih.stats.totalAttacks++;
      if (isWin) {
        userData.data.dih.length += stolen;
        targetData.data.dih.length -= stolen;
        userData.data.dih.stats.wins++;
        targetData.data.dih.stats.losses = (targetData.data.dih.stats.losses || 0) + 1;

        await usersData.set(senderID, { data: userData.data });
        await usersData.set(targetID, { data: targetData.data });

        return message.reply(`⚔️ Victory! You dominated ${targetData.name || "Unknown"} and took ${stolen} cm of their dih. Your dih 🍆 is now ${userData.data.dih.length} cm.`);
      } else {
        userData.data.dih.length -= stolen;
        targetData.data.dih.length += stolen;
        userData.data.dih.stats.losses++;
        targetData.data.dih.stats.wins = (targetData.data.dih.stats.wins || 0) + 1;

        await usersData.set(senderID, { data: userData.data });
        await usersData.set(targetID, { data: targetData.data });

        return message.reply(`⚔️ Defeat! ${targetData.name || "Unknown"} was too strong and took ${stolen} cm from your dih. Your dih 🍆 is now ${userData.data.dih.length} cm.`);
      }

    } else if (command === "loan") {
      if (userData.data.dih.length >= 0) {
        return message.reply("You don't need a loan! Your dih 🍆 is doing just fine.");
      }
      userData.data.dih.length = 0;
      await usersData.set(senderID, { data: userData.data });
      return message.reply("🏦 Your debt has been cleared. Your dih 🍆 is now back to 0 cm.");

    } else if (command === "import") {
        return message.reply("📦 Import functionality is currently in development. We are working on supporting imports from other bots! Summing lengths will be supported.");

    } else if (command === "stats") {
      const stats = userData.data.dih;
      const winRate = stats.stats.totalAttacks > 0 ? ((stats.stats.wins / stats.stats.totalAttacks) * 100).toFixed(1) : 0;

      const statsMsg = `📊 Your Dih Stats\n\n` +
        `📏 Length: ${stats.length} cm\n` +
        `⚔️ Wins: ${stats.stats.wins}\n` +
        `💀 Losses: ${stats.stats.losses}\n` +
        `🔥 Total Attacks: ${stats.stats.totalAttacks}\n` +
        `📈 Win Rate: ${winRate}%`;

      return message.reply(statsMsg);

    } else if (command === "dotd") {
      const tz = config.TIMEZONE || "Asia/Dhaka";
      const today = moment.tz(tz).format("DD/MM/YYYY");
      const threadData = await threadsData.get(threadID);

      if (!threadData.data) threadData.data = {};

      if (threadData.data.lastDOTD === today) {
        const winner = await usersData.get(threadData.data.dotdWinnerID);
        return message.reply(`Today's Dih of the Day belongs to ${winner.name || "Unknown"}! They already received a bonus of ${threadData.data.dotdBonus} cm.`);
      }

      const allUsers = await usersData.getAll();
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const activeMemberIDs = allUsers
        .filter(u => u.data?.dih?.lastGrowth > oneWeekAgo)
        .map(u => String(u.userID));

      const members = (threadData.members || []).filter(m => m.inGroup && activeMemberIDs.includes(String(m.userID)));

      if (members.length === 0) return message.reply("No active players (who grew their dih in the last week) found for Dih of the Day!");

      const luckyMember = members[Math.floor(Math.random() * members.length)];
      const bonus = Math.floor(Math.random() * 15) + 5;

      const luckyUserData = await usersData.get(luckyMember.userID);
      if (!luckyUserData.data) luckyUserData.data = {};
      if (!luckyUserData.data.dih) luckyUserData.data.dih = { length: 0, lastGrowth: 0, stats: { wins: 0, losses: 0, totalAttacks: 0 } };

      luckyUserData.data.dih.length += bonus;
      await usersData.set(luckyMember.userID, { data: luckyUserData.data });

      threadData.data.lastDOTD = today;
      threadData.data.dotdWinnerID = luckyMember.userID;
      threadData.data.dotdBonus = bonus;
      await threadsData.set(threadID, { data: threadData.data });

      return message.reply(`🎉 Congratulations ${luckyUserData.name || "Unknown"}! Your dih was chosen as the Dih of the Day!\n\n🎁 You received a bonus of ${bonus} cm! Current length: ${luckyUserData.data.dih.length} cm.`);

    } else {
      return message.reply("Invalid subcommand! Use: grow, top, attack, stats, dotd, loan, import");
    }
  }
};
