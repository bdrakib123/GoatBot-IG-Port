export class MediaAPI {
    constructor(ig: any, trackSeen: any);
    ig: any;
    trackSeen: any;
    parseResult(raw: any): {
        item_id: any;
        thread_id: any;
        timestamp: any;
    };
    track(raw: any): {
        item_id: any;
        thread_id: any;
        timestamp: any;
    };
    sendPhoto(threadId: any, photoPath: any): Promise<unknown>;
    sendPhotoWithCaption(threadId: any, photoPath: any, caption?: string): Promise<unknown>;
    sendPhotoFromUrl(threadId: any, photoUrl: any): Promise<unknown>;
    sendVideo(threadId: any, videoPath: any): Promise<unknown>;
    sendVideoFromUrl(threadId: any, videoUrl: any): Promise<unknown>;
    sendVoiceNote(threadId: any, audioPath: any): Promise<unknown>;
    sendGif(threadId: any, giphyId: any): Promise<{
        item_id: any;
        thread_id: any;
        timestamp: any;
    }>;
    sendSticker(threadId: any, stickerId: any): Promise<{
        item_id: any;
        thread_id: any;
        timestamp: any;
    }>;
    sendAnimatedMedia(threadId: any, mediaId: any): Promise<{
        item_id: any;
        thread_id: any;
        timestamp: any;
    }>;
    sendLink(threadId: any, linkUrl: any, linkText?: string): Promise<{
        item_id: any;
        thread_id: any;
        timestamp: any;
    }>;
    shareMediaToThread(threadId: any, mediaId: any, message?: string): Promise<{
        item_id: any;
        thread_id: any;
        timestamp: any;
    }>;
    getMessageMediaUrl(threadId: any, itemId: any): Promise<{
        item_id: any;
        item_type: any;
        media: null;
    }>;
    downloadMessageMedia(threadId: any, itemId: any, savePath: any): Promise<{
        path: any;
        size: any;
        type: string;
        url: any;
    }>;
    forwardMessage(fromThreadId: any, toThreadId: any, itemId: any): Promise<unknown>;
    _downloadToTemp(url: any, ext: any, timeoutMs?: number): Promise<string>;
}
//# sourceMappingURL=media.d.ts.map