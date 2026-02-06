/**
 * Profile Completion Utility
 * Checks if a user's profile is complete enough to launch projects or upvote
 */

/**
 * Check if profile is complete
 * @param {Object} profile - User profile object
 * @returns {Object} - { isComplete: boolean, missing: string[], message: string }
 */
export const checkProfileCompletion = (profile) => {
  if (!profile) {
    return {
      isComplete: false,
      missing: ['Profile not found'],
      message: 'Profile not found. Please complete your profile.',
      completionPercentage: 0
    };
  }

  const missing = [];
  let completedFields = 0;
  const totalRequiredFields = 3; // name, at least one social link, location

  // Required: Name (safe trim for non-string values from DB)
  const name = profile.full_name != null ? String(profile.full_name).trim() : '';
  if (!name) {
    missing.push('Name');
  } else {
    completedFields++;
  }

  // Required: At least one social link
  const hasSocialLink = !!(profile.twitter ||
    profile.linkedin ||
    profile.portfolio ||
    profile.youtube);
  if (!hasSocialLink) {
    missing.push('At least one social link (X/Twitter, LinkedIn, Portfolio, or YouTube)');
  } else {
    completedFields++;
  }

  // Required: Location (safe trim)
  const location = profile.location != null ? String(profile.location).trim() : '';
  if (!location) {
    missing.push('Location');
  } else {
    completedFields++;
  }

  // Never show 100% when there are missing required fields
  const completionPercentage = missing.length === 0
    ? 100
    : Math.round((completedFields / totalRequiredFields) * 100);

  return {
    isComplete: missing.length === 0,
    missing,
    message: missing.length > 0
      ? `Please complete your profile: ${missing.join(', ')}`
      : 'Profile is complete!',
    completionPercentage
  };
};

/**
 * Get profile completion status with detailed breakdown
 * @param {Object} profile - User profile object
 * @returns {Object} - Detailed completion status
 */
export const getProfileCompletionStatus = (profile) => {
  const check = checkProfileCompletion(profile);

  return {
    ...check,
    details: {
      hasName: !!(profile?.full_name && profile.full_name.trim().length > 0),
      hasBio: !!(profile?.bio && profile.bio.trim().length >= 40),
      bioLength: profile?.bio?.trim().length || 0,
      bioMinLength: 40,
      hasSocialLink: !!(profile?.twitter || profile?.linkedin || profile?.portfolio || profile?.youtube),
      hasInterest: !!(profile?.interest && profile.interest.trim().length > 0),
      hasLocation: !!(profile?.location && profile.location.trim().length > 0),
      hasSkills: !!(profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0)
    }
  };
};

