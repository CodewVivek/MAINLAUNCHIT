'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SubmitStep0 from '@/components/Submit/SubmitStep0';
import SubmitSidebar from '@/components/Submit/SubmitSidebar';
import BasicInfoStep from '@/components/Submit/BasicInfoStep';
import MediaStep from '@/components/Submit/MediaStep';
import PromoteStep from '@/components/Submit/PromoteStep';
import { generateLaunchData } from '@/utils/aiGeneration';
import SmartFillDialog from '@/components/Submit/SmartFillDialog';
import { handleFormSubmission } from '@/utils/formSubmission';
import { handleSaveDraft } from '@/utils/draftManagement';
import { checkProfileCompletion } from '@/utils/profileCompletion';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import SubmitProgress from '@/components/Submit/SubmitProgress';

export default function SubmitPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); // 0 = Step 0, 1-3 = Form steps
    const [isAILoading, setIsAILoading] = useState(false);
    const [isBadgeVerified, setIsBadgeVerified] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('standard');
    const [smartFillOpen, setSmartFillOpen] = useState(false);
    const [pendingAIData, setPendingAIData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        tagline: '',
        description: '',
        category: '',
        logo: null, // can be File object or URL string
        logoPreview: null,
        screenshots: [null, null, null, null], // Initialized with 4 slots to allow adding images
        thumbnail: null, // can be File object or URL string
        links: [''],
        tags: [],
        builtWith: [],
        features: [],
        isRelaunch: false,
        relaunchProjectId: null,
        relaunchType: 'minor', // 'minor' or 'major'
        relaunchUpdateNotes: '',
    });

    const [userDrafts, setUserDrafts] = useState([]);
    const [isDraftsLoading, setIsDraftsLoading] = useState(false);

    // Check authentication and load draft if edit param exists
    useEffect(() => {
        const initializePage = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/register');
                return;
            }

            setUser(user);

            // Fetch profile for completion check (name, social, location)
            const { data: profileVal } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, role, location, twitter, linkedin, portfolio, youtube')
                .eq('id', user.id)
                .maybeSingle();

            setProfile(profileVal);

            // Fetch user's drafts
            setIsDraftsLoading(true);
            const { data: drafts } = await supabase
                .from('projects')
                .select('id, name, updated_at')
                .eq('user_id', user.id)
                .eq('status', 'draft')
                .order('updated_at', { ascending: false });

            setUserDrafts(drafts || []);
            setIsDraftsLoading(false);

            // Check for edit query param
            const editId = searchParams.get('edit');
            if (editId) {
                try {
                    const { data: project, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('id', editId)
                        .maybeSingle();

                    if (error) throw error;
                    if (project) {
                        // Populate form data
                        setEditingProjectId(project.id);
                        setFormData({
                            name: project.name || '',
                            websiteUrl: project.website_url || '',
                            tagline: project.tagline || '',
                            description: project.description || '',
                            category: project.category_type || '',
                            logo: project.logo_url || null,
                            thumbnail: project.thumbnail_url || null,
                            screenshots: Array.isArray(project.cover_urls) ? [...project.cover_urls, ...Array(4 - project.cover_urls.length).fill(null)] : [null, null, null, null],
                            links: project.links || [''],
                            tags: project.tags || [],
                            builtWith: project.built_with || [],
                            features: project.features || [],
                            isRelaunch: project.status !== 'draft',
                            relaunchProjectId: project.status !== 'draft' ? project.id : null,
                            relaunchType: 'minor',
                            relaunchUpdateNotes: '',
                            subscription_status: project.subscription_status,
                            plan_type: project.plan_type,
                        });
                        // If it's a draft, skip step 0
                        if (project.status === 'draft') {
                            setCurrentStep(1);
                        }
                    }
                } catch (err) {
                    toast.error("Failed to load draft");
                }
            }
        };

        initializePage();
    }, [router, searchParams]);



    const applyAIDataToForm = (data, prev) => {
        return {
            ...prev,
            name: data.name || data.project_name || prev.name,
            websiteUrl: data.website_url || data.url || prev.websiteUrl,
            tagline: data.tagline || prev.tagline,
            description: data.description || prev.description,
            category: typeof data.category === 'string' ? data.category.toLowerCase() : (data.category_type || prev.category),
            logo: data.logo_url || prev.logo,
            thumbnail: data.thumbnail_url || prev.thumbnail,
            tags: data.tags && Array.isArray(data.tags) ? data.tags.filter(Boolean) : prev.tags,
            links: data.links && Array.isArray(data.links)
                ? data.links.filter(Boolean).map(link => {
                    if (typeof link === 'string') return link;
                    return link.url || link.link || link.href || JSON.stringify(link);
                })
                : prev.links,
            builtWith: data.built_with && Array.isArray(data.built_with)
                ? data.built_with.filter(Boolean).map(tech => {
                    if (typeof tech === 'string') {
                        return {
                            value: tech.toLowerCase().trim().replace(/\s+/g, '-'),
                            label: tech
                        };
                    }
                    const label = tech.label || tech.name || 'Unknown';
                    const value = tech.value || tech.id || label.toLowerCase().trim().replace(/\s+/g, '-');
                    return { value, label };
                })
                : prev.builtWith,
        };
    };

    // Step 0: show profile completion modal when profile is missing or incomplete (so modal is visible on Step 0)
    useEffect(() => {
        if (currentStep !== 0) return;
        if (profile == null) {
            setIsProfileModalOpen(true);
            return;
        }
        const completion = checkProfileCompletion(profile);
        if (!completion.isComplete) {
            setIsProfileModalOpen(true);
        }
    }, [currentStep, profile]);

    // Profile complete + modal state: auto-close when profile becomes complete (must run before any early return)
    const profileComplete = profile == null ? true : checkProfileCompletion(profile).isComplete;
    useEffect(() => {
        if (profileComplete && isProfileModalOpen) {
            setIsProfileModalOpen(false);
        }
    }, [profileComplete, isProfileModalOpen]);

    // Refetch profile on tab focus when on Step 0 (must run before any early return)
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user && currentStep === 0) {
                supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url, role, location, twitter, linkedin, portfolio, youtube')
                    .eq('id', user.id)
                    .maybeSingle()
                    .then(({ data }) => { if (data) setProfile(data); });
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [user, currentStep]);

    const handleStep0Continue = async (data) => {
        // Step 0 only: block if profile still incomplete (e.g. user closed modal)
        if (profile) {
            const completion = checkProfileCompletion(profile);
            if (!completion.isComplete) {
                setIsProfileModalOpen(true);
                return;
            }
        }
        if (typeof data === 'string') {
            // Manual entry
            setFormData(prev => ({ ...prev, websiteUrl: data }));
        } else if (data.isRelaunch) {
            // Relaunching existing project
            try {
                // Fetch full project data from DB
                const { data: project, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', data.id)
                    .single();

                if (error) throw error;

                setFormData(prev => ({
                    ...prev,
                    name: project.name || '',
                    websiteUrl: project.website_url || '',
                    tagline: project.tagline || '',
                    description: project.description || '',
                    category: project.category_type || '',
                    logo: project.logo_url || null,
                    thumbnail: project.thumbnail_url || null,
                    screenshots: project.cover_urls || [],
                    links: project.links || [''],
                    tags: project.tags || [],
                    builtWith: project.built_with || [],
                    features: project.features || [],
                    isRelaunch: true,
                    relaunchProjectId: project.id,
                    relaunchUpdateNotes: data.relaunchUpdateNotes || '',
                    subscription_status: project.subscription_status,
                    plan_type: project.plan_type,
                }));
            } catch (error) {
                toast.error("Failed to load project data. Please try again.");
                return;
            }
        } else {
            // AI Data or Draft loading (data is an object but not isRelaunch)
            setFormData(prev => applyAIDataToForm(data, prev));
            if (data.id) setEditingProjectId(data.id);
        }
        setCurrentStep(1);
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAIGenerate = async () => {
        if (!formData.websiteUrl) {
            toast.error("Please enter a website URL first");
            return;
        }

        await generateLaunchData({
            websiteUrl: formData.websiteUrl,
            supabase,
            setSnackbar: ({ message, severity }) => {
                if (severity === 'error') toast.error(message);
                else if (severity === 'success') toast.success(message);
                else toast(message);
            },
            setIsAILoading: setIsAILoading,
            setIsRetrying: () => { },
            setRetryCount: () => { },
            getFilledFieldsCount: () => {
                // simple count
                let count = 0;
                if (formData.name) count++;
                if (formData.description) count++;
                if (formData.tagline) count++;
                if (formData.logo) count++;
                return count;
            },
            applyAIData: (data) => {
                setFormData(prev => applyAIDataToForm(data, prev));
            },
            setPendingAIData: setPendingAIData,
            setShowSmartFillDialog: setSmartFillOpen,
            urlPreview: null,
            isGeneratingPreview: false,
            generateBasicPreview: () => { },
        });
    };

    // File Handlers for MediaStep
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            handleFormChange(field, file);
        }
    };

    const handleCoverChange = (e, idx) => {
        const file = e.target.files[0];
        if (file) {
            const newScreenshots = [...(formData.screenshots || [])];
            newScreenshots[idx] = file;
            handleFormChange('screenshots', newScreenshots);
        }
    };

    const removeCover = (idx) => {
        const newScreenshots = [...(formData.screenshots || [])];
        newScreenshots.splice(idx, 1);
        handleFormChange('screenshots', newScreenshots);
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        // Profile completion was checked when entering submit flow (Step 0 → 1)
        try {
            await handleFormSubmission({
                formData,
                selectedCategory: formData.category ? { value: formData.category } : null,
                links: formData.links || [],
                builtWith: formData.builtWith || [],
                tags: formData.tags || [],
                logoFile: formData.logo,
                thumbnailFile: formData.thumbnail,
                coverFiles: formData.screenshots || [],
                existingMediaUrls: [],
                existingLogoUrl: null,
                isEditing: !!editingProjectId,
                editingProjectId: editingProjectId,
                user,
                supabase,
                setSnackbar: ({ message, severity }) => {
                    if (severity === 'success') toast.success(message);
                    else toast.error(message);
                },
                navigate: (path) => router.push(path),
                // Pass state setters to allow cleanup after submission
                setFormData: () => setFormData({
                    name: '', websiteUrl: '', tagline: '', description: '', category: '',
                    logo: null, logoPreview: null, screenshots: [null, null, null, null], thumbnail: null,
                    links: [''], tags: [], builtWith: [], features: []
                }),
                setSelectedCategory: () => { },
                setLinks: (val) => handleFormChange('links', val),
                setTags: (val) => handleFormChange('tags', val),
                setLogoFile: (val) => handleFormChange('logo', val),
                setThumbnailFile: (val) => handleFormChange('thumbnail', val),
                setCoverFiles: (val) => handleFormChange('screenshots', [null, null, null, null]),
                setEditingProjectId: setEditingProjectId,
                setUrlPreview: () => { },
                setPendingAIData: setPendingAIData,
                setShowSmartFillDialog: setSmartFillOpen,
                setRetryCount: () => { },
                setIsAILoading: setIsAILoading,
                setIsRetrying: () => { },
                setIsGeneratingPreview: () => { },
                selectedPlan: selectedPlan,
            });
        } catch (error) {
        }
    };

    const isStepValid = () => {
        if (currentStep === 1) {
            return formData.name && formData.websiteUrl && formData.tagline && formData.description && formData.category;
        }
        if (currentStep === 2) {
            // Require Logo AND Thumbnail. Screenshots remain optional!
            const hasLogo = formData.logo || formData.logoPreview;
            const hasThumbnail = formData.thumbnail || formData.thumbnailPreview;
            return hasLogo && hasThumbnail;
        }
        if (currentStep === 3) {
            const isAdmin = profile?.role === 'admin';
            const isActive = ['active', 'trialing'].includes(formData.subscription_status);
            if (isActive) return true; // Already paid
            if (selectedPlan === 'standard' && !isAdmin && !isBadgeVerified) {
                return false;
            }
            return !!selectedPlan;
        }
        return true;
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (currentStep === 0) {
        return (
            <>
                <SubmitStep0
                    onContinue={handleStep0Continue}
                    userDrafts={userDrafts}
                    profileComplete={profileComplete}
                    onShowProfileModal={() => setIsProfileModalOpen(true)}
                />
                <ProfileCompletionModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    profile={profile}
                    action="launch"
                    user={user}
                    supabase={supabase}
                    formData={formData}
                    selectedCategory={formData.category ? { value: formData.category } : null}
                    links={formData.links || []}
                    builtWith={formData.builtWith || []}
                    tags={formData.tags || []}
                    logoFile={formData.logo}
                    thumbnailFile={formData.thumbnail}
                    coverFiles={formData.screenshots || []}
                    autoSaveDraftId={editingProjectId}
                    editingProjectId={editingProjectId}
                    setAutoSaveDraftId={setEditingProjectId}
                    isFormEmpty={() => !formData?.name}
                    setSnackbar={({ message, severity }) => {
                        if (severity === 'success') toast.success(message);
                        else toast.error(message);
                    }}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Sidebar: Navigation */}
            <SubmitSidebar
                currentStep={currentStep}
                isEditing={!!editingProjectId}
                onStepClick={(step) => {
                    if (currentStep > 0 && step > 0) setCurrentStep(step);
                }}
            />

            {/* Middle: Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
                <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10">
                    {currentStep === 1 && (
                        <BasicInfoStep
                            formData={formData}
                            onChange={handleFormChange}
                            onAIGenerate={handleAIGenerate}
                            handleNext={handleNext}
                            isEditing={!!editingProjectId}
                            handleSaveDraft={() => handleSaveDraft({
                                user, formData, supabase,
                                editingProjectId,
                                setAutoSaveDraftId: setEditingProjectId,
                                navigate: (path) => router.push(path),
                                setSnackbar: ({ message, severity }) => severity === 'success' ? toast.success(message) : toast.error(message)
                            })}
                            isStepValid={isStepValid()}
                        />
                    )}
                    {currentStep === 2 && (
                        <MediaStep
                            logoFile={formData.logo}
                            handleLogoChange={(e) => handleFileChange(e, 'logo')}
                            removeLogo={() => handleFormChange('logo', null)}
                            handleImageError={() => { }}
                            viewAIImage={(url) => window.open(url, '_blank')}
                            isAILoading={isAILoading}
                            urlPreview={{
                                logo: typeof formData.logo === 'string',
                                screenshot: typeof formData.thumbnail === 'string'
                            }}
                            thumbnailFile={formData.thumbnail}
                            handleThumbnailChange={(e) => handleFileChange(e, 'thumbnail')}
                            removeThumbnail={() => handleFormChange('thumbnail', null)}
                            coverFiles={formData.screenshots || []}
                            handleCoverChange={handleCoverChange}
                            removeCover={removeCover}
                            handleNext={handleNext}
                            handleSaveDraft={() => handleSaveDraft({
                                user, formData, supabase,
                                editingProjectId,
                                setAutoSaveDraftId: setEditingProjectId,
                                navigate: (path) => router.push(path),
                                setSnackbar: ({ message, severity }) => severity === 'success' ? toast.success(message) : toast.error(message)
                            })}
                            isStepValid={isStepValid()}
                        />
                    )}
                    {currentStep === 3 && (
                        <PromoteStep
                            formData={formData}
                            onChange={handleFormChange}
                            handleNext={handleNext}
                            handleSaveDraft={() => handleSaveDraft({
                                user, formData, supabase,
                                editingProjectId,
                                setAutoSaveDraftId: setEditingProjectId,
                                navigate: (path) => router.push(path),
                                setSnackbar: ({ message, severity }) => severity === 'success' ? toast.success(message) : toast.error(message)
                            })}
                            isStepValid={isStepValid()}
                            isBadgeVerified={isBadgeVerified}
                            setIsBadgeVerified={setIsBadgeVerified}
                            selectedPlan={selectedPlan}
                            setSelectedPlan={setSelectedPlan}
                            profile={profile}
                        />
                    )}
                </div>

                {/* Fixed Footer Navigation */}
                <div className="px-8 py-6 border-t border-border bg-background sticky bottom-0 z-50">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 order-2 sm:order-1 w-full sm:w-auto">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-border bg-background font-bold text-[13px] hover:bg-muted transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={() => handleSaveDraft({
                                    user, formData, supabase,
                                    editingProjectId,
                                    setAutoSaveDraftId: setEditingProjectId,
                                    navigate: (path) => router.push(path),
                                    setSnackbar: ({ message, severity }) => severity === 'success' ? toast.success(message) : toast.error(message),
                                    isFormEmpty: () => !formData.name && !formData.websiteUrl && !formData.tagline && !formData.description,
                                    isEditing: !!editingProjectId
                                })}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-border bg-background font-bold text-[13px] text-muted-foreground hover:text-foreground hover:border-blue-600/30 transition-all flex items-center justify-center"
                            >
                                Save as Draft
                            </button>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="w-full sm:w-auto px-10 h-11 rounded-xl bg-blue-600 text-white font-black text-sm tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {currentStep === 3 ? (selectedPlan === 'standard' ? 'Launch Project' : 'Promote & Launch') : 'Continue'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Progress Bar */}
            <SubmitProgress formData={formData} />

            <ProfileCompletionModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={profile}
                action="launch"
                user={user}
                supabase={supabase}
                formData={formData}
                selectedCategory={formData.category ? { value: formData.category } : null}
                links={formData.links || []}
                builtWith={formData.builtWith || []}
                tags={formData.tags || []}
                logoFile={formData.logo}
                thumbnailFile={formData.thumbnail}
                coverFiles={formData.screenshots || []}
                setSnackbar={({ message, severity }) => {
                    if (severity === 'success') toast.success(message);
                    else toast.error(message);
                }}
            />
            <SmartFillDialog
                open={smartFillOpen}
                pendingAIData={pendingAIData}
                onCancel={() => setSmartFillOpen(false)}
                onFillAll={() => {
                    if (pendingAIData) {
                        setFormData(prev => ({
                            ...prev,
                            name: pendingAIData.name || prev.name,
                            tagline: pendingAIData.tagline || prev.tagline,
                            description: pendingAIData.description || prev.description,
                            logo: pendingAIData.logo_url || prev.logo,
                            thumbnail: pendingAIData.thumbnail_url || prev.thumbnail,
                            links: pendingAIData.links && pendingAIData.links.length > 0 ? pendingAIData.links : prev.links,
                            features: pendingAIData.features || prev.features,
                            category: pendingAIData.category || prev.category,
                        }));
                        setCurrentStep(1); // Move to Basic Info to show changes
                        toast.success("All AI data applied!");
                    }
                    setSmartFillOpen(false);
                    setPendingAIData(null);
                }}
                onFillEmpty={() => {
                    if (pendingAIData) {
                        setFormData(prev => ({
                            ...prev,
                            name: prev.name || pendingAIData.name || prev.name,
                            tagline: prev.tagline || pendingAIData.tagline || prev.tagline,
                            description: prev.description || pendingAIData.description || prev.description,
                            logo: prev.logo || pendingAIData.logo_url || prev.logo,
                            thumbnail: prev.thumbnail || pendingAIData.thumbnail_url || prev.thumbnail,
                            links: (!prev.links || prev.links.length === 0 || (prev.links.length === 1 && !prev.links[0])) && pendingAIData.links?.length > 0
                                ? pendingAIData.links
                                : prev.links,
                            features: (!prev.features || prev.features.length === 0) && pendingAIData.features?.length > 0
                                ? pendingAIData.features
                                : prev.features,
                            category: prev.category || pendingAIData.category || prev.category,
                        }));
                        setCurrentStep(1); // Move to Basic Info
                        toast.success("Empty fields filled with AI data!");
                    }
                    setSmartFillOpen(false);
                    setPendingAIData(null);
                }}
            />
        </div>
    );
}
