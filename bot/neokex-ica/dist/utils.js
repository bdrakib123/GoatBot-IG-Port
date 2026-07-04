import crypto from 'crypto';
export function generateDeviceId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `android-${timestamp}${random}`.substring(0, 16);
}
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export function generateRequestId() {
    return generateUUID();
}
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function getUsernameFromUrl(url) {
    const match = url.match(/instagram\.com\/([^/?]+)/);
    return match ? match[1] : null;
}
export function generateSignature(data, key) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest('hex');
}
export function signPayload(payload, key) {
    const jsonPayload = JSON.stringify(payload);
    const signature = generateSignature(jsonPayload, key);
    return {
        signed_body: `${signature}.${jsonPayload}`,
        ig_sig_key_version: '4',
    };
}
export function generatePhoneId() { return generateUUID(); }
export function generateAdId() { return generateUUID(); }
export function generateWaterfallId() { return generateUUID(); }
export function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0)
        return `${d}d ${h % 24}h ${m % 60}m`;
    if (h > 0)
        return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0)
        return `${m}m ${s % 60}s`;
    return `${s}s`;
}
export function classifyError(error) {
    const msg = (error?.message || String(error)).toLowerCase();
    const status = error?.response?.status || error?.statusCode;
    if (status === 401 || msg.includes('login_required') || msg.includes('not authenticated') || msg.includes('checkpoint')) {
        return 'auth';
    }
    if (status === 429 || msg.includes('429') || msg.includes('throttle') || msg.includes('rate limit') || msg.includes('please wait')) {
        return 'ratelimit';
    }
    if (status >= 500 || msg.includes('503') || msg.includes('502') || msg.includes('500') || msg.includes('network') || msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('enotfound')) {
        return 'network';
    }
    return 'unknown';
}
export function exponentialBackoff(attempt, base = 2000, max = 60000) {
    const delay = Math.min(base * Math.pow(2, attempt - 1), max);
    const jitter = Math.random() * 1000;
    return Math.round(delay + jitter);
}
export function withTimeout(promise, ms, label = 'operation') {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout: ${label} exceeded ${ms}ms`));
        }, ms);
        promise.then((value) => { clearTimeout(timer); resolve(value); }, (err) => { clearTimeout(timer); reject(err); });
    });
}
export async function withRetry(fn, { maxRetries = 3, label = 'request', onRetry = null } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const kind = classifyError(error);
            if (kind === 'auth')
                throw error;
            if (attempt < maxRetries) {
                const delay = kind === 'ratelimit'
                    ? exponentialBackoff(attempt, 10000, 120000)
                    : exponentialBackoff(attempt, 2000, 30000);
                if (onRetry)
                    onRetry({ attempt, maxRetries, delay, error, kind, label });
                await sleep(delay);
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=utils.js.map