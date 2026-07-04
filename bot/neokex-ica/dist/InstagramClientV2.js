import { IgApiClient } from 'instagram-private-api';
import EventEmitter from 'eventemitter3';
import CookieManager from './CookieManager.js';
import logger from './Logger.js';
import { readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';
import axios from 'axios';
import { withRetry, sleep } from './utils.js';
export default class InstagramClientV2 extends EventEmitter {
    constructor() {
        super();
        this.ig = new IgApiClient();
        this.userId = null;
        this.username = null;
        this.isLoggedIn = false;
        this.cookies = {};
    }
    async login(username, password) {
        try {
            logger.info(`Logging in as ${username}`);
            this.ig.state.generateDevice(username);
            this.ig.state.proxyUrl = process.env.IG_PROXY;
            const auth = await this.ig.account.login(username, password);
            this.userId = auth.pk.toString();
            this.username = auth.username;
            this.isLoggedIn = true;
            logger.success(`Logged in as ${this.username} (ID: ${this.userId})`);
            this.emit('login', { userId: this.userId, username: this.username });
            return { logged_in_user: auth, userId: this.userId, username: this.username };
        }
        catch (error) {
            logger.error('Login failed:', error.message);
            throw new Error(`Login failed: ${error.message}`);
        }
    }
    async loadCookiesFromFile(filePath) {
        try {
            logger.info(`Loading cookies from ${filePath}`);
            const content = readFileSync(filePath, 'utf-8');
            const cookies = {};
            for (const line of content.split('\n')) {
                if (!line.trim() || line.startsWith('# '))
                    continue;
                const clean = line.replace(/^#HttpOnly_/, '');
                const parts = clean.split(/\s+/);
                if (parts.length >= 7)
                    cookies[parts[5]] = parts[6];
            }
            this.cookies = cookies;
            if (!cookies.sessionid || !cookies.ds_user_id) {
                throw new Error('Invalid cookie file — missing sessionid or ds_user_id');
            }
            this.userId = cookies.ds_user_id;
            this.ig.state.generateDevice(this.userId);
            for (const [name, value] of Object.entries(cookies)) {
                await this.ig.state.cookieJar.setCookie(`${name}=${value}; Domain=.instagram.com; Path=/;`, 'https://instagram.com');
            }
            this.isLoggedIn = true;
            logger.success('Cookies loaded successfully');
            logger.session(`Authenticated via cookies (User ID: ${this.userId})`);
            this.emit('cookies:loaded', { cookieFile: filePath });
            try {
                const user = await this.ig.account.currentUser();
                this.username = user.username;
                logger.info(`Verified user: ${this.username}`);
            }
            catch (_) {
                logger.warn('Could not verify user from cookies, will try to proceed anyway');
            }
            return this.cookies;
        }
        catch (error) {
            logger.error('Failed to load cookies:', error.message);
            throw error;
        }
    }
    saveCookiesToFile(filePath, domain = '.instagram.com') {
        CookieManager.saveToFile(filePath, this.cookies, domain);
        logger.success(`Cookies saved to ${filePath}`);
        this.emit('cookies:saved', { cookieFile: filePath });
    }
    setCookies(cookies) {
        this.cookies = { ...this.cookies, ...cookies };
        if (cookies.ds_user_id)
            this.userId = cookies.ds_user_id;
        this.isLoggedIn = true;
    }
    getCookies() {
        return { ...this.cookies };
    }
    getCurrentUserID() {
        return this.userId;
    }
    getCurrentUsername() {
        return this.username;
    }
    getIgClient() {
        return this.ig;
    }
    async validateSession() {
        try {
            const user = await this.ig.account.currentUser();
            this.username = user.username;
            logger.info(`Session valid — user: ${this.username}`);
            return { valid: true, userId: this.userId, username: this.username };
        }
        catch (error) {
            logger.error('Session validation failed:', error.message);
            this.emit('session:expired', { error });
            return { valid: false, error: error.message };
        }
    }
    async pingSession() {
        try {
            await this.ig.account.currentUser();
            return true;
        }
        catch (_) {
            return false;
        }
    }
    async getSessionState() {
        return {
            cookies: this.cookies,
            userId: this.userId,
            username: this.username,
            deviceId: this.ig.state.deviceId,
            uuid: this.ig.state.uuid,
        };
    }
    async loadSessionState(sessionState) {
        if (!sessionState.cookies)
            return;
        this.cookies = sessionState.cookies;
        this.userId = sessionState.userId;
        this.username = sessionState.username;
        for (const [name, value] of Object.entries(sessionState.cookies)) {
            await this.ig.state.cookieJar.setCookie(`${name}=${value}; Domain=.instagram.com; Path=/;`, 'https://instagram.com');
        }
        if (sessionState.deviceId)
            this.ig.state.deviceId = sessionState.deviceId;
        if (sessionState.uuid)
            this.ig.state.uuid = sessionState.uuid;
        this.isLoggedIn = true;
        logger.success('Session state loaded');
    }
    async getUserInfo(userId) {
        try {
            return await this.ig.user.info(userId);
        }
        catch (error) {
            logger.error('Failed to get user info:', error.message);
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    }
    async getUserInfoByUsername(username) {
        try {
            const userId = await this.ig.user.getIdByUsername(username);
            return await this.getUserInfo(userId);
        }
        catch (error) {
            logger.error('Failed to get user by username:', error.message);
            throw new Error(`Failed to get user by username: ${error.message}`);
        }
    }
    async searchUsers(query) {
        try {
            const results = await this.ig.search.users(query);
            return results.users || results || [];
        }
        catch (error) {
            logger.error('Search failed:', error.message);
            throw new Error(`Search failed: ${error.message}`);
        }
    }
    async getFriendshipStatus(userId) {
        try {
            const status = await this.ig.friendship.show(userId);
            return status;
        }
        catch (error) {
            logger.error('Failed to get friendship status:', error.message);
            throw new Error(`Failed to get friendship status: ${error.message}`);
        }
    }
    async getFriendshipStatuses(userIds) {
        try {
            const ids = (Array.isArray(userIds) ? userIds : [userIds]).map(String);
            const statuses = await this.ig.friendship.showMany(ids);
            return statuses;
        }
        catch (error) {
            logger.error('Failed to get friendship statuses:', error.message);
            throw new Error(`Failed to get friendship statuses: ${error.message}`);
        }
    }
    async followUser(userId) {
        try {
            await this.ig.friendship.create(userId);
            logger.info(`Followed user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to follow user:', error.message);
            throw new Error(`Failed to follow user: ${error.message}`);
        }
    }
    async unfollowUser(userId) {
        try {
            await this.ig.friendship.destroy(userId);
            logger.info(`Unfollowed user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to unfollow user:', error.message);
            throw new Error(`Failed to unfollow user: ${error.message}`);
        }
    }
    async blockUser(userId) {
        try {
            await this.ig.friendship.block(userId);
            logger.info(`Blocked user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to block user:', error.message);
            throw new Error(`Failed to block user: ${error.message}`);
        }
    }
    async unblockUser(userId) {
        try {
            await this.ig.friendship.unblock(userId);
            logger.info(`Unblocked user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to unblock user:', error.message);
            throw new Error(`Failed to unblock user: ${error.message}`);
        }
    }
    async getBlockedUsers() {
        try {
            const feed = this.ig.feed.accountFollowersYouKnow();
            return await feed.items();
        }
        catch (error) {
            logger.error('Failed to get blocked users:', error.message);
            throw new Error(`Failed to get blocked users: ${error.message}`);
        }
    }
    async muteUser(userId, muteStories = false, mutePosts = false) {
        try {
            await this.ig.friendship.mutePostsOrStoryFromFollow({
                targetUserId: userId,
                postMuteStatus: mutePosts ? 1 : 0,
                storyMuteStatus: muteStories ? 1 : 0,
            });
            logger.info(`Muted user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to mute user:', error.message);
            throw new Error(`Failed to mute user: ${error.message}`);
        }
    }
    async getFollowers(userId, maxItems = 100) {
        try {
            const feed = this.ig.feed.accountFollowers(userId);
            const all = [];
            do {
                const batch = await feed.items();
                all.push(...batch);
                if (feed.isMoreAvailable() && all.length < maxItems)
                    await sleep(600);
            } while (feed.isMoreAvailable() && all.length < maxItems);
            return all.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get followers:', error.message);
            throw new Error(`Failed to get followers: ${error.message}`);
        }
    }
    async getFollowing(userId, maxItems = 100) {
        try {
            const feed = this.ig.feed.accountFollowing(userId);
            const all = [];
            do {
                const batch = await feed.items();
                all.push(...batch);
                if (feed.isMoreAvailable() && all.length < maxItems)
                    await sleep(600);
            } while (feed.isMoreAvailable() && all.length < maxItems);
            return all.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get following:', error.message);
            throw new Error(`Failed to get following: ${error.message}`);
        }
    }
    async getUserFeed(userId, maxItems = 30) {
        try {
            const feed = this.ig.feed.user(userId);
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get user feed:', error.message);
            throw new Error(`Failed to get user feed: ${error.message}`);
        }
    }
    async getTimelineFeed(maxItems = 30) {
        try {
            const feed = this.ig.feed.timeline();
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get timeline:', error.message);
            throw new Error(`Failed to get timeline: ${error.message}`);
        }
    }
    async getHashtagFeed(hashtag, maxItems = 30) {
        try {
            const feed = this.ig.feed.tag(hashtag);
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get hashtag feed:', error.message);
            throw new Error(`Failed to get hashtag feed: ${error.message}`);
        }
    }
    async getExploreFeed(maxItems = 30) {
        try {
            const feed = this.ig.feed.discover();
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get explore feed:', error.message);
            throw new Error(`Failed to get explore feed: ${error.message}`);
        }
    }
    async getLocationFeed(locationId, maxItems = 30) {
        try {
            const feed = this.ig.feed.location(locationId);
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get location feed:', error.message);
            throw new Error(`Failed to get location feed: ${error.message}`);
        }
    }
    async getActivityFeed() {
        try {
            const feed = this.ig.feed.reelsMedia({ userIds: [this.userId] });
            return await feed.items();
        }
        catch (error) {
            logger.error('Failed to get activity feed:', error.message);
            throw new Error(`Failed to get activity feed: ${error.message}`);
        }
    }
    async getNotifications() {
        try {
            const news = await this.ig.news.inbox();
            return news;
        }
        catch (error) {
            logger.error('Failed to get notifications:', error.message);
            throw new Error(`Failed to get notifications: ${error.message}`);
        }
    }
    async likePost(mediaId) {
        try {
            await this.ig.media.like({ mediaId, moduleInfo: { module_name: 'profile' }, d: 0 });
            logger.info(`Liked post ${mediaId}`);
        }
        catch (error) {
            logger.error('Failed to like post:', error.message);
            throw new Error(`Failed to like post: ${error.message}`);
        }
    }
    async unlikePost(mediaId) {
        try {
            await this.ig.media.unlike({ mediaId, moduleInfo: { module_name: 'profile' }, d: 0 });
            logger.info(`Unliked post ${mediaId}`);
        }
        catch (error) {
            logger.error('Failed to unlike post:', error.message);
            throw new Error(`Failed to unlike post: ${error.message}`);
        }
    }
    async commentPost(mediaId, text) {
        try {
            const result = await this.ig.media.comment({ mediaId, text });
            logger.info(`Commented on post ${mediaId}`);
            return result;
        }
        catch (error) {
            logger.error('Failed to comment:', error.message);
            throw new Error(`Failed to comment: ${error.message}`);
        }
    }
    async deleteComment(mediaId, commentId) {
        try {
            await this.ig.media.deleteComment({ mediaId, commentId });
            logger.info(`Deleted comment ${commentId} on post ${mediaId}`);
        }
        catch (error) {
            logger.error('Failed to delete comment:', error.message);
            throw new Error(`Failed to delete comment: ${error.message}`);
        }
    }
    async likeComment(mediaId, commentId) {
        try {
            await this.ig.media.likeComment({ mediaId, commentId });
            logger.info(`Liked comment ${commentId}`);
        }
        catch (error) {
            logger.error('Failed to like comment:', error.message);
            throw new Error(`Failed to like comment: ${error.message}`);
        }
    }
    async unlikeComment(mediaId, commentId) {
        try {
            await this.ig.media.unlikeComment({ mediaId, commentId });
            logger.info(`Unliked comment ${commentId}`);
        }
        catch (error) {
            logger.error('Failed to unlike comment:', error.message);
            throw new Error(`Failed to unlike comment: ${error.message}`);
        }
    }
    async getComments(mediaId, maxItems = 20) {
        try {
            const feed = this.ig.feed.mediaComments(mediaId);
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get comments:', error.message);
            throw new Error(`Failed to get comments: ${error.message}`);
        }
    }
    async getMediaInfo(mediaId) {
        try {
            const info = await this.ig.media.info(mediaId);
            return info.items[0];
        }
        catch (error) {
            logger.error('Failed to get media info:', error.message);
            throw new Error(`Failed to get media info: ${error.message}`);
        }
    }
    async deletePost(mediaId) {
        try {
            await this.ig.media.delete({ mediaId });
            logger.info(`Deleted post ${mediaId}`);
        }
        catch (error) {
            logger.error('Failed to delete post:', error.message);
            throw new Error(`Failed to delete post: ${error.message}`);
        }
    }
    async getTaggedPosts(userId, maxItems = 30) {
        try {
            const feed = this.ig.feed.userTag(userId);
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get tagged posts:', error.message);
            throw new Error(`Failed to get tagged posts: ${error.message}`);
        }
    }
    async getSavedPosts(maxItems = 30) {
        try {
            const feed = this.ig.feed.saved();
            const items = await feed.items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get saved posts:', error.message);
            throw new Error(`Failed to get saved posts: ${error.message}`);
        }
    }
    async savePost(mediaId) {
        try {
            await this.ig.media.save({ mediaId });
            logger.info(`Saved post ${mediaId}`);
        }
        catch (error) {
            logger.error('Failed to save post:', error.message);
            throw new Error(`Failed to save post: ${error.message}`);
        }
    }
    async unsavePost(mediaId) {
        try {
            await this.ig.media.unsave({ mediaId });
            logger.info(`Unsaved post ${mediaId}`);
        }
        catch (error) {
            logger.error('Failed to unsave post:', error.message);
            throw new Error(`Failed to unsave post: ${error.message}`);
        }
    }
    async uploadPhoto(photoPath, caption = '') {
        try {
            const buffer = readFileSync(photoPath);
            const result = await this.ig.publish.photo({ file: buffer, caption });
            logger.success('Photo uploaded to feed');
            return result;
        }
        catch (error) {
            logger.error('Failed to upload photo:', error.message);
            throw new Error(`Failed to upload photo: ${error.message}`);
        }
    }
    async uploadVideo(videoPath, caption = '', coverPath = null) {
        try {
            const options = { video: readFileSync(videoPath), caption };
            if (coverPath)
                options.coverImage = readFileSync(coverPath);
            const result = await this.ig.publish.video(options);
            logger.success('Video uploaded to feed');
            return result;
        }
        catch (error) {
            logger.error('Failed to upload video:', error.message);
            throw new Error(`Failed to upload video: ${error.message}`);
        }
    }
    async uploadCarousel(photoPaths, caption = '') {
        try {
            const items = await Promise.all(photoPaths.map(async (path) => {
                let buf = readFileSync(path);
                try {
                    buf = await sharp(buf).jpeg({ quality: 85 }).toBuffer();
                }
                catch (_) { }
                return { file: buf };
            }));
            const result = await this.ig.publish.album({ items, caption });
            logger.success(`Carousel uploaded (${photoPaths.length} photos)`);
            return result;
        }
        catch (error) {
            logger.error('Failed to upload carousel:', error.message);
            throw new Error(`Failed to upload carousel: ${error.message}`);
        }
    }
    async uploadStory(photoPath, options = {}) {
        try {
            const buffer = readFileSync(photoPath);
            const result = await this.ig.publish.story({ file: buffer, ...options });
            logger.success('Story uploaded');
            return result;
        }
        catch (error) {
            logger.error('Failed to upload story:', error.message);
            throw new Error(`Failed to upload story: ${error.message}`);
        }
    }
    async uploadVideoStory(videoPath, options = {}) {
        try {
            const video = readFileSync(videoPath);
            const result = await this.ig.publish.videoStory({ video, ...options });
            logger.success('Video story uploaded');
            return result;
        }
        catch (error) {
            logger.error('Failed to upload video story:', error.message);
            throw new Error(`Failed to upload video story: ${error.message}`);
        }
    }
    async getStories(userId) {
        try {
            const reel = await this.ig.feed.userStory(userId).items();
            return reel;
        }
        catch (error) {
            logger.error('Failed to get stories:', error.message);
            throw new Error(`Failed to get stories: ${error.message}`);
        }
    }
    async getReelsTrayCandidates() {
        try {
            const tray = await this.ig.feed.reelsTray().items();
            return tray;
        }
        catch (error) {
            logger.error('Failed to get reels tray:', error.message);
            throw new Error(`Failed to get reels tray: ${error.message}`);
        }
    }
    async editProfile(options = {}) {
        try {
            const current = await this.ig.account.currentUser();
            const payload = {
                username: options.username || current.username,
                name: options.name || options.fullName || current.full_name,
                biography: options.biography || options.bio || current.biography,
                email: options.email || current.email || '',
                phone_number: options.phone || current.phone_number || '',
                external_url: options.website || options.externalUrl || current.external_url || '',
                gender: options.gender ?? current.gender ?? 1,
            };
            const result = await this.ig.account.editProfile(payload);
            logger.success('Profile updated');
            return result;
        }
        catch (error) {
            logger.error('Failed to edit profile:', error.message);
            throw new Error(`Failed to edit profile: ${error.message}`);
        }
    }
    async setProfilePicture(photoPath) {
        try {
            let buffer = readFileSync(photoPath);
            try {
                buffer = await sharp(buffer)
                    .resize(320, 320, { fit: 'cover' })
                    .jpeg({ quality: 90 })
                    .toBuffer();
            }
            catch (_) { }
            const result = await this.ig.account.changeProfilePicture({ picture: buffer });
            logger.success('Profile picture updated');
            return result;
        }
        catch (error) {
            logger.error('Failed to set profile picture:', error.message);
            throw new Error(`Failed to set profile picture: ${error.message}`);
        }
    }
    async removeProfilePicture() {
        try {
            await this.ig.account.removeProfilePicture();
            logger.success('Profile picture removed');
        }
        catch (error) {
            logger.error('Failed to remove profile picture:', error.message);
            throw new Error(`Failed to remove profile picture: ${error.message}`);
        }
    }
    async changePassword(oldPassword, newPassword) {
        try {
            await this.ig.account.changePassword(oldPassword, newPassword);
            logger.success('Password changed');
        }
        catch (error) {
            logger.error('Failed to change password:', error.message);
            throw new Error(`Failed to change password: ${error.message}`);
        }
    }
    async searchHashtags(query) {
        try {
            const results = await this.ig.search.tags(query);
            return results.results || results || [];
        }
        catch (error) {
            logger.error('Failed to search hashtags:', error.message);
            throw new Error(`Failed to search hashtags: ${error.message}`);
        }
    }
    async searchLocations(query) {
        try {
            const results = await this.ig.search.place(query);
            return results.items || results || [];
        }
        catch (error) {
            logger.error('Failed to search locations:', error.message);
            throw new Error(`Failed to search locations: ${error.message}`);
        }
    }
    async searchAll(query) {
        const [users, hashtags, locations] = await Promise.allSettled([
            this.searchUsers(query),
            this.searchHashtags(query),
            this.searchLocations(query),
        ]);
        return {
            users: users.status === 'fulfilled' ? users.value : [],
            hashtags: hashtags.status === 'fulfilled' ? hashtags.value : [],
            locations: locations.status === 'fulfilled' ? locations.value : [],
        };
    }
    // ─── Suggested Users ─────────────────────────────────────────────────────────
    async getSuggestedUsers(maxItems = 30) {
        try {
            const feed = this.ig.feed.suggestedUsers();
            const items = await feed.items();
            return (items || []).slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get suggested users:', error.message);
            throw new Error(`Failed to get suggested users: ${error.message}`);
        }
    }
    // ─── Liked Posts ─────────────────────────────────────────────────────────────
    async getLikedPosts(maxItems = 30) {
        try {
            const feed = this.ig.feed.liked();
            const items = await feed.items();
            return (items || []).slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get liked posts:', error.message);
            throw new Error(`Failed to get liked posts: ${error.message}`);
        }
    }
    // ─── Stories ─────────────────────────────────────────────────────────────────
    async deleteStory(mediaId) {
        try {
            await this.ig.media.delete({ mediaId, mediaType: 'PHOTO' });
            logger.info(`Story ${mediaId} deleted`);
        }
        catch (error) {
            logger.error('Failed to delete story:', error.message);
            throw new Error(`Failed to delete story: ${error.message}`);
        }
    }
    async reactToStory(userId, storyId, emoji) {
        try {
            await this.ig.direct.sendReaction({ recipientUsers: [[userId]], storyId, emoji });
            logger.info(`Reacted to story ${storyId} with ${emoji}`);
        }
        catch (error) {
            logger.error('Failed to react to story:', error.message);
            throw new Error(`Failed to react to story: ${error.message}`);
        }
    }
    async getCloseFriendsStories() {
        try {
            const tray = await this.ig.feed.reelsTray('besties').items();
            return tray || [];
        }
        catch (error) {
            logger.error('Failed to get close friends stories:', error.message);
            throw new Error(`Failed to get close friends stories: ${error.message}`);
        }
    }
    // ─── Highlights ──────────────────────────────────────────────────────────────
    async getUserHighlights(userId) {
        try {
            const feed = this.ig.feed.reelsMedia({ userIds: [String(userId)] });
            const items = await feed.items();
            logger.info(`Fetched highlights for user ${userId}`);
            return items || [];
        }
        catch (error) {
            logger.error('Failed to get user highlights:', error.message);
            throw new Error(`Failed to get user highlights: ${error.message}`);
        }
    }
    async getHighlightItems(highlightId) {
        try {
            const feed = this.ig.feed.reelsMedia({ userIds: [String(highlightId)] });
            const items = await feed.items();
            logger.info(`Fetched items for highlight ${highlightId}`);
            return items || [];
        }
        catch (error) {
            logger.error('Failed to get highlight items:', error.message);
            throw new Error(`Failed to get highlight items: ${error.message}`);
        }
    }
    // ─── Notifications ───────────────────────────────────────────────────────────
    async markNotificationsSeen() {
        try {
            await this.ig.news.markAsSeen();
            logger.info('All notifications marked as seen');
        }
        catch (error) {
            logger.error('Failed to mark notifications as seen:', error.message);
            throw new Error(`Failed to mark notifications as seen: ${error.message}`);
        }
    }
    async getFollowRequests() {
        try {
            const feed = this.ig.feed.pendingFriendships();
            return await feed.items();
        }
        catch (error) {
            logger.error('Failed to get follow requests:', error.message);
            throw new Error(`Failed to get follow requests: ${error.message}`);
        }
    }
    async approveFollowRequest(userId) {
        try {
            await this.ig.friendship.approve(userId);
            logger.info(`Approved follow request from user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to approve follow request:', error.message);
            throw new Error(`Failed to approve follow request: ${error.message}`);
        }
    }
    async rejectFollowRequest(userId) {
        try {
            await this.ig.friendship.deny(userId);
            logger.info(`Rejected follow request from user ${userId}`);
        }
        catch (error) {
            logger.error('Failed to reject follow request:', error.message);
            throw new Error(`Failed to reject follow request: ${error.message}`);
        }
    }
}
//# sourceMappingURL=InstagramClientV2.js.map