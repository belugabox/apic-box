import dotenv from 'dotenv';

dotenv.config({
    quiet: true,
});

/**
 * Environment configuration loader
 * Centralizes all environment variables used in the application
 */

// ============================================================================
// LOG CONFIGURATION
// ============================================================================
export const LOG_LEVEL =
    (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info';

// ============================================================================
// DATA STORAGE CONFIGURATION
// ============================================================================
export const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data';

// ============================================================================
// AUTHENTICATION - JWT CONFIGURATION
// ============================================================================

// Validate JWT secrets are provided
if (!process.env.JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
}
if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
        'Missing required environment variable: JWT_REFRESH_SECRET',
    );
}
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ============================================================================
// ADMIN CONFIGURATION
// ============================================================================
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================
export const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '100');
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
if (!process.env.GALLERY_JWT_SECRET) {
    throw new Error(
        'Missing required environment variable: GALLERY_JWT_SECRET',
    );
}
export const GALLERY_JWT_SECRET = process.env.GALLERY_JWT_SECRET;

// Thumbnail generation options
export const THUMBNAIL_SIZE = parseInt(process.env.THUMBNAIL_SIZE || '500', 10);
export const THUMBNAIL_QUALITY = parseInt(
    process.env.THUMBNAIL_QUALITY || '90',
    10,
);
export const THUMBNAIL_WITH_WATERMARK =
    process.env.THUMBNAIL_WITH_WATERMARK !== 'false';

// Create a hash of thumbnail options for change detection
export const getThumbnailOptionsHash = (): string => {
    return `${THUMBNAIL_SIZE}-${THUMBNAIL_QUALITY}-${THUMBNAIL_WITH_WATERMARK}`;
};

// ============================================================================
// ENVIRONMENT SUMMARY (for debugging)
// ============================================================================
export const ENV_SUMMARY = {
    logLevel: LOG_LEVEL,
    dataPath: DATA_FILE_PATH,
    hasJwtSecret: !!JWT_SECRET,
    hasJwtRefreshSecret: !!JWT_REFRESH_SECRET,
    hasGalleryJwtSecret: !!GALLERY_JWT_SECRET,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
};
