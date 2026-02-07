'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/supabaseClient';
import { generateLaunchData } from '@/utils/aiGeneration';
import { toast } from 'react-hot-toast';

/** Returns true only if input looks like a valid http(s) URL with a real host (e.g. domain or localhost). */
function isValidUrl(input) {
    const trimmed = (input || '').trim();
    if (!trimmed || trimmed.length < 4) return false;
    let toTest = trimmed;
    if (!/^https?:\/\//i.test(toTest)) toTest = 'https://' + toTest;
    try {
        const u = new URL(toTest);
        if (!['http:', 'https:'].includes(u.protocol)) return false;
        const host = (u.hostname || '').toLowerCase();
        if (!host) return false;
        if (host === 'localhost') return true;
        // require at least one dot for domain (e.g. example.com) or valid host
        return host.includes('.') && host.length > 3;
    } catch {
        return false;
    }
}

const FadeItem = ({ project }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-20% 0px -20% 0px" }); // Only consider middle 60% as "in view"

    return (
        <Link href={`/launches/${project.slug}`} target="_blank" className="block w-full">
            <motion.div
                ref={ref}
                animate={{ opacity: isInView ? 1 : 0.3, scale: isInView ? 1 : 0.95 }}
                transition={{ duration: 0.5 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border transition-colors w-full group hover:border-primary/50 cursor-pointer"
            >
                <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    {project.logo_url ? (
                        <img
                            src={project.logo_url}
                            alt={project.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.tagline || 'No tagline'}
                    </p>
                </div>
            </motion.div>
        </Link>
    );
};

export default function SubmitStep0({ onContinue, userDrafts = [], profileComplete = true, onShowProfileModal }) {
    const [url, setUrl] = useState('https://');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [sponsoredProjects, setSponsoredProjects] = useState([]);
    const router = useRouter();

    const loadingMessages = [
        "Analyzing landing page...",
        "Extracting product details...",
        "Identifying key features...",
        "Generating tags & categories..."
    ];

    useEffect(() => {
        let interval;
        if (isGenerating) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
            }, 3000);
        } else {
            setLoadingStep(0);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleResumeDraft = (draftId) => {
        // Simple refresh with edit param
        window.location.href = `/submit?edit=${draftId}`;
    };
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // 1. Fetch ALL sponsored projects (highest priority, any age)
                const { data: rawSponsoredData } = await supabase
                    .from('projects')
                    .select('id, name, tagline, logo_url, is_sponsored, slug, sponsored_tier, sponsor_tier, created_at')
                    .eq('is_sponsored', true)
                    .neq('status', 'draft');

                // Sort: Premium (champion) first, then Launcher (launcher), then by created_at
                const sponsoredData = (rawSponsoredData || []).sort((a, b) => {
                    const tierA = a.sponsor_tier || a.sponsored_tier || '';
                    const tierB = b.sponsor_tier || b.sponsored_tier || '';

                    const scoreA = tierA === 'premium' || tierA === 'champion' ? 2 : (tierA === 'highlight' || tierA === 'launcher' ? 1 : 0);
                    const scoreB = tierB === 'premium' || tierB === 'champion' ? 2 : (tierB === 'highlight' || tierB === 'launcher' ? 1 : 0);

                    if (scoreA !== scoreB) return scoreB - scoreA;
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                // 2. Fetch older "Beyond Day One" projects (lower priority)
                const oneDayAgo = new Date();
                oneDayAgo.setDate(oneDayAgo.getDate() - 1);

                const { data: regularData } = await supabase
                    .from('projects')
                    .select('id, name, tagline, logo_url, is_sponsored, slug, sponsored_tier, created_at')
                    .eq('is_sponsored', false)
                    .lt('created_at', oneDayAgo.toISOString())
                    .neq('status', 'draft')
                    .order('created_at', { ascending: false })
                    .limit(40);

                // Interleave sponsored projects every 7 regular projects for the requested gap
                const interleaved = [];
                let regIdx = 0;
                let sponsoredIdx = 0;
                const sponsoredLen = sponsoredData?.length || 0;
                const regularLen = regularData?.length || 0;

                if (sponsoredLen > 0) {
                    // Start with 2 regular projects to push the first sponsor down
                    // This makes the sponsor "enter" the screen instead of being static at the top
                    for (let i = 0; i < 3 && regIdx < regularLen; i++) {
                        interleaved.push(regularData[regIdx]);
                        regIdx++;
                    }

                    while (regIdx < regularLen) {
                        // Add one sponsored item (cycle through multiple if exists)
                        interleaved.push(sponsoredData[sponsoredIdx % sponsoredLen]);
                        sponsoredIdx++;

                        // Add exactly 7 regular projects between sponsors
                        for (let i = 0; i < 3 && regIdx < regularLen; i++) {
                            interleaved.push(regularData[regIdx]);
                            regIdx++;
                        }
                    }
                } else {
                    interleaved.push(...(regularData || []));
                }

                if (interleaved.length > 0) {
                    setSponsoredProjects(interleaved);
                }


            } catch (err) {
            }
        };
        fetchProjects();
    }, []);

    // Auto-scroll animation logic
    useEffect(() => {
        if (sponsoredProjects.length === 0) return;
        const scrollContainer = document.getElementById('project-scroll-container');
        if (!scrollContainer) return;

        let scrollPosition = 0;
        const scrollSpeed = 2.5; // Optimized speed for 1:1 interleave
        let animationFrameId;

        const animate = () => {
            scrollPosition += scrollSpeed;
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollPosition;
                // Seamless loop reset (now with 2x duplication)
                if (scrollPosition >= scrollContainer.scrollHeight / 2) {
                    scrollPosition = 0;
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [sponsoredProjects]);


    const urlValid = isValidUrl(url);
    const handleGenerate = async () => {
        if (!profileComplete && typeof onShowProfileModal === 'function') {
            onShowProfileModal();
            return;
        }
        if (!url.trim()) {
            toast.error('Please enter a website URL');
            return;
        }
        if (!urlValid) {
            toast.error('Please enter a valid URL (e.g. https://yourproduct.com)');
            return;
        }

        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http')) {
            formattedUrl = 'https://' + formattedUrl;
        }

        setIsGenerating(true);
        try {
            await generateLaunchData({
                websiteUrl: formattedUrl,
                supabase,
                setSnackbar: ({ message, severity }) => {
                    if (severity === 'error') toast.error(message);
                    else if (severity === 'success') toast.success(message);
                    else toast(message);
                },
                setIsAILoading: setIsGenerating,
                setIsRetrying: () => { },
                setRetryCount: () => { },
                getFilledFieldsCount: () => 0,
                applyAIData: (data) => {
                    // Reset generating state immediately before transition
                    setIsGenerating(false);
                    onContinue(data);
                },
                setPendingAIData: () => { },
                setShowSmartFillDialog: () => { },
                urlPreview: null,
                isGeneratingPreview: false,
                generateBasicPreview: () => { },
            });
        } catch (error) {
            setIsGenerating(false);
        }
    };

    // Duplicate once for seamless loop (A,B,A,B)
    const duplicatedProjects = [...sponsoredProjects, ...sponsoredProjects];

    return (
        <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-82px)] w-full overflow-hidden  flex text-foreground flex-col lg:flex-row">
            {/* Left Column: Auto-Scrolling List */}
            <div className="h-[40vh] lg:h-full lg:w-[45%] relative flex-col shrink-0 flex">
                {/* Header within the column */}
                <div className="p-6 pb-4 lg:px-12 z-10 flex items-center gap-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        Beyond Day One 🌱
                    </h3>
                    <div className="group relative">
                        <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center cursor-help hover:bg-muted-foreground/30 transition-colors">
                            <span className="text-xs font-bold text-muted-foreground">?</span>
                        </div>
                        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-popover border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">Long-term Visibility Promise:</span>
                                <br />
                                Your launch doesn’t disappear after 24h. We keep it visible over time.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    id="project-scroll-container"
                    className="flex-1 overflow-hidden relative lg:px-12"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
                    }}
                >
                    <div className="space-y-4 px-4 pb-32">
                        {duplicatedProjects.map((project, idx) => (
                            <div
                                key={`${project.id}-${idx}`}
                                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${project.is_sponsored
                                    ? 'bg-blue-500/5 border-blue-500/30'
                                    : 'bg-card border-border'
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden border border-border">
                                    {project.logo_url ? (
                                        <img
                                            src={project.logo_url}
                                            alt={project.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-foreground truncate">
                                            {project.name}
                                        </h4>
                                        {project.is_sponsored && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-slate-900 text-[9px] font-black uppercase rounded shadow-sm">
                                                <Zap className="w-2.5 h-2.5 fill-current" /> SPONSORED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        {project.tagline || 'No tagline'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Sticky / Static Content */}
            <div className="flex-1 h-full overflow-y-auto flex items-start justify-center p-8 lg:p-12 relative">
                <div className="w-full max-w-lg space-y-10 py-12">
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold"
                        >
                            <Sparkles className="w-4 h-4" />
                            AI-Assisted Launch
                        </motion.div>

                        <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
                            Launch Your <span className="text-blue-600">Product</span>
                        </h1>

                        <p className="text-xl text-muted-foreground">
                            Launch once. Stay visible beyond day one.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => profileComplete && setUrl(e.target.value)}
                                placeholder={profileComplete ? "yourproduct.com" : "Complete your profile to continue"}
                                readOnly={!profileComplete}
                                className="relative w-full px-4 py-4 bg-background border border-border rounded-xl text-lg placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                onFocus={() => { if (!profileComplete && onShowProfileModal) onShowProfileModal(); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleGenerate();
                                }}
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (profileComplete && !urlValid)}
                            className="
    w-full py-3.5
    bg-primary text-primary-foreground
    rounded-xl
    font-semibold text-base
    hover:shadow-primary/25
    active:scale-[0.99]
    transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
    shadow-md shadow-primary/15
  "
                        >
                            {isGenerating ? (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{loadingMessages[loadingStep]}</span>
                                    </div>
                                    <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-1">
                                        <motion.div
                                            className="h-full bg-white"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Launch with AI
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                    </div>

                    <div className="pt-2 text-center space-y-8">
                        <p className="text-sm text-muted-foreground">
                            AI automatically fetches Name, Description, Logo & Screenshots
                        </p>

                        <button
                            onClick={() => onContinue('')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground/20 pb-0.5"
                        >
                            Prefer manual? Fill it yourself →
                        </button>

                        {userDrafts.length > 0 && (
                            <div className="pt-6 border-t border-border mt-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
                                    Your existing in progress posts:
                                </h4>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                    {userDrafts.map((draft) => (
                                        <button
                                            key={draft.id}
                                            onClick={() => handleResumeDraft(draft.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-all text-left group"
                                        >
                                            <span className="text-sm font-bold text-foreground truncate max-w-[200px]">
                                                {draft.name || 'Untitled Project'}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-all">
                                                Resume <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div>
    );
}
