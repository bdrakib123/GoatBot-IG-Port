export class FeedsAPI {
    constructor(ig: any, userId: any);
    ig: any;
    userId: any;
    getTimelineFeed(maxItems?: number): Promise<any>;
    getUserFeed(userId: any, maxItems?: number): Promise<any>;
    getHashtagFeed(hashtag: any, maxItems?: number): Promise<any>;
    getExploreFeed(maxItems?: number): Promise<any>;
    getLocationFeed(locationId: any, maxItems?: number): Promise<any>;
    getActivityFeed(): Promise<any>;
    getNotifications(): Promise<any>;
    getReelsTrayCandidates(): Promise<any>;
}
//# sourceMappingURL=feeds.d.ts.map