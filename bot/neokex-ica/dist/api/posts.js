/**
 * @module api/posts
 * Post interactions — like, comment, upload photo/video/carousel, save, delete.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import { readFileSync } from 'fs';
import sharp from 'sharp';
import logger from '../logger.js';
export class PostsAPI {
    constructor(ig) {
        this.ig = ig;
    }
    // ─── Likes ─────────────────────────────────────────────────────────────────
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
    // ─── Comments ──────────────────────────────────────────────────────────────
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
            logger.info(`Deleted comment ${commentId}`);
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
            const items = await this.ig.feed.mediaComments(mediaId).items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get comments:', error.message);
            throw new Error(`Failed to get comments: ${error.message}`);
        }
    }
    // ─── Media info ────────────────────────────────────────────────────────────
    async getMediaInfo(mediaId) {
        try {
            const info = await this.ig.media.info(mediaId);
            return info['items']?.[0];
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
            const items = await this.ig.feed.usertags(userId).items();
            return items.slice(0, maxItems);
        }
        catch (error) {
            logger.error('Failed to get tagged posts:', error.message);
            throw new Error(`Failed to get tagged posts: ${error.message}`);
        }
    }
    async getSavedPosts(maxItems = 30) {
        try {
            const items = await this.ig.feed.saved().items();
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
    // ─── Upload ────────────────────────────────────────────────────────────────
    async uploadPhoto(photoPath, caption = '') {
        try {
            const result = await this.ig.publish.photo({
                file: readFileSync(photoPath),
                caption,
            });
            logger.success('Photo uploaded to feed');
            return result;
        }
        catch (error) {
            logger.error('Failed to upload photo:', error.message);
            throw new Error(`Failed to upload photo: ${error.message}`);
        }
    }
    async uploadVideo(videoPath, caption = '', coverPath) {
        try {
            const options = { video: readFileSync(videoPath), caption };
            if (coverPath)
                options['coverImage'] = readFileSync(coverPath);
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
            const items = await Promise.all(photoPaths.map(async (p) => {
                const raw = readFileSync(p);
                let file = raw;
                try {
                    file = Buffer.from(await sharp(file).jpeg({ quality: 85 }).toBuffer());
                }
                catch { /* ignore */ }
                return { file };
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
}
//# sourceMappingURL=posts.js.map