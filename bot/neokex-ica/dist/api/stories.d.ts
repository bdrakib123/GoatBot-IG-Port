export class StoriesAPI {
    constructor(ig: any);
    ig: any;
    getStories(userId: any): Promise<any>;
    uploadStory(photoPath: any, options?: {}): Promise<any>;
    uploadVideoStory(videoPath: any, options?: {}): Promise<any>;
    deleteStory(mediaId: any): Promise<void>;
    reactToStory(userId: any, storyId: any, emoji: any): Promise<void>;
    getCloseFriendsStories(): Promise<any>;
}
//# sourceMappingURL=stories.d.ts.map