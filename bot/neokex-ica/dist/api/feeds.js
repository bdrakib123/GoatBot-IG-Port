/**
 * @module api/feeds
 * Feed access — timeline, user, hashtag, explore, location, activity, notifications.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import logger from '../logger.js';
export class FeedsAPI {
    constructor(ig, userId) {
        this.ig = ig;
        this.userId = userId;
    }
    async getTimelineFeed(maxItems = 30) {
        try {
            const items = await this.ig.feed.timeline().items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get timeline:', error.message);
            throw new Error(`Failed to get timeline: ${error.message}`);
        }
    }
    async getUserFeed(userId, maxItems = 30) {
        try {
            const items = await this.ig.feed.user(userId).items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get user feed:', error.message);
            throw new Error(`Failed to get user feed: ${error.message}`);
        }
    }
    async getHashtagFeed(hashtag, maxItems = 30) {
        try {
            const items = await this.ig.feed.tag(hashtag).items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get hashtag feed:', error.message);
            throw new Error(`Failed to get hashtag feed: ${error.message}`);
        }
    }
    async getExploreFeed(maxItems = 30) {
        try {
            const items = await this.ig.feed.discover().items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get explore feed:', error.message);
            throw new Error(`Failed to get explore feed: ${error.message}`);
        }
    }
    async getLocationFeed(locationId, maxItems = 30) {
        try {
            const items = await this.ig.feed.location(locationId).items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get location feed:', error.message);
            throw new Error(`Failed to get location feed: ${error.message}`);
        }
    }
    async getActivityFeed() {
        try {
            const uid = this.userId();
            const items = uid
                ? await this.ig.feed.reelsMedia({ userIds: [uid] }).items()
                : [];
            return items;
        }
        catch (error) {
            logger.error('Failed to get activity feed:', error.message);
            throw new Error(`Failed to get activity feed: ${error.message}`);
        }
    }
    async getNotifications() {
        try {
            return await this.ig.news.inbox();
        }
        catch (error) {
            logger.error('Failed to get notifications:', error.message);
            throw new Error(`Failed to get notifications: ${error.message}`);
        }
    }
    async getReelsTrayCandidates() {
        try {
            return await this.ig.feed.reelsTray().items();
        }
        catch (error) {
            logger.error('Failed to get reels tray:', error.message);
            throw new Error(`Failed to get reels tray: ${error.message}`);
        }
    }
}
//# sourceMappingURL=feeds.js.map