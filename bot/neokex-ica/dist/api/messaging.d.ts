export class MessagingAPI {
    constructor(ig: any, emitter: any, replyHandlers: any, trackSeen: any);
    ig: any;
    emitter: any;
    replyHandlers: any;
    trackSeen: any;
    parseResult(raw: any): {
        item_id: any;
        thread_id: any;
        timestamp: any;
        status: string;
    };
    sendMessage(threadId: any, text: any, options?: {}): Promise<unknown>;
    sendMessageToUser(userId: any, text: any, options?: {}): Promise<unknown>;
    sendMessageBulk(targets: any, text: any, options?: {}): Promise<({
        threadId: any;
        success: boolean;
        result: unknown;
        error?: undefined;
    } | {
        threadId: any;
        success: boolean;
        error: any;
        result?: undefined;
    })[]>;
    scheduleMessage(threadId: any, text: any, delayMs: any, options?: {}): Promise<any>;
    sendMessageWithReply(threadId: any, text: any, onReply: any, options?: {}): Promise<unknown>;
    sendMessageToUserWithReply(userId: any, text: any, onReply: any, options?: {}): Promise<unknown>;
    registerReplyHandler(itemId: any, callback: any, timeoutMs?: number): void;
    clearReplyHandler(itemId: any): boolean;
    unsendMessage(threadId: any, itemId: any): Promise<void>;
    editMessage(threadId: any, itemId: any, newText: any): Promise<{
        success: boolean;
        item_id: any;
        new_text: any;
    }>;
    sendReaction(threadId: any, itemId: any, emoji: any): Promise<void>;
    removeReaction(threadId: any, itemId: any): Promise<void>;
    indicateTyping(threadId: any, isTyping?: boolean): Promise<void>;
}
//# sourceMappingURL=messaging.d.ts.map