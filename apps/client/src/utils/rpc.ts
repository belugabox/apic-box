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

// Types
type ErrorResponse = {
    success?: boolean;
    errors?: Array<{ message: string; [key: string]: unknown }>;
    name?: string;
    message?: string;
    [key: string]: unknown;
};

const BINARY_CONTENT_TYPES = [
    'image',
    'application/pdf',
    'application/octet-stream',
    'application/zip',
];

const isBlobContentType = (contentType: string | null): boolean =>
    contentType
        ? BINARY_CONTENT_TYPES.some((type) => contentType.includes(type)) ||
          contentType.includes('application/octet-stream') ||
          contentType.startsWith('image/') ||
          contentType.includes('application/pdf')
        : false;

/**
 * Core fetch handler - transforms Response to typed result
 * Automatically detects JSON vs Blob based on Content-Type
 * @param response - HTTP Response object
 * @returns Parsed response based on content type
 * @throws RpcError on validation or parse failure
 */
const handleResponse = async <T = unknown>(response: Response): Promise<T> => {
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

    // Auto-detect response type from Content-Type header
    const contentType = response.headers.get('Content-Type');
    if (isBlobContentType(contentType)) {
        return (await response.blob()) as T;
    }
    return (await response.json()) as T;
};

/**
 * Generic fetch with automatic error handling and response type detection
 * Automatically detects JSON vs Blob responses and handles all errors as RpcError
 * @param url - The URL to fetch
 * @param options - Fetch options (method, headers, body, signal, etc.)
 * @returns Parsed response (auto-detects JSON vs Blob)
 * @throws RpcError on fetch or validation failure
 */
export const fetch = async <T = unknown>(
    url: string,
    options?: RequestInit,
): Promise<T> => {
    if (options?.signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');

    try {
        return handleResponse<T>(await globalThis.fetch(url, options));
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
 * Hono ClientResponse wrapper - uses central error handling
 * @param rpc - Promise<ClientResponse> from Hono client
 * @param signal - Optional AbortSignal for cancellation
 * @returns Parsed response based on content type
 * @throws RpcError on failure
 */
export const callRpc = async <T>(
    rpc: Promise<ClientResponse<T>>,
    signal?: AbortSignal,
): Promise<T> => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
        return handleResponse<T>(await rpc);
    } catch (err) {
        if (err instanceof RpcError || err instanceof DOMException) throw err;
        throw new RpcError(
            0,
            'FetchError',
            err instanceof Error ? err.message : 'Unknown fetch error',
            err,
        );
    }
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
    // Return cached blob URL if available
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Fetch blob with central error handler
    const blob = await fetch<Blob>(url, options);
    if (blob.size === 0 && !allowEmpty) return undefined;

    // Create and cache object URL
    const objectUrl = URL.createObjectURL(blob);
    cache.set(cacheKey, objectUrl);
    return objectUrl;
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
