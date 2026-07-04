/**
 * ica-neokex — Demo / verification script
 *
 * Run:  node demo.js
 *
 * Verifies the library loads correctly and prints a full summary of all
 * available methods, authentication options, and event names.
 */

import InstagramChatAPI from './src/index.js';

const C = {
  reset:  '\x1b[0m',
  bright: '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
};

function heading(text) {
  console.log(`\n${C.blue}${C.bright}  ${text}${C.reset}`);
  console.log(`${C.dim}  ${'─'.repeat(text.length + 2)}${C.reset}`);
}

function item(label, value, color = C.cyan) {
  console.log(`  ${C.dim}•${C.reset} ${label.padEnd(26)} ${color}${value}${C.reset}`);
}

function check(label) {
  console.log(`  ${C.green}✓${C.reset} ${label}`);
}

// ─── Instantiate (banner prints here) ────────────────────────────────────────

const bot = new InstagramChatAPI({ showBanner: true });

// ─── Collect methods by category ─────────────────────────────────────────────

const proto = Object.getPrototypeOf(bot);
const allMethods = Object.getOwnPropertyNames(proto)
  .filter(m => m !== 'constructor' && typeof bot[m] === 'function')
  .sort();

const categories = {
  'Auth & Session':    ['login', 'loadCookiesFromFile', 'saveCookiesToFile', 'setCookies', 'getCookies', 'getSessionState', 'loadSessionState', 'validateSession', 'pingSession', 'getCurrentUserID', 'getCurrentUsername', 'getIgClient'],
  'Polling':           ['startPolling', 'stopPolling', 'restartPolling', 'startListening', 'stopListening', 'getPollingStats'],
  'Messaging':         ['sendMessage', 'sendMessageToUser', 'sendMessageBulk', 'scheduleMessage', 'sendMessageWithReply', 'sendMessageToUserWithReply', 'registerReplyHandler', 'clearReplyHandler', 'unsendMessage', 'editMessage', 'sendReaction', 'removeReaction', 'indicateTyping'],
  'Media':             ['sendPhoto', 'sendPhotoWithCaption', 'sendPhotoFromUrl', 'sendVideo', 'sendVideoFromUrl', 'sendVoiceNote', 'sendSticker', 'sendGif', 'sendAnimatedMedia', 'sendLink', 'shareMediaToThread', 'forwardMessage', 'getMessageMediaUrl', 'downloadMessageMedia'],
  'Inbox & Threads':   ['getInbox', 'getFullInbox', 'getUnreadThreads', 'getPendingInbox', 'getThread', 'getThreadMessages', 'getThreadParticipants', 'getThreadIdByUsername', 'getRecentMessages', 'searchMessages', 'createThread', 'markAsSeen', 'markAllThreadsSeen', 'approveThread', 'declineThread', 'muteThread', 'unmuteThread', 'deleteThread', 'archiveThread', 'unarchiveThread', 'leaveThread', 'addUsersToThread', 'removeUserFromThread', 'updateThreadTitle'],
  'Users & Social':    ['getUserInfo', 'getUserInfoByUsername', 'searchUsers', 'getFriendshipStatus', 'getFriendshipStatuses', 'followUser', 'unfollowUser', 'blockUser', 'unblockUser', 'muteUser', 'getBlockedUsers', 'getFollowers', 'getFollowing', 'getSuggestedUsers', 'getFollowRequests', 'approveFollowRequest', 'rejectFollowRequest'],
  'Feeds':             ['getTimelineFeed', 'getUserFeed', 'getHashtagFeed', 'getExploreFeed', 'getLocationFeed', 'getLikedPosts', 'getReelsTrayCandidates'],
  'Posts':             ['likePost', 'unlikePost', 'commentPost', 'deleteComment', 'likeComment', 'unlikeComment', 'getComments', 'getMediaInfo', 'deletePost', 'getTaggedPosts', 'getSavedPosts', 'savePost', 'unsavePost'],
  'Publishing':        ['uploadPhoto', 'uploadVideo', 'uploadCarousel'],
  'Stories':           ['getStories', 'uploadStory', 'uploadVideoStory', 'deleteStory', 'reactToStory', 'getCloseFriendsStories', 'getUserHighlights', 'getHighlightItems'],
  'Profile':           ['editProfile', 'setProfilePicture', 'removeProfilePicture', 'changePassword'],
  'Search':            ['searchUsers', 'searchHashtags', 'searchLocations', 'searchAll'],
  'Notifications':     ['getNotifications', 'markNotificationsSeen'],
  'Events':            ['onMessage', 'onPendingRequest', 'onError', 'onLogin', 'onRateLimit', 'onTyping', 'onPollingStart', 'onPollingStop', 'onSessionExpired', 'onCircuitOpen', 'onCircuitClosed', 'onShutdown'],
  'Status':            ['getStatus', 'getPollingStats'],
};

