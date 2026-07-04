export type UserInfo = {
    pk: number | string;
    username: string;
    full_name: string;
    biography?: string | undefined;
    external_url?: string | undefined;
    follower_count?: number | undefined;
    following_count?: number | undefined;
    media_count?: number | undefined;
    is_private?: boolean | undefined;
    is_verified?: boolean | undefined;
    profile_pic_url?: string | undefined;
};
export type FriendshipStatus = {
    following: boolean;
    followed_by: boolean;
    blocking: boolean;
    muting: boolean;
    is_private: boolean;
    incoming_request: boolean;
    outgoing_request: boolean;
};
export type SessionState = {
    cookies: Record<string, string>;
    userId: string | null;
    username: string | null;
    deviceId?: string | undefined;
    uuid?: string | undefined;
};
export type SessionValidationResult = {
    valid: boolean;
    userId?: string | null | undefined;
    username?: string | null | undefined;
    error?: string | undefined;
};
export type LoginResult = {
    logged_in_user: unknown;
    userId: string;
    username: string;
};
//# sourceMappingURL=user.d.ts.map