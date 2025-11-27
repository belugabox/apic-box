import { ClientResponse } from 'hono/client';

import { BlobURLCache } from './cache';

// Classe d'erreur personnalisée pour les appels RPC
export class RpcError extends Error {
    constructor(
        public status: number,
        public name: string,
        public message: string,
        public details?: unknown,
    ) {
        super(message || `RPC Error: ${status}`);
        this.name = name;
        this.message = message || `RPC Error: ${status}`;
        this.details = details;
        Object.setPrototypeOf(this, RpcError.prototype);
    }
}

// Types utiles
type ErrorResponse = {
    success?: boolean;
    errors?: Array<{
        message: string;
        [key: string]: unknown;
    }>;
    name?: string;
    message?: string;
    [key: string]: unknown;
};
const BINARY_CONTENT_TYPES = [
    'image',
    'application/pdf',
    'application/octet-stream',
];

const isBinaryResponse = (contentType: string | null): boolean =>
    contentType
        ? BINARY_CONTENT_TYPES.some((type) => contentType.includes(type))
        : false;

export const callRpc = async <T>(
    rpc: Promise<ClientResponse<T>>,
    signal?: AbortSignal,
): Promise<T> => {
    // Vérifier si déjà annulé avant de commencer
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const response = await rpc;
    if (!response.ok) {
        try {
            const errorData = (await response.json()) as ErrorResponse;

            // Handle Arktype validation errors
            if (errorData.success === false && errorData.errors) {
                const firstError = errorData.errors[0];
                throw new RpcError(
                    response.status,
                    'ValidationError',
                    firstError?.message || 'Validation failed',
                    errorData,
                );
            }

            // Handle standard error format
            throw new RpcError(
                response.status,
                errorData.name || 'Error',
                errorData.message || 'An error occurred',
                errorData,
            );
        } catch (err) {
            if (err instanceof RpcError) throw err;
            throw new RpcError(
                response.status,
                'Unknown error',
                'An unknown error occurred',
                err,
            );
        }
    }

    // Déterminer le type de réponse
    const contentType = response.headers.get('Content-Type');
    if (isBinaryResponse(contentType)) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer) as T;
    }

    // Parser comme du JSON
    return (await response.json()) as T;
};

/**
 * Generic blob fetch with caching support
 * @param url - The URL to fetch
 * @param cache - BlobURLCache instance for caching
 * @param cacheKey - Unique cache key
 * @param options - Fetch options (headers, signal, etc.)
 * @param allowEmpty - Allow returning undefined for empty blobs
 * @returns Cached blob URL or undefined
 * @throws RpcError on fetch failure
 */
export const fetchBlobWithCache = async (
    url: string,
    cache: BlobURLCache,
    cacheKey: string,
    options?: RequestInit,
    allowEmpty: boolean = false,
): Promise<string | undefined> => {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Check if already aborted
    if (options?.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    try {
        // Fetch the blob
        const response = await fetch(url, options);
        if (!response || !response.ok) {
            throw new RpcError(
                response.status,
                'FetchError',
                `Failed to fetch blob: ${response.statusText}`,
                { url, status: response.status },
            );
        }

        const blob = await response.blob();
        if (blob.size === 0 && !allowEmpty) {
            return undefined;
        }

        // Create object URL and cache it
        const objectUrl = URL.createObjectURL(blob);
        cache.set(cacheKey, objectUrl);

        return objectUrl;
    } catch (err) {
        if (err instanceof RpcError || err instanceof DOMException) throw err;
        throw new RpcError(
            0,
            'FetchError',
            err instanceof Error ? err.message : 'Unknown fetch error',
            { url, originalError: err },
        );
    }
};

/**
 * Build URL with optional timestamp query parameter for cache busting
 * @param path - Base path
 * @param updatedAt - Optional timestamp for cache busting
 * @returns Complete URL with proper query parameter formatting
 */
export const buildUrlWithTimestamp = (
    path: string,
    updatedAt?: string,
): string => {
    if (!updatedAt) {
        return path;
    }

    const timestamp = new Date(updatedAt).getTime();
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}v=${timestamp}`;
};
