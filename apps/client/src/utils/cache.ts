/**
 * Generic LRU (Least Recently Used) Cache implementation
 * with automatic cleanup of old entries and configurable maximum size
 */
export class LRUCache<T> {
    private cache = new Map<string, { value: T; timestamp: number }>();
    private maxSize: number;
    private onEvict?: (key: string, value: T) => void;

    constructor(
        maxSize: number = 50,
        onEvict?: (key: string, value: T) => void,
    ) {
        this.maxSize = maxSize;
        this.onEvict = onEvict;
    }

    /**
     * Store a value in the cache
     * If cache is full, evicts the least recently used entry
     */
    set(key: string, value: T): void {
        // If key already exists, delete it to update its position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // If cache is full, remove the oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = Array.from(this.cache.entries()).sort(
                ([, a], [, b]) => a.timestamp - b.timestamp,
            )[0][0];

            const oldValue = this.cache.get(oldestKey)?.value;
            if (oldValue && this.onEvict) {
                this.onEvict(oldestKey, oldValue);
            }
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    /**
     * Retrieve a value from the cache
     */
    get(key: string): T | undefined {
        return this.cache.get(key)?.value;
    }

    /**
     * Check if a key exists in the cache
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Remove a specific key from the cache
     */
    delete(key: string): boolean {
        const value = this.cache.get(key)?.value;
        const deleted = this.cache.delete(key);

        if (deleted && value && this.onEvict) {
            this.onEvict(key, value);
        }

        return deleted;
    }

    /**
     * Clear all entries from the cache
     */
    clear(): void {
        this.cache.forEach(({ value }, key) => {
            if (this.onEvict) {
                this.onEvict(key, value);
            }
        });
        this.cache.clear();
    }

    /**
     * Get the current size of the cache
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Get all keys in the cache
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }
}

/**
 * Specialized cache for managing blob URLs with automatic cleanup
 */
export class BlobURLCache {
    private cache: LRUCache<string>;

    constructor(maxSize: number = 50) {
        this.cache = new LRUCache<string>(maxSize, (_key, url) => {
            // Cleanup: revoke the blob URL when evicted
            URL.revokeObjectURL(url);
        });
    }

    set(key: string, url: string): void {
        this.cache.set(key, url);
    }

    get(key: string): string | undefined {
        return this.cache.get(key);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size();
    }
}
