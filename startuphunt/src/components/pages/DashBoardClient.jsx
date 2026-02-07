'use client';

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import TrendingProjects from '../TrendingProjects';
import LastWeekTopProjects from '../LastWeekTopProjects';
import Testimonials from '../Testimonials';
import PartnerBadges from '../PartnerBadges';
import { supabase } from "@/supabaseClient";
import { Rocket, Zap } from "lucide-react";
import { DashboardSkeleton } from "@/components/Skeletons";
import { useRouter } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import ProjectCard from "@/components/ProjectCard";
import PremiumSponsorCard from "@/components/PremiumSponsorCard";
import Image from "next/image";
import { getCategoryDisplay } from "@/constants/categoryIcons";

const Dashboard = ({ initialProjects = [], initialPremium = [], initialHighlight = [], initialCategoryCounts = [], initialError = null }) => {
  const [projects, setProjects] = useState(initialProjects);
  const [premiumProjects, setPremiumProjects] = useState(initialPremium);
  const [highlightProjects, setHighlightProjects] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState(initialCategoryCounts); // top 8 by launch count for Explore by Category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const router = useRouter();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // Handle Highlight Rotation (Client-side logic to ensure it changes daily)
  useEffect(() => {
    if (initialHighlight.length === 0) return;

    const allHighlights = [...initialHighlight].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (allHighlights.length <= 9) {
      setHighlightProjects(allHighlights);
    } else {
      const limit = 9;
      const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const startIndex = (daysSinceEpoch * limit) % allHighlights.length;
      const rotated = [];
      for (let i = 0; i < limit; i++) {
        rotated.push(allHighlights[(startIndex + i) % allHighlights.length]);
      }
      setHighlightProjects(rotated);
    }
  }, [initialHighlight]);

  useEffect(() => {
    if (initialProjects.length >= ITEMS_PER_PAGE) setHasMore(true);
    else setHasMore(false);
  }, [initialProjects]);

  const loadMoreProjects = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const oldest = projects[projects.length - 1]?.created_at;
    if (!oldest) return;

    const { data } = await supabase
      .from("projects")
      .select(`
        id, name, tagline, slug, logo_url, thumbnail_url, website_url,
        category_type, created_at, last_relaunch_date, status, user_id,
        is_sponsored, sponsored_tier, plan_type,
        likes:project_likes(count)
      `)
      .neq("status", "draft")
      .lt("created_at", oldest)
      .order("plan_type", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ITEMS_PER_PAGE);

    if (data?.length) {
      setProjects([...projects, ...data]);
      if (data.length < ITEMS_PER_PAGE) setHasMore(false);
    } else setHasMore(false);

    setLoadingMore(false);
  };

  const grouped = {};
  [...projects]
    .map(p => ({
      ...p,
      likesCount: p.likes?.[0]?.count || 0
    }))
    .sort((a, b) => {
      // 1. Sort by day first (implicit in grouping, but we sort the whole list here)
      const dateA = new Date(a.created_at).setHours(0, 0, 0, 0);
      const dateB = new Date(b.created_at).setHours(0, 0, 0, 0);

      if (dateB !== dateA) return dateB - dateA;

      // 2. Priority Plans (Spotlight > Showcase > Standard/Free)
      if (a.plan_type !== b.plan_type) {
        const planOrder = { 'Spotlight': 3, 'Showcase': 2, 'Free': 1, 'Standard': 1 };
        return (planOrder[b.plan_type] || 0) - (planOrder[a.plan_type] || 0);
      }

      // 3. Within the same day and same plan, sort by likes (DESC)
      if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;

      // 4. If likes are same, sort by created_at (DESC)
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .forEach(p => {
      const d = new Date(p.created_at);
      let label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d");
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(p);
    });

  const openProject = (p) => router.push(`/launches/${p.slug}`);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="pt-20 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-background">

      {/* HERO */}
      <section className="py-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Made for builders.</h1>
        <p className="mt-3 text-muted-foreground">Discover the next generation of startups daily.</p>
        <button
          onClick={() => router.push("/submit")}
          className="mt-6 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
        >
          Submit your startup
        </button>
      </section>

      <div className="max-w-7xl mx-auto px-4">

        {/* PREMIUM / SPOTLIGHT GRID */}
        {premiumProjects.length > 0 && (
          <div className="mb-16">

            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-border/40" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-muted/30">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Spotlight</span>
              </div>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {premiumProjects.slice(0, 3).map(p => (
                <PremiumSponsorCard key={p.id} project={p} onClick={openProject} />
              ))}
            </div>

          </div>
        )}


        {/* HIGHLIGHTS */}
        {highlightProjects.length > 0 && (
          <div className="mb-14">
            <h3 className="text-2xl font-semibold flex items-center gap-2 text-muted-foreground mb-4">
              Today's Highlights
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {highlightProjects.map(p => (
                <ProjectCard key={p.id} project={p} onProjectClick={openProject} utmSource="highlight" />
              ))}
            </div>
          </div>
        )}

        {/* EXPLORE BY CATEGORY — 2 rows × 4 cols, sorted by launch count */}
        {categoryCounts.length > 0 && (
          <section className="mb-14">
            <h3 className="text-2xl font-semibold flex items-center gap-2 text-muted-foreground mb-4">
              Explore by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryCounts.map(({ category_type, count, samples }) => {
                const { name, desc, icon: Icon } = getCategoryDisplay(category_type);
                const href = `/category/${encodeURIComponent(category_type)}`;
                return (
                  <Link
                    key={category_type}
                    href={href}
                    className="
                      group flex flex-col rounded-2xl border border-border bg-card p-5
                      hover:border-primary/40 hover:shadow-md transition-all text-left
                    "
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{desc}</p>
                    {/* 2 circular launch logos + count circle (like image) */}
                    <div className="flex items-center gap-0 mt-auto">
                      <div className="flex -space-x-2">
                        {samples?.slice(0, 2).map((s) => (
                          <button
                            key={s.slug}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/launches/${s.slug}`);
                            }}
                            className="w-9 h-9 rounded-full border-2 border-card bg-muted overflow-hidden shrink-0 hover:z-10 hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                            title={s.name}
                          >
                            {s.logo_url ? (
                              <img src={s.logo_url} alt={s.name || ""} className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase">
                                {(s.name || "?")[0]}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-muted text-foreground dark:bg-foreground dark:text-background flex items-center justify-center shrink-0 text-[10px] font-bold tabular-nums ml-1 border border-border dark:border-transparent">
                        +{count}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* FEED */}
        {Object.entries(grouped).map(([label, list]) => (
          <Fragment key={label}>
            <h3 className="mt-12 mb-4 text-lg font-semibold text-foreground flex items-center gap-3">
              {label}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {list.map(p => (
                <ProjectCard key={p.id} project={p} onProjectClick={openProject} utmSource="normal" />
              ))}
            </div>
          </Fragment>
        ))}

        {/* LOAD MORE */}
        {hasMore && (
          <div className="flex justify-center my-10">
            <button
              onClick={loadMoreProjects}
              disabled={loadingMore}
              className="px-7 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}

      </div>

      <Testimonials />
      <PartnerBadges />
    </div>
  );
};

export default Dashboard;
