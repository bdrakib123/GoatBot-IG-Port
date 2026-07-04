/**
 * @module core/client
 * Core Instagram client — authentication, session management, device state.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import { IgApiClient } from 'instagram-private-api';
import { EventEmitter } from 'events';
import logger from '../logger.js';
import { CookieManager } from './cookies.js';
export class InstagramCore extends EventEmitter {
    constructor() {
        super();
        this.ig = new IgApiClient();
        this.userId = null;
        this.username = null;
        this.isLoggedIn = false;
        this.cookies = {};
    }
    // ─── Authentication ────────────────────────────────────────────────────────
    async login(username, password) {
        try {
            logger.info(`Logging in as ${username}`);
            this.ig.state.generateDevice(username);
            const proxy = process.env['IG_PROXY'];
            if (proxy)
                this.ig.state.proxyUrl = proxy;
            const auth = await this.ig.account.login(username, password);
            this.userId = auth.pk.toString();
            this.username = auth.username;
            this.isLoggedIn = true;
            logger.success(`Logged in as ${this.username} (ID: ${this.userId})`);
            this.emit('login', { userId: this.userId, username: this.username });
            return { logged_in_user: auth, userId: this.userId, username: this.username };
        }
        catch (error) {
            const msg = error.message;
            logger.error('Login failed:', msg);
            throw new Error(`Login failed: ${msg}`);
        }
    }
    async loadCookiesFromFile(filePath) {
        try {
            logger.info(`Loading cookies from ${filePath}`);
            const cookies = CookieManager.loadFromFile(filePath);
            if (!cookies['sessionid'] || !cookies['ds_user_id']) {
                throw new Error('Invalid cookie file — missing sessionid or ds_user_id');
            }
            this.cookies = cookies;
            this.userId = cookies['ds_user_id'] ?? null;
            this.ig.state.generateDevice(this.userId);
            for (const [name, value] of Object.entries(cookies)) {
                await this.ig.state.cookieJar.setCookie(`${name}=${value}; Domain=.instagram.com; Path=/;`, 'https://instagram.com');
            }
            this.isLoggedIn = true;
            logger.success('Cookies loaded successfully');
            logger.session(`Authenticated via cookies (User ID: ${this.userId})`);
            this.emit('cookies:loaded', { cookieFile: filePath });
            try {
                const user = await this.ig.account.currentUser();
                this.username = user.username;
                logger.info(`Verified user: ${this.username}`);
            }
            catch {
                logger.warn('Could not verify user from cookies — will proceed anyway');
            }
            return { ...this.cookies };
        }
        catch (error) {
            logger.error('Failed to load cookies:', error.message);
            throw error;
        }
    }
    saveCookiesToFile(filePath, domain = '.instagram.com') {
        CookieManager.saveToFile(filePath, this.cookies, domain);
        logger.success(`Cookies saved to ${filePath}`);
        this.emit('cookies:saved', { cookieFile: filePath });
    }
    setCookies(cookies) {
        this.cookies = { ...this.cookies, ...cookies };
        if (cookies['ds_user_id'])
            this.userId = cookies['ds_user_id'];
        this.isLoggedIn = true;
    }
    getCookies() {
        return { ...this.cookies };
    }
    // ─── Session ───────────────────────────────────────────────────────────────
    async validateSession() {
        try {
            const user = await this.ig.account.currentUser();
            this.username = user.username;
            logger.info(`Session valid — user: ${this.username}`);
            return { valid: true, userId: this.userId, username: this.username };
        }
        catch (error) {
            const msg = error.message;
            logger.error('Session validation failed:', msg);
            this.emit('session:expired', { error });
            return { valid: false, error: msg };
        }
    }
    async pingSession() {
        try {
            await this.ig.account.currentUser();
            return true;
        }
        catch {
            return false;
        }
    }
    async getSessionState() {
        return {
            cookies: this.cookies,
            userId: this.userId,
            username: this.username,
            deviceId: this.ig.state.deviceId,
            uuid: this.ig.state.uuid,
        };
    }
    async loadSessionState(state) {
        if (!state.cookies)
            return;
        this.cookies = state.cookies;
        this.userId = state.userId;
        this.username = state.username;
        for (const [name, value] of Object.entries(state.cookies)) {
            await this.ig.state.cookieJar.setCookie(`${name}=${value}; Domain=.instagram.com; Path=/;`, 'https://instagram.com');
        }
        if (state.deviceId)
            this.ig.state.deviceId = state.deviceId;
        if (state.uuid)
            this.ig.state.uuid = state.uuid;
        this.isLoggedIn = true;
        logger.success('Session state loaded');
    }
    // ─── Identity helpers ──────────────────────────────────────────────────────
    getCurrentUserID() { return this.userId; }
    getCurrentUsername() { return this.username; }
    getIgClient() { return this.ig; }
}
//# sourceMappingURL=client.js.map