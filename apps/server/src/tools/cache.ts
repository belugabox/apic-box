import { logger } from './logger';

/**
 * Gestionnaire de cache générique en mémoire avec expiration
 * @example
 * const imageCache = new MemoryCache<Buffer>(30 * 60 * 1000); // 30 minutes
 * const buffer = await imageCache.get(imageId, async () => readFile(path));
 */
export class MemoryCache<T> {
    private cache = new Map<string | number, { value: T; timestamp: number }>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(private maxAge: number) {
        // Nettoyer le cache toutes les 5 minutes
        this.cleanupInterval = setInterval(
            () => {
                this.clean();
            },
            5 * 60 * 1000,
        );
    }

    /**
     * Récupère une valeur du cache ou la génère si elle n'existe pas
     */
    async get(key: string | number, generator: () => Promise<T>): Promise<T> {
        const cacheEntry = this.cache.get(key);

        // Vérifier si le cache est valide et pas expiré
        if (cacheEntry && Date.now() - cacheEntry.timestamp < this.maxAge) {
            return cacheEntry.value;
        }

        // Générer la valeur
        const value = await generator();

        // Stocker en cache
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });

        return value;
    }

    /**
     * Stocke une valeur dans le cache
     */
    set(key: string | number, value: T): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    /**
     * Récupère une valeur du cache sans la générer
     */
    getIfExists(key: string | number): T | null {
        const cacheEntry = this.cache.get(key);

        if (cacheEntry && Date.now() - cacheEntry.timestamp < this.maxAge) {
            return cacheEntry.value;
        }

        // Si expired, supprimer
        if (cacheEntry) {
            this.cache.delete(key);
        }

        return null;
    }

    /**
     * Supprime une clé du cache
     */
    delete(key: string | number): boolean {
        return this.cache.delete(key);
    }

    /**
     * Nettoie le cache des entrées expirées
     */
    clean(): void {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= this.maxAge) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            logger.debug(
                { removed, remaining: this.cache.size },
                '🧹 Cache cleaned',
            );
        }
    }

    /**
     * Vide complètement le cache
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.debug({ cleared: size }, '🗑️  Cache cleared');
    }

    /**
     * Retourne la taille du cache
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Arrête le nettoyage automatique
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
}
