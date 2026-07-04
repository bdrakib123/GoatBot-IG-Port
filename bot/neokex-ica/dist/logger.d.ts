declare const _default: Logger;
export default _default;
declare class Logger {
    constructor(prefix?: string);
    prefix: string;
    timestamp(): string;
    format(level: any, color: any, message: any, data: any): string;
    info(message: any, data: any): void;
    success(message: any, data: any): void;
    warn(message: any, data: any): void;
    error(message: any, data: any): void;
    debug(message: any, data: any): void;
    event(message: any, data: any): void;
    session(message: any): void;
    login(username: any): void;
    message(from: any, preview: any): void;
    custom(level: any, color: any, message: any, data: any): void;
}
//# sourceMappingURL=logger.d.ts.map