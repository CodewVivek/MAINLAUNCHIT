// Analytics utility functions for Google Analytics
const config = {
    GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
};

/**
 * Check if analytics tracking is enabled (for opt-out feature)
 */
const isAnalyticsEnabled = () => {
    // Check localStorage for opt-out preference
    const optOut = localStorage.getItem('analytics_opt_out');
    return optOut !== 'true';
};

/**
 * Track real users - fires after 4 seconds to filter out bots
 * Bots typically don't stay on a page for 4 seconds, so this helps identify real human users
 */
export const trackRealUser = () => {
    // Check if analytics is enabled
    if (!isAnalyticsEnabled()) return;

    setTimeout(() => {
        if (window.gtag) {
            window.gtag('event', 'real_user', {
                event_category: 'User Quality',
                event_label: 'Real Human User'
            });
        }
    }, 4000);
};

/**
 * Track a custom event in Google Analytics
 * @param {string} action - The event action name (e.g., 'boost_project', 'sign_up')
 * @param {object} params - Additional parameters (e.g., { project_name: 'LaunchIt' })
 */
export const trackEvent = (action, params = {}) => {
    if (!isAnalyticsEnabled()) return;

    if (window.gtag) {
        window.gtag('event', action, params);
    }
};

// ==================== TRAFFIC & USAGE METRICS ====================

/**
 * Track page view (handled by useAnalytics hook, but available for manual tracking)
 */
export const trackPageView = (path) => {
    if (!isAnalyticsEnabled()) return;

    if (window.gtag && config.GA_MEASUREMENT_ID) {
        window.gtag('config', config.GA_MEASUREMENT_ID, {
            page_path: path
        });
    }
};

/**
 * Track traffic source (referrer)
 */
export const trackTrafficSource = (source, medium = 'organic') => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('traffic_source', {
        event_category: 'Traffic',
        source: source || 'direct',
        medium: medium
    });
};

/**
 * Track device and tech info (automatically captured by GA, but can be enhanced)
 */
export const trackDeviceInfo = (deviceType, browser, os) => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('device_info', {
        event_category: 'Technical',
        device_type: deviceType,
        browser: browser,
        os: os
    });
};

// ==================== ENGAGEMENT & EVENTS ====================

/**
 * Track search queries
 * @param {string} query - The search query
 * @param {number} resultCount - Number of results returned
 */
export const trackSearch = (query, resultCount = 0) => {
    if (!isAnalyticsEnabled() || !query || query.trim().length === 0) return;

    // Sanitize query (remove PII, limit length)
    const sanitizedQuery = query.trim().slice(0, 100);

    trackEvent('search', {
        event_category: 'Engagement',
        search_term: sanitizedQuery,
        result_count: resultCount
    });
};

/**
 * Track project submission (success or failure)
 * @param {string} status - 'success' or 'failed'
 * @param {string} reason - Reason for failure (if failed)
 */
export const trackSubmission = (status, reason = null) => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('project_submission', {
        event_category: 'Engagement',
        event_label: status,
        status: status,
        failure_reason: reason || null
    });
};

/**
 * Track outbound link clicks (e.g., "Visit Website" button)
 * @param {string} url - The destination URL
 * @param {string} linkType - Type of link (e.g., 'website', 'social', 'external')
 */
export const trackOutboundClick = (url, linkType = 'external') => {
    if (!isAnalyticsEnabled() || !url) return;

    // Sanitize URL (remove query params that might contain PII)
    const sanitizedUrl = url.split('?')[0].slice(0, 200);

    trackEvent('outbound_click', {
        event_category: 'Engagement',
        event_label: sanitizedUrl,
        link_type: linkType,
        link_url: sanitizedUrl
    });
};

/**
 * Track likes/boosts
 * @param {string} action - 'like' or 'unlike'
 * @param {string} projectId - Project ID (hashed/anonymized)
 */
