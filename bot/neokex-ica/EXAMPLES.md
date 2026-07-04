# ica-neokex Examples

Complete examples for using the ica-neokex Instagram Chat API library.

## Table of Contents

- [Authentication](#authentication)
- [Sending Messages](#sending-messages)
- [Media Sharing](#media-sharing)
- [Thread Management](#thread-management)
- [User Operations](#user-operations)
- [Building Bots](#building-bots)
- [Advanced Patterns](#advanced-patterns)

---

## Authentication

### Cookie-Based Login (Recommended)

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();

// Load cookies exported from your browser (Netscape format)
// Use the "Get cookies.txt" extension for Chrome/Firefox
await bot.loadCookiesFromFile('./cookies.txt');

console.log(`Logged in as: ${bot.getCurrentUsername()}`);
```

### Username/Password Login

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();

try {
  await bot.login('username', 'password');
  console.log('Login successful!');

  // Save cookies for next time
  await bot.saveCookiesToFile('./cookies.txt');
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Session Health Check

```javascript
const result = await bot.validateSession();
if (!result.valid) {
  console.error('Session expired, please refresh cookies');
  process.exit(1);
}

// Lightweight ping (no event emission)
const alive = await bot.pingSession();
console.log('Session alive:', alive);
```

---

## Sending Messages

### Send Text Message

```javascript
// To a thread
await bot.sendMessage('thread_id', 'Hello!');

// To a user (creates thread if needed)
await bot.sendMessageToUser('user_id', 'Hi there!');
```

### Send with onReply Callback

```javascript
await bot.sendMessageWithReply(
  'thread_id',
  'What is your name?',
  async (reply) => {
    await bot.sendMessage(reply.thread_id, `Nice to meet you, ${reply.text}!`);
  }
);
```

### Interactive Menu with onReply

```javascript
bot.onMessage(async (msg) => {
  if (msg.is_from_me) return;

  if (msg.text === '!menu') {
    await bot.sendMessageWithReply(
      msg.thread_id,
      'Menu:\n1. Products\n2. Support\n3. Pricing\n\nReply with a number:',
      async (reply) => {
        const responses = {
          '1': 'Here are our products...',
          '2': 'Contact support at...',
          '3': 'Pricing: $10/month',
        };
        const text = responses[reply.text.trim()] ?? 'Invalid choice. Try !menu again.';
        await bot.sendMessage(reply.thread_id, text);
      },
      { replyTimeout: 60000 }
    );
  }
});
```

### Scheduled Message

```javascript
// Send after 60 seconds
const scheduled = bot.scheduleMessage('thread_id', 'Reminder!', 60000);

// Cancel before it fires
scheduled.cancel();
```

### Bulk DM Sender

```javascript
const recipients = ['user_id_1', 'user_id_2', 'user_id_3'];

await bot.sendMessageBulk(recipients, 'Hey! Check out our new product!', {
  delay: 3000, // 3 seconds between each send
});
```

---

## Media Sharing

### Send Photo

```javascript
// From file
await bot.sendPhoto('thread_id', './photo.jpg');

// From URL (auto-downloads and processes)
await bot.sendPhotoFromUrl('thread_id', 'https://picsum.photos/800/600');
```

### Send Video

```javascript
await bot.sendVideo('thread_id', './video.mp4');
await bot.sendVideoFromUrl('thread_id', 'https://example.com/video.mp4');
```

### Media Download Bot

```javascript
bot.onMessage(async (msg) => {
  if (msg.is_from_me || !msg.message?.media) return;

  const mediaUrls = await bot.getMessageMediaUrl(msg.thread_id, msg.item_id);

  if (mediaUrls.media.videos?.length > 0) {
    const dl = await bot.downloadMessageMedia(msg.thread_id, msg.item_id, './downloads/video.mp4');
    console.log(`Downloaded to: ${dl.path} (${dl.size} bytes)`);
  }
});
```

### Send Link

```javascript
await bot.sendLink(
  'thread_id',
  'https://github.com/NeoKEX/ica-neokex',
  'Check out this library!'
);
```

---

## Thread Management

### Get Inbox

```javascript
const inbox = await bot.getInbox();

inbox.threads.forEach((thread) => {
  const username = thread.users?.[0]?.username ?? 'Unknown';
  const lastMsg  = thread.last_permanent_item?.text ?? '(media)';
  console.log(`@${username}: ${lastMsg}`);
});
```

### Thread Operations

```javascript
await bot.muteThread('thread_id');
await bot.unmuteThread('thread_id');
await bot.archiveThread('thread_id');
await bot.approveThread('thread_id');   // accept pending request
await bot.deleteThread('thread_id');
await bot.updateThreadTitle('thread_id', 'New Group Name');
```

---

## User Operations

### Search & Info

```javascript
const results = await bot.searchUsers('username');
results.forEach(user => console.log(`@${user.username} — ${user.full_name}`));

const user = await bot.getUserInfoByUsername('instagram');
console.log(`Followers: ${user.follower_count}`);
```

### Social Actions

```javascript
await bot.followUser('user_id');
await bot.unfollowUser('user_id');
await bot.blockUser('user_id');
await bot.unblockUser('user_id');
```

### Get Followers / Following

```javascript
// Paginated — fetches up to 200 followers
const followers = await bot.getFollowers('user_id', 200);
const following = await bot.getFollowing('user_id', 200);
```

---

## Building Bots

### Resilient Long-Running Bot

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();
await bot.loadCookiesFromFile('./cookies.txt');

bot.onMessage(async (msg) => {
  if (msg.is_from_me) return;
  console.log(`[${msg.thread_id}] ${msg.text}`);
  await bot.sendMessage(msg.thread_id, `Echo: ${msg.text}`);
});

bot.onError((err) => console.error('Bot error:', err.message));

// Restart process on session expiry (let PM2/systemd handle restart)
bot.onSessionExpired(() => process.exit(1));

bot.onCircuitOpen(({ cooldown }) => {
  console.log(`Circuit open — pausing ${cooldown / 1000}s`);
});

bot.onCircuitClosed(() => console.log('Circuit closed — back online'));
bot.onShutdown(() => console.log('Shutdown complete'));

await bot.startListening({
  interval:             5000,
  minInterval:          3000,
  maxInterval:         30000,
  maxConsecutiveErrors:    5,
  circuitCooldown:     60000,
});
```

### Keyword Bot

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();
await bot.loadCookiesFromFile('./cookies.txt');

const responses = {
  hello: 'Hi there! How can I help you?',
  help:  'Commands: hello, help, info',
  info:  'This bot is powered by ica-neokex.',
};

bot.onMessage(async (msg) => {
  if (msg.is_from_me) return;

  const text = msg.text?.toLowerCase() ?? '';
  for (const [keyword, reply] of Object.entries(responses)) {
    if (text.includes(keyword)) {
      await bot.sendMessage(msg.thread_id, reply);
      break;
    }
  }
});

await bot.startListening(5000);
```

### Auto-React Bot

```javascript
bot.onMessage(async (msg) => {
  if (msg.is_from_me) return;

  const text = msg.text?.toLowerCase() ?? '';
  let emoji = null;

  if (text.includes('love'))  emoji = '❤️';
  else if (text.includes('lol') || text.includes('funny')) emoji = '😂';
  else if (text.includes('thanks')) emoji = '🙏';

  if (emoji) await bot.sendReaction(msg.thread_id, msg.item_id, emoji);
});
```

---

## Advanced Patterns

### Health Monitoring

```javascript
setInterval(() => {
  const status = bot.getStatus();
  const s = status.pollingStats;
  console.log(
    `[Health] uptime=${s.uptimeFormatted} polls=${s.totalPolls}` +
    ` errors=${s.totalErrors} circuit=${s.circuitOpen ? 'OPEN' : 'closed'}` +
    ` interval=${s.currentInterval}ms`
  );
}, 60000);
```

### Error Handling

```javascript
bot.onError((err) => {
  if (err.type === 'auth') {
    console.error('Auth failure — exiting');
    process.exit(1);
  }
  if (err.type === 'ratelimit') {
    console.warn('Rate limit hit — circuit breaker will handle it');
  }
});
```

### Environment Variables

```javascript
import 'dotenv/config';

await bot.loadCookiesFromFile(process.env.COOKIES_PATH ?? './cookies.txt');
```

---

## Need Help?

- [GitHub Issues](https://github.com/NeoKEX/ica-neokex/issues)
- [npm Package](https://www.npmjs.com/package/ica-neokex)
- [Main README](./README.md)
