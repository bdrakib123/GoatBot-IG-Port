/**
 * @module api/media
 * Media sending — photos, videos, voice notes, GIFs, stickers, links, carousels, URL downloads.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import sharp from 'sharp';
import axios from 'axios';
import logger from '../logger.js';
import { withRetry } from '../utils/retry.js';
import { withTimeout } from '../utils/timeout.js';
import { sleep } from '../utils/sleep.js';
const DOWNLOAD_TIMEOUT = 45_000;
const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export class MediaAPI {
    constructor(ig, trackSeen) {
        this.ig = ig;
        this.trackSeen = trackSeen;
    }
    parseResult(raw) {
        const r = raw;
        const p = r?.['payload'];
        return {
            item_id: p?.['item_id'] ?? r['item_id'] ?? '',
            thread_id: p?.['thread_id'] ?? r['thread_id'] ?? '',
            timestamp: p?.['timestamp'] ?? r['timestamp'] ?? Date.now().toString(),
        };
    }
    track(raw) {
        const result = this.parseResult(raw);
        if (result.item_id)
            this.trackSeen(result.item_id);
        return result;
    }
    // ─── Photo ─────────────────────────────────────────────────────────────────
    async sendPhoto(threadId, photoPath) {
        return withRetry(async () => {
            const original = readFileSync(photoPath);
            let buf = original;
            try {
                const img = sharp(original);
                const meta = await img.metadata();
                const needsResize = (meta.width ?? 0) > 1080 || (meta.height ?? 0) > 1080;
                const resizeOpts = needsResize
                    ? { width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true }
                    : undefined;
                buf = Buffer.from(await img.resize(resizeOpts).jpeg({ quality: 85, mozjpeg: true }).toBuffer());
                if (buf.length > PHOTO_MAX_BYTES) {
                    buf = Buffer.from(await sharp(original).resize(resizeOpts).jpeg({ quality: 65, mozjpeg: true }).toBuffer());
                }
            }
            catch {
                buf = original;
            }
            const raw = await this.ig.entity.directThread(threadId).broadcastPhoto({ file: buf });
            const result = this.track(raw);
            logger.success(`Photo sent to thread ${threadId}`);
            return result;
        }, {
            maxRetries: 3, label: 'sendPhoto',
            onRetry: ({ attempt, delay }) => logger.warn(`sendPhoto retry ${attempt} in ${(delay / 1000).toFixed(1)}s`),
        });
    }
    async sendPhotoWithCaption(threadId, photoPath, caption = '') {
        const result = await this.sendPhoto(threadId, photoPath);
        if (caption) {
            await sleep(400);
            await this.ig.entity.directThread(threadId).broadcastText(caption);
        }
        return result;
    }
    async sendPhotoFromUrl(threadId, photoUrl) {
        const tmp = await this._downloadToTemp(photoUrl, 'jpg');
        try {
            return await this.sendPhoto(threadId, tmp);
        }
        finally {
            try {
                unlinkSync(tmp);
            }
            catch { /* ignore */ }
        }
    }
    // ─── Video ─────────────────────────────────────────────────────────────────
    async sendVideo(threadId, videoPath) {
        return withRetry(async () => {
            const raw = await this.ig.entity.directThread(threadId).broadcastVideo({ video: readFileSync(videoPath) });
            const result = this.track(raw);
            logger.info(`Video sent to thread ${threadId}`);
            return result;
        }, { maxRetries: 2, label: 'sendVideo' });
    }
    async sendVideoFromUrl(threadId, videoUrl) {
        const tmp = await this._downloadToTemp(videoUrl, 'mp4', 90_000);
        try {
            return await this.sendVideo(threadId, tmp);
        }
        finally {
            try {
                unlinkSync(tmp);
            }
            catch { /* ignore */ }
        }
    }
    // ─── Voice note ────────────────────────────────────────────────────────────
    async sendVoiceNote(threadId, audioPath) {
        return withRetry(async () => {
            const raw = await this.ig.entity.directThread(threadId).broadcastVoice({ file: readFileSync(audioPath) });
            const result = this.track(raw);
            logger.info(`Voice note sent to thread ${threadId}`);
            return result;
        }, { maxRetries: 2, label: 'sendVoiceNote' });
    }
    // ─── GIF / Sticker / Animated ──────────────────────────────────────────────
    async sendGif(threadId, giphyId) {
        const raw = await this.ig.entity.directThread(threadId).broadcastGiphy({ giphy_id: giphyId });
        const result = this.track(raw);
        logger.info(`GIF sent to thread ${threadId}`);
        return result;
    }
    async sendSticker(threadId, stickerId) {
        const raw = await this.ig.entity.directThread(threadId).broadcastSticker({ sticker_id: stickerId });
        const result = this.track(raw);
        logger.info(`Sticker sent to thread ${threadId}`);
        return result;
    }
    async sendAnimatedMedia(threadId, mediaId) {
        const raw = await this.ig.entity.directThread(threadId).broadcastAnimatedMedia({ media_id: mediaId });
        const result = this.track(raw);
        logger.info(`Animated media sent to thread ${threadId}`);
        return result;
    }
    // ─── Link & media share ────────────────────────────────────────────────────
    async sendLink(threadId, linkUrl, linkText = '') {
        const raw = await this.ig.entity.directThread(threadId).broadcastLink(linkUrl, linkText);
        const result = this.track(raw);
        logger.info(`Link sent to thread ${threadId}`);
        return result;
    }
    async shareMediaToThread(threadId, mediaId, message = '') {
        const raw = await this.ig.entity.directThread(threadId).broadcastMediaShare({ media_id: mediaId, text: message });
        const result = this.track(raw);
        logger.info(`Media ${mediaId} shared to thread ${threadId}`);
        return result;
    }
    // ─── Media info & download ─────────────────────────────────────────────────
    async getMessageMediaUrl(threadId, itemId) {
        const threadFeed = this.ig.feed.directThread({ thread_id: threadId });
        const items = await threadFeed.items();
        const message = items.find((i) => i['item_id'] === itemId);
        if (!message)
            throw new Error(`Message ${itemId} not found in thread ${threadId}`);
        const out = {
            item_id: itemId,
            item_type: message['item_type'],
            media: null,
        };
        const media = message['media'];
        if (media) {
            out.media = { id: media['id'], media_type: media['media_type'] };
            const iv2 = media['image_versions2'];
            if (iv2) {
                out.media.images = iv2['candidates'].map((c) => ({
                    url: c['url'], width: c['width'], height: c['height'],
                }));
            }
            const vv = media['video_versions'];
            if (vv) {
                out.media.videos = vv.map((v) => ({
                    url: v['url'], width: v['width'], height: v['height'], type: v['type'],
                }));
            }
            const carousel = media['carousel_media'];
            if (carousel) {
                out.media.carousel = carousel.map((c) => ({
                    id: c['id'],
                    images: c['image_versions2']?.['candidates'],
                    videos: c['video_versions'],
                }));
            }
        }
        return out;
    }
    async downloadMessageMedia(threadId, itemId, savePath) {
        const info = await this.getMessageMediaUrl(threadId, itemId);
        if (!info.media)
            throw new Error('No media in this message');
        let url;
        let ext = 'jpg';
        if (info.media.videos?.length) {
            url = info.media.videos[0].url;
            ext = 'mp4';
        }
        else if (info.media.images?.length) {
            url = info.media.images[0].url;
        }
        else
            throw new Error('No downloadable URL found');
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60_000 });
        const path = savePath ?? `/tmp/media_${Date.now()}.${ext}`;
        writeFileSync(path, res.data);
        logger.success(`Media downloaded to ${path}`);
        return { path, size: res.data.length, type: ext, url };
    }
    async forwardMessage(fromThreadId, toThreadId, itemId) {
        const info = await this.getMessageMediaUrl(fromThreadId, itemId);
        if (info.media?.videos?.length)
            return this.sendVideoFromUrl(toThreadId, info.media.videos[0].url);
        if (info.media?.images?.length)
            return this.sendPhotoFromUrl(toThreadId, info.media.images[0].url);
        throw new Error('Cannot forward this message type');
    }
    // ─── Internal helpers ──────────────────────────────────────────────────────
    async _downloadToTemp(url, ext, timeoutMs = DOWNLOAD_TIMEOUT) {
        const response = await withTimeout(axios.get(url, {
            responseType: 'arraybuffer',
            timeout: timeoutMs,
            headers: { 'User-Agent': 'Mozilla/5.0' },
        }), timeoutMs + 5_000, 'download');
        const path = `/tmp/${ext}_${Date.now()}.${ext}`;
        writeFileSync(path, response.data);
        return path;
    }
}
//# sourceMappingURL=media.js.map