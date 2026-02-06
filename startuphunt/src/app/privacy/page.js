import React from "react";

export const metadata = {
    title: "Privacy Policy - Launchit",
    description: "Read Launchit's Privacy Policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-6 sm:px-8">
            <h1 className="text-4xl sm:text-5xl font-black mb-10 text-center tracking-tight">Privacy Policy</h1>

            <div className="bg-muted/50 p-6 rounded-2xl mb-12 border border-border">
                <p className="text-md font-medium">
                    <span className="text-muted-foreground mr-2">Effective Date:</span> August 17, 2025
                </p>
                <p className="text-md font-medium mt-1">
                    <span className="text-muted-foreground mr-2">Last Updated:</span> January 2026
                </p>
            </div>

            <div className="space-y-12 text-foreground/90 leading-relaxed text-sm sm:text-base">
                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">1. Introduction</h2>
                    <p>
                        Launchit ("we", "our", "us") is a platform dedicated to discovering, showcasing, and launching early-stage startups and innovative projects.
                        We are committed to protecting your privacy and ensuring transparency about how we collect, use, and protect your information.
                    </p>
                    <p className="mt-4">
                        This Privacy Policy explains how we handle your information when you use our platform to discover startups, submit your own projects,
                        interact with other users, and engage with our community features.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">2. What We Do</h2>
                    <div className="bg-muted/20 p-6 rounded-2xl border border-border text-sm sm:text-base">
                        <p className="mb-4 font-medium uppercase tracking-wider text-xs text-muted-foreground">Launchit is a startup discovery and launch platform that:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Allows users to discover and explore early-stage startups and projects</li>
                            <li>Enables entrepreneurs to submit and showcase their startup ideas</li>
                            <li>Facilitates community interaction through upvotes, comments, saves, follows, and sharing</li>
                            <li>Provides category-based discovery, profiles, and view history</li>
                            <li>Offers paid visibility plans (Showcase, Spotlight) processed via our payment partner</li>
                            <li>Supports networking, creator profiles, and optional pitch/feedback features</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">3. Information We Collect</h2>

                    <h3 className="text-xl font-semibold mb-3">3.1 Account Information</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6 font-medium text-muted-foreground">
                        <li><span className="text-foreground">Profile Data:</span> Name, email address, profile picture, and username</li>
                        <li><span className="text-foreground">Authentication:</span> Google OAuth credentials (when using Google sign-in)</li>
                        <li><span className="text-foreground">Account Settings:</span> Preferences, notification settings, and profile visibility</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">3.2 Startup/Project Submissions</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6 font-medium text-muted-foreground">
                        <li><span className="text-foreground">Project Details:</span> Startup name, description, website, logo, images, and category</li>
                        <li><span className="text-foreground">Technical Information:</span> Built-with technologies, launch status, and project metadata</li>
                        <li><span className="text-foreground">Media Content:</span> Thumbnails, screenshots, and promotional materials you upload</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">3.3 User Interactions</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6 font-medium text-muted-foreground">
                        <li><span className="text-foreground">Engagement Data:</span> Upvotes (likes), comments, saves, follows, and project view history</li>
                        <li><span className="text-foreground">Search and Browsing:</span> Search queries, results clicked, and browsing patterns</li>
                        <li><span className="text-foreground">Community Participation:</span> Feedback, community contributions, and reports</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">3.4 Payment and Billing</h3>
                    <ul className="list-disc ml-6 space-y-2 font-medium text-muted-foreground">
                        <li><span className="text-foreground">Payment Processing:</span> Paid plans (Showcase, Spotlight) are processed by our payment partner, Dodo Payments. We do not store your full payment card details; card data is handled by Dodo and their processors.</li>
                        <li><span className="text-foreground">Billing Data:</span> We may store subscription status, plan type, and project–plan association. You can manage billing and subscriptions via our customer portal (powered by Dodo).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">4. How We Use Your Information</h2>

                    <h3 className="text-xl font-semibold mb-3">4.1 Core Platform Services</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>Providing and maintaining the Launchit platform</li>
                        <li>Processing your startup submissions and project uploads</li>
                        <li>Enabling user authentication and account management</li>
                        <li>Facilitating community interactions and networking</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">4.2 Platform Improvement</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Analyzing usage patterns to improve user experience</li>
                        <li>Developing new features based on user needs</li>
                        <li>Optimizing platform performance and functionality</li>
                        <li>Understanding user journey and navigation patterns</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">5. Information Sharing</h2>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                        <p className="font-bold mb-4">Important: Content Visibility</p>
                        <p className="text-sm">
                            When you submit a startup or project to Launchit, this information becomes publicly visible
                            to all platform users. This includes project details, images, and creator information.
                        </p>
                    </div>

                    <h3 className="text-xl font-semibold mt-8 mb-4">5.1 Service Providers</h3>
                    <ul className="list-disc ml-6 space-y-2 font-medium text-muted-foreground">
                        <li><span className="text-foreground">Infrastructure:</span> Supabase for database and authentication</li>
                        <li><span className="text-foreground">Analytics:</span> Privacy-focused analytics for platform insights</li>
                        <li><span className="text-foreground">Communication:</span> Third-party email delivery for notifications</li>
                        <li><span className="text-foreground">AI Services:</span> Models for content generation and search</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">6. Data Security</h2>
                    <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-2xl border border-green-200 dark:border-green-800/30">
                        <ul className="list-disc ml-6 space-y-2 text-green-700 dark:text-green-300 font-medium">
                            <li>All data is encrypted in transit and at rest</li>
                            <li>Strict authentication and authorization protocols</li>
                            <li>Row-Level Security (RLS) enabled on all databases</li>
                            <li>Regular security assessments and backups</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">7. Your Rights and Choices</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Update or delete your profile information at any time in Settings</li>
                        <li>Edit or remove your project submissions and comments</li>
                        <li>Manage subscriptions and billing via the customer portal (Dodo)</li>
                        <li>Request a full copy of your data or account deletion (contact us or use in-app options where available)</li>
                        <li>Manage communication and notification preferences in account settings</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">8. Contact Information</h2>
                    <div className="bg-muted p-6 rounded-2xl border border-border">
                        <p className="mb-4 font-medium">If you have any questions about this Privacy Policy, please contact us:</p>
                        <div className="space-y-2 text-sm sm:text-base">
                            <p><span className="text-muted-foreground mr-2">X:</span> <a href="https://x.com/launchit__" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">@launchit__</a> or <a href="https://x.com/vweekk_" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">@vweekk_</a></p>
                            <p><span className="text-muted-foreground mr-2">Peerlist:</span> <a href="https://peerlist.io/vwekk" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">peerlist.io/vwekk</a></p>
                        </div>
                    </div>
                </section>

                <div className="pt-12 border-t border-border text-center text-muted-foreground text-sm">
                    <p>Effective as of August 17, 2025. Last updated January 2026.</p>
                    <p className="mt-1">We are committed to protecting your privacy and being transparent about our practices.</p>
                </div>
            </div>
        </div>
    );
}
