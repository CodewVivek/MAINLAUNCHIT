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
  // Fetch initial projects on the server (fast, SEO-friendly)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

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

  // Pass server-fetched data to client component
  return (
    <DashBoardClient
      initialProjects={initialProjects || []}
      initialError={error?.message || null}
    />
  );
}
