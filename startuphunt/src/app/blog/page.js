import { createServerSupabaseClient } from "@/lib/supabase-server";
import BlogListClient from "@/components/pages/BlogListClient";
import BlogComingSoon from "@/components/BlogComingSoon";

export const metadata = {
    title: "Startup Blog & News - Launchit Blog",
    description: "Learn how to launch, scale, and grow your startup with expert guides and founder stories on Launchit.",
};

export default async function BlogPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user
        ? (await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle())?.data?.role === "admin"
        : false;

    if (!isAdmin) {
        return <BlogComingSoon />;
    }

    const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
    }

    return <BlogListClient initialPosts={posts || []} />;
}
