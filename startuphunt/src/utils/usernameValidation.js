// Username validation utility
const USERNAME_RULES = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-z0-9_.-]+$/, // Lowercase, alphanumeric, underscore, period, hyphen
  reserved: [
    'admin', 'administrator', 'support', 'help', 'api', 'dashboard', 
    'login', 'register', 'signup', 'signin', 'settings', 'account',
    'profile', 'user', 'users', 'about', 'aboutus', 'privacy', 
    'terms', 'faq', 'contact', 'search', 'submit', 'launches',
    'category', 'community', 'suggestions', 'launchitguide', 'how-it-works',
    'www', 'mail', 'email', 'root', 'system', 'test', 'demo',
    'null', 'undefined', 'true', 'false'
  ]
};

export const validateUsername = (username) => {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    return { valid: false, errors: ['Username is required'], sanitized: '' };
  }
  
  const trimmed = username.trim().toLowerCase();
  
  // Length validation
  if (trimmed.length < USERNAME_RULES.minLength) {
    errors.push(`Username must be at least ${USERNAME_RULES.minLength} characters`);
  }
  if (trimmed.length > USERNAME_RULES.maxLength) {
    errors.push(`Username must be ${USERNAME_RULES.maxLength} characters or less`);
  }
  
  // Character validation
  if (!USERNAME_RULES.pattern.test(trimmed)) {
    errors.push('Username can only contain lowercase letters, numbers, periods, hyphens, and underscores');
  }
  
  // Start/End validation
  if (trimmed.match(/^[._-]/) || trimmed.match(/[._-]$/)) {
    errors.push('Username cannot start or end with a period, underscore, or hyphen');
  }
  
  // Consecutive characters validation
  if (/(\.{2,}|_{2,}|-{2,})/.test(trimmed)) {
    errors.push('Username cannot contain consecutive periods, underscores, or hyphens');
  }
  
  // Reserved words (case-insensitive)
  if (USERNAME_RULES.reserved.includes(trimmed)) {
    errors.push('This username is reserved and cannot be used');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized: trimmed
  };
};

export const checkUsernameAvailability = async (username, currentUserId, supabase) => {
  try {
    // Check rate limit first (for availability checks)
    const { checkAvailabilityCheckRateLimit, recordAvailabilityCheck } = await import('./usernameRateLimit');
    
    const rateLimitCheck = await checkAvailabilityCheckRateLimit(currentUserId || null, supabase);
    if (!rateLimitCheck.allowed) {
      return { 
        available: false, 
        error: rateLimitCheck.message || 'Too many availability checks. Please wait a moment.' 
      };
    }

    // Case-insensitive check
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', username) // Case-insensitive comparison
      .maybeSingle();
    
    // Record the check (async, don't wait)
    recordAvailabilityCheck(currentUserId || null, username, supabase).catch(() => {
      // Silent fail - recording is not critical
    });
    
    if (error) {
      return { available: false, error: 'Failed to check availability' };
    }
    
    // Available if no user found, or if it's the current user's username
    const available = !data || data.id === currentUserId;
    
    return { 
      available, 
      error: available ? null : 'Username is already taken' 
    };
  } catch (error) {
    return { available: false, error: 'Failed to check availability' };
  }
};

export const generateUsernameSuggestions = async (baseUsername, supabase, excludeUserId = null) => {
  const suggestions = [];
  const base = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!base || base.length < 2) return suggestions;
  
  // Pattern 1: Add numbers
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${base}${i}`);
    suggestions.push(`${base}${Math.floor(Math.random() * 1000)}`);
  }
  
  // Pattern 2: Add suffixes
  const suffixes = ['official', 'real', 'verified', 'pro'];
  suffixes.forEach(suffix => {
    suggestions.push(`${base}_${suffix}`);
    suggestions.push(`${base}.${suffix}`);
  });
  
  // Pattern 3: Add prefixes
  const prefixes = ['its', 'the', 'real'];
  prefixes.forEach(prefix => {
    suggestions.push(`${prefix}_${base}`);
  });
  
  // Check availability and return only available ones
  const availableSuggestions = [];
  for (const suggestion of suggestions.slice(0, 10)) {
    try {
      const { available } = await checkUsernameAvailability(suggestion, excludeUserId, supabase);
      if (available) {
        availableSuggestions.push(suggestion);
        if (availableSuggestions.length >= 5) break;
      }
    } catch (error) {
      // Continue to next suggestion if one fails
      continue;
    }
  }
  
  return availableSuggestions;
};

