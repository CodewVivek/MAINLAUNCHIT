import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { Flame } from "lucide-react";

const TrendingProjects = ({ limit = 5, by = "trending" }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const calculateTrendingScore = (project) => project.likesCount || 0;

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("id, name, tagline, slug, logo_url, created_at")
        .neq("status", "draft")
        .gte("created_at", twentyFourHoursAgo.toISOString());

      if (error || !projectsData?.length) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Batch fetch all likes in a single query instead of 140+ individual queries
      const projectIds = projectsData.map(p => p.id);
      const { data: likesData } = await supabase
        .from("project_likes")
        .select("project_id")
        .in("project_id", projectIds);

      // Count likes per project
      const likesCounts = (likesData || []).reduce((acc, like) => {
        acc[like.project_id] = (acc[like.project_id] || 0) + 1;
        return acc;
      }, {});

      // Add like counts to projects
      const projectsWithCounts = projectsData.map(project => ({
        ...project,
        likesCount: likesCounts[project.id] || 0
      }));

      const projectsWithTrending = projectsWithCounts.map((p) => ({
        ...p,
        trendingScore: calculateTrendingScore(p),
      }));

      let sorted = projectsWithTrending;

      if (by === "newest") {
        sorted = sorted.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      } else {
        sorted = sorted.sort((a, b) => b.trendingScore - a.trendingScore);
      }

      setProjects(sorted.slice(0, limit));
      setLoading(false);
    };

    fetchTrending();
  }, [limit, by]);

  if (loading) {
    return (
      <div className="mt-10">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Trending (24h)
        </h3>

        <div className="mt-3 space-y-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl border border-border bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!projects.length) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Trending (24h)
        </h3>

        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
          <Flame className="w-3.5 h-3.5" />
          Hot
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => router.push(`/launches/${project.slug}`)}
            className="
              w-full text-left
              flex items-center gap-3
              rounded-xl border border-border
              bg-card px-3 py-2
              hover:bg-muted transition
            "
          >
            {/* Logo */}
            <div className="flex-shrink-0">
              {project.logo_url ? (
                <img
                  src={project.logo_url}
                  alt={project.name}
                  className="w-9 h-9 rounded-xl border border-border bg-background object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl border border-border bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {project.name?.[0]?.toUpperCase() || "L"}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-md font-semibold text-foreground truncate">
                {project.name}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {project.tagline}
              </p>
            </div>

          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingProjects;