export const trackLike = (action, projectId = null) => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('project_like', {
        event_category: 'Engagement',
        event_label: action,
        action: action,
        project_id: projectId ? hashString(projectId) : null
    });
};

/**
 * Track shares
 * @param {string} platform - Social platform (e.g., 'twitter', 'linkedin', 'facebook')
 * @param {string} projectId - Project ID (hashed/anonymized)
 */
export const trackShare = (platform, projectId = null) => {
    if (!isAnalyticsEnabled() || !platform) return;

    trackEvent('share', {
        event_category: 'Engagement',
        event_label: platform,
        platform: platform,
        project_id: projectId ? hashString(projectId) : null
    });
};

/**
 * Track sorting preference
 * @param {string} sortBy - Sort option (e.g., 'newest', 'trending', 'top')
 */
export const trackSorting = (sortBy) => {
    if (!isAnalyticsEnabled() || !sortBy) return;

    trackEvent('sort', {
        event_category: 'Engagement',
        event_label: sortBy,
        sort_by: sortBy
    });
};

/**
 * Track scroll depth
 * @param {number} depth - Scroll depth percentage (0-100)
 * @param {string} pagePath - Current page path
 */
export const trackScrollDepth = (depth, pagePath = null) => {
    if (!isAnalyticsEnabled() || depth < 0 || depth > 100) return;

    // Only track milestones (25%, 50%, 75%, 100%) to avoid spam
    const milestones = [25, 50, 75, 100];
    const roundedDepth = milestones.find(m => depth >= m && depth < m + 25) || null;

    if (roundedDepth && trackScrollDepth.lastTracked !== roundedDepth) {
        trackScrollDepth.lastTracked = roundedDepth;

        trackEvent('scroll_depth', {
            event_category: 'Engagement',
            event_label: `${roundedDepth}%`,
            depth: roundedDepth,
            page_path: pagePath || window.location.pathname
        });

        // Reset after 5 seconds to allow tracking next milestone
        setTimeout(() => {
            trackScrollDepth.lastTracked = null;
        }, 5000);
    }
};

// Initialize scroll depth tracking state
trackScrollDepth.lastTracked = null;

/**
 * Track comment submission
 * @param {string} projectId - Project ID (hashed/anonymized)
 */
export const trackComment = (projectId = null) => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('comment', {
        event_category: 'Engagement',
        project_id: projectId ? hashString(projectId) : null
    });
};

/**
 * Track save/bookmark action
 * @param {string} action - 'save' or 'unsave'
 * @param {string} projectId - Project ID (hashed/anonymized)
 */
export const trackSave = (action, projectId = null) => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('save_project', {
        event_category: 'Engagement',
        event_label: action,
        action: action,
        project_id: projectId ? hashString(projectId) : null
    });
};

/**
 * Track follow action
 * @param {string} action - 'follow' or 'unfollow'
 */
export const trackFollow = (action) => {
    if (!isAnalyticsEnabled()) return;

    trackEvent('follow', {
        event_category: 'Engagement',
        event_label: action,
        action: action
    });
};

/**
 * Track category filter usage
 * @param {string} category - Category selected
 */
export const trackCategoryFilter = (category) => {
    if (!isAnalyticsEnabled() || !category) return;

    trackEvent('category_filter', {
        event_category: 'Engagement',
        event_label: category,
        category: category
    });
};

/**
 * Track AI feature usage
 * @param {string} feature - AI feature name (e.g., 'smart_fill', 'generate_data')
 * @param {string} status - 'success' or 'failed'
 */
export const trackAIFeature = (feature, status = 'success') => {
    if (!isAnalyticsEnabled() || !feature) return;

    trackEvent('ai_feature', {
        event_category: 'AI Features',
        event_label: feature,
        feature: feature,
        status: status
    });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Hash a string for privacy (simple hash, not cryptographic)
 * @param {string} str - String to hash
 * @returns {string} - Hashed string
 */
const hashString = (str) => {
    if (!str || typeof str !== 'string') return null;

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
};
