/**
 * @module api/stories
 * Stories — get, upload photo story, upload video story, delete, react.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */

import { readFileSync } from 'fs';
import logger from '../Logger.js';

export class StoriesAPI {
  constructor(ig) {
    this.ig = ig;
  }

  async getStories(userId) {
    try {
      return await this.ig.feed.userStory(userId).items();
    } catch (error) {
      logger.error('Failed to get stories:', error.message);
      throw new Error(`Failed to get stories: ${error.message}`);
    }
  }

  async uploadStory(photoPath, options = {}) {
    try {
      const result = await this.ig.publish.story({ file: readFileSync(photoPath), ...options });
      logger.success('Photo story uploaded');
      return result;
    } catch (error) {
      logger.error('Failed to upload story:', error.message);
      throw new Error(`Failed to upload story: ${error.message}`);
    }
  }

  async uploadVideoStory(videoPath, options = {}) {
    try {
      const result = await this.ig.publish.videoStory({ video: readFileSync(videoPath), ...options });
      logger.success('Video story uploaded');
      return result;
    } catch (error) {
      logger.error('Failed to upload video story:', error.message);
      throw new Error(`Failed to upload video story: ${error.message}`);
    }
  }

  async deleteStory(mediaId) {
    try {
      await this.ig.media.delete({ mediaId, mediaType: 'PHOTO' });
      logger.info(`Story ${mediaId} deleted`);
    } catch (error) {
      logger.error('Failed to delete story:', error.message);
      throw new Error(`Failed to delete story: ${error.message}`);
    }
  }

  async reactToStory(userId, storyId, emoji) {
    try {
      await this.ig.direct.sendReaction({ recipientUsers: [[userId]], storyId, emoji });
      logger.info(`Reacted to story ${storyId} with ${emoji}`);
    } catch (error) {
      logger.error('Failed to react to story:', error.message);
      throw new Error(`Failed to react to story: ${error.message}`);
    }
  }

  async getCloseFriendsStories() {
    try {
      const tray = await this.ig.feed.reelsTray('besties').items();
      return tray || [];
    } catch (error) {
      logger.error('Failed to get close friends stories:', error.message);
      throw new Error(`Failed to get close friends stories: ${error.message}`);
    }
  }
}
