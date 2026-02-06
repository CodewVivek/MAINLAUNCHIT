import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

const RelatedProjects = ({ categoryType, excludeProjectId, projectName }) => {
    const [projects, setProjects] = useState([]);
    const [fallbackProjects, setFallbackProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);

            const { data } = await supabase
                .from("projects")
                .select("id, name, tagline, slug, thumbnail_url, logo_url, category_type, created_at")
                .eq("category_type", categoryType)
                .neq("id", excludeProjectId)
                .eq("status", "launched")
                .limit(6);

            if (!data || data.length === 0) {
                const { data: fallback } = await supabase
                    .from("projects")
                    .select("id, name, tagline, slug, thumbnail_url, logo_url, category_type, created_at")
                    .neq("id", excludeProjectId)
                    .neq("status", "draft")
                    .limit(6);

                setFallbackProjects(fallback || []);
                setProjects([]);
            } else {
                setProjects(data || []);
                setFallbackProjects([]);
            }

            setLoading(false);
        };

        if (categoryType && excludeProjectId) fetchRelated();
    }, [categoryType, excludeProjectId]);

    const displayProjects = useMemo(
        () => (projects.length ? projects : fallbackProjects),
        [projects, fallbackProjects]
    );

    if (loading) {
        return (
            <div className="mt-14">
                <div className="flex items-end justify-between mb-5 px-1">
                    <div>
                        <div className="h-5 w-44 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-2" />
                        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-900 rounded-md animate-pulse" />
                    </div>
                    <div className="h-4 w-20 bg-gray-100 dark:bg-gray-900 rounded-md animate-pulse" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden"
                        >
                            <div className="aspect-video bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            <div className="p-4">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                                    <div className="flex-1">
                                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
                                        <div className="h-3 w-44 bg-gray-100 dark:bg-gray-900 rounded-md mt-2 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!displayProjects.length) return null;

    const isFallback = !projects.length;

    return (
        <section className="mt-14">
            {/* Header */}
            <div className="flex items-end justify-between mb-5 px-1">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {isFallback ? "Explore More" : "Similar Tools & Alternatives"}
                    </h3>

                    <p className="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {isFallback ? "More launches you might like" : `Best Alternatives to ${projectName || categoryType}`}
                    </p>
                </div>

                <button
                    onClick={() => router.push("/")}
                    className="
            group text-md font-semibold text-gray-700 dark:text-gray-300
            hover:text-black dark:hover:text-white transition
            inline-flex items-center gap-1
          "
                >
                    View all
                    <span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayProjects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => router.push(`/launches/${project.slug}`)}
                        className="
              group cursor-pointer rounded-2xl overflow-hidden
              border border-gray-200 dark:border-gray-800
              bg-white dark:bg-gray-900/40
              hover:border-gray-300 dark:hover:border-gray-700
              hover:shadow-[0_12px_45px_-25px_rgba(0,0,0,0.45)]
              transition-all
            "
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            {project.thumbnail_url ? (
                                <img
                                    src={project.thumbnail_url}
                                    alt={project.name}
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-md">
                                    No thumbnail
                                </div>
                            )}

                            {/* Hover overlay (ProjectDetails style) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Category pill */}
                            {project.category_type && (
                                <div className="absolute bottom-3 right-3">
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-black/75 text-white backdrop-blur">
                                        {project.category_type}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bottom content */}
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Logo */}
                                {project.logo_url ? (
                                    <img
                                        src={project.logo_url}
                                        alt={project.name}
                                        className="w-10 h-10 rounded-full object-cover bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        {project.name?.[0]?.toUpperCase() || "L"}
                                    </div>
                                )}

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                                        {project.name}
                                    </h4>

                                    <p className="text-md text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                        {project.tagline || "No tagline provided"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RelatedProjects;
