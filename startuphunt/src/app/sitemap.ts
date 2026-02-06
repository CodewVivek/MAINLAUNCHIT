import { MetadataRoute } from 'next'
import { createPublicSupabaseClient } from '@/lib/supabase-server'
import { CATEGORIES } from '@/constants/categories'

/** Max URLs per sitemap (Google limit 50,000). Supabase default is 1000 — we must raise to get all rows. */
const SITEMAP_ROW_LIMIT = 50000

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://launchit.site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createPublicSupabaseClient()

    // —— 1. Static pages (high priority, always first) ——
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
        { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ]

    // —— 2. Launches (every project — critical for indexing) ——
    const { data: projects } = await supabase
        .from('projects')
        .select('slug, updated_at, created_at')
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(SITEMAP_ROW_LIMIT)

    const projectPages: MetadataRoute.Sitemap = (projects || []).map((p) => ({
        url: `${BASE_URL}/launches/${p.slug}`,
        lastModified: new Date(p.updated_at || p.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    // —— 3. Category pages (every category — critical for indexing) ——
    const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
        url: `${BASE_URL}/category/${encodeURIComponent(category)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.85,
    }))

    // —— 4. User profiles ——
    const { data: profiles } = await supabase
        .from('profiles')
        .select('username, updated_at')
        .not('username', 'is', null)
        .limit(SITEMAP_ROW_LIMIT)

    const profilePages: MetadataRoute.Sitemap = (profiles || []).map((p) => ({
        url: `${BASE_URL}/profile/${p.username}`,
        lastModified: new Date(p.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    // —— 5. Blog posts (published only) ——
    const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(SITEMAP_ROW_LIMIT)

    const blogPages: MetadataRoute.Sitemap = (blogPosts || []).map((p) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at || p.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    // Order: static → launches → categories → profiles → blog (crawl priority)
    return [...staticPages, ...projectPages, ...categoryPages, ...profilePages, ...blogPages]
}
