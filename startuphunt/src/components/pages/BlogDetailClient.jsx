'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    ChevronLeft,
    Share2,
    Twitter,
    Linkedin as LinkedIn,
    ArrowRight,
    User,
    Bookmark,
    List,
    Rocket
} from 'lucide-react';

const BlogDetailClient = ({ post }) => {
    const [activeSection, setActiveSection] = useState('');
    const [toc, setToc] = useState([]);

    useEffect(() => {
        // Basic TOC generator from headers
        const extractHeaders = () => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.content; // This assumes processed HTML or simple text
            // If it's pure markdown, we'd need a parser. For now, assume it's rendered.

            // Simulation for now - in a real app, use a markdown parser's AST
            const mockToc = [
                { id: 'introduction', text: 'Introduction', level: 2 },
                { id: 'the-strategy', text: 'The Core Strategy', level: 2 },
                { id: 'execution', text: 'Execution & Launch', level: 2 },
                { id: 'final-tips', text: 'Final Tips', level: 2 },
            ];
            setToc(mockToc);
        };
        extractHeaders();
    }, [post]);

    if (!post) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Minimal Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-[60]">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/blog" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Blog
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <Link href="/submit" className="hidden sm:flex px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10">
                            Submit My Project
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12 relative">

                    {/* LEFT COLUMN: Founder & Stats (Author Bio) */}
                    <aside className="w-full lg:w-72 order-2 lg:order-1 lg:sticky lg:top-28 h-fit space-y-8">
                        {/* Author Card */}
                        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">About the Author</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center border border-blue-200 overflow-hidden">
                                    <User className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground leading-tight">Founder</h4>
                                    <p className="text-xs text-muted-foreground">@launchit__</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                Building Launchit to help every maker ship their product without gatekeepers.
                            </p>
                            <a
                                href="https://x.com/launchit__"
                                target="_blank"
                                className="w-full py-2.5 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                            >
                                <Twitter className="w-3.5 h-3.5" /> Follow on X
                            </a>
                        </div>

                        {/* Platform Stats */}
                        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-4 flex items-center gap-2">
                                <Rocket className="w-3 h-3" /> Community
                            </h3>
                            <div className="text-3xl font-black mb-1 leading-none">300+</div>
                            <p className="text-blue-100 text-xs font-medium mb-6">Makers are already launching here.</p>
                            <Link href="/submit" className="text-white text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-blue-200 transition-colors">
                                Join them now →
                            </Link>
                        </div>
                    </aside>

                    {/* MIDDLE COLUMN: The Content */}
                    <article className="flex-1 min-w-0 order-1 lg:order-2">
                        {/* Article Header */}
                        <header className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase tracking-widest">
                                    {post.category || 'Article'}
                                </span>
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Clock className="w-4 h-4" /> 5 min read
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground mb-8 leading-[1.1] tracking-tight">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground border-y border-border py-4 font-medium">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Published {new Date(post.created_at).toLocaleDateString()}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span className="flex items-center gap-2">
                                    <Bookmark className="w-4 h-4" /> Save Article
                                </span>
                            </div>
                        </header>

                        {/* Cover Image */}
                        {post.cover_image && (
                            <div className="mb-12 rounded-[2rem] overflow-hidden border border-border shadow-2xl">
                                <img src={post.cover_image} alt={post.title} className="w-full h-auto aspect-video object-cover" />
                            </div>
                        )}

                        {/* Post Content */}
                        <div className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-[2.5rem] prose-img:border prose-img:border-border prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed">
                            {/* In a real app, use react-markdown here */}
                            <div className="whitespace-pre-wrap text-[1.125rem] md:text-[1.25rem] leading-[1.8] font-medium text-foreground/80">
                                {post.content}
                            </div>
                        </div>

                        {/* Footer CTA */}
                        <div className="mt-20 p-10 bg-muted rounded-[2.5rem] border border-border flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
                                <Rocket className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black mb-2 leading-none">Loved this article?</h3>
                                <p className="text-muted-foreground font-medium mb-4">Put these tips into practice and launch your startup on Launchit today.</p>
                                <Link href="/submit" className="text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:gap-3 transition-all">
                                    Launch My Startup <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </article>

                    {/* RIGHT COLUMN: Table of Contents */}
                    <aside className="w-full lg:w-64 order-3 lg:sticky lg:top-28 h-fit hidden xl:block">
                        <div className="bg-card/50 backdrop-blur-md rounded-3xl border border-border p-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                <List className="w-3.5 h-3.5" /> In this article
                            </h3>
                            <nav className="space-y-1">
                                {toc.map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        className={`block py-2 text-sm font-bold transition-all border-l-2 pl-4 -ml-6 ${activeSection === item.id
                                            ? 'border-blue-600 text-blue-600 bg-blue-500/5'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        {item.text}
                                    </a>
                                ))}
                            </nav>

                            <div className="mt-8 pt-8 border-t border-border">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Share this story</h4>
                                <div className="flex items-center gap-3">
                                    <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                        <Twitter className="w-4 h-4" />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-blue-700 hover:text-white transition-colors">
                                        <LinkedIn className="w-4 h-4" />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
};

export default BlogDetailClient;
