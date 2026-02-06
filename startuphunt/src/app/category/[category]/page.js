import { supabase } from "@/supabaseClient";
import CategoryProjectsClient from "@/components/pages/CategoryProjectsClient";
import { CATEGORIES } from "@/constants/categories";

// Generate static paths for all categories
export async function generateStaticParams() {
    return CATEGORIES.map((category) => ({
        category: category,
    }));
}

// Generate metadata for SEO (per category)
// Generate metadata for SEO (per category)
export async function generateMetadata(props) {
    const params = await props.params;
    const category = decodeURIComponent(params.category);

    return {
        title: `${category} Projects | Launchit`,
        description: `Discover the latest ${category} startups and projects on Launchit. Find innovative tools and products in the ${category} space.`,
        keywords: `${category}, startups, projects, launches, ${category} tools`,
        alternates: {
            canonical: `https://launchit.site/category/${encodeURIComponent(category)}`,
        },
        openGraph: {
            title: `${category} Projects | Launchit`,
            description: `Discover the latest ${category} startups and projects`,
            url: `https://launchit.site/category/${encodeURIComponent(category)}`,
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
            title: `${category} Projects | Launchit`,
            description: `Discover the latest ${category} startups and projects`,
            images: ["https://launchit.site/images/r6_circle_optimized.png"],
            site: "@launchit__",
        },
    };
}

// Server Component - Fetches category projects
export default async function CategoryPage(props) {
    const params = await props.params;
    const category = decodeURIComponent(params.category);

    // Match category case-insensitively (DB may have "Productivity" or "productivity")
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
      id,
      name,
      tagline,
      description,
      website_url,
      category_type,
      created_at,
      slug,
      thumbnail_url,
      logo_url,
      user_id,
      plan_type
    `)
        .ilike('category_type', category)
        .neq('status', 'draft')
        .order('plan_type', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        projects = null;
    }

    // Fetch profile names for project owners (no FK join assumptions)
    let normalized = projects || [];
    if (normalized.length > 0) {
        const userIds = [...new Set(normalized.map((p) => p.user_id).filter(Boolean))];

        if (userIds.length > 0) {
            const { data: profileRows, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, full_name')
                .in('id', userIds);

            if (!profileError && profileRows) {
                const profileMap = profileRows.reduce((acc, row) => {
                    acc[row.id] = row;
                    return acc;
                }, {});

                normalized = normalized.map((p) => {
                    const prof = profileMap[p.user_id];
                    return {
                        ...p,
                        creator_name: prof?.full_name || null,
                        creator_username: prof?.username || null,
                    };
                });
            }
        }
    }

    // Pass server-fetched data to client component
    return (
        <CategoryProjectsClient
            category={category}
            initialProjects={normalized}
            initialError={error?.message || null}
        />
    );
}
