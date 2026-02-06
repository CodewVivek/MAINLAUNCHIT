'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Rocket, Crown, Sparkles, ArrowRight, ShieldCheck, Zap, Plus, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const AnimatedCounter = ({ target, duration = 0.5, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / (duration * 1000);

            if (progress < 1) {
                setCount(Math.floor(target * progress));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    const formatNumber = (num) => {
        return num.toLocaleString();
    };

    return <span>{formatNumber(count)}{suffix}</span>;
};

export default function PricingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlProjectId = searchParams.get('projectId');

    const [selectedPlan, setSelectedPlan] = useState('Showcase');
    const [loadingCheckout, setLoadingCheckout] = useState(false);

    // Project Selection State
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [userProjects, setUserProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    useEffect(() => {
        const planParam = searchParams.get('plan');
        if (planParam) {
            setSelectedPlan(planParam);
        }

        // If we have a projectId and plan in the URL, the user was just redirected 
        // from the submission flow. We can proceed directly to checkout.
        if (urlProjectId && planParam) {
            processCheckout(urlProjectId);
        }
    }, [searchParams, urlProjectId]);

    const fetchProjectsAndShowModal = async (planForUpgrade) => {
        setLoadingProjects(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/register?redirect=/pricing');
                return;
            }

            const { data: projects, error } = await supabase
                .from('projects')
                .select('id, name, tagline, logo_url, status, plan_type, subscription_status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!projects || projects.length === 0) {
                alert("You don't have any projects to upgrade yet! Please launch one first.");
                router.push('/submit');
                return;
            }

            // Exclude projects already on this plan (or higher) — they can't pay again for the same plan
            const plan = planForUpgrade || selectedPlan;
            const eligible = projects.filter((p) => {
                if (p.status === 'draft') return true;
                if (p.plan_type === plan) return false; // already on Showcase/Spotlight — don't offer again
                if (plan === 'Showcase' && p.plan_type === 'Spotlight') return false; // already on higher plan
                return true;
            });

            if (eligible.length === 0) {
                alert(`All your launches are already on ${plan} or a higher plan. Manage your subscription in Settings.`);
                setLoadingProjects(false);
                return;
            }

            setUserProjects(eligible);
            setShowProjectModal(true);
        } catch (error) {
            alert('Failed to load your projects.');
        } finally {
            setLoadingProjects(false);
        }
    };

    const processCheckout = async (projectIdToUse) => {
        setLoadingCheckout(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/register');
                return;
            }

            // Dodo adapter expects checkout-session shaped payload.
            // Product IDs must be exposed to the client (NEXT_PUBLIC_) or fetched from your backend.
            const productId =
                selectedPlan === 'Showcase'
                    ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_SHOWCASE
                    : selectedPlan === 'Spotlight'
                        ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_SPOTLIGHT
                        : null;

            if (!productId) {
                alert('Missing product configuration. Please set NEXT_PUBLIC_DODO_PRODUCT_ID_SHOWCASE / NEXT_PUBLIC_DODO_PRODUCT_ID_SPOTLIGHT.');
                return;
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // IMPORTANT: Send cookies for authentication
                body: JSON.stringify({
                    product_cart: [{ product_id: productId, quantity: 1 }],
                    customer: { email: user.email },
                    return_url: `${window.location.origin}/dashboard`,
                    metadata: {
                        userId: String(user.id),
                        planType: String(selectedPlan),
                        projectId: String(projectIdToUse),
                    },
                }),
            });

            // Dodo adapter may return non-JSON on errors; parse safely.
            const raw = await response.text();
            let data = null;
            try {
                data = JSON.parse(raw);
            } catch {
                data = { error: raw };
            }

            if (response.ok && data?.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }

            alert(data?.error || 'Checkout failed. Please try again.');
        } catch (error) {
            alert('Something went wrong. Please try again.');
        } finally {
            setLoadingCheckout(false);
            setShowProjectModal(false);
        }
    };

    const handleCheckout = async (planName) => {
        if (planName === 'Standard') {
            router.push('/submit');
            return;
        }

        setSelectedPlan(planName);

        // 1. If we already have a projectId from URL, use it directly
        if (urlProjectId) {
            await processCheckout(urlProjectId);
            return;
        }

        // 2. Otherwise show modal with only projects that can be upgraded (excludes already on this plan)
        await fetchProjectsAndShowModal(planName);
    };

    const plans = [
        {
            name: 'Standard',
            price: 0,
            description: 'Get listed and gather community feedback.',
            icon: Sparkles,
            gradient: 'from-emerald-500/10 to-teal-500/10',
            accent: 'emerald',
            features: [
                'Homepage listing (standard rotation)',
                'Dedicated project page for visitors',
                'Community upvotes & organic discovery',
                '1 SEO do-follow backlink (add badge + reach 10 upvotes)',
                'Category listing with standard placement',
            ],
            cta: 'Get Started Free',
            popular: false
        },
        {
            name: 'Showcase',
            price: 9,
            description: 'Make your project visible to the world.',
            icon: Rocket,
            gradient: 'from-blue-500/10 to-indigo-500/10',
            accent: 'blue',
            features: [
                'Direct traffic to your website ',
                'Featured in Today’s highlights',
                'Top placement in your category',
                '5 SEO do-follow backlinks (no badge required)',
                'One-time email feature',
                'Cancel anytime'
            ],
            cta: 'Start Showcase',
            popular: true
        },
        {
            name: 'Spotlight',
            price: 59,
            description: 'Maximum visibility for serious builders.',
            icon: Crown,
            gradient: 'from-violet-500/10 to-purple-500/10',
            accent: 'violet',
            features: [
                'Everything in Showcase',
                'Premium homepage placement',
                'Top placement across all categories',
                'Shared on X (Twitter) 10 times',
                '7 SEO Dofollow backlinks',
                'Full SEO-focused launch blog',
                'Email feature (until subscription expires)',
                'Priority support',
                'Cancel anytime'
            ],
            cta: 'Go Spotlight',
            popular: false
        }
    ];

    const faqs = [
        {
            question: 'Is this a monthly subscription?',
            answer: 'Yes. These plans are monthly subscriptions that apply to a single project launch. You can cancel any time if you no longer need the promotion.'
        },
        {
            question: 'What is Direct-to-website?',
            answer: 'Clicks go straight to your website instead of a project details page, helping you maximize conversions.'
        },
        {
            question: 'How do relaunches work?',
            answer: 'Relaunch brings your existing project back into Today for fresh visibility. Same URL, no resubmission.'
        },
        {
            question: 'Do you offer refunds?',
            answer: 'Full refunds if your project is rejected. Successful launches are final.'
        },
        {
            question: 'What are the SEO benefits?',
            answer: 'Launchit provides contextual dofollow backlinks from relevant product pages and editorial content. These help search engines discover your site and can improve visibility over time as Launchit grows.'
        },
        {
            question: 'How does the free Standard plan work?',
            answer: 'The Standard plan is free. Your project is listed publicly and can earn one website backlink after adding a Launchit badge and reaching at least 10 upvotes.'
        },
        {
            question: 'What’s the difference between Showcase and Spotlight?',
            answer: 'Showcase offers category priority and targeted distribution (5 do-follow backlinks). Spotlight adds homepage priority, multi-category placement, social distribution, 7 do-follow backlinks , and a full SEO-focused launch blog we write for you.'
        },
        {
            question: 'Why is Launchit more affordable than other platforms?',
            answer: 'Launchit is founder-built with lightweight infrastructure and automated reviews, keeping costs low while offering real visibility.'
        },
        {
            question: 'How much traffic can I expect?',
            answer: 'Traffic depends on your product, visuals, category, plan, and participation. Streaks, relaunches, and sharing increase visibility. There are no guarantees.'
        },
        {
            question: 'Do you provide analytics?',
            answer: 'We don’t offer a built-in analytics dashboard yet. Most founders track results using Google Analytics or similar tools.'
        },
        {
            question: 'Can I promote multiple projects?',
            answer: 'Yes. You can launch multiple projects from the same account. Each project has its own promotion plan.'
        },
        {
            question: 'Can I cancel or downgrade?',
            answer: 'Yes, you can manage your subscription from your dashboard. Since plans are monthly, you can stop the promotion whenever you feel you’ve achieved your launch goals.'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] px-6 py-24 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_70%)] pointer-events-none" />

            <AnimatePresence>
                {showProjectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#0f0f0f] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold">Select Project to Upgrade</h3>
                                <button onClick={() => setShowProjectModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                                {userProjects.map((project) => {
                                    const isDraft = project.status === 'draft';
                                    const isActive = ['active', 'trialing'].includes(project.subscription_status);
                                    const isSubscribedToSame = isActive && project.plan_type === selectedPlan;
                                    const isSubscribedToHigher = isActive && project.plan_type === 'Spotlight' && selectedPlan === 'Showcase';
                                    const isDisabled = isSubscribedToSame || isSubscribedToHigher;

                                    return (
                                        <button
                                            key={project.id}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                if (isDraft) {
                                                    router.push(`/submit?edit=${project.id}`); // Redirect to finish launch
                                                } else {
                                                    processCheckout(project.id);
                                                }
                                            }}
                                            disabled={isDisabled}
                                            className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 text-left group ${isDisabled
                                                ? 'opacity-50 grayscale cursor-not-allowed border-slate-100 dark:border-slate-800'
                                                : isDraft
                                                    ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-800'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                {project.logo_url ? (
                                                    <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Rocket className={`w-5 h-5 ${isDraft ? 'text-amber-400' : 'text-slate-400'}`} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className={`font-bold transition-colors ${isDisabled
                                                        ? 'text-slate-400'
                                                        : isDraft
                                                            ? 'text-amber-900 dark:text-amber-100'
                                                            : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                        }`}>
                                                        {project.name}
                                                    </h4>
                                                    {isDisabled ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                                                            Already on {project.plan_type}
                                                        </span>
                                                    ) : (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border ${isDraft
                                                            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                                            }`}>
                                                            {project.status || 'Active'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1">
                                                    {isDraft ? 'Continue setup to launch' : (project.tagline || 'No tagline')}
                                                </p>
                                            </div>
                                            {isDraft && !isDisabled && <ArrowRight className="w-4 h-4 text-amber-400" />}
                                            {isDisabled && <Check className="w-4 h-4 text-blue-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 text-center text-xs text-slate-500">
                                Upgrading for <b>{selectedPlan}</b> plan
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto mb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Boost Your Launch</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">Monthly plans tailored for individual startup launches.</p>
            </div>

            {/* Minimal Stats Grid */}
            <div className="max-w-4xl mx-auto mb-20 text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 mt-8">
                    {[
                        { label: 'Total visits per month', target: 1600, suffix: '+' },
                        { label: 'Impressions per month', target: 15200, suffix: '+' },
                        { label: 'Total page views per month', target: 3200, suffix: '+' },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1.5 font-sans">
                                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                            </div>
                            <div className="text-base font-medium text-slate-500 dark:text-slate-400">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Last 30 days • Updated on 29 JAN
                </div>
            </div>

            {/* Pricing Cards */}
            <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, idx) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.name;

                    return (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            onClick={() => setSelectedPlan(plan.name)}
                            className={`relative rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${isSelected
                                ? 'border-blue-500 shadow-2xl shadow-blue-500/15'
                                : 'border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 hover:border-slate-300 dark:hover:border-slate-700'
                                } bg-white dark:bg-[#0a0a0a]`}
                        >
                            {plan.name === 'Showcase' && (
                                <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-b-xl shadow-lg z-10">
                                    MOST POPULAR
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={`p-6 pb-0`}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5 border border-slate-200/50 dark:border-slate-800/50`}>
                                    <Icon className={`w-6 h-6 ${isSelected || plan.name === 'Showcase' ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'}`} />
                                </div>
                                <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-3xl font-black">${plan.price}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/mo</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed min-h-[32px]">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Divider with subtle gradient */}
                            <div className="px-6 mt-4">
                                <div className="h-px w-full bg-slate-100 dark:bg-slate-900" />
                            </div>

                            {/* Features list */}
                            <div className="p-6 space-y-3 flex-1">
                                {plan.features.map((f, i) => (
                                    <div key={i} className="flex items-start gap-2.5 group/feat">
                                        <div className="mt-0.5 p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/feat:text-blue-500 transition-colors">
                                            {f.includes('Everything') ? <Plus className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-snug group-hover/feat:text-slate-900 dark:group-hover/feat:text-white transition-colors">
                                            {f}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Subscription Info */}
                            <div className="px-6 mb-1">
                                <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">Per Month / 1 Launch</span>
                            </div>

                            {/* CTA Button */}
                            <div className="p-6 pt-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckout(plan.name);
                                    }}
                                    disabled={loadingCheckout}
                                    className={`w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isSelected
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90'
                                        } ${loadingCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loadingCheckout && selectedPlan === plan.name ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {plan.cta}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto mt-32">
                <div className="text-center mb-12">
                    <h2 className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs mb-4">
                        Frequently Asked Questions
                    </h2>
                    <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="border border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                            <h3 className="font-bold mb-3 flex items-start gap-3 text-foreground leading-tight">
                                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                {faq.question}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

