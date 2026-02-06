import { createPublicSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import UserProfileClient from "@/components/pages/UserProfileClient";

// Generate static paths for user profiles
export async function generateStaticParams() {
    const supabase = createPublicSupabaseClient();
    const { data: profiles } = await supabase
        .from('profiles')
        .select('username')
        .not('username', 'is', null);

    return profiles?.map((profile) => ({
        username: profile.username,
    })) || [];
}

// Generate metadata for SEO (per user profile)
// Generate metadata for SEO (per user profile)
export async function generateMetadata(props) {
    const params = await props.params;
    if (params.username === 'me') {
        return {
            title: 'My Profile | Launchit',
        };
    }

    const supabase = createPublicSupabaseClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, bio')
        .ilike('username', params.username)
        .single();

    if (!profile) {
        return {
            title: 'User Not Found | Launchit',
        };
    }

    return {
        title: `${profile.full_name || profile.username} - Projects on Launchit`,
        description: profile.bio || `Check out projects launched by ${profile.full_name || profile.username} on Launchit`,
        keywords: `${profile.username}, ${profile.full_name}, founder, maker, projects`,
        alternates: {
            canonical: `https://launchit.site/profile/${params.username}`,
        },
        openGraph: {
            title: `${profile.full_name || profile.username} | Launchit`,
            description: profile.bio || `Projects by ${profile.full_name || profile.username}`,
            url: `https://launchit.site/profile/${params.username}`,
            siteName: "Launchit",
            type: "profile",
        },
    };
}

// Server Component - Fetches user profile data
export default async function UserProfilePage(props) {
    const params = await props.params;
    if (params.username === 'me') {
        return <UserProfileClient initialProfile={null} initialProjects={[]} />;
    }

    const supabase = await createServerSupabaseClient();
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', params.username)
        .single();

    if (error || !profile) {
        notFound();
    }

    // Fetch user's projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

    return (
        <UserProfileClient
            initialProfile={profile}
            initialProjects={projects || []}
        />
    );
}
