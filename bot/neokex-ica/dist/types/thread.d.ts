export type ThreadUser = {
    pk: number | string;
    username: string;
    full_name?: string | undefined;
    profile_pic_url?: string | undefined;
    is_private?: boolean | undefined;
};
export type Thread = {
    thread_id: string;
    thread_title?: string | undefined;
    users?: ThreadUser[] | undefined;
    items?: unknown[] | undefined;
    last_permanent_item?: unknown;
    has_older?: boolean | undefined;
    cursor?: string | null | undefined;
};
export type InboxResult = {
    threads: Thread[];
    has_older: boolean;
    cursor: string | null;
    unseen_count: number;
    pending_requests_total: number;
};
export type FullInboxResult = {
    threads: Thread[];
    total: number;
};
export type PendingInboxResult = {
    threads: Thread[];
    has_older: boolean;
};
export type ThreadResult = {
    thread_id: string;
    items: unknown[];
    has_older: boolean;
    cursor: string | null;
    users: ThreadUser[];
};
//# sourceMappingURL=thread.d.ts.map