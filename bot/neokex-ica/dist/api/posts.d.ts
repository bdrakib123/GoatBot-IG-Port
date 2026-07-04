export class PostsAPI {
    constructor(ig: any);
    ig: any;
    likePost(mediaId: any): Promise<void>;
    unlikePost(mediaId: any): Promise<void>;
    commentPost(mediaId: any, text: any): Promise<any>;
    deleteComment(mediaId: any, commentId: any): Promise<void>;
    likeComment(mediaId: any, commentId: any): Promise<void>;
    unlikeComment(mediaId: any, commentId: any): Promise<void>;
    getComments(mediaId: any, maxItems?: number): Promise<any>;
    getMediaInfo(mediaId: any): Promise<any>;
    deletePost(mediaId: any): Promise<void>;
    getTaggedPosts(userId: any, maxItems?: number): Promise<any>;
    getSavedPosts(maxItems?: number): Promise<any>;
    savePost(mediaId: any): Promise<void>;
    unsavePost(mediaId: any): Promise<void>;
    uploadPhoto(photoPath: any, caption?: string): Promise<any>;
    uploadVideo(videoPath: any, caption: string | undefined, coverPath: any): Promise<any>;
    uploadCarousel(photoPaths: any, caption?: string): Promise<any>;
}
//# sourceMappingURL=posts.d.ts.map