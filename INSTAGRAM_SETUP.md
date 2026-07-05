# INSTAGRAM_SETUP.md

## 🍪 Instagram Cookie Setup (Detailed)

GoatBot-IG uses your browser cookies to authenticate with Instagram. This is safer than email/password login and bypasses most security checks.

### 1. Install Cookie-Editor
- [Chrome Extension](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
- [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### 2. Export Cookies
1. Log in to [Instagram](https://www.instagram.com) on your computer.
2. Click the **Cookie-Editor** icon in your extension bar.
3. Click the **Export** button at the bottom.
4. Select **Netscape** format (Required!).
5. The cookies will be copied to your clipboard.

### 3. Add to Bot
1. Create a file named `account.txt` in the root folder of the bot.
2. Paste the copied cookies into this file.
3. Save and close.

---

## 🛡️ Anti-Ban Best Practices (Enhanced)

Using a bot on Instagram carries risks. This port includes several enhancements inspired by `insta-p8` to keep your account safe:

### 1. Natural Delays
The bot is now equipped with `humanDelay`. It introduces a random delay before responding to simulate human behavior.
- **Config:** `humanDelay` in `config/default.json`.
- **Default:** 1.5s to 4s.

### 2. Typing Indicators
The bot automatically sends a typing indicator before replying.
- **Config:** `typingIndicator` in `config/default.json`.
- **Realism:** It stays "typing" for a configurable duration (default 1.5s) to look natural.

### 3. Read Receipts
The bot can automatically mark messages as seen. This is controlled via the API options in the configuration.

### 4. Robust Error Handling
Global handlers for `unhandledRejection` and `uncaughtException` ensure the bot doesn't just crash silently. All errors are logged with full context in the `logs/` directory.

---

## ⚙️ Production Logging

The logging system has been completely overhauled with **Winston**:
- **Colored Console:** Distinct colors for INFO, SUCCESS, WARN, ERROR, and DEBUG.
- **Daily Rotation:** Logs are saved in `./logs/combined-YYYY-MM-DD.log` and kept for 14 days.
- **Error Logs:** Separate `./logs/error-YYYY-MM-DD.log` for critical issues.
- **Structured JSON:** Ideal for log shippers or the built-in Dashboard.
- **Discord Webhook:** Forward critical logs and command usage to Discord.
  - Set `logging.webhookUrl` in `config/default.json`.

---

## 🤖 AI Fallback

Turn your bot into an AI assistant when commands aren't found!
- **Enable:** Set `AI_FALLBACK.enable` to `true`.
- **How it works:** If a user types `!hello` and no "hello" command exists, the bot routes the input to the AI command (default: `gpt`).
