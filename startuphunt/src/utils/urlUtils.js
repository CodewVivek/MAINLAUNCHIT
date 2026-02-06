/**
 * URL Utilities
 * Functions for normalizing and validating URLs
 */

/**
 * Normalize a URL for comparison
 * Removes protocol, www, trailing slashes, query params, and hash
 * Converts to lowercase for case-insensitive matching
 * 
 * @param {string} url - The URL to normalize
 * @returns {string} - Normalized URL
 * 
 * @example
 * normalizeUrl('https://www.Example.com/') // 'example.com'
 * normalizeUrl('http://example.com?ref=123') // 'example.com'
 */
export const normalizeUrl = (url) => {
    if (!url) return '';

    let normalized = url.toLowerCase().trim();

    // Remove protocol (http://, https://)
    normalized = normalized.replace(/^https?:\/\//, '');

    // Remove www
    normalized = normalized.replace(/^www\./, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Remove query params and hash
    normalized = normalized.split('?')[0].split('#')[0];

    return normalized;
};

/**
 * Check if two URLs are the same after normalization
 * 
 * @param {string} url1 - First URL
 * @param {string} url2 - Second URL
 * @returns {boolean} - True if URLs match
 */
export const urlsMatch = (url1, url2) => {
    return normalizeUrl(url1) === normalizeUrl(url2);
};

/**
 * Validate URL format
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL format
 */
export const isValidUrl = (url) => {
    if (!url) return false;

    try {
        // Add protocol if missing for URL constructor
        const urlToTest = url.startsWith('http') ? url : `https://${url}`;
        new URL(urlToTest);
        return true;
    } catch {
        return false;
    }
};
