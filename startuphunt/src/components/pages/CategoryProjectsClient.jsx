'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { ArrowLeft, Rocket, ExternalLink, Calendar, Tag, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '@/components/Skeletons';
import ProjectCard from "@/components/ProjectCard";
import PremiumSponsorCard from "@/components/PremiumSponsorCard";

const CategoryProjects = ({ category, initialProjects = [], initialError = null }) => {
    const router = useRouter();
    const [projects, setProjects] = useState(initialProjects);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError);

    const fetchCategoryProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
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

                setError('Failed to load projects');
                toast.error('Failed to load projects');
            } else {
                setProjects(data || []);
            }
        } catch (error) {

            setError('An error occurred while loading projects');
            toast.error('An error occurred while loading projects');
        } finally {
            setLoading(false);
        }
    };

    const openProject = (project) => {
        router.push(`/launches/${project.slug}`);
    };

    const spotlightProjects = projects.filter(p => p.plan_type === 'Spotlight');
    const highlightProjects = projects.filter(p => p.plan_type === 'Showcase');
    const normalProjects = projects.filter(p => !p.plan_type || (p.plan_type !== 'Spotlight' && p.plan_type !== 'Showcase'));

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background pt-16">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-background pt-4">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground capitalize">{category} Startups & Tools</h1>
                            <p className="text-muted-foreground mt-1">
                                {projects.length} {projects.length === 1 ? 'project' : 'projects'} found
                            </p>
                        </div>
                    </div>

                    {/* SEO Content Section */}
                    {projects.length > 0 && (
                        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <h2 className="text-xl font-semibold text-foreground mb-4">Discover the Best {category.charAt(0).toUpperCase() + category.slice(1)} Startups</h2>
                                <p className="text-foreground/80 mb-4">
                                    Welcome to Launchit's curated collection of {category} startups and innovative tools. This directory features {projects.length}+ cutting-edge {category} projects submitted by founders who are building the future of {category}.
                                </p>
                                <p className="text-foreground/80 mb-4">
                                    Whether you're looking for inspiration, researching the latest {category} trends, or searching for your next favorite {category} tool, you'll find a diverse range of products here. From early-stage MVPs to established {category} platforms, each project represents real innovation from builders around the world.
                                </p>
                                <h3 className="text-lg font-semibold text-foreground mb-3">Why Explore {category.charAt(0).toUpperCase() + category.slice(1)} Projects on Launchit?</h3>
                                <ul className="list-disc list-inside text-foreground/80 space-y-2 mb-4">
                                    <li><strong>Curated Quality:</strong> Every {category} project is submitted by real founders and makers</li>
                                    <li><strong>Fresh Innovation:</strong> Discover new {category} tools and products as they launch</li>
                                    <li><strong>Direct Access:</strong> Connect with founders and get early access to {category} solutions</li>
                                    <li><strong>Diverse Solutions:</strong> From free tools to enterprise {category} platforms</li>
                                </ul>
                                <p className="text-foreground/80">
                                    Browse the {category} startups below to find innovative solutions, get inspired by what other founders are building, and discover tools that can help you in your own {category} journey. Each project page includes detailed information, screenshots, and direct links to try the products yourself.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {projects.length === 0 ? (
                        <div className="text-center py-16">
                            <Rocket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold text-foreground mb-2">No {category} projects yet</h2>
                            <p className="text-muted-foreground mb-6">
                                Be the first to launch a {category} project!
                            </p>
                            <button
                                onClick={() => router.push('/submit')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Launch Your Project
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* SPOTLIGHT SECTION */}
                            {spotlightProjects.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-px flex-1 bg-border/40" />
                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-muted/30 text-yellow-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Spotlight</span>
                                        </div>
                                        <div className="h-px flex-1 bg-border/40" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {spotlightProjects.map(p => (
                                            <PremiumSponsorCard key={p.id} project={p} onClick={openProject} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* HIGHLIGHTS SECTION */}
                            {highlightProjects.length > 0 && (
                                <div>
                                    <h3 className="text-2xl font-semibold flex items-center gap-2 text-muted-foreground mb-6">
                                        Today's Highlights
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {highlightProjects.map(p => (
                                            <ProjectCard key={p.id} project={p} onProjectClick={openProject} utmSource="category_highlight" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* NORMAL PROJECTS SECTION */}
                            {normalProjects.length > 0 && (
                                <div>
                                    <h3 className="text-2xl font-semibold text-muted-foreground mb-6">
                                        {spotlightProjects.length > 0 || highlightProjects.length > 0 ? "More Projects" : category + " Projects"}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {normalProjects.map((project) => (
                                            <ProjectCard key={project.id} project={project} onProjectClick={openProject} utmSource="category_normal" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CategoryProjects; 