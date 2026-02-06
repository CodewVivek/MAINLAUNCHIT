import { createServerSupabaseClient } from "@/lib/supabase-server";
import BlogDetailClient from "@/components/pages/BlogDetailClient";
import BlogComingSoon from "@/components/BlogComingSoon";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user
        ? (await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle())?.data?.role === "admin"
        : false;

    if (!isAdmin) {
        return {
            title: "Coming Soon - Launchit Blog",
            description: "Our blog is launching soon. Check back for guides and founder stories.",
        };
    }

    const { data: post } = await supabase
        .from("blog_posts")
        .select("title, excerpt, cover_image")
        .eq("slug", slug)
        .maybeSingle();

    if (!post) return { title: "Post Not Found" };

    return {
        title: `${post.title} - Launchit Blog`,
        description: post.excerpt,
        openGraph: {
            images: post.cover_image ? [post.cover_image] : undefined,
        },
    };
}

export default async function BlogPostPage({ params }) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user
        ? (await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle())?.data?.role === "admin"
        : false;

    if (!isAdmin) {
        return <BlogComingSoon />;
    }

    const { data: post, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error || !post) {
        notFound();
    }

    return <BlogDetailClient post={post} />;
}
