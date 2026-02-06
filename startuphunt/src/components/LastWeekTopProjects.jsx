import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";

const LastWeekTopProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTopProjects = async () => {
            setLoading(true);

            // Calculate LAST WEEK (Monday to Sunday)
            const now = new Date();
            const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

            // Calculate last week's Monday
            let daysToLastMonday;
            if (day === 0) {
                daysToLastMonday = 6;
            } else if (day === 1) {
                daysToLastMonday = 7;
            } else {
                daysToLastMonday = (day - 1) + 7;
            }

            const lastWeekMonday = new Date(now);
            lastWeekMonday.setDate(now.getDate() - daysToLastMonday);
            lastWeekMonday.setHours(0, 0, 0, 0);

            const lastWeekSunday = new Date(lastWeekMonday);
            lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
            lastWeekSunday.setHours(23, 59, 59, 999);

            const startDate = lastWeekMonday.toISOString();
            const endDate = lastWeekSunday.toISOString();

            try {
                // Fetch projects launched in last week
                let { data: projectsData, error: projectsError } = await supabase
                    .from("projects")
                    .select("id, name, slug, tagline, description, logo_url, created_at")
                    .eq("status", "launched")
                    .is("deleted_at", null)
                    .gte("created_at", startDate)
                    .lte("created_at", endDate);

                if (projectsError || !projectsData) {
                    setProjects([]);
                    setLoading(false);
                    return;
                }

                if (projectsData.length === 0) {
                    setProjects([]);
                    setLoading(false);
                    return;
                }

                const projectIds = projectsData.map(p => p.id);

                // Fetch likes count
                const { data: likes, error: likesError } = await supabase
                    .from('project_likes')
                    .select('project_id')
                    .in('project_id', projectIds);

                const likesMap = {};
                if (likes) {
                    likes.forEach(like => {
                        likesMap[like.project_id] = (likesMap[like.project_id] || 0) + 1;
                    });
                }

                // Combine and sort
                const sortedProjects = projectsData
                    .map(project => ({
                        ...project,
                        likesCount: likesMap[project.id] || 0
                    }))
                    .sort((a, b) => {
                        // 1. Likes (desc)
                        if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
                        // 2. Created At (newer first)
                        return new Date(b.created_at) - new Date(a.created_at);
                    })
                    .slice(0, 5); // Top 5

                setProjects(sortedProjects);

            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchTopProjects();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!projects.length) {
        return (
            <div className="mt-8">
                <div className="font-semibold text-md text-foreground mb-5">
                    Last Week's Top 5
                </div>
                <div className="text-muted-foreground py-4 text-md">
                    No new launches found for last week.
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {/* Header branding */}
            <div className="font-semibold text-md text-foreground mb-5">
                Last Week's Top 5
            </div>

            <div className="flex flex-col gap-4">
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        className="rounded-xl border border-border p-2 flex gap-3 items-center cursor-pointer hover:shadow-md transition-all duration-300 bg-card dark:bg-gray-950/50 hover:bg-muted relative group"
                        onClick={() => router.push(`/launches/${project.slug}`)}
                    >
                        {/* Project Logo */}
                        {project.logo_url ? (
                            <img
                                src={project.logo_url}
                                alt={`${project.name} logo`}
                                className="w-12 h-12 object-contain rounded-lg border border-border bg-muted flex-shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border flex-shrink-0">
                                <span>{project.name.charAt(0)}</span>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-md font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {project.name}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                                {project.tagline}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LastWeekTopProjects;
