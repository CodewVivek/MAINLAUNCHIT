import React from "react";

export const metadata = {
    title: "Terms of Service - Launchit",
    description: "Read Launchit's Terms of Service to understand the rules and guidelines for using our platform.",
};

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-6 sm:px-8">
            <h1 className="text-4xl sm:text-5xl font-black mb-10 text-center tracking-tight">Terms of Service</h1>

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
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">1. Introduction and Acceptance</h2>
                    <p>
                        Welcome to Launchit! These Terms of Service ("Terms") govern your use of our startup discovery and launch platform.
                        By accessing or using Launchit, you agree to be bound by these Terms and our Privacy Policy.
                    </p>
                    <p className="mt-4">
                        Launchit is a platform that connects entrepreneurs, investors, and startup enthusiasts. We provide tools for discovering,
                        showcasing, and launching early-stage startups and innovative projects.
                    </p>
                    <div className="bg-primary/5 p-4 rounded-xl mt-6 border border-primary/10">
                        <p className="text-sm font-semibold">
                            <span className="text-primary mr-1">Important:</span> If you do not agree to these Terms, please do not use our platform.
                            Your continued use of Launchit constitutes acceptance of these Terms.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">2. What Launchit Does</h2>
                    <div className="bg-muted/20 p-6 rounded-2xl border border-border">
                        <p className="mb-4 font-medium">
                            Our platform serves as a bridge between innovative ideas and the resources needed to bring them to life.
                            Launchit is a startup platform that provides:
                        </p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong>Startup Discovery:</strong> Browse and discover early-stage startups and innovative projects by category</li>
                            <li><strong>Project Submission:</strong> Submit and showcase your startup ideas; manage drafts and launches</li>
                            <li><strong>Community Interaction:</strong> Upvote projects, comment, save, follow creators, and share</li>
                            <li><strong>Creator Profiles:</strong> Public profiles with your launches, upvoted/saved/viewed projects</li>
                            <li><strong>Paid Visibility Plans:</strong> Optional Showcase and Spotlight plans for enhanced placement (processed via our payment partner, Dodo Payments)</li>
                            <li><strong>Billing Management:</strong> Manage subscriptions and billing through our customer portal (Dodo)</li>
                            <li><strong>Networking and Feedback:</strong> Connect with founders; optional pitch and community feedback features</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">3. User Accounts and Registration</h2>

                    <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>You must be at least 13 years old to create an account</li>
                        <li>You must provide accurate, current, and complete information during registration</li>
                        <li>You are responsible for maintaining the security of your account credentials</li>
                        <li>You may sign in via Google OAuth or email (magic link / OTP) or other approved methods we offer</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">3.2 Account Responsibilities</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>You are responsible for all activities that occur under your account</li>
                        <li>You must notify us immediately of any unauthorized use of your account</li>
                        <li>You may not share your account credentials with others</li>
                        <li>You may not create multiple accounts for malicious purposes</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">3.3 Account Termination</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>You may delete your account at any time through your account settings</li>
                        <li>We may suspend or terminate your account for violations of these Terms</li>
                        <li>Account termination will remove your personal data but may preserve public content</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">4. Acceptable Use and Community Guidelines</h2>

                    <h3 className="text-xl font-semibold mb-3">4.1 What You Can Do</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>Submit legitimate startup projects and business ideas</li>
                        <li>Engage respectfully with other community members</li>
                        <li>Share constructive feedback and insights</li>
                        <li>Use the platform for networking and collaboration</li>
                        <li>Report inappropriate content or behavior</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">4.2 What You Cannot Do</h3>
                    <div className="bg-destructive/5 p-6 rounded-2xl border border-destructive/10">
                        <ul className="list-disc ml-6 space-y-2 text-destructive font-medium">
                            <li><strong>Illegal Activities:</strong> Use the platform for any unlawful purpose</li>
                            <li><strong>Harassment:</strong> Harass, abuse, or harm other users</li>
                            <li><strong>Spam:</strong> Post spam, advertisements, or promotional content without permission</li>
                            <li><strong>False Information:</strong> Submit fake startups or misleading information</li>
                            <li><strong>Intellectual Property:</strong> Infringe on others' copyrights, trademarks, or patents</li>
                            <li><strong>Security:</strong> Attempt to hack, disrupt, or compromise platform security</li>
                            <li><strong>Impersonation:</strong> Impersonate others or create fake accounts</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">5. Content Submission and Ownership</h2>

                    <h3 className="text-xl font-semibold mb-3">5.1 Your Content</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>You retain ownership of the content you submit to Launchit</li>
                        <li>You are responsible for the accuracy and legality of your submissions</li>
                        <li>You grant us a license to display and distribute your content on the platform</li>
                        <li>You represent that you have the right to share the content you submit</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">5.2 Content Guidelines</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>Startup submissions must be genuine business ideas or projects</li>
                        <li>Content must be appropriate for a professional startup community</li>
                        <li>Images and media must be owned by you or properly licensed</li>
                        <li>Descriptions should be accurate and not misleading</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">5.3 Content Moderation</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We reserve the right to review and moderate all content</li>
                        <li>Content that violates these Terms may be removed</li>
                        <li>We may suspend accounts for repeated violations</li>
                        <li>You can appeal content removal decisions</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">6. Payments and Subscriptions</h2>

                    <h3 className="text-xl font-semibold mb-3">6.1 Paid Plans</h3>
                    <p className="mb-4">
                        Launchit may offer paid visibility plans (e.g. Showcase, Spotlight) to give your project enhanced placement and features.
                        Pricing and plan details are shown on our Pricing page. Payment is processed by our payment partner, Dodo Payments.
                    </p>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>You may upgrade a launched project to a paid plan via the Pricing page and checkout flow</li>
                        <li>Subscription terms (billing cycle, renewal, cancellation) are governed by the plan you select and Dodo&apos;s payment terms</li>
                        <li>You can manage your subscription, update payment methods, and cancel through our customer portal (powered by Dodo)</li>
                        <li>Refund and cancellation policies for paid plans are as stated at checkout and in Dodo&apos;s terms where applicable</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">6.2 Your Responsibilities</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>You must provide accurate billing information and pay fees for any plan you purchase</li>
                        <li>You may not abuse the payment system, circumvent fees, or use the platform for payment fraud</li>
                        <li>If your subscription lapses or is cancelled, your project may revert to standard (free) placement as described in our product</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">7. Community Features and Interactions</h2>

                    <h3 className="text-xl font-semibold mb-3">7.1 Comments and Feedback</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>Comments should be constructive and respectful</li>
                        <li>Personal attacks and hate speech are prohibited</li>
                        <li>Spam comments and self-promotion are not allowed</li>
                        <li>You can report inappropriate comments for review</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">7.2 Networking and Connections</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>You can connect with other users through the platform</li>
                        <li>Respect others' privacy and communication preferences</li>
                        <li>Do not use connections for spam or harassment</li>
                        <li>Professional networking is encouraged</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">7.3 Community Standards</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Treat all community members with respect</li>
                        <li>Share knowledge and insights constructively</li>
                        <li>Help maintain a positive and productive environment</li>
                        <li>Report violations to help protect the community</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">8. Intellectual Property and Licensing</h2>

                    <h3 className="text-xl font-semibold mb-3">8.1 Platform Intellectual Property</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>Launchit and its content are protected by intellectual property laws</li>
                        <li>You may not copy, modify, or distribute our platform code or design</li>
                        <li>Our trademarks and branding are our exclusive property</li>
                        <li>You may use the platform for its intended purpose only</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">8.2 User Content Licensing</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>By submitting content, you grant us a worldwide, non-exclusive license</li>
                        <li>This license allows us to display and distribute your content on the platform</li>
                        <li>You retain ownership and can remove your content at any time</li>
                        <li>Other users may view and interact with your public content</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">8.3 Third-Party Content</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We respect third-party intellectual property rights</li>
                        <li>If you believe your content was used without permission, contact us</li>
                        <li>We will investigate and remove infringing content promptly</li>
                        <li>You are responsible for ensuring you have rights to share content</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">9. Privacy and Data Protection</h2>
                    <p className="mb-4">
                        Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy,
                        which is incorporated into these Terms by reference.
                    </p>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>We collect information necessary to provide our services</li>
                        <li>Your data is protected using industry-standard security measures</li>
                        <li>We do not sell your personal information to third parties</li>
                        <li>You have control over your data and can request deletion</li>
                        <li>We use analytics tools to understand platform usage and improve our services</li>
                    </ul>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <p className="text-sm font-semibold">
                            <span className="text-primary mr-1">Note:</span> By using Launchit, you consent to our data collection and analytics practices as described in our Privacy Policy.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">10. Platform Availability and Maintenance</h2>

                    <h3 className="text-xl font-semibold mb-3">10.1 Service Availability</h3>
                    <ul className="list-disc ml-6 space-y-2 mb-6">
                        <li>We strive to maintain high platform availability</li>
                        <li>Service may be temporarily unavailable for maintenance</li>
                        <li>We will notify users of planned maintenance when possible</li>
                        <li>We are not liable for temporary service interruptions</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">9.2 Platform Updates</h3>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>We continuously improve and update our platform</li>
                        <li>New features may be added or existing ones modified</li>
                        <li>Significant changes and acceptance through continued use</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">11. Disclaimers and Limitations</h2>

                    <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800/30">
                        <h3 className="text-xl font-bold mb-4 text-orange-800 dark:text-orange-400">Important Disclaimers:</h3>
                        <ul className="list-disc ml-6 space-y-2 text-orange-700 dark:text-orange-300 font-medium">
                            <li><strong>No Investment Advice:</strong> Launchit does not provide investment, financial, or legal advice</li>
                            <li><strong>User Responsibility:</strong> Users are responsible for their own business decisions</li>
                            <li><strong>Content Accuracy:</strong> We do not verify the accuracy of user-submitted content</li>
                            <li><strong>No Guarantees:</strong> We do not guarantee the success of any startup or project</li>
                            <li><strong>Third-Party Links:</strong> We are not responsible for content on external websites bridged by links</li>
                        </ul>
                    </div>
                    <p className="mt-6">
                        To the maximum extent permitted by law, Launchit shall not be liable for any indirect, incidental,
                        special, or consequential damages arising from your use of the platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">12. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of the jurisdiction where Launchit operates. Any disputes will be resolved through
                        direct communication or appropriate legal channels in the presiding jurisdiction.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">13. Contact Information</h2>
                    <div className="bg-muted p-6 rounded-2xl border border-border">
                        <p className="mb-4 font-medium">If you have any questions about these Terms, please contact us:</p>
                        <div className="space-y-2 text-sm sm:text-base">
                            <p><span className="text-muted-foreground mr-2">X:</span> <a href="https://x.com/launchit__" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">@launchit__</a> or <a href="https://x.com/vweekk_" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">@vweekk_</a></p>
                            <p><span className="text-muted-foreground mr-2">Peerlist:</span> <a href="https://peerlist.io/vwekk" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary transition-colors">peerlist.io/vwekk</a></p>
                        </div>
                    </div>
                </section>

                <div className="pt-12 border-t border-border text-center text-muted-foreground text-sm">
                    <p>Effective as of August 17, 2025. Last updated January 2026.</p>
                    <p className="mt-1">By using Launchit, you agree to these Terms and our Privacy Policy.</p>
                </div>
            </div>
        </div>
    );
}
