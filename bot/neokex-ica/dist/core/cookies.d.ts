export class CookieManager {
    /**
     * Parse a Netscape-format cookie file into a key/value map.
     * @param {string} content
     * @returns {Record<string,string>}
     */
    static parseNetscape(content: string): Record<string, string>;
    /**
     * Load cookies from a Netscape-format file on disk.
     * Throws if the file does not exist.
     * @param {string} filePath
     * @returns {Record<string,string>}
     */
    static loadFromFile(filePath: string): Record<string, string>;
    /**
     * Serialise a cookie map back to a Netscape-format file.
     * @param {string} filePath
     * @param {Record<string,string>} cookies
     * @param {string} [domain='.instagram.com']
     */
    static saveToFile(filePath: string, cookies: Record<string, string>, domain?: string): void;
    /**
     * Render a cookie map as a `Cookie` header string.
     * @param {Record<string,string>} cookies
     * @returns {string}
     */
    static toString(cookies: Record<string, string>): string;
}
//# sourceMappingURL=cookies.d.ts.map