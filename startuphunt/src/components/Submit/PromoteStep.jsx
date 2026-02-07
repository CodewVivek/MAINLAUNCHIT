'use client';

import { useState } from 'react';
import { Sparkles, Check, Copy, ExternalLink, ShieldCheck, Zap, ArrowRight, Crown, MousePointer2, Rocket, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromoteStep({
    formData,
    handleNext,
    handleSaveDraft,
    isStepValid,
    isBadgeVerified,
    setIsBadgeVerified,
    selectedPlan,
    setSelectedPlan,
    profile
}) {
    const [verifying, setVerifying] = useState(false);
    const [badgeTheme, setBadgeTheme] = useState('dark');

    const isAdmin = profile?.role === 'admin';

    const themes = {
        classicDark: { name: 'Featured Dark', img: '/badges/featured-dark.svg' },
        classicLight: { name: 'Featured Light', img: '/badges/featured-light.svg' },
        minimalDark: { name: 'Minimal Dark', img: '/badges/minimal-dark-v2.svg' },
        minimalLight: { name: 'Minimal Light', img: '/badges/minimal-light-v2.svg' }
    };

    if (!themes[badgeTheme]) setBadgeTheme('classicDark');

    const badgeCode = `<a href="https://launchit.site/project/${formData.name?.toLowerCase().replace(/\s+/g, '-')}" target="_blank"><img src="${themes[badgeTheme]?.img || themes.classicDark.img}" alt="Launched on Launchit" width="200" height="54"></a>`;

    const copyCode = () => {
        navigator.clipboard.writeText(badgeCode);
        toast.success("Code copied to clipboard!");
    };

    const verifyBadge = async () => {
        if (!formData.websiteUrl) {
            toast.error("Please provide a website URL in Step 1 first.");
            return;
        }

        setVerifying(true);
        try {
            const response = await fetch('/api/verify-badge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formData.websiteUrl })
            });

            const data = await response.json();

            if (data.success) {
                setIsBadgeVerified(true);
                toast.success(data.message || "Badge verified! Your project is ready to launch.");
            } else {
                toast.error(data.message || "Badge verification failed. Please check and try again.", {
                    duration: 6000
                });
                if (data.hint) {
                    setTimeout(() => {
                        toast(data.hint, {
                            icon: '💡',
                            duration: 5000
                        });
                    }, 500);
                }
            }
        } catch (error) {
            toast.error("Verification failed. Please check your connection and try again.");
        } finally {
            setVerifying(false);
        }
    };

    const plans = [
        {
            id: 'standard',
            name: 'Standard',
            price: 'FREE',
            tagline: 'The Organic Path',
            description: 'Essential visibility for every startup.',
            features: [
                'Homepage listing (standard rotation)',
                'Dedicated project page for visitors',
                'Community upvotes & organic discovery',
                '1 verified do-follow backlink (add badge + reach 10 upvotes)',
                'Category listing with standard placement'
            ],
            requiresBadge: true
        },
        {
            id: 'showcase',
            name: 'Showcase',
            price: '9',
            tagline: 'High Velocity',
            description: 'Direct traffic & priority ranking to scale faster.',
            features: [
                'Direct traffic to your website',
                'Featured in "Today’s highlights"',
                'Top placement in your category',
                '5 verified do-follow backlinks (no badge required)',
                'One-time email feature',
                'No badge required',
                'Cancel anytime'
            ],
            requiresBadge: false,
            isPopular: true
        },
        {
            id: 'spotlight',
            name: 'Spotlight',
            price: '59',
            tagline: 'Elite Distribution',
            description: 'Maximum exposure across all channels.',
            features: [
                'Everything in Showcase',
                'Premium homepage placement',
                'Top placement across all categories',
                'Shared on X (Twitter) 10 times',
                '7 SEO Dofollow backlinks',
                'Full SEO-focused launch blog',
                'Email feature (Until sub expires)',
                'Cancel anytime'
            ],
            requiresBadge: false
        }
    ];

    const currentPlan = plans.find(p => p.id === (selectedPlan || 'standard'));

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="mb-10">
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">
                    Amplify your reach
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                    Choose a plan to boost your visibility and drive more traffic to your product.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const isActive = ['active', 'trialing'].includes(formData.subscription_status);
                    const isCurrentPlan = isActive && formData.plan_type === plan.name;
                    const isHigherActive = isActive && formData.plan_type === 'Spotlight' && plan.id === 'showcase';
                    const isDisabled = isActive && (isCurrentPlan || isHigherActive || plan.id === 'standard');

                    return (
                        <button
                            key={plan.id}
                            onClick={() => {
                                if (isDisabled) return;
                                setSelectedPlan(plan.id);
                            }}
                            disabled={isDisabled}
                            className={`relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left group overflow-hidden min-h-[420px] ${isSelected
                                ? 'bg-blue-50/10 border-blue-600 shadow-xl shadow-blue-500/5'
                                : isDisabled
                                    ? 'opacity-60 bg-muted/50 border-border cursor-not-allowed'
                                    : 'bg-background border-border hover:border-blue-600/20 hover:shadow-lg'
                                }`}
                        >
                            {plan.isPopular && !isCurrentPlan && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">
                                    Popular
                                </div>
                            )}

                            {isCurrentPlan && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-bl-xl shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Current
                                </div>
                            )}

                            <div className="space-y-1.5 mb-6 w-full">
                                <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isSelected ? 'text-blue-600' : 'text-muted-foreground/40'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1.5">
                                    {plan.price === 'FREE' ? (
                                        <span className={`text-3xl font-black ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>FREE</span>
                                    ) : (
                                        <>
                                            <span className="text-xl font-bold text-muted-foreground/30">$</span>
                                            <span className={`text-3xl font-black ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>{plan.price}</span>
                                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest ml-1">/mo</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed mt-2">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="space-y-3 w-full flex-1 pt-4 border-t border-border/50">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-0.5 rounded-full ${isSelected ? 'bg-blue-600/10 text-blue-600' : 'bg-muted text-muted-foreground/30'}`}>
                                            <Check className="w-3 h-3" strokeWidth={4} />
                                        </div>
                                        <span className={`text-[12px] leading-snug font-bold tracking-tight ${isSelected ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className={`mt-8 w-full py-2.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-[0.2em] text-center transition-all ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : isDisabled
                                    ? 'bg-muted border-border text-muted-foreground'
                                    : 'border-border text-muted-foreground group-hover:border-blue-600/30'
                                }`}>
                                {isCurrentPlan ? 'Active' : isHigherActive ? 'Subscribed to Spotlight' : isSelected ? 'Current Selection' : 'Choose Plan'}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Summary/Action Section */}
            <AnimatePresence mode="wait">
                {selectedPlan === 'standard' && (
                    <motion.div
                        key="verify"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 bg-muted/30 border border-border rounded-2xl max-w-5xl mx-auto"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8 flex flex-col justify-center">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-foreground font-black text-xl tracking-tight">
                                        <ShieldCheck className="w-7 h-7 text-blue-600" />
                                        Boost Your SEO Authority
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                        Adding our badge increases your startup's SEO authority and Domain Rating (DR).
                                        As Launchit's authority grows, your project's backlink power scales—driving more organic visibility and search traffic directly to your site.
                                    </p>
                                </div>

                                <button
                                    onClick={verifyBadge}
                                    disabled={verifying || isBadgeVerified}
                                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isBadgeVerified
                                        ? 'bg-green-500 text-white cursor-default'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-[0.98]'
                                        }`}
                                >
                                    {verifying ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verifying...
                                        </>
                                    ) : isBadgeVerified ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 animate-in zoom-in" />
                                            Badge Verified
                                        </>
                                    ) : (
                                        'Verify Now'
                                    )}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Style Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-[0.2em]">
                                            Choose Style
                                        </span>
                                        <div className="h-px flex-1 bg-border/50" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(themes).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setBadgeTheme(t)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 ${badgeTheme === t
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-background border-border text-muted-foreground hover:border-blue-600/30'
                                                    }`}
                                            >
                                                {themes[t].name.replace('Featured ', '').replace('Minimal ', '')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="bg-background rounded-2xl border-2 border-border border-dashed p-4 relative overflow-hidden group flex flex-col items-center min-h-[130px] justify-center">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <img
                                        src={themes[badgeTheme]?.img || themes.classicDark.img}
                                        alt="Badge Preview"
                                        className="h-10 w-auto drop-shadow-xl relative transform transition-all group-hover:scale-105 duration-700"
                                    />
                                    <div className="mt-3 flex flex-col items-center gap-1 opacity-40">
                                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Live Preview</span>
                                        <div className="h-1 w-1 rounded-full bg-blue-600 animate-pulse" />
                                    </div>
                                </div>

                                {/* Code Snippet */}
                                <div className="bg-muted/30 border-2 border-border rounded-xl p-4 flex gap-4 items-start group focus-within:border-blue-600/50 transition-all">
                                    <code className="text-[11px] text-foreground font-mono opacity-100 break-all leading-relaxed flex-1">
                                        {badgeCode}
                                    </code>
                                    <button
                                        onClick={copyCode}
                                        className="p-2.5 bg-background border border-border hover:bg-blue-50 rounded-lg transition-all shrink-0 group-hover:scale-105 shadow-sm"
                                    >
                                        <Copy className="w-4 h-4 text-muted-foreground group-hover:text-blue-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
