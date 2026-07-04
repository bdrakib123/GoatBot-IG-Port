# ica-neokex

> **Professional Instagram Chat API for Node.js**

A powerful, production-ready Instagram automation library with 124+ methods for building Instagram bots, chatbots, and automation tools. Send messages, photos, videos, manage threads, automate social interactions, and more — built for long-running bots with enterprise-grade resilience.

[![npm version](https://img.shields.io/npm/v/ica-neokex.svg)](https://www.npmjs.com/package/ica-neokex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

## Disclaimer

This is an **unofficial** library that uses Instagram's private/internal APIs. Using this may violate Instagram's Terms of Service and could result in account restrictions or bans. **Use at your own risk, for educational purposes only.**

---

## Features

### Complete Messaging Suite
- **Text Messages** — Send to threads or users with reply support and bulk delivery
- **Scheduled Messages** — Schedule messages with cancelable promises
- **Photo/Video Uploads** — Send media from files or URLs with auto-processing
- **GIFs & Animated Media** — Send GIFs and animated stickers
- **Link Sharing** — Share URLs with previews
- **Reactions** — React to messages with emojis
- **Message Editing** — Edit sent messages
- **Unsend Messages** — Delete sent messages
- **Mark as Seen** — Read receipts
- **onReply Handlers** — Advanced callback pattern for handling replies
- **Media Download** — Extract and download video/image URLs from messages
- **Message Forwarding** — Forward media between threads

### Thread Management
- Get inbox and filter conversations
- Mute/unmute, archive/unarchive, delete threads
- Approve pending message requests
- Add/remove participants, update thread titles
- Typing indicators

### User & Social
- Get user info by ID or username
- Search users, get followers & following lists
- Follow/unfollow, block/unblock, mute users
- Friendship status checks (single and bulk)
- Get blocked users list

### Content & Feeds
- Timeline feed, user feed, hashtag feed, explore feed
- Stories, reels tray candidates
- Activity feed and notifications
- Location-based feeds

### Post Interactions
- Like/unlike posts and comments
- Comment, delete comments
- Get media info, tagged posts, saved posts
- Save/unsave posts, delete posts
- Upload photos, videos, carousels, and stories

### Profile Management
- Edit profile details
- Set or remove profile picture
- Change password

### Long-Running Bot Resilience
- **Circuit breaker** — opens after N consecutive errors, auto-recovers after cooldown
- **Adaptive polling** — speeds up on activity, slows down when quiet
- **Per-request timeout** — hung HTTP calls never stall the polling loop
- **Exponential backoff retry** — all send methods auto-retry on transient errors
- **Graceful shutdown** — SIGTERM/SIGINT handled cleanly with event emission
- **Session expiry detection** — emits `session:expired` and stops safely
- **LRU seenMessageIds eviction** — capped at 5,000, evicts oldest 2,500 automatically
- **Reply handler sweep** — periodic cleanup of expired handlers (no leaks)
- **Error classification** — `auth`, `ratelimit`, `network`, `unknown`

### Observability
- `getStatus()` — overall bot health snapshot
- `getPollingStats()` — uptime, poll count, error count, circuit state, interval
- `validateSession()` — full session check with event emission
- `pingSession()` — lightweight boolean health check
- `restartPolling()` — recover polling without full restart

---

## Installation

```bash
npm install ica-neokex
```

---

## Quick Start

### Option 1: Cookie Authentication (Recommended)

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();

// Export cookies from your browser using "Get cookies.txt" extension (Netscape format)
await bot.loadCookiesFromFile('./cookies.txt');

// Send a message
await bot.sendMessage('thread_id', 'Hello from ica-neokex!');

// Get inbox
const inbox = await bot.getInbox();
console.log(`You have ${inbox.threads.length} conversations`);
```

### Option 2: Username/Password Login

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();

await bot.login('your_username', 'your_password');

// Save session for reuse
await bot.saveCookiesToFile('./cookies.txt');

await bot.sendMessageToUser('user_id', 'Hi there!');
```

---

## Resilient Bot (Recommended for Long-Running Bots)

```javascript
import InstagramChatAPI from 'ica-neokex';

const bot = new InstagramChatAPI();
await bot.loadCookiesFromFile('./cookies.txt');

bot.onMessage(async (msg) => {
  if (msg.is_from_me) return;
  await bot.sendMessage(msg.thread_id, `You said: ${msg.text}`);
});

bot.onSessionExpired(() => {
  console.log('Session expired — restarting process');
  process.exit(1); // let your process manager restart
});

bot.onCircuitOpen(({ cooldown }) => {
  console.log(`Too many errors — pausing ${cooldown / 1000}s`);
});

bot.onCircuitClosed(() => console.log('Back online'));
bot.onShutdown(() => console.log('Clean shutdown'));

await bot.startListening({
  interval:             5000,   // start polling at 5s
  minInterval:          3000,   // never faster than 3s
  maxInterval:         30000,   // never slower than 30s
  maxConsecutiveErrors:    5,   // open circuit after 5 errors
  circuitCooldown:     60000,   // wait 60s before retrying
});
```

---

## API Reference

### Authentication

```javascript
await bot.login(username, password);
await bot.loadCookiesFromFile('./cookies.txt');
await bot.saveCookiesToFile('./cookies.txt');
const userId   = bot.getCurrentUserID();
const username = bot.getCurrentUsername();
const state    = await bot.getSessionState();
await bot.loadSessionState(state);
const result   = await bot.validateSession(); // { valid, userId, username }
const alive    = await bot.pingSession();     // true / false
```

### Messaging

```javascript
await bot.sendMessage(threadId, 'Hello!');
await bot.sendMessage(threadId, 'Reply', { replyToItemId: 'msg_id' });
await bot.sendMessageToUser(userId, 'Hi!');

const scheduled = bot.scheduleMessage(threadId, 'Reminder!', 60000);
scheduled.cancel(); // cancel before it fires

await bot.sendMessageBulk(['id1', 'id2'], 'Broadcast!', { delay: 2000 });

await bot.sendMessageWithReply(threadId, 'What is your name?', async (reply) => {
  await bot.sendMessage(reply.thread_id, `Nice to meet you, ${reply.text}!`);
});
```

### Media

```javascript
await bot.sendPhoto(threadId, './image.jpg');
await bot.sendPhotoFromUrl(threadId, 'https://example.com/image.jpg');
await bot.sendVideo(threadId, './video.mp4');
await bot.sendVideoFromUrl(threadId, 'https://example.com/video.mp4');
await bot.sendVoiceNote(threadId, './audio.m4a');
await bot.sendGif(threadId, 'giphy_id');
await bot.sendSticker(threadId, 'sticker_id');
await bot.sendLink(threadId, 'https://example.com', 'Check this out!');
await bot.shareMediaToThread(threadId, 'media_id');
```

### Message Actions

```javascript
await bot.sendReaction(threadId, itemId, '❤️');
await bot.removeReaction(threadId, itemId);
await bot.editMessage(threadId, itemId, 'Updated text');
await bot.unsendMessage(threadId, itemId);
await bot.forwardMessage(fromThreadId, toThreadId, itemId);
await bot.markAsSeen(threadId, itemId);
await bot.markAllThreadsSeen();
await bot.indicateTyping(threadId, true);

const media = await bot.getMessageMediaUrl(threadId, itemId);
const dl    = await bot.downloadMessageMedia(threadId, itemId, './video.mp4');
```

### Inbox & Threads

```javascript
const inbox   = await bot.getInbox();
const full    = await bot.getFullInbox();
const unread  = await bot.getUnreadThreads();
const thread  = await bot.getThread(threadId);
const msgs    = await bot.getThreadMessages(threadId, 20);
const members = await bot.getThreadParticipants(threadId);
const id      = await bot.getThreadIdByUsername('username');
await bot.createThread(['user_id_1', 'user_id_2']);

await bot.approveThread(threadId);
await bot.declineThread(threadId);
await bot.muteThread(threadId);
await bot.unmuteThread(threadId);
await bot.archiveThread(threadId);
await bot.unarchiveThread(threadId);
await bot.deleteThread(threadId);
await bot.leaveThread(threadId);
await bot.addUsersToThread(threadId, ['user_id']);
await bot.removeUserFromThread(threadId, 'user_id');
await bot.updateThreadTitle(threadId, 'New Title');
```

### User & Social

```javascript
const user  = await bot.getUserInfo(userId);
const user2 = await bot.getUserInfoByUsername('username');
const found = await bot.searchUsers('query');

const status   = await bot.getFriendshipStatus(userId);
const statuses = await bot.getFriendshipStatuses(['id1', 'id2']);

await bot.followUser(userId);
await bot.unfollowUser(userId);
await bot.blockUser(userId);
await bot.unblockUser(userId);
await bot.muteUser(userId);
const blocked = await bot.getBlockedUsers();

const followers = await bot.getFollowers(userId, 100);
const following = await bot.getFollowing(userId, 100);
```

### Feeds & Content

```javascript
const timeline = await bot.getTimelineFeed(20);
const feed     = await bot.getUserFeed(userId, 20);
const hashtag  = await bot.getHashtagFeed('photography', 20);
const explore  = await bot.getExploreFeed(20);
const location = await bot.getLocationFeed(locationId, 20);
const activity = await bot.getActivityFeed();
const notifs   = await bot.getNotifications();
const stories  = await bot.getStories(userId);
const reels    = await bot.getReelsTrayCandidates();
```

### Posts & Interactions

```javascript
await bot.likePost(mediaId);
await bot.unlikePost(mediaId);
await bot.commentPost(mediaId, 'Great post!');
await bot.deleteComment(mediaId, commentId);
await bot.likeComment(mediaId, commentId);
await bot.unlikeComment(mediaId, commentId);
const comments = await bot.getComments(mediaId);
const info     = await bot.getMediaInfo(mediaId);
await bot.deletePost(mediaId);

const tagged = await bot.getTaggedPosts(userId);
const saved  = await bot.getSavedPosts();
await bot.savePost(mediaId);
await bot.unsavePost(mediaId);
```

### Publishing

```javascript
await bot.uploadPhoto('./photo.jpg', 'Caption #hashtag');
await bot.uploadVideo('./video.mp4', 'Caption');
await bot.uploadCarousel(['./img1.jpg', './img2.jpg'], 'Carousel caption');
await bot.uploadStory('./story.jpg');
await bot.uploadVideoStory('./story.mp4');
```

### Profile

```javascript
await bot.editProfile({ biography: 'New bio', website: 'https://example.com' });
await bot.setProfilePicture('./avatar.jpg');
await bot.removeProfilePicture();
await bot.changePassword('oldPassword', 'newPassword');
```

### Search

```javascript
const tags      = await bot.searchHashtags('photography');
const locations = await bot.searchLocations('New York');
```

### Health & Observability

```javascript
const status = bot.getStatus();
// { isLoggedIn, userId, username, isPolling, pollingStats }

const stats = bot.dm.getPollingStats();
// { startedAt, totalPolls, totalErrors, consecutiveErrors,
//   circuitOpen, currentInterval, uptime, uptimeFormatted,
//   seenIdCount, replyHandlerCount, trackedThreads }

await bot.restartPolling({ interval: 5000 });
```

### Events

```javascript
bot.onMessage(callback);          // new incoming message
bot.onPendingRequest(callback);   // new pending DM request
bot.onError(callback);            // any polling or runtime error
bot.onLogin(callback);            // successful login
bot.onRateLimit(callback);        // rate limit hit
bot.onTyping(callback);           // typing indicator
bot.onPollingStart(callback);     // polling loop started
bot.onPollingStop(callback);      // polling loop stopped
bot.onSessionExpired(callback);   // auth failure detected
bot.onCircuitOpen(callback);      // circuit breaker opened
bot.onCircuitClosed(callback);    // circuit breaker recovered
bot.onShutdown(callback);         // graceful shutdown complete
```

---

## Configuration

```javascript
const bot = new InstagramChatAPI({
  showBanner: false  // suppress startup banner (default: true)
});
```

---

## Performance Tips

1. **Cookie authentication** — faster and more reliable than username/password
2. **Reuse sessions** — save cookies and reload them to skip login overhead
3. **Respect rate limits** — add delays between bulk operations
4. **Let the circuit breaker work** — don't bypass it; it protects your account
5. **Use `process.exit(1)` on `session:expired`** — let a process manager (PM2, systemd) restart cleanly

---

## Security Best Practices

1. Never commit credentials — use environment variables or `.env` files
2. Don't use your main Instagram account for testing
3. Respect rate limits — Instagram bans accounts that spam
4. Consider proxies for production bots running at high volume
5. Be prepared for two-factor authentication challenges on fresh logins

---

## Troubleshooting

### Login Failed / Challenge Required
- Use cookie authentication instead of username/password
- Complete any checkpoint in the Instagram app before retrying
- Wait 24–48 hours if your account is temporarily restricted

### Photos Not Sending
- Supported formats: JPG, PNG
- Images are auto-resized to 1080px max width
- Large files are auto-compressed using Sharp

### Rate Limiting
- Add 3–5 second delays between bulk requests
- The circuit breaker will automatically pause polling on repeated 429 errors
- `ratelimit` errors use a 10s–120s backoff automatically

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Links

- [GitHub Repository](https://github.com/NeoKEX/ica-neokex)
- [npm Package](https://www.npmjs.com/package/ica-neokex)
- [Report Issues](https://github.com/NeoKEX/ica-neokex/issues)
- [Examples](./EXAMPLES.md)