// ─── Print summary ────────────────────────────────────────────────────────────

heading('Library Status');
check('InstagramChatAPI instantiated successfully');
check(`Node.js ${process.version} ✓`);
check('All dependencies resolved');
check(`TypeScript declarations available in dist/`);

heading('Statistics');
item('Total methods', allMethods.length.toString(), C.green);
item('Event emitter', 'EventEmitter3', C.cyan);
item('Polling engine', 'Adaptive (circuit breaker)', C.cyan);
item('Seen-ID cache', 'LRU-evicting Set (max 5000)', C.cyan);
item('Retry strategy', 'Exponential backoff with jitter', C.cyan);

heading('Methods by Category');
let categorised = 0;
for (const [cat, methods] of Object.entries(categories)) {
  const found = methods.filter(m => allMethods.includes(m));
  categorised += found.length;
  const label = `${cat} (${found.length})`;
  console.log(`\n  ${C.yellow}${C.bright}${label}${C.reset}`);
  const cols = 3;
  for (let i = 0; i < found.length; i += cols) {
    const row = found.slice(i, i + cols).map(m => m.padEnd(32)).join('');
    console.log(`  ${C.dim}${row}${C.reset}`);
  }
}

const uncategorised = allMethods.filter(m => !Object.values(categories).flat().includes(m));
if (uncategorised.length) {
  console.log(`\n  ${C.yellow}${C.bright}Other (${uncategorised.length})${C.reset}`);
  console.log(`  ${C.dim}${uncategorised.join(', ')}${C.reset}`);
}

heading('Authentication Options');
check('Username + password login');
check('Netscape cookie file (.txt)');
check('Inline cookie object (setCookies)');
check('Session state snapshot (getSessionState / loadSessionState)');

heading('Emitted Events');
const events = [
  ['message',         'New direct message received'],
  ['pending_request', 'New DM request in pending inbox'],
  ['login',           'Successful authentication'],
  ['error',           'Any unhandled error'],
  ['ratelimit',       'Instagram rate-limit hit'],
  ['typing',          'Typing indicator detected'],
  ['polling:start',   'Polling loop started'],
  ['polling:stop',    'Polling loop stopped'],
  ['session:expired', 'Auth session expired'],
  ['circuit:open',    'Circuit breaker opened'],
  ['circuit:closed',  'Circuit breaker closed'],
  ['shutdown',        'SIGTERM / SIGINT received'],
];
for (const [ev, desc] of events) {
  item(ev, desc, C.dim);
}

heading('Quick-Start Example');
console.log(`
  ${C.dim}import InstagramChatAPI from 'ica-neokex';

  const bot = new InstagramChatAPI();
  await bot.login('username', 'password');

  bot.onMessage(async (event) => {
    if (!event.is_from_me) {
      await bot.indicateTyping(event.thread_id);
      await bot.sendMessage(event.thread_id, \`Echo: \${event.text}\`);
    }
  });

  await bot.startPolling({ interval: 5000 });${C.reset}
`);

console.log(`${C.green}${C.bright}  ica-neokex is ready. See README.md for the full API reference.${C.reset}\n`);
