import { supabase } from "@/supabaseClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectDetailsClient from "@/components/pages/ProjectDetailsClient";

// Generate static paths for all projects (SSG for 100K+ pages)
export async function generateStaticParams() {
    const { data: projects } = await supabase
        .from('projects')
        .select('slug')
        .neq('status', 'draft');

    return projects?.map((project) => ({
        slug: project.slug,
    })) || [];
}

// Normalize slug (lowercase) so Launchit.site/launches/Your-Project and ?utm_source=... work
const normalizeSlug = (s) => (typeof s === 'string' ? s.toLowerCase().trim() : '');

// Generate metadata for SEO (per project)
export async function generateMetadata(props) {
    const params = await props.params;
    const slug = normalizeSlug(params.slug);
    const { data: projectList } = await supabase
        .from('projects')
        .select('name, tagline, description, logo_url, thumbnail_url, category_type, created_at')
        .ilike('slug', slug)
        .neq('status', 'draft')
        .limit(1);
    const project = projectList?.[0];

    if (!project) {
        return {
            title: 'Project Not Found | Launchit',
        };
    }

    const shareImage = project.thumbnail_url || project.logo_url || 'https://launchit.site/images/r6_circle_optimized.png';
    const canonicalPath = `https://launchit.site/launches/${slug}`;

    return {
        title: `${project.name} - ${project.tagline} | Launchit`,
        description: project.description || project.tagline,
        keywords: `${project.name}, ${project.category_type}, startup, launch, ${project.tagline}`,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: `${project.name} | Launchit`,
            description: project.tagline,
            url: canonicalPath,
            siteName: "Launchit",
            images: [{ url: shareImage, width: 1200, height: 630 }],
            locale: "en_US",
            type: "article",
            publishedTime: project.created_at,
        },
        twitter: {
            card: "summary_large_image",
            title: `${project.name} | Launchit`,
            description: project.tagline,
            images: [shareImage],
            site: "@launchit__",
        },
    };
}

// ... existing code ...

// Server Component - Fetches project data (slug normalized so capital L / UTM query params don't break)
export default async function ProjectPage(props) {
    const params = await props.params;
    const slug = normalizeSlug(params.slug);
    const { data: projectList, error } = await supabase
        .from('projects')
        .select('*, likes:project_likes(count)')
        .ilike('slug', slug)
        .neq('status', 'draft')
        .limit(1);
    const project = projectList?.[0];

    if (error || !project) {
        notFound();
    }

    // Pass server-fetched data to client component with Suspense boundary
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ProjectDetailsClient initialProject={project} />
        </Suspense>
    );
}
