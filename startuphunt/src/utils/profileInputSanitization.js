/**
 * Profile Input Sanitization Utilities
 * Sanitizes and validates profile form inputs before saving to database
 */

/**
 * Sanitize text input (name, bio)
 * @param {string} input - Raw input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export const sanitizeText = (input, maxLength = 1000) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validate and sanitize URL
 * @param {string} url - Raw URL string
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
export const validateAndSanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: true, sanitized: '', error: null }; // Empty is allowed for optional fields
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { valid: true, sanitized: '', error: null };
  }

  // Basic URL validation
  try {
    const urlObj = new URL(trimmed);

    // Check if HTTPS or HTTP
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return { valid: false, sanitized: '', error: 'URL must start with http:// or https://' };
    }

    return { valid: true, sanitized: trimmed, error: null };
  } catch (e) {
    return { valid: false, sanitized: '', error: 'Invalid URL format' };
  }
};

/**
 * Validate bio length
 * @param {string} bio - Bio text
 * @param {number} minLength - Minimum length (default: 40)
 * @param {number} maxLength - Maximum length (default: 200)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateBio = (bio, minLength = 40, maxLength = 200) => {
  if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
    return { valid: true, error: null }; // Optional
  }

  const trimmed = bio.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `Bio must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Bio must be ${maxLength} characters or less` };
  }

  return { valid: true, error: null };
};

/**
 * Validate full name
 * @param {string} name - Full name
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateFullName = (name, maxLength = 100) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Name must be ${maxLength} characters or less` };
  }

  // Check for only whitespace
  if (!trimmed.replace(/\s+/g, '').length) {
    return { valid: false, error: 'Name cannot be only whitespace' };
  }

  return { valid: true, error: null };
};

/**
 * Validate skills array
 * @param {Array} skills - Skills array
 * @param {Array} validOptions - List of valid skill options
 * @returns {object} - { valid: boolean, error: string, sanitized: Array }
 */
export const validateSkills = (skills, validOptions = []) => {
  if (!skills) {
    return { valid: true, error: null, sanitized: [] }; // Optional field
  }

  // Handle string (legacy data)
  let skillsArray = [];
  if (typeof skills === 'string') {
    try {
      skillsArray = JSON.parse(skills);
    } catch (e) {
      // If not valid JSON, treat as empty
      skillsArray = [];
    }
  } else if (Array.isArray(skills)) {
    skillsArray = skills;
  } else {
    skillsArray = [];
  }

  // Filter out invalid options if validOptions provided
  if (validOptions.length > 0) {
    skillsArray = skillsArray.filter(skill => validOptions.includes(skill));
  }

  // Limit to 1 skill (as per current UI)
  if (skillsArray.length > 1) {
    skillsArray = [skillsArray[0]];
  }

  return { valid: true, error: null, sanitized: skillsArray };
};

/**
 * Validate interest/category
 * @param {string} interest - Interest value
 * @param {Array} validOptions - List of valid interest options
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateInterest = (interest, validOptions = []) => {
  if (!interest || typeof interest !== 'string' || interest.trim().length === 0) {
    return { valid: true, error: null }; // Optional
  }

  const trimmed = interest.trim();

  // If validOptions provided, check if it's in the list
  if (validOptions.length > 0 && !validOptions.includes(trimmed)) {
    return { valid: false, error: 'Invalid interest/category selected' };
  }

  return { valid: true, error: null };
};

