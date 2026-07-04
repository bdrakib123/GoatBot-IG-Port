/**
 * @module api/users
 * User info, social actions — follow, block, mute, friendship status, followers.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import logger from '../logger.js';
import { sleep } from '../utils/sleep.js';
export class UsersAPI {
    constructor(ig) {
        this.ig = ig;
    }
    // ─── User info ─────────────────────────────────────────────────────────────
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
            return this.getUserInfo(userId);
        }
        catch (error) {
            logger.error('Failed to get user by username:', error.message);
            throw new Error(`Failed to get user by username: ${error.message}`);
        }
    }
    async searchUsers(query) {
        try {
            const results = await this.ig.search.users(query);
            return results['users'] ?? results ?? [];
        }
        catch (error) {
            logger.error('Search failed:', error.message);
            throw new Error(`Search failed: ${error.message}`);
        }
    }
    // ─── Friendship ────────────────────────────────────────────────────────────
    async getFriendshipStatus(userId) {
        try {
            return await this.ig.friendship.show(userId);
        }
        catch (error) {
            logger.error('Failed to get friendship status:', error.message);
            throw new Error(`Failed to get friendship status: ${error.message}`);
        }
    }
    async getFriendshipStatuses(userIds) {
        try {
            const ids = userIds.map(String);
            return await this.ig.friendship.showMany(ids);
        }
        catch (error) {
            logger.error('Failed to get friendship statuses:', error.message);
            throw new Error(`Failed to get friendship statuses: ${error.message}`);
        }
    }
    // ─── Social actions ────────────────────────────────────────────────────────
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
            const feed = this.ig.feed.accountFollowers();
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
                targetUserId: String(userId),
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
    // ─── Followers / following ─────────────────────────────────────────────────
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
}
//# sourceMappingURL=users.js.map