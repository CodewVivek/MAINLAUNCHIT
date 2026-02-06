/**
 * Supabase Image Transform Utility
 * Optimizes images on-the-fly using Supabase Storage transforms
 * Reduces network payload from 8.9MB to ~500KB-1MB
 */

/**
 * Get optimized image URL with Supabase transforms
 * @param {string} imageUrl - Original Supabase storage URL
 * @param {Object} options - Transform options
 * @param {number} options.width - Target width (default: 800)
 * @param {number} options.height - Target height (optional, maintains aspect ratio)
 * @param {number} options.quality - JPEG quality 1-100 (default: 80)
 * @param {string} options.format - Output format: 'webp', 'avif', 'jpeg', 'png' (default: 'webp')
 * @param {boolean} options.resize - Resize mode: 'cover', 'contain', 'fill' (default: 'cover')
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl) return imageUrl;

    // If not a Supabase storage URL, return as-is
    if (!imageUrl.includes('supabase.co') || !imageUrl.includes('/storage/v1/object/public/')) {
        return imageUrl;
    }

    const {
        width = 800,
        height = null,
        quality = 80,
        format = 'webp',
        resize = 'cover'
    } = options;

    // Parse the URL
    const url = new URL(imageUrl);

    // Build transform parameters
    const params = new URLSearchParams();
    params.set('width', width.toString());
    if (height) {
        params.set('height', height.toString());
    }
    params.set('quality', quality.toString());
    params.set('format', format);
    params.set('resize', resize);

    // Add transform parameters to URL
    url.search = params.toString();

    return url.toString();
};

/**
 * Get optimized thumbnail URL (smaller, faster loading)
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized thumbnail URL
 */
export const getThumbnailUrl = (imageUrl) => {
    return getOptimizedImageUrl(imageUrl, {
        width: 400,
        height: 225,
        quality: 75,
        format: 'webp',
        resize: 'cover'
    });
};

/**
 * Get optimized cover image URL (for project details)
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized cover URL
 */
export const getCoverImageUrl = (imageUrl) => {
    return getOptimizedImageUrl(imageUrl, {
        width: 1200,
        height: null, // Maintain aspect ratio
        quality: 85,
        format: 'webp',
        resize: 'contain'
    });
};

/**
 * Get optimized logo URL (small, high quality)
 * @param {string} imageUrl - Original logo URL
 * @returns {string} Optimized logo URL
 */
export const getLogoUrl = (imageUrl) => {
    return getOptimizedImageUrl(imageUrl, {
        width: 128,
        height: 128,
        quality: 90,
        format: 'webp',
        resize: 'contain'
    });
};

/**
 * Get optimized avatar URL
 * @param {string} imageUrl - Original avatar URL
 * @returns {string} Optimized avatar URL
 */
export const getAvatarUrl = (imageUrl) => {
    return getOptimizedImageUrl(imageUrl, {
        width: 64,
        height: 64,
        quality: 85,
        format: 'webp',
        resize: 'cover'
    });
};

