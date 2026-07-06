<div align="center">

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!--           ANIME HEADER — famous anime girls              -->
<!-- ╚══════════════════════════════════════════════════════╝ -->

<img src="https://user-images.githubusercontent.com/74038190/213910845-af37a709-8995-40d6-be59-724526e3c3d7.gif" width="140" alt="Anime Girl 1"/>
<img src="https://user-images.githubusercontent.com/74038190/229223263-cf2e4b07-2615-4f87-9c38-e37600f8381a.gif" width="200" alt="Zero Two — Darling in the FranXX"/>
<img src="https://user-images.githubusercontent.com/74038190/226127923-0e8b7792-7b3c-462b-951b-63c96ba1a5af.gif" width="200" alt="Anime Girl 3"/>
<img src="https://user-images.githubusercontent.com/74038190/212749447-bfb7e725-6987-49d9-ae85-2015e3e7cc41.gif" width="140" alt="Anime Coder Girl"/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,100:db2777&height=200&section=header&text=GoatBot-IG&fontSize=70&fontColor=ffffff&animation=twinkling&fontAlignY=38&desc=Professional%20Instagram%20Bot%20%7C%20MQTT%20Powered&descAlignY=60&descSize=18" width="100%"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Instagram](https://img.shields.io/badge/Instagram-DM%20Bot-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com)
[![MQTT](https://img.shields.io/badge/MQTT-Real%20Time-660066?style=for-the-badge&logo=mqtt&logoColor=white)](https://mqtt.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-ff69b4?style=for-the-badge)]()
[![Commands](https://img.shields.io/badge/Commands-21+-9b59b6?style=for-the-badge)]()
[![Dashboard](https://img.shields.io/badge/Dashboard-Live%20Web%20UI-00b4d8?style=for-the-badge)]()

<br/>

>  *A powerful Instagram Direct Message bot with a live web dashboard — built for speed, style, and extensibility.*

</div>

---

##  Table of Contents

- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [📦 Requirements](#-requirements)
- [🚀 Installation](#-installation)
- [🍪 account.txt — Cookie Setup](#-accounttxt--cookie-setup)
- [⚙️ Configuration](#️-configuration)
- [🤖 Commands](#-commands)
- [📅 Events](#-events)
- [🗄️ Database](#️-database)
- [📊 Dashboard](#-dashboard)
- [🗂️ Project Structure](#️-project-structure)
- [🛠️ Adding Custom Commands](#️-adding-custom-commands)
- [🧩 Adding Custom Events](#-adding-custom-events)
- [🔐 Roles & Permissions](#-roles--permissions)
- [🌐 Deploying (Replit)](#-deploying-replit)
- [❓ FAQ & Troubleshooting](#-faq--troubleshooting)
- [💖 Credits](#-credits)

---

## ✨ Features

<div align="center">

| Feature | Description |
|:-------:|:------------|
| ⚡ **MQTT Real-Time** | Connects to Instagram via native MQTT — no polling, instant messages |
| 🎮 **21+ Commands** | Games, AI, utility, admin, moderation — all ready to go |
| 📊 **Live Dashboard** | Beautiful dark web UI — monitor bot stats, users, threads, logs in real time |
| 🍪 **Cookie Login** | Paste your Netscape cookies into `account.txt` and go |
| 🔐 **Role System** | 5-tier permission system — user → mod → admin → owner → dev |
| 🗄️ **JSON Database** | Zero-setup persistent storage — users, threads, economy |
| 🔔 **7 Event Handlers** | Welcome, leave, reactions, errors, ready — everything covered |
| 🔄 **Auto-Save** | Database auto-saves every minute — no data loss |
| 🌐 **Per-Thread Prefix** | Each group can have its own custom command prefix |
| 🤖 **AI Command** | Built-in GPT-powered chat via free API |
| ⏰ **Reminders** | Set time-based reminders — checked every 30 seconds |
| 🛡️ **Spam Protection** | Auto-bans spammers, configurable thresholds |
| 📜 **Robust Logging** | Winston-powered daily rotation and webhook support |
| 🕵️ **Anti-Ban** | Human-like delays and typing indicators |
| 🤖 **AI Fallback** | Automatically routes unknown commands to AI |
| 🐐 **GoatV2 Core** | Fully ported core system and lifecycle support |
| 💳 **Advanced Bank** | Complete banking system with ATM cards |
| 📈 **Rank System** | Experience and level system with rank cards |

</div>

---

## 📸 Screenshots

### 📊 Live Dashboard — Overview
<div align="center">
<img src="assets/screenshots/dashboard-overview.jpg" width="900" alt="Dashboard Overview"/>
</div>

### 🖥️ Dashboard Tabs
The dashboard has **5 live tabs** — all auto-refresh every 15 seconds:

| Tab | What It Shows |
|-----|--------------|
| **Overview** | Bot status, uptime, memory, commands loaded, recent activity |
| **Groups** | All Instagram chats — name, members, thread ID, view full member list |
| **Users** | All users in DB — messages, commands, balance, ban status |
| **Commands** | All loaded commands — category, role requirement, cooldown, aliases |
| **Logs** | Last 300 log lines — filterable by INFO / WARN / ERROR / DEBUG |

---

## 📦 Requirements

- **Node.js** v18 or v20 (v20 recommended)
- **npm** or **pnpm**
- An **Instagram account** (cookies from browser)
- Internet connection

---

## 🚀 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Gtajisan/GoatBot-IG-Port.git
cd GoatBot-IG-Port
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Add your Instagram cookies

See the **[🍪 Cookie Setup](#-accounttxt--cookie-setup)** section below.

### 4️⃣ Configure the bot

Edit `config/default.json` — set your admin UID, prefix, timezone, etc.
See **[⚙️ Configuration](#️-configuration)**.

### 5️⃣ Start the bot

```bash
node index.js
```

The bot will:
1. Read cookies from `account.txt`
2. Login to Instagram via MQTT
3. Load all 21 commands and 7 events
4. Start the live dashboard at **http://localhost:3000**
5. Begin listening for messages in real time ✅

---

## 🍪 account.txt — Cookie Setup
### 🍪 Enhanced Cookie Login System
The bot now supports an improved cookie-based login system for better stability:

- **Dual Format Support:** Works with standard **Netscape HTTP Cookie File** format (from browser extensions) and **JSON-stringified** session objects.
- **Auto-Persistence:** The bot automatically saves and updates the session state in `account.txt` after successful login, reducing the need for repeated manual cookie exports.
- **Library Implementation:** Built on the `@neoaz07/nkxica` library, specifically designed for Instagram's MQTT and chat protocol.
- **Smart Fallback:** Attempts to load existing sessions from `account.txt` first. If expired or missing, it will automatically attempt a fresh login using credentials from your configuration.


This file holds your Instagram session cookies in **Netscape format**.  
This is the same format used by browsers — no manual formatting needed if you use a cookie exporter extension.

### 📄 File Location
```
account.txt   ← root of the project
```

### 📋 Format (Netscape Cookie Format)

```
# Netscape HTTP Cookie File
# This is the cookie file — paste your Instagram cookies below
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      ps_n    1
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      datr    XXXXXXXXXXXXXXXXXXXXXXXX
.instagram.com  TRUE    /       TRUE    1999999999      ds_user_id      YOUR_USER_ID_HERE
.instagram.com  TRUE    /       TRUE    1999999999      csrftoken       YOUR_CSRF_TOKEN_HERE
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      ig_did  XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      sessionid       YOUR_USER_ID%3AYOUR_SESSION_TOKEN
.instagram.com  TRUE    /       TRUE    1999999999      mid     XXXXXXXXXXXXXXXXXXXXXXXX
```

> ⚠️ **Important:** Columns are separated by **TAB characters** (`\t`), not spaces.

---

### 🛠️ How to Get Your Cookies (Step by Step)

#### Method 1 — Browser Extension (Recommended ✅)

1. Install **"Cookie-Editor"** extension:
   - [Chrome](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

2. Go to **https://www.instagram.com** and log in to your bot account

3. Click the Cookie-Editor extension icon

4. Click **"Export"** → select **"Netscape"** format

5. Copy the entire output

6. Paste it into `account.txt` (replace everything)

7. Save the file and start the bot

#### Method 2 — DevTools (Manual)

1. Open Instagram in browser, log in
2. Press `F12` → go to **Application** tab → **Cookies** → `https://www.instagram.com`
3. Copy these cookies and build the Netscape format:

| Cookie Name | Where to Find |
|-------------|--------------|
| `sessionid` | Application → Cookies |
| `ds_user_id` | Application → Cookies |
| `csrftoken` | Application → Cookies |
| `datr` | Application → Cookies |
| `ig_did` | Application → Cookies |
| `mid` | Application → Cookies |

---

### ✅ Cookie Validation

The bot automatically validates `account.txt` on startup:
- ✅ Valid → logs in immediately
- ❌ Missing `sessionid` → shows error with instructions
- 🔄 Expired → re-login required (refresh cookies from browser)

---

### 🔐 Security Tips

- **Never share your `account.txt`** — it gives full access to your Instagram account
- Use a **dedicated bot account**, not your personal Instagram
- Add `account.txt` to `.gitignore` before pushing to GitHub:
  ```
  echo "account.txt" >> .gitignore
  ```

---


### ⚙️ Technical Environment
- **Node.js:** Requires version **18 or higher**.
- **Protocol:** Uses the **Instagram MQTT (ICA)** protocol for real-time messaging.
- **Engine:** Powered by the GoatBot V2 architecture ported to Instagram.
- **Library:** Deep integration with `@neoaz07/nkxica` for core API interactions.

### ❓ Troubleshooting TTS (say command)
If the `say` command fails:
1. Ensure your bot server has internet access to Google's translation services.
2. Check if the `temp` or system temporary directory is writable.
3. If using on Render/Replit, ensures dependencies are correctly installed.
## ⚙️ Configuration

Edit **`config/default.json`**:

```jsonc
{
  "prefix": "!",                    // Command prefix — can be !, /, ., etc.
  "noPrefix": true,                 // Allow no-prefix commands (ping, hi, etc.)
  "nickNameBot": "GoatBot-IG",      // Bot display name

  "adminBot": ["YOUR_UID_HERE"],    // Bot admin UIDs — gets admin role automatically
  "premiumUsers": [],               // Premium user UIDs — gets premium role
  "devUsers": ["YOUR_UID_HERE"],    // Developer UIDs — full access including shell

  "language": "en",                 // Language: "en", "vi", "ar", etc.
  "timeZone": "Asia/Dhaka",         // Your timezone for !time command

  "instagramAccount": {
    "email": "",                    // Optional: email for password login
    "password": "",                 // Optional: password for password login
    "proxy": null                   // Optional: "http://user:pass@host:port"
  },

  "spamProtection": {
    "commandThreshold": 8,          // Max commands per timeWindow before spam-ban
    "timeWindow": 10,               // Seconds to track
    "banDuration": 24               // Hours to ban spammer
  },

  "database": {
    "autoSave": true,               // Auto-save database
    "saveIntervalMinutes": 1        // How often to save (minutes)
  },

  "autoUptime": {
    "enable": true,                 // Ping self to prevent Replit sleep
    "timeInterval": 180             // Ping every N seconds
  }
}
```

### 🔑 Getting Your UID

Send `!uid` to the bot after it starts, or use the `!uid @username` command.  
Your UID will be shown in the response — paste it into `adminBot` and `devUsers`.

---

## 🤖 Commands

> Default prefix: `!`   All commands also work without prefix if `noPrefix: true`.

### 🔵 System Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `help` | `!help [command]` | List all commands or get info about one | Everyone |
| `ping` | `!ping` | Check bot response time in ms | Everyone |
| `info` | `!info` | Show bot information, uptime, stats | Everyone |
| `prefix` | `!prefix [new]` / `!prefix reset` | View or change this chat's prefix | Everyone |

### 🎮 Game Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `dice` | `!dice [sides]` | Roll a dice (default 6-sided) | Everyone |
| `coinflip` | `!coinflip` | Flip a coin — heads or tails | Everyone |
| `rps` | `!rps <rock\|paper\|scissors>` | Play Rock Paper Scissors vs bot | Everyone |

### 🎉 Fun Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `choose` | `!choose opt1 \| opt2 \| opt3` | Pick randomly between your options | Everyone |
| `quote` | `!quote` | Get a random inspirational quote | Everyone |

### 🤖 AI Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `ai` | `!ai <question>` | Ask AI anything — powered by free API | Everyone |

### 📊 Info Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `stats` | `!stats` | View your personal stats and bot stats | Everyone |
| `userinfo` | `!userinfo [username]` | Get info about any Instagram user | Everyone |
| `uid` | `!uid [username]` | Get your UID or resolve any username | Everyone |
| `time` | `!time` | Show current time/date in configured timezone | Everyone |

### 🛠️ Utility Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `remind` | `!remind 5m Drink water` | Set a timed reminder | Everyone |

### 🔧 Admin Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `admin` | `!admin <add\|remove\|list> [uid]` | Manage thread admins | Thread Admin |
| `echo` | `!echo <text>` | Make bot say something | Bot Admin |
| `unsend` | `!unsend` | Delete the bot's last message | Bot Admin |
| `thread` | `!thread <info\|ban\|unban\|prefix>` | Thread management tools | Bot Admin |

### 👑 Owner / Dev Commands

| Command | Usage | Description | Role |
|---------|-------|-------------|------|
| `restart` | `!restart` | Restart the bot process | Developer |
| `shell` | `!shell <command>` | Execute shell commands on the server | Developer |

---

### ⏱️ Reminder Time Formats

```
!remind 30s  Check the oven
!remind 5m   Drink water
!remind 2h   Call mom
!remind 1d   Submit homework
```

---

## 📅 Events

Events are automatic handlers — no command needed. They fire on their own.

| Event | Trigger | Action |
|-------|---------|--------|
| `ready` | Bot starts up | Logs startup success, sets bot status |
| `message` | Any DM received | Routes to command handler |
| `message_reaction` | Someone reacts to a message | Logs reaction, can be extended |
| `bot_added` | Bot added to a group | Sends welcome message to the group |
| `gc_join` | Member joins a group | Sends welcome message to new member |
| `gc_leave` | Member leaves a group | Sends goodbye message |
| `error` | Any unhandled error | Logs and attempts graceful recovery |

---

## 🗄️ Database

GoatBot-IG uses a **JSON file database** — zero setup, instant start.

### 📂 Location
```
storage/
└── data/
    └── bot.json      ← all data stored here
```

### 🏗️ Database Structure

```json
{
  "users": {
    "29952506516": {
      "name": "username",
      "uid": "29952506516",
      "messageCount": 42,
      "commandCount": 10,
      "balance": 500,
      "exp": 0,
      "role": 4,
      "banned": false,
      "banReason": null,
      "reminders": [],
      "firstSeen": "2025-01-01T00:00:00.000Z",
      "lastSeen": "2025-01-02T00:00:00.000Z"
    }
  },
  "threads": {
    "340282366841710301281153310980469410821": {
      "threadID": "340282...",
      "name": "Group Chat Name",
      "prefix": "!",
      "bannedMembers": [],
      "adminMembers": [],
      "isGroup": true,
      "memberCount": 5,
      "messageCount": 100,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z"
    }
  },
  "globalStats": {
    "totalCommands": 0,
    "totalMessages": 0
  },
  "processedMessages": []
}
```

### 📋 User Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Instagram User ID |
| `name` | string | Display name |
| `messageCount` | number | Total messages sent to bot |
| `commandCount` | number | Total commands used |
| `balance` | number | In-bot economy balance |
| `exp` | number | Experience points |
| `role` | 0–4 | Permission level (see Roles section) |
| `banned` | boolean | Whether user is banned from bot |
| `reminders` | array | Pending reminder list |
| `firstSeen` | ISO date | When user first messaged bot |
| `lastSeen` | ISO date | Last activity timestamp |

### 📋 Thread Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `threadID` | string | Instagram thread/chat ID |
| `name` | string | Group name (or DM) |
| `prefix` | string | This chat's custom command prefix |
| `bannedMembers` | array | UIDs banned in this thread |
| `adminMembers` | array | UIDs with thread admin role |
| `isGroup` | boolean | True if group chat, false if DM |
| `memberCount` | number | Number of members |
| `messageCount` | number | Total messages processed |

### 💾 Auto-Save

The database auto-saves every **1 minute** by default.  
Change the interval in `config/default.json`:
```json
"database": {
  "autoSave": true,
  "saveIntervalMinutes": 5
}
```

---

## 📊 Dashboard

GoatBot-IG includes a **live web dashboard** accessible from any browser.

### 🌐 Access
```
http://localhost:3000
```
Or via Replit preview at your `.replit.dev` URL.

### 📑 Dashboard Pages

#### Overview Tab
- Bot online/offline status with pulse indicator
- Uptime counter (live)
- Total commands used (all time)
- Users in database
- Memory usage with progress bar
- Commands loaded, Events loaded, Prefix, Node.js version
- Bot information table
- Recent message activity feed (last 20 events)

#### Groups Tab
- All Instagram threads fetched from inbox
- Search by name or thread ID
- Shows: thread name, type (Group/DM), member count
- Click **View** → see full member list with UID, username, admin badge

#### Users Tab
- All users stored in database
- Search by name or UID
- Shows: message count, command count, balance, first seen / last seen, ban status

#### Commands Tab
- All 21 commands organized by category
- Shows: command name, description, usage syntax, role requirement, cooldown
- Category filter chips (AI, System, Game, Utility, Admin, Owner)

#### Logs Tab
- Last 300 log lines from `storage/logs/combined.log`
- Filter by level: INFO / WARN / ERROR / DEBUG
- Auto-refresh toggle (updates every 3 seconds)
- Color-coded by severity

### 🔄 Auto-Refresh
The dashboard automatically refreshes data every **15 seconds** without reloading the page.

### 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves dashboard HTML |
| `/api/status` | GET | Bot status, stats, uptime, memory |
| `/api/threads` | GET | All threads from Instagram inbox |
| `/api/thread/:id` | GET | Specific thread info + members |
| `/api/users` | GET | All users from database |
| `/api/commands` | GET | All loaded commands + metadata |
| `/api/logs` | GET | Last 300 log lines |

---

## 🗂️ Project Structure

```
GoatBot-IG-Port/
│
├── index.js                    # Entry point — bootstraps everything
│
├── account.txt                 # 🍪 Your Instagram cookies (Netscape format)
├── config/
│   ├── index.js                # Config loader (reads default.json + env vars)
│   └── default.json            # All bot settings
│
├── bot/
│   └── InstagramBot.js         # Core bot class — login, listen, dashboard, handlers
│
├── commands/                   # 📁 21 command files
│   ├── ai.js                   # AI chat command
│   ├── help.js                 # Help command
│   ├── ping.js                 # Ping command
│   ├── admin.js                # Admin management
│   ├── shell.js                # Shell execution (dev only)
│   └── ...                     # 16 more commands
│
├── events/                     # 📁 7 event handler files
│   ├── ready.js                # On bot start
│   ├── message.js              # On message received
│   ├── bot_added.js            # On bot added to group
│   ├── gc_join.js              # On member join
│   ├── gc_leave.js             # On member leave
│   ├── message_reaction.js     # On message reaction
│   └── error.js                # On error
│
├── utils/
│   ├── logger.js               # Winston logger (file + console)
│   ├── database.js             # JSON database manager
│   ├── commandLoader.js        # Loads all commands from /commands/
│   ├── eventLoader.js          # Loads all events from /events/
│   ├── permissions.js          # Role/permission checker
│   ├── banner.js               # ASCII art startup banner
│   └── moderation.js           # Spam detection, ban helpers
│
├── dashboard/
│   └── index.html              # Full dashboard SPA (served at port 3000)
│
├── storage/
│   ├── data/
│   │   └── bot.json            # 🗄️ All bot data (users, threads, stats)
│   └── logs/
│       ├── combined.log        # All log levels
│       └── error.log           # Error-only log
│
├── assets/
│   └── screenshots/
│       └── dashboard-overview.jpg
│
├── package.json
└── README.md
```

---

## 🛠️ Adding Custom Commands

Create a new file in `commands/` — e.g. `commands/greet.js`:

```javascript
module.exports = {
  config: {
    name: "greet",                          // Command name (trigger: !greet)
    aliases: ["hello", "hi"],               // Alternative names
    description: "Greet someone warmly",    // Shows in !help
    usage: "greet [name]",                  // Usage hint
    category: "fun",                        // Category for !help grouping
    role: 0,                                // 0=everyone, 1=mod, 2=admin, 4=dev
    cooldown: 3,                            // Seconds between uses
    noPrefix: true                          // Works without prefix too
  },

  async execute({ api, event, args, db, config }) {
    const name = args.join(" ") || "friend";
    await api.sendMessage(`👋 Hello, ${name}! Hope you're doing great! 🌸`, event.threadID);
  }
};
```

The bot **auto-loads** new commands on next start — no registration needed.

### 📦 Available `execute` Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `api` | object | Instagram API — `sendMessage`, `unsendMessage`, etc. |
| `event` | object | Full message event (threadID, senderID, body, etc.) |
| `args` | string[] | Command arguments (text after command name) |
| `db` | object | Database — `getUser()`, `getThread()`, `updateUser()`, etc. |
| `config` | object | Bot config values |
| `prefix` | string | Current thread's prefix |
| `bot` | object | Bot instance reference |

---

## 🧩 Adding Custom Events

Create a new file in `events/` — e.g. `events/typing.js`:

```javascript
module.exports = {
  config: {
    name: "typ",                // Instagram event type to listen for
    description: "User is typing"
  },

  async execute({ api, event, db }) {
    // event.type === "typ" here
    // event.isTyping, event.threadID, event.senderID available
    console.log(`${event.senderID} is typing in ${event.threadID}`);
  }
};
```

Auto-loaded on next restart.

---

## 🔐 Roles & Permissions

GoatBot-IG uses a **5-tier role system**:

| Role | Level | Who Has It | Can Do |
|------|-------|-----------|--------|
| **User** | 0 | Everyone | Run public commands |
| **Moderator** | 1 | Assigned per thread | Moderate thread members |
| **Admin** | 2 | Set in config / `!admin add` | Thread management, echo, unsend |
| **Premium** | 3 | Set in `premiumUsers` config | Premium-only commands |
| **Developer** | 4 | Set in `devUsers` config | Shell, restart, full access |

### Setting Roles in config

```json
"adminBot":    ["111111111"],   // Admin users (role 2)
"premiumUsers": ["222222222"],  // Premium users (role 3)
"devUsers":    ["333333333"]    // Developers (role 4)
```

### Setting Thread Admins

```
!admin add 111111111     → Grants role 2 in this thread
!admin remove 111111111  → Removes thread admin
!admin list              → Lists all thread admins
```

---

## 🌐 Deploying (Replit)

### Quick Deploy on Replit

1. **Fork this repl** or create a new one and paste the code
2. Add your cookies to `account.txt`
3. Configure `config/default.json`
4. Click **Run** — the workflow `GoatBot Instagram` starts `node index.js`
5. Dashboard appears in the preview pane at port 3000

### Keeping It Online 24/7

Enable auto-uptime in `config/default.json`:

```json
"autoUptime": {
  "enable": true,
  "timeInterval": 180,
  "url": "https://YOUR-REPL-NAME.USERNAME.repl.co"
}
```

Set `url` to your Replit `.replit.dev` URL — the bot pings itself every 3 minutes to stay awake.

### Environment Variables (Optional)

Instead of storing credentials in files, set these Replit Secrets:

| Secret Key | Value |
|------------|-------|
| `IG_EMAIL` | Your Instagram email |
| `IG_PASSWORD` | Your Instagram password |
| `BOT_ADMIN_UID` | Your Instagram UID |

---

## ❓ FAQ & Troubleshooting

<details>
<summary><b>❌ "No valid cookies in account.txt"</b></summary>

Your `account.txt` is empty, missing, or doesn't have a valid `sessionid` cookie.

**Fix:** Export your Instagram cookies from the browser using Cookie-Editor extension → Netscape format → paste into `account.txt`.
</details>

<details>
<summary><b>❌ "Login failed / CHECKPOINT_REQUIRED"</b></summary>

Instagram is asking for verification on this account.

**Fix:**
1. Open Instagram in your browser
2. Complete the verification (phone/email code)
3. Re-export cookies after verification
4. Paste fresh cookies into `account.txt`
</details>

<details>
<summary><b>❌ Bot connects but commands don't work</b></summary>

Check:
- You're using the right prefix (default: `!`)
- The command exists — try `!help` to see all commands
- You're not banned — check dashboard → Users tab
- The bot's UID matches what's in `ds_user_id` cookie
</details>

<details>
<summary><b>❌ Dashboard shows "Offline" but bot is running</b></summary>

The dashboard polls `/api/status` every 15 seconds. If it shows offline:
- Refresh the page
- Check workflow is running (console should show "Connected via Instagram MQTT")
- Look at Logs tab for errors
</details>

<details>
<summary><b>❌ "429 Too Many Requests"</b></summary>

Instagram is rate-limiting the account.

**Fix:** Wait 10–60 minutes before restarting. Reduce command frequency. The bot handles 429 errors automatically with a cooldown.
</details>

<details>
<summary><b>❓ How do I find my Instagram UID?</b></summary>

1. Start the bot
2. Send `!uid` to the bot in a DM
3. The bot replies with your UID
4. Paste it into `adminBot` and `devUsers` in `config/default.json`
5. Restart the bot
</details>

<details>
<summary><b>❓ Can I run multiple accounts?</b></summary>

Currently one account per process. To run multiple bots, clone the repo into a separate folder and use a different `account.txt` and port for each.
</details>

---

## 💖 Credits

<div align="center">

| Role | Person / Project |
|------|-----------------|
| **Bot Architecture** | [Gtajisan](https://github.com/Gtajisan) |
| **Original GoatBot V2** | [NTKhang](https://github.com/ntkhang03) |
| **Instagram MQTT Library** | [@neoaz07/nkxica](https://www.npmjs.com/package/@neoaz07/nkxica) |
| **Logger** | [Winston](https://github.com/winstonjs/winston) |
| **HTTP Client** | [Axios](https://axios-http.com) |
| **Scheduler** | [node-cron](https://www.npmjs.com/package/node-cron) |
| **Anime Banner GIF** | [Tamamo no Mae fan art — public use] |

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:db2777,100:7c3aed&height=120&section=footer" width="100%"/>

**Made with 💜 by [Gtajisan](https://github.com/Gtajisan)**

*If you found this useful, please ⭐ star the repo!*

[![GitHub stars](https://img.shields.io/github/stars/Gtajisan/GoatBot-IG-Port?style=social)](https://github.com/Gtajisan/GoatBot-IG-Port/stargazers)

</div>
