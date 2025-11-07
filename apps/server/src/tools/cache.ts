export namespace Cache {
    const cacheStore: Map<string, any> = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    export const getCached = (key: string): string[] | null => {
        const entry = cacheStore.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_DURATION) {
            cacheStore.delete(key);
            return null;
        }

        return entry.data;
    };

    export const setCache = (key: string, data: string[]): void => {
        cacheStore.set(key, {
            data,
            timestamp: Date.now(),
        });
    };

    export const clearCache = (key: string): void => {
        cacheStore.delete(key);
    };
}
