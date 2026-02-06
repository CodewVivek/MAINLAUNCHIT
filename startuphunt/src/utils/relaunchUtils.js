import { supabase } from "../supabaseClient";

/**
 * Get projects eligible for relaunch
 * Eligibility criteria:
 * - Likes ≤ 2
 * - Comments ≤ 1
 * - Age ≥ 2 days
 * - Not relaunched in last 7 days (or never)
 * 
 * @param {number} limit - Maximum number of projects to return
 * @returns {Promise<Array>} Array of eligible projects with creator info
 */
export const getRelaunchEligibleProjects = async (limit = 100) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch projects that are at least 2 days old
    let query = supabase
      .from("projects")
      .select("*")
      .neq("status", "draft")
      .lt("created_at", twoDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data: projects, error } = await query;

    if (error) {
      return [];
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    // Filter by relaunch timing (not relaunched in last 7 days or never)
    const timeFilteredProjects = projects.filter(project => {
      if (!project.last_relaunch_date) return true; // Never relaunched
      const lastRelaunched = new Date(project.last_relaunch_date);
      return lastRelaunched < sevenDaysAgo;
    });

    // Batch fetch likes and comments counts (one query each instead of 2*N)
    const projectIds = timeFilteredProjects.map((p) => p.id);
    const [likesRes, commentsRes] = await Promise.all([
      projectIds.length > 0
        ? supabase.from("project_likes").select("project_id").in("project_id", projectIds)
        : { data: [] },
      projectIds.length > 0
        ? supabase.from("comments").select("project_id").in("project_id", projectIds)
        : { data: [] },
    ]);

    const likesMap = (likesRes.data || []).reduce((acc, row) => {
      acc[row.project_id] = (acc[row.project_id] || 0) + 1;
      return acc;
    }, {});
    const commentsMap = (commentsRes.data || []).reduce((acc, row) => {
      acc[row.project_id] = (acc[row.project_id] || 0) + 1;
      return acc;
    }, {});

    const projectsWithCounts = timeFilteredProjects.map((project) => ({
      ...project,
      likesCount: likesMap[project.id] || 0,
      commentsCount: commentsMap[project.id] || 0,
    }));

    // Filter by engagement criteria: likes ≤ 2, comments ≤ 1
    const eligibleProjects = projectsWithCounts.filter((project) => {
      return project.likesCount <= 2 && project.commentsCount <= 1;
    });

    // Batch fetch creator info (one query instead of N)
    const userIds = [...new Set(eligibleProjects.map((p) => p.user_id).filter(Boolean))];
    let creatorMap = {};
    if (userIds.length > 0) {
      const { data: creators, error: creatorError } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);
      if (!creatorError && creators) {
        creatorMap = creators.reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {});
      }
    }

    const projectsWithCreators = eligibleProjects.map((project) => ({
      ...project,
      creator: project.user_id ? creatorMap[project.user_id] || null : null,
    }));

    return projectsWithCreators;
  } catch (error) {
    return [];
  }
};

/**
 * Rotate projects for display
 * Uses time-based rotation (changes every 6 hours)
 * 
 * @param {Array} projects - Array of eligible projects
 * @param {number} count - Number of projects to return
 * @returns {Array} Rotated subset of projects
 */
export const rotateRelaunchProjects = (projects, count = 4) => {
  if (!projects || projects.length === 0) {
    return [];
  }

  if (projects.length <= count) {
    return projects;
  }

  // Get rotation index based on time (changes every 6 hours)
  const now = new Date();
  const hour = now.getHours();
  const rotationsPerDay = 4; // Every 6 hours
  const rotationIndex = Math.floor(hour / (24 / rotationsPerDay));

  // Use rotation index + date as seed for consistent rotation
  const dateString = now.toDateString();
  const seed = `${rotationIndex}-${dateString}`;

  // Simple seeded shuffle
  const shuffled = [...projects].sort((a, b) => {
    const hashA = hashString(`${seed}-${a.id}`);
    const hashB = hashString(`${seed}-${b.id}`);
    return hashA - hashB;
  });

  return shuffled.slice(0, count);
};

/**
 * Simple hash function for consistent shuffling
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Update last_relaunch_date for a project (schema: last_relaunch_date date).
 * Call this when a project is shown in the relaunch section.
 *
 * @param {string} projectId - Project ID
 */
export const markProjectAsRelaunched = async (projectId) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for date column
    const { error } = await supabase
      .from("projects")
      .update({ last_relaunch_date: today, relaunched: true })
      .eq("id", projectId);

    if (error) {
    }
  } catch (error) {
  }
};

