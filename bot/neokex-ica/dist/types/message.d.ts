export type SendResult = {
    item_id: string;
    thread_id: string;
    timestamp: string;
    text?: string | undefined;
    status: "sent" | "failed";
};
export type MessageReply = {
    item_id: string;
    text: string;
    user_id: string | number;
    timestamp: string;
};
export type MessageEvent = {
    thread_id: string;
    item_id: string;
    user_id: string | number;
    text: string;
    timestamp: string;
    is_from_me: boolean;
    thread_title: string | null;
    thread_users: unknown[];
    message: RawMessageItem;
    messageReply?: MessageReply | undefined;
};
export type RawMessageItem = {
    item_id?: string | undefined;
    user_id?: string | number | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    item_type?: string | undefined;
    media?: unknown;
    replied_to_message?: RawMessageItem | undefined;
};
export type BulkSendResult = {
    threadId: string;
    success: boolean;
    result?: SendResult | undefined;
    error?: string | undefined;
};
export type ScheduledMessage = Promise<SendResult> & {
    cancel: () => void;
};
export type ReplyHandlerEntry = {
    callback: ReplyCallback;
    timerId: any;
    registeredAt: number;
};
export type ReplyCallback = (arg0: MessageEvent) => void | Promise<void>;
export type MediaInfo = {
    item_id: string;
    item_type?: string | undefined;
    media: object | null;
};
export type DownloadedMedia = {
    path: string;
    size: number;
    type: string;
    url: string;
};
//# sourceMappingURL=message.d.ts.map