import { supabase } from "@/supabaseClient";
import DashBoardClient from "@/components/pages/DashBoardClient";

// Always fetch fresh launches (no static cache) so "today" stays current
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Launchit - Where Builders Launch Projects",
  description: "Discover and launch early-stage startups on Launchit - ship products faster, get visibility, and reach makers without gatekeeping.",
  keywords: "early-stage startups, launch startup, startup discovery, product launch, founders, indie hackers, side projects",
  openGraph: {
    title: "Launchit - Where Builders Launch Projects",
    description: "Discover and launch early-stage startups on Launchit",
    url: "https://launchit.site",
    siteName: "Launchit",
    images: [
      {
        url: "https://launchit.site/images/r6_circle_optimized.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Launchit - Where Builders Launch Projects",
    description: "Discover and launch early-stage startups on Launchit",
    images: ["https://launchit.site/images/r6_circle_optimized.png"],
    site: "@launchit__",
  },
};

// Server Component - Fetches data for SEO
export default async function HomePage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // 1. Fetch main feed
  const { data: initialProjects, error } = await supabase
    .from("projects")
    .select(`
      id, name, tagline, slug, logo_url, thumbnail_url, website_url,
      category_type, created_at, last_relaunch_date, status, user_id,
      is_sponsored, sponsored_tier, plan_type,
      likes:project_likes(count)
    `)
    .neq("status", "draft")
    .gte("created_at", sevenDaysAgoISO)
    .order("plan_type", { ascending: false })
    .order("created_at", { ascending: false });

  // 2. Fetch Sponsored (Premium/Highlight)
  const { data: sponsoredData } = await supabase
    .from("projects")
    .select("id, name, tagline, slug, logo_url, thumbnail_url, website_url, sponsored_tier, created_at, plan_type")
    .eq("is_sponsored", true)
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const premiumProjects = (sponsoredData || []).filter(
    p => (p.sponsored_tier || "").toLowerCase() === "premium"
  );

  const highlightProjects = (sponsoredData || []).filter(
    p => (p.sponsored_tier || "").toLowerCase() === "highlight"
  );

  // 3. Fetch categories for "Explore" section
  const { data: catData } = await supabase
    .from("projects")
    .select("category_type, logo_url, thumbnail_url, slug, name")
    .neq("status", "draft")
    .not("category_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000); // Reduced limit for server performance

  const byCategory = {};
  (catData || []).forEach((p) => {
    const c = p.category_type?.trim() || "";
    if (!c) return;
    if (!byCategory[c]) byCategory[c] = [];
    byCategory[c].push(p);
  });

  const categoryCounts = Object.entries(byCategory)
    .map(([category_type, list]) => ({
      category_type,
      count: list.length,
      samples: list.slice(0, 2).map(({ logo_url, thumbnail_url, slug, name }) => ({
        logo_url: logo_url || thumbnail_url,
        slug,
        name,
      })),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Pass server-fetched data to client component
  return (
    <DashBoardClient
      initialProjects={initialProjects || []}
      initialPremium={premiumProjects}
      initialHighlight={highlightProjects}
      initialCategoryCounts={categoryCounts}
      initialError={error?.message || null}
    />
  );
}
