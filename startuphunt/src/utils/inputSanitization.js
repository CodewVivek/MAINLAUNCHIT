/**
 * Input sanitization utilities for security
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize comment content by removing HTML tags and dangerous characters
 * @param {string} content - Raw comment content
 * @returns {string} - Sanitized content
 */
export const sanitizeComment = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove HTML tags (React escapes by default, but this is extra protection)
  let sanitized = content.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters while preserving normal text
  // Keep newlines, spaces, and common punctuation
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim and return
  return sanitized.trim();
};

/**
 * Validate comment length
 * @param {string} content - Comment content
 * @param {number} maxLength - Maximum allowed length (default: 500)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateCommentLength = (content, maxLength = 500) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Comment cannot be empty' };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Comment cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Comment must be ${maxLength} characters or less` };
  }

  return { valid: true, error: null };
};

/**
 * Sanitize and validate comment in one step
 * @param {string} content - Raw comment content
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} - { sanitized: string, valid: boolean, error: string }
 */
export const sanitizeAndValidateComment = (content, maxLength = 500) => {
  const sanitized = sanitizeComment(content);
  const validation = validateCommentLength(sanitized, maxLength);
  
  return {
    sanitized,
    valid: validation.valid,
    error: validation.error
  };
};

/**
 * Rate limiting utility
 * Simple in-memory rate limiter (for client-side throttling)
 * Note: This is client-side only. Server-side rate limiting should be implemented in Supabase RLS or Edge Functions
 */
class RateLimiter {
  constructor() {
    this.actions = new Map(); // Map<actionKey, { count: number, resetTime: number }>
  }

  /**
   * Check if action is allowed
   * @param {string} actionKey - Unique key for the action (e.g., 'like-comment-{userId}')
   * @param {number} maxActions - Maximum actions allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} - True if action is allowed
   */
  isAllowed(actionKey, maxActions, windowMs) {
    const now = Date.now();
    const record = this.actions.get(actionKey);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.actions.set(actionKey, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (record.count >= maxActions) {
      return false; // Rate limit exceeded
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Reset rate limit for an action
   * @param {string} actionKey - Action key to reset
   */
  reset(actionKey) {
    this.actions.delete(actionKey);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Check rate limit for an action
 * @param {string} actionKey - Unique key for the action
 * @param {number} maxActions - Maximum actions (default: 10)
 * @param {number} windowMs - Time window in ms (default: 60000 = 1 minute)
 * @returns {boolean} - True if allowed
 */
export const checkRateLimit = (actionKey, maxActions = 10, windowMs = 60000) => {
  return rateLimiter.isAllowed(actionKey, maxActions, windowMs);
};

