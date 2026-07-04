export class InstagramCore extends EventEmitter<[never]> {
    constructor();
    ig: IgApiClient;
    userId: any;
    username: any;
    isLoggedIn: boolean;
    cookies: {};
    login(username: any, password: any): Promise<{
        logged_in_user: import("instagram-private-api").AccountRepositoryLoginResponseLogged_in_user;
        userId: any;
        username: any;
    }>;
    loadCookiesFromFile(filePath: any): Promise<{}>;
    saveCookiesToFile(filePath: any, domain?: string): void;
    setCookies(cookies: any): void;
    getCookies(): {};
    validateSession(): Promise<{
        valid: boolean;
        userId: any;
        username: any;
        error?: undefined;
    } | {
        valid: boolean;
        error: any;
        userId?: undefined;
        username?: undefined;
    }>;
    pingSession(): Promise<boolean>;
    getSessionState(): Promise<{
        cookies: {};
        userId: any;
        username: any;
        deviceId: string;
        uuid: string;
    }>;
    loadSessionState(state: any): Promise<void>;
    getCurrentUserID(): any;
    getCurrentUsername(): any;
    getIgClient(): IgApiClient;
}
import { EventEmitter } from 'events';
import { IgApiClient } from 'instagram-private-api';
//# sourceMappingURL=client.d.ts.map