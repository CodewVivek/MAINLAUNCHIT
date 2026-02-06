'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    ArrowRight,
    Clock,
    Calendar,
    ChevronRight,
    Rocket
} from 'lucide-react';

const BlogListClient = ({ initialPosts = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', ...new Set(initialPosts.map(p => p.category).filter(Boolean))];

    const filteredPosts = initialPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-background">


            <div className="max-w-[1440px] mx-auto px-6 py-12">
                {/* Categories */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat
                                ? 'bg-foreground text-background shadow-lg'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {filteredPosts.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-muted-foreground text-lg">No articles found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post) => (
                            <Link
                                href={`/blog/${post.slug}`}
                                key={post.id}
                                className="group flex flex-col bg-card rounded-3xl border border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                            >
                                <div className="relative h-60 overflow-hidden">
                                    {post.cover_image ? (
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Rocket className="w-12 h-12 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            {post.category || 'Article'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight text-muted-foreground mb-4">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> 5 min read
                                        </span>
                                    </div>

                                    <h2 className="text-xl md:text-2xl font-black text-foreground mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                                        {post.title}
                                    </h2>

                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-8 leading-relaxed">
                                        {post.excerpt || 'Read the latest insights and tips for modern startup founders.'}
                                    </p>

                                    <div className="mt-auto flex items-center text-blue-600 font-black text-[13px] uppercase tracking-wider group-hover:gap-2 transition-all">
                                        Read Article <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogListClient;
