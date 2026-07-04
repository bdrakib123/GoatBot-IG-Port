export class UsersAPI {
    constructor(ig: any);
    ig: any;
    getUserInfo(userId: any): Promise<any>;
    getUserInfoByUsername(username: any): Promise<any>;
    searchUsers(query: any): Promise<any>;
    getFriendshipStatus(userId: any): Promise<any>;
    getFriendshipStatuses(userIds: any): Promise<any>;
    followUser(userId: any): Promise<void>;
    unfollowUser(userId: any): Promise<void>;
    blockUser(userId: any): Promise<void>;
    unblockUser(userId: any): Promise<void>;
    getBlockedUsers(): Promise<any>;
    muteUser(userId: any, muteStories?: boolean, mutePosts?: boolean): Promise<void>;
    getFollowers(userId: any, maxItems?: number): Promise<any[]>;
    getFollowing(userId: any, maxItems?: number): Promise<any[]>;
}
//# sourceMappingURL=users.d.ts.map