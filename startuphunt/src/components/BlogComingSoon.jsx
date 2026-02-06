'use client';

import Link from 'next/link';
import { Rocket, ArrowRight } from 'lucide-react';

export default function BlogComingSoon() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-20">
            <div className="max-w-lg mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-8">
                    <Rocket className="w-3.5 h-3.5" /> Blog
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">
                    Coming soon
                </h1>
                <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                    We're preparing guides, launch stories, and tips for founders. Check back soon.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                >
                    Back to Launchit <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
