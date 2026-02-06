/**
 * Utility functions for Register form
 */

export function getLinkType(url) {
    if (!url) return { label: 'Website', icon: '🌐' };
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: '▶️' };
    if (url.includes('instagram.com')) return { label: 'Instagram', icon: '📸' };
    if (url.includes('play.google.com')) return { label: 'Play Store', icon: '🤖' };
    if (url.includes('apps.apple.com')) return { label: 'App Store', icon: '🍎' };
    if (url.includes('linkedin.com')) return { label: 'LinkedIn', icon: '💼' };
    if (url.includes('twitter.com') || url.includes('x.com')) return { label: 'Twitter/X', icon: '🐦' };
    if (url.includes('facebook.com')) return { label: 'Facebook', icon: '📘' };
    return { label: 'Website', icon: '🌐' };
}

export const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

export const slugify = (text) => {
    if (!text || typeof text !== 'string') return '';
    let slug = text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\w-]+/g, '')       // Remove non-word characters except hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens

    // If result is empty or too short, return a fallback
    if (!slug || slug.length < 1) {
        return 'project';
    }

    // Limit slug length to 100 characters (reasonable limit for URLs)
    if (slug.length > 100) {
        slug = slug.substring(0, 100).replace(/-+$/, ''); // Remove trailing hyphens
    }

    return slug;
};

/**
 * Generate a unique slug for a project by checking the database.
 * Uses clean slug format (no random IDs) for better SEO and backlinks.
 * If duplicate exists, appends -2, -3, etc. until unique.
 * 
 * @param {string} projectName - The project name to slugify
 * @param {object} supabase - Supabase client instance
 * @param {string} excludeId - Optional project ID to exclude from check (for editing)
 * @returns {Promise<string>} - Unique slug
 */
export const generateUniqueSlug = async (projectName, supabase, excludeId = null) => {
    if (!projectName || !supabase) {
        throw new Error('Project name and supabase client are required');
    }

    const baseSlug = slugify(projectName);
    if (!baseSlug) {
        throw new Error('Invalid project name - cannot generate slug');
    }

    // Start with base slug
    let candidateSlug = baseSlug;
    let counter = 1;

    // Check if slug exists (excluding old random ID pattern)
    while (true) {
        let query = supabase
            .from('projects')
            .select('id, slug')
            .eq('slug', candidateSlug);

        // Exclude current project if editing
        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            // On error, fallback to base slug with timestamp to ensure uniqueness
            return `${baseSlug}-${Date.now()}`;
        }

        // If slug doesn't exist, it's available
        if (!data) {
            return candidateSlug;
        }

        // Slug exists, try next number
        counter++;
        candidateSlug = `${baseSlug}-${counter}`;

        // Safety limit to prevent infinite loop
        if (counter > 1000) {
            return `${baseSlug}-${Date.now()}`;
        }
    }
};

export const sanitizeFileName = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return 'file';
    return fileName
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9.-_]/g, '') // Remove special characters except dots, hyphens, underscores
        .toLowerCase();
};

export const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const saved = new Date(date);
    const diffSeconds = Math.floor((now - saved) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
};

/**
 * Add UTM parameters to outbound URLs for better tracking and attribution.
 * Uses industry-standard UTM parameters that work with Google Analytics and other analytics tools.
 * 
 * @param {string} url - The destination URL
 * @param {string} source - Traffic source (default: 'launchit')
 * @param {string} medium - Traffic medium (default: 'referral')
 * @param {string} campaign - Campaign name (optional)
 * @returns {string} - URL with UTM parameters appended
 */
export const addUtmParams = (url, source = 'launchit', medium = 'referral', campaign = null) => {
    if (!url || typeof url !== 'string') return url;

    try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);

        // Add UTM parameters (only if not already present)
        if (!params.has('utm_source')) {
            params.set('utm_source', source);
        }
        if (!params.has('utm_medium')) {
            params.set('utm_medium', medium);
        }
        if (campaign && !params.has('utm_campaign')) {
            params.set('utm_campaign', campaign);
        }

        urlObj.search = params.toString();
        return urlObj.toString();
    } catch (error) {
        // If URL parsing fails, append UTM params manually
        const separator = url.includes('?') ? '&' : '?';
        const utmParams = `utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}${campaign ? `&utm_campaign=${encodeURIComponent(campaign)}` : ''}`;
        return `${url}${separator}${utmParams}`;
    }
};

