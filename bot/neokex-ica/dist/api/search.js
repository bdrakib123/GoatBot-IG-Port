/**
 * @module api/search
 * Search — hashtags and locations.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
import logger from '../logger.js';
export class SearchAPI {
    constructor(ig) {
        this.ig = ig;
    }
    async searchHashtags(query) {
        try {
            const results = await this.ig.search.tags(query);
            return results['results'] ?? results ?? [];
        }
        catch (error) {
            logger.error('Failed to search hashtags:', error.message);
            throw new Error(`Failed to search hashtags: ${error.message}`);
        }
    }
    async searchLocations(query) {
        try {
            const results = await this.ig.search.places(query);
            return results['items'] ?? results ?? [];
        }
        catch (error) {
            logger.error('Failed to search locations:', error.message);
            throw new Error(`Failed to search locations: ${error.message}`);
        }
    }
}
//# sourceMappingURL=search.js.map