// Username change rate limiting utility (Database-based)
const USERNAME_CHANGE_LIMITS = {
  maxChangesPerMonth: 2,
  minDaysBetweenChanges: 14,
  maxAvailabilityChecksPerMinute: 10
};

/**
 * Check if user can change username (rate limiting via database)
 * @param {string} userId - User ID
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<{allowed: boolean, message?: string}>}
 */
export const checkRateLimit = async (userId, supabase) => {
  if (!userId) {
    return { allowed: false, message: 'User ID is required' };
  }

  if (!supabase) {
    return { allowed: false, message: 'Database connection required' };
  }

  try {
    const { data, error } = await supabase.rpc('check_username_change_rate_limit', {
      p_user_id: userId,
      p_max_changes_per_month: USERNAME_CHANGE_LIMITS.maxChangesPerMonth,
      p_min_days_between_changes: USERNAME_CHANGE_LIMITS.minDaysBetweenChanges
    });

    if (error) {
      // Fail open - allow change if database check fails (to avoid blocking users)
      return { allowed: true, daysRemaining: 0 };
    }

    return {
      allowed: data?.allowed ?? true,
      message: data?.message || null,
      daysRemaining: data?.days_remaining ?? 0,
      reason: data?.reason || null
    };
  } catch (error) {
    // Fail open - allow change if check fails
    return { allowed: true, daysRemaining: 0 };
  }
};

/**
 * Record username change in database
 * @param {string} userId - User ID
 * @param {string} oldUsername - Old username
 * @param {string} newUsername - New username
 * @param {object} supabase - Supabase client instance
 */
export const recordUsernameChange = async (userId, oldUsername, newUsername, supabase) => {
  if (!userId || !newUsername || !supabase) return;

  try {
    const { error } = await supabase.rpc('record_username_change', {
      p_user_id: userId,
      p_old_username: oldUsername || null,
      p_new_username: newUsername
    });

    if (error) {
      // Silent fail - don't block user if recording fails
    }
  } catch (error) {
    // Silent fail
  }
};

/**
 * Check if user can perform availability check (rate limiting via database)
 * @param {string|null} userId - User ID (null for anonymous users)
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<{allowed: boolean, message?: string}>}
 */
export const checkAvailabilityCheckRateLimit = async (userId, supabase) => {
  if (!supabase) {
    return { allowed: false, message: 'Database connection required' };
  }

  try {
    const { data, error } = await supabase.rpc('check_availability_check_rate_limit', {
      p_user_id: userId || null,
      p_max_checks_per_minute: USERNAME_CHANGE_LIMITS.maxAvailabilityChecksPerMinute
    });

    if (error) {
      // Fail open - allow check if database check fails
      return { allowed: true };
    }

    return {
      allowed: data?.allowed ?? true,
      message: data?.message || null
    };
  } catch (error) {
    // Fail open
    return { allowed: true };
  }
};

/**
 * Record availability check in database
 * @param {string|null} userId - User ID (null for anonymous users)
 * @param {string} usernameChecked - Username that was checked
 * @param {object} supabase - Supabase client instance
 */
export const recordAvailabilityCheck = async (userId, usernameChecked, supabase) => {
  if (!usernameChecked || !supabase) return;

  try {
    const { error } = await supabase.rpc('record_availability_check', {
      p_user_id: userId || null,
      p_username_checked: usernameChecked
    });

    if (error) {
      // Silent fail
    }
  } catch (error) {
    // Silent fail
  }
};

