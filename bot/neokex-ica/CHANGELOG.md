# Changelog

All notable changes to **ica-neokex** are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-03-12

### Added

#### Core
- **TypeScript support** — `tsconfig.json` updated with `allowJs: true` so the
  entire JS source is compiled and `.d.ts` type-declaration files are emitted
  automatically from JSDoc annotations. TypeScript users get full IntelliSense
  with zero migration cost.
- Full **JSDoc type annotations** across `src/index.js` and
  `src/InstagramClientV2.js` — `@param`, `@returns`, `@typedef`, and
  `@example` tags cover every public method.

#### New API methods
| Method | Description |
|---|---|
| `startPolling(options?)` | Canonical name; `startListening` kept as alias |
| `stopPolling()` | Canonical name; `stopListening` kept as alias |
| `getPendingInbox()` | Expose pending DM requests from `DirectMessageV2` |
| `searchAll(query)` | Combined parallel search — users, hashtags, locations |
| `getSuggestedUsers(maxItems?)` | Instagram-suggested accounts |
| `getLikedPosts(maxItems?)` | Posts the current user has liked |
| `deleteStory(mediaId)` | Delete a story by its media ID |
| `reactToStory(userId, storyId, emoji)` | Emoji-react to a story |
| `getCloseFriendsStories()` | Stories from close-friends / besties list |
| `getUserHighlights(userId)` | Highlight reels for a user |
| `getHighlightItems(highlightId)` | Items inside a specific highlight reel |
| `markNotificationsSeen()` | Mark all activity notifications as seen |
| `getFollowRequests()` | Pending follow requests (private accounts) |
| `approveFollowRequest(userId)` | Approve a follow request |
| `rejectFollowRequest(userId)` | Reject/deny a follow request |

#### TypeScript modules (advanced usage)
The `src/` directory now also ships modular TypeScript classes for users who
prefer composition over the monolithic `InstagramChatAPI`:
- `src/core/client.ts` — `InstagramCore`
- `src/polling/engine.ts` — `PollingEngine`
- `src/api/messaging.ts` — `MessagingAPI`
- `src/api/media.ts` — `MediaAPI`
- `src/api/threads.ts` — `ThreadsAPI`
- `src/api/users.ts` — `UsersAPI`
- `src/api/feeds.ts` — `FeedsAPI`
- `src/api/posts.ts` — `PostsAPI`
- `src/api/stories.ts` — `StoriesAPI`
- `src/api/profile.ts` — `ProfileAPI`
- `src/api/search.ts` — `SearchAPI`

### Changed
- `src/index.js` — `showSimple` banner replaced with `showFull` to display
  method count and features on startup.
- `src/index.js` — `export { InstagramChatAPI }` named export added alongside
  the existing default export for ES-module named imports.
- `tsconfig.json` — Added `"allowJs": true`, `"checkJs": false` to compile JS
  source files and emit declarations.

### Fixed
- `src/index.js` — `startPolling` / `stopPolling` were missing; only
  `startListening` / `stopListening` existed. Both aliases are now present.
- `src/index.js` — `getPendingInbox()` was implemented in `DirectMessageV2`
  but never exposed on the top-level class.

---

## [1.0.0] — initial release

- `InstagramChatAPI` class with 120+ methods for messaging, media, threads,
  users, feeds, posts, stories, and profile management.
- Adaptive polling engine with circuit breaker, LRU seen-ID cache, and
  exponential backoff.
- Cookie / session persistence (Netscape-format).
- Full JSDoc documentation and `EXAMPLES.md`.
