import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { SettingsSkeleton } from "./Skeletons";
import {
    AlertTriangle,
    X,
    User,
    Trash2,
    LogOut,
    Check,
    AlertCircle,
    Loader2,
    Twitter,
    Linkedin,
    Globe,
    Youtube,
    Link2,
    MapPin,
    Briefcase,
    Upload,
    Search,
    Plus,
    Paperclip,
    Bell,
    Mail,
    Rocket,
    CreditCard,
} from "lucide-react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { Drawer } from "@mui/material";
import { validateUsername, checkUsernameAvailability, generateUsernameSuggestions } from "../utils/usernameValidation";
import { checkRateLimit, recordUsernameChange } from "../utils/usernameRateLimit";
import { trackEvent } from "../utils/analytics";
import {
    sanitizeText,
    validateAndSanitizeUrl,
    validateBio,
    validateFullName,
    validateSkills,
    validateInterest
} from "../utils/profileInputSanitization";
import { handleImageUpload } from "../utils/imageHandling";
import { isPaidAccess } from "../utils/subscriptionUtils";

const Settings = () => {
    const [activeTab, setActiveTab] = useState("profile");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const navigate = router.push; // Backward compatibility alias
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        full_name: "",
        bio: "",
        twitter_username: "",
        linkedin_username: "",
        portfolio_username: "",
        youtube_username: "",
        interest: "",
        location: "",
        skills: [],
        avatar_url: "",
        marketing_emails: true,
        milestone_emails: true,
        reminders_emails: true,
    });
    const [subscription, setSubscription] = useState({
        plan: "Standard",
        status: "inactive",
        daysRemaining: 0,
        nextPayment: null,
        loading: true,
        dodoCustomerId: null,
        hasAccess: false,
        hasAnyPaidProject: false,
        cancelAtPeriodEnd: false,
        subscriptionId: null
    });
    const [portalLoading, setPortalLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [skillInput, setSkillInput] = useState("");
    const [skillSearchOpen, setSkillSearchOpen] = useState(false);
    const [locationSearchOpen, setLocationSearchOpen] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const locationDropdownRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    const [showAvatarStudio, setShowAvatarStudio] = useState(false);
    const [avatarTab, setAvatarTab] = useState("notionists-neutral");
    const [randomSeeds, setRandomSeeds] = useState([]);

    // Avatar styles configuration
    const avatarStyles = [
        { id: "notionists-neutral", name: "Notionists Neutral" },
        { id: "notionists", name: "Notionists" },
        { id: "lorelei-neutral", name: "Lorelei Neutral" },
        { id: "lorelei", name: "Lorelei" },
        { id: "adventurer", name: "Adventurer" },
        { id: "avataaars", name: "Avataaars" },
        { id: "open-peeps", name: "Open Peeps" }
    ];

    // Generate random seeds for the gallery
    const generateSeeds = () => {
        const seeds = Array.from({ length: 9 }, () => Math.random().toString(36).substring(7));
        setRandomSeeds(seeds);
    };

    useEffect(() => {
        if (showAvatarStudio) {
            generateSeeds();
        }
    }, [showAvatarStudio, avatarTab]);

    // Countries list for location dropdown
    const countries = [
        "🇺🇸 United States", "🇬🇧 United Kingdom", "🇨🇦 Canada", "🇦🇺 Australia", "🇮🇳 India",
        "🇩🇪 Germany", "🇫🇷 France", "🇯🇵 Japan", "🇧🇷 Brazil", "🇲🇽 Mexico", "🇪🇸 Spain", "🇮🇹 Italy",
        "🇳🇱 Netherlands", "🇸🇪 Sweden", "🇳🇴 Norway", "🇩🇰 Denmark", "🇫🇮 Finland", "🇵🇱 Poland",
        "🇰🇷 South Korea", "🇸🇬 Singapore", "🇦🇪 United Arab Emirates", "🇮🇱 Israel", "🇨🇭 Switzerland",
        "🇧🇪 Belgium", "🇦🇹 Austria", "🇮🇪 Ireland", "🇵🇹 Portugal", "🇬🇷 Greece", "🇨🇿 Czech Republic",
        "🇳🇿 New Zealand", "🇿🇦 South Africa", "🇦🇷 Argentina", "🇨🇱 Chile", "🇨🇴 Colombia", "🇵🇪 Peru",
        "🇹🇭 Thailand", "🇲🇾 Malaysia", "🇮🇩 Indonesia", "🇵🇭 Philippines", "🇻🇳 Vietnam", "🇹🇼 Taiwan",
        "🇭🇰 Hong Kong", "🇨🇳 China", "🇷🇺 Russia", "🇹🇷 Turkey", "🇸🇦 Saudi Arabia", "🇪🇬 Egypt",
        "🇳🇬 Nigeria", "🇰🇪 Kenya", "🇬🇭 Ghana", "🇲🇦 Morocco", "🇹🇳 Tunisia", "🇩🇿 Algeria",
        "🇵🇰 Pakistan", "🇧🇩 Bangladesh", "🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇲🇲 Myanmar", "🇰🇭 Cambodia",
        "🌍 Other"
    ];

    // Skills/Expertise options - matching image
    const skillOptions = [
        "ReactJS", "JavaScript", "TypeScript", "NodeJS", "NextJS",
        "HTML / CSS / JavaScript", "MongoDB", "TailwindCSS", "Python", "CSS",
        "ExpressJS", "Redux", "Java", "Frontend Developer", "Backend Developer",
        "Full Stack Developer", "Mobile Developer (iOS)", "Mobile Developer (Android)",
        "UI/UX Designer", "Product Designer", "Graphic Designer", "DevOps Engineer",
        "Data Scientist", "Machine Learning Engineer", "Marketing Specialist",
        "Growth Hacker", "Sales Professional", "Product Manager", "Founder/CEO",
        "Business Development", "Content Creator", "Copywriter", "Other"
    ];

    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Username change state
    const [newUsername, setNewUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityStatus, setAvailabilityStatus] = useState(null);
    const [usernameSuggestions, setUsernameSuggestions] = useState([]);
    const usernameDebounceTimerRef = useRef(null);
    const [user, setUser] = useState(null);
    const [rateLimitInfo, setRateLimitInfo] = useState({ allowed: true, daysRemaining: 0, message: null });

    // Extract username from URL
    const extractUsername = (url, platform) => {
        if (!url || typeof url !== 'string') return "";
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            if (platform === "twitter" || platform === "x") {
                return path.replace(/^\//, "").replace(/\/$/, "");
            } else if (platform === "linkedin") {
                return path.replace(/^\/in\//, "").replace(/\/$/, "");
            } else if (platform === "youtube") {
                return path.replace(/^\//, "").replace(/\/$/, "");
            } else {
                return path.replace(/^\//, "").replace(/\/$/, "");
            }
        } catch {
            return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
        }
    };

    // Build URL from username
    const buildUrl = (username, platform) => {
        if (!username || !username.trim()) return "";
        const clean = username.trim();
        if (platform === "twitter" || platform === "x") {
            return `https://twitter.com/${clean}`;
        } else if (platform === "linkedin") {
            return `https://linkedin.com/in/${clean}`;
        } else if (platform === "youtube") {
            return `https://youtube.com/${clean}`;
        } else {
            return clean.startsWith("http") ? clean : `https://${clean}`;
        }
    };

    const handleDeleteAccount = async () => {
        try {
            if (!profile) return;

            const { error: deleteError } = await supabase.rpc("delete_user_account", {
                user_uuid: profile.id
            });

            if (deleteError) {
                throw deleteError;
            }

            await supabase.auth.signOut();

            setSnackbar({
                open: true,
                message: "Account and all data deleted successfully",
                severity: "success",
            });

            navigate("/");
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Failed to delete account: ",
                severity: "error",
            });
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                navigate("/UserRegister");
                return;
            }

            setUser(user);

            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (profileData) {
                setProfile(profileData);

                // Safely parse skills
                let skillsArray = [];
                if (Array.isArray(profileData.skills)) {
                    skillsArray = profileData.skills;
                } else if (profileData.skills && typeof profileData.skills === 'string') {
                    try {
                        const parsed = JSON.parse(profileData.skills);
                        skillsArray = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        skillsArray = [];
                    }
                }

                // Extract usernames from URLs
                const twitterUsername = extractUsername(profileData.twitter || "", "twitter");
                const linkedinUsername = extractUsername(profileData.linkedin || "", "linkedin");
                const youtubeUsername = extractUsername(profileData.youtube || "", "youtube");
                const portfolioUsername = extractUsername(profileData.portfolio || "", "portfolio");

                setFormData({
                    full_name: profileData.full_name || "",
                    bio: profileData.bio || "",
                    twitter_username: twitterUsername,
                    linkedin_username: linkedinUsername,
                    portfolio_username: portfolioUsername,
                    youtube_username: youtubeUsername,
                    interest: profileData.interest || "",
                    location: profileData.location || "",
                    skills: skillsArray,
                    avatar_url: profileData.avatar_url || "",
                    // Treat null/undefined as true (opt-in by default), explicit false as off
                    marketing_emails: profileData.marketing_emails !== false,
                    milestone_emails: profileData.milestone_emails !== false,
                    reminders_emails: profileData.reminders_emails !== false,
                });
                setNewUsername(profileData.username || "");
                setLocationSearch(profileData.location || "");

                // Paid plan filter: case-insensitive so Showcase/showcase/SHOWCASE all match
                const paidPlanFilter = "plan_type.ilike.showcase,plan_type.ilike.spotlight";
                // Fetch Subscription/Project info: prefer active/trialing/on_hold paid plan, then any Showcase/Spotlight (cancelled/succeeded still need portal)
                const { data: paidProject } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("user_id", user.id)
                    .or(paidPlanFilter)
                    .in("subscription_status", ["active", "trialing", "on_hold"])
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let projectData = paidProject ?? null;
                let hasAnyPaidProject = !!paidProject;
                if (!projectData) {
                    const { data: anyPaidList } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("user_id", user.id)
                        .or(paidPlanFilter)
                        .order("updated_at", { ascending: false })
                        .limit(10);
                    if (anyPaidList?.length) {
                        hasAnyPaidProject = true;
                        projectData = anyPaidList.find((p) => p.dodo_customer_id) || anyPaidList[0];
                    }
                }
                if (projectData && !projectData.dodo_customer_id) {
                    const { data: withCustomerId } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("user_id", user.id)
                        .or(paidPlanFilter)
                        .not("dodo_customer_id", "is", null)
                        .order("updated_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (withCustomerId) projectData = withCustomerId;
                }
                if (!projectData) {
                    const { data: latestProject } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    projectData = latestProject ?? null;
                }

                if (projectData) {
                    const hasPeriodEnd = projectData.current_period_end && !Number.isNaN(new Date(projectData.current_period_end).getTime());
                    const daysRemaining = hasPeriodEnd
                        ? Math.max(0, Math.ceil((new Date(projectData.current_period_end) - new Date()) / (1000 * 60 * 60 * 24)))
                        : null;
                    const nextPaymentStr = hasPeriodEnd ? new Date(projectData.current_period_end).toLocaleDateString() : null;
                    const rawPlan = projectData.plan_type;
                    const isPaidPlan = rawPlan && String(rawPlan).toLowerCase() !== "free";
                    const normalizedPlan = rawPlan && (String(rawPlan).toLowerCase() === "showcase" ? "Showcase" : String(rawPlan).toLowerCase() === "spotlight" ? "Spotlight" : rawPlan);
                    const planLabel = isPaidPlan ? normalizedPlan : "Standard";

                    setSubscription({
                        plan: planLabel,
                        status: projectData.subscription_status || "inactive",
                        daysRemaining,
                        nextPayment: nextPaymentStr,
                        loading: false,
                        dodoCustomerId: projectData.dodo_customer_id ?? null,
                        hasAccess: isPaidAccess(projectData),
                        hasAnyPaidProject: hasAnyPaidProject || isPaidPlan,
                        cancelAtPeriodEnd: !!projectData.cancel_at_period_end,
                        subscriptionId: projectData.subscription_id ?? null
                    });
                } else {
                    setSubscription(prev => ({ ...prev, loading: false, hasAnyPaidProject: false }));
                }
            }

            setLoading(false);
        };
        fetchProfile();
    }, [router]);

    // Check rate limit on mount and when user/profile changes
    useEffect(() => {
        const checkRateLimitStatus = async () => {
            if (!user?.id || !profile) {
                setRateLimitInfo({ allowed: true, daysRemaining: 0, message: null });
                return;
            }

            try {
                const rateLimit = await checkRateLimit(user.id, supabase);
                setRateLimitInfo({
                    allowed: rateLimit.allowed,
                    daysRemaining: rateLimit.daysRemaining || 0,
                    message: rateLimit.message || null
                });
            } catch (error) {
                setRateLimitInfo({ allowed: true, daysRemaining: 0, message: null });
            }
        };

        checkRateLimitStatus();
    }, [user?.id, profile, supabase]);

    // Close location dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
                setLocationSearchOpen(false);
            }
        };

        if (locationSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [locationSearchOpen]);

    // Real-time username availability check (debounced)
    useEffect(() => {
        if (!newUsername || newUsername === profile?.username) {
            setAvailabilityStatus(null);
            setUsernameError("");
            setUsernameSuggestions([]);
            return;
        }

        if (usernameDebounceTimerRef.current) {
            clearTimeout(usernameDebounceTimerRef.current);
        }

        const timer = setTimeout(async () => {
            setCheckingAvailability(true);
            setAvailabilityStatus("checking");

            const validation = validateUsername(newUsername);

            if (!validation.valid) {
                setAvailabilityStatus("invalid");
                setUsernameError(validation.errors[0]);
                setCheckingAvailability(false);
                return;
            }

            const { available, error } = await checkUsernameAvailability(
                validation.sanitized,
                user?.id,
                supabase
            );

            setCheckingAvailability(false);
            setAvailabilityStatus(available ? "available" : "taken");
            setUsernameError(error);

            if (!available) {
                const suggestions = await generateUsernameSuggestions(
                    validation.sanitized,
                    supabase,
                    user?.id
                );
                setUsernameSuggestions(suggestions);
            } else {
                setUsernameSuggestions([]);
            }
        }, 500);

        usernameDebounceTimerRef.current = timer;

        return () => {
            if (usernameDebounceTimerRef.current) {
                clearTimeout(usernameDebounceTimerRef.current);
            }
        };
    }, [newUsername, profile?.username, user?.id, supabase]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setSnackbar({
                open: true,
                message: "Please upload an image file",
                severity: "error",
            });
            return;
        }

        setUploadingAvatar(true);
        try {
            const avatarUrl = await handleImageUpload(file, "avatar", supabase);

            // Update profile with new avatar
            const { error } = await supabase
                .from("profiles")
                .update({ avatar_url: avatarUrl })
                .eq("id", profile.id);

            if (error) throw error;

            setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
            setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));

            // Update auth metadata
            await supabase.auth.updateUser({
                data: { avatar_url: avatarUrl }
            });

            setSnackbar({
                open: true,
                message: "Profile picture updated successfully",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Failed to upload profile picture: " + (error.message || "Unknown error"),
                severity: "error",
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const addSkill = (skill) => {
        if (formData.skills.length >= 10) {
            setSnackbar({
                open: true,
                message: "Maximum 10 skills allowed",
                severity: "error",
            });
            return;
        }
        if (!formData.skills.includes(skill)) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, skill]
            }));
        }
        setSkillInput("");
        setSkillSearchOpen(false);
    };

    const removeSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    };

    const filteredSkills = skillOptions.filter(skill =>
        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
        !formData.skills.includes(skill)
    );

    const filteredCountries = countries.filter(country =>
        country.toLowerCase().includes(locationSearch.toLowerCase())
    );

    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);

        try {
            const nameValidation = validateFullName(formData.full_name);
            if (!nameValidation.valid) {
                setSnackbar({
                    open: true,
                    message: nameValidation.error,
                    severity: "error",
                });
                setSaving(false);
                return;
            }

            const bioValidation = validateBio(formData.bio, 40, 200);
            if (!bioValidation.valid) {
                setSnackbar({
                    open: true,
                    message: bioValidation.error,
                    severity: "error",
                });
                setSaving(false);
                return;
            }

            // Interest is optional; only validate when user entered something
            const interestVal = (formData.interest || "").trim();
            if (interestVal) {
                const validInterests = ["AI", "SaaS", "Mobile", "Web", "Design", "Marketing", "Fintech", "Health", "Education", "Ecommerce", "Gaming", "Blockchain", "DevTools", "Productivity", "Social", "Other"];
                const interestValidation = validateInterest(formData.interest, validInterests);
                if (!interestValidation.valid) {
                    setSnackbar({
                        open: true,
                        message: interestValidation.error,
                        severity: "error",
                    });
                    setSaving(false);
                    return;
                }
            }

            // Build URLs from usernames
            const twitterUrl = buildUrl(formData.twitter_username, "twitter");
            const linkedinUrl = buildUrl(formData.linkedin_username, "linkedin");
            const youtubeUrl = buildUrl(formData.youtube_username, "youtube");
            const portfolioUrl = buildUrl(formData.portfolio_username, "portfolio");

            // Validate at least one social link is provided
            const hasAtLeastOneSocialLink =
                (formData.twitter_username && formData.twitter_username.trim()) ||
                (formData.linkedin_username && formData.linkedin_username.trim()) ||
                (formData.youtube_username && formData.youtube_username.trim()) ||
                (formData.portfolio_username && formData.portfolio_username.trim());

            if (!hasAtLeastOneSocialLink) {
                setSnackbar({
                    open: true,
                    message: "Please add at least one social link (Twitter, LinkedIn, YouTube, or Portfolio)",
                    severity: "error",
                });
                setSaving(false);
                return;
            }

            // Validate URLs
            const twitterUrlValidation = validateAndSanitizeUrl(twitterUrl || "https://twitter.com/");
            const linkedinUrlValidation = validateAndSanitizeUrl(linkedinUrl || "https://linkedin.com/in/");
            const youtubeUrlValidation = validateAndSanitizeUrl(youtubeUrl || "https://youtube.com/");
            const portfolioUrlValidation = validateAndSanitizeUrl(portfolioUrl || "https://example.com/");


            const sanitizedName = sanitizeText(formData.full_name, 100);
            const sanitizedBio = sanitizeText(formData.bio, 200);
            const sanitizedLocation = sanitizeText(formData.location, 100);

            if (!sanitizedLocation) {
                setSnackbar({
                    open: true,
                    message: "Location is required",
                    severity: "error",
                });
                setSaving(false);
                return;
            }

            const updateData = {
                full_name: sanitizedName,
                bio: sanitizedBio,
                twitter: twitterUrl || "",
                linkedin: linkedinUrl || "",
                portfolio: portfolioUrl || "",
                youtube: youtubeUrl || "",
                interest: (formData.interest || "").trim(),
                location: sanitizedLocation,
                marketing_emails: formData.marketing_emails,
                milestone_emails: formData.milestone_emails,
                reminders_emails: formData.reminders_emails,
            };

            const { error } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("id", profile.id);

            if (!error) {
                await supabase.auth.updateUser({
                    data: { full_name: sanitizedName }
                });
            }

            if (error) {
                setSnackbar({
                    open: true,
                    message: "Failed to save changes: " + (error.message || "Unknown error"),
                    severity: "error",
                });
            } else {
                setSnackbar({
                    open: true,
                    message: "Profile updated successfully",
                    severity: "success",
                });
                // If user came from launch flow to complete profile, send them back to submit with their draft
                const cameFrom = searchParams.get("cameFrom");
                const draftId = searchParams.get("draftId");
                if (cameFrom === "launch" && draftId) {
                    setTimeout(() => {
                        router.push(`/submit?edit=${draftId}`);
                    }, 800);
                }
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: "An error occurred while saving: " + (error.message || "Unknown error"),
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUsernameChange = async () => {
        if (!newUsername || !profile || !user || !user.id || newUsername === profile.username) {
            return;
        }

        const rateLimit = await checkRateLimit(user.id, supabase);
        setRateLimitInfo({
            allowed: rateLimit.allowed,
            daysRemaining: rateLimit.daysRemaining || 0,
            message: rateLimit.message || null
        });

        if (!rateLimit.allowed) {
            setSnackbar({
                open: true,
                message: rateLimit.message || "Rate limit exceeded",
                severity: "error",
            });
            return;
        }

        const validation = validateUsername(newUsername);
        if (!validation.valid) {
            setSnackbar({
                open: true,
                message: validation.errors[0],
                severity: "error",
            });
            return;
        }

        if (availabilityStatus !== "available") {
            setSnackbar({
                open: true,
                message: "Please choose an available username",
                severity: "error",
            });
            return;
        }

        setSaving(true);

        try {
            const oldUsername = profile.username || "";

            const { error } = await supabase
                .from("profiles")
                .update({ username: validation.sanitized })
                .eq("id", user.id);

            if (error) {
                if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
                    throw new Error("Username is already taken. Please choose another.");
                } else if (error.message.includes("permission")) {
                    throw new Error("You do not have permission to change your username.");
                } else {
                    throw new Error("Failed to update username. Please try again.");
                }
            }

            await recordUsernameChange(user.id, oldUsername, validation.sanitized, supabase);

            const updatedRateLimit = await checkRateLimit(user.id, supabase);
            setRateLimitInfo({
                allowed: updatedRateLimit.allowed,
                daysRemaining: updatedRateLimit.daysRemaining || 0,
                message: updatedRateLimit.message || null
            });

            trackEvent("username_changed", {
                event_category: "User Actions",
                old_username: oldUsername,
                new_username: validation.sanitized
            });

            setProfile({ ...profile, username: validation.sanitized });
            setAvailabilityStatus(null);
            setUsernameSuggestions([]);

            setSnackbar({
                open: true,
                message: "Username updated successfully! Redirecting...",
                severity: "success",
            });

            setTimeout(() => {
                navigate(`/profile/${validation.sanitized}`);
            }, 1000);

        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || "Failed to update username",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className="space-y-8"
                    >
                        {/* BASIC PROFILE SECTION */}
                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <User className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-foreground">Basic Profile</h2>
                            </div>

                            {/* Profile Picture & Name Row */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar Control */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <img
                                            src={formData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.full_name || "User"}`}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg group-hover:opacity-90 transition-opacity"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAvatarStudio(true)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="text-white text-sm font-bold">Edit Avatar</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" /> Upload Photo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAvatarStudio(true)}
                                            className="w-full px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <User className="w-4 h-4" /> Avatar Studio
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                {/* Name and Bio in a column */}
                                <div className="flex-1 w-full space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-1.5 ml-1">
                                                Display Name <span className="text-destructive">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleFormChange}
                                                maxLength={100}
                                                className="w-full bg-muted/5 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground transition-all"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        {/* Brief Bio */}
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-1.5 ml-1">
                                                Short Bio
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    name="bio"
                                                    className="w-full bg-muted/5 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground pr-16 transition-all min-h-[100px]"
                                                    placeholder="Tell the community about yourself..."
                                                    value={formData.bio}
                                                    onChange={handleFormChange}
                                                    maxLength={200}
                                                />
                                                <div className={`absolute top-2 right-3 text-[10px] font-bold px-2 py-1 rounded bg-background border border-border ${formData.bio.length >= 40
                                                    ? 'text-emerald-500'
                                                    : 'text-muted-foreground'
                                                    }`}>
                                                    {formData.bio.length}/200
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 ml-1">
                                                Briefly describe who you are and what you're building.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PUBLIC IDENTITY SECTION */}
                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-foreground">Profession & Location</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-1.5 ml-1">
                                        Location <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative" ref={locationDropdownRef}>
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={locationSearch}
                                            onChange={(e) => {
                                                setLocationSearch(e.target.value);
                                                setLocationSearchOpen(true);
                                            }}
                                            onFocus={() => setLocationSearchOpen(true)}
                                            placeholder="City, Country"
                                            className="w-full bg-muted/5 border border-border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground transition-all"
                                        />
                                        {locationSearchOpen && (
                                            <div className="absolute z-20 w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {filteredCountries.length > 0 ? (
                                                    filteredCountries.map(country => (
                                                        <button
                                                            key={country}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, location: country }));
                                                                setLocationSearch(country);
                                                                setLocationSearchOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-muted text-foreground text-sm transition-colors"
                                                        >
                                                            {country}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2.5 text-sm text-muted-foreground">No matches found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Interest/Category */}
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-1.5 ml-1">
                                        Primary Interest
                                    </label>
                                    <select
                                        name="interest"
                                        value={formData.interest}
                                        onChange={handleFormChange}
                                        className="w-full bg-muted/5 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select your main domain...</option>
                                        <option value="AI">🤖 AI & Machine Learning</option>
                                        <option value="SaaS">☁️ SaaS & Platforms</option>
                                        <option value="Mobile">📱 Mobile Apps</option>
                                        <option value="Web">🌐 Web Development</option>
                                        <option value="Design">🎨 Design & Creative</option>
                                        <option value="Marketing">📈 Marketing & Sales</option>
                                        <option value="Fintech">💸 Finance & Fintech</option>
                                        <option value="Health">🩺 Health & Fitness</option>
                                        <option value="Education">📚 Education</option>
                                        <option value="Ecommerce">🛍️ E-commerce</option>
                                        <option value="Gaming">🎮 Gaming & Entertainment</option>
                                        <option value="Blockchain">⛓️ Blockchain & Web3</option>
                                        <option value="DevTools">⚙️ Developer Tools</option>
                                        <option value="Productivity">💼 Work & Productivity</option>
                                        <option value="Social">👥 Social & Community</option>
                                        <option value="Other">🔧 Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SOCIAL LINKS SECTION */}
                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <Link2 className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Social Links <span className="text-destructive">*</span></h2>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
                                    1 dofollow link
                                </span>
                            </div>

                            <p className="text-sm text-muted-foreground bg-primary/5 rounded-xl p-4 border border-primary/10">
                                <strong className="text-primary">Boost visibility:</strong> Adding your handles allows us to tag you across platforms when promoting your launches. At least one link is required.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Twitter */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5 ml-1">
                                        <Twitter className="w-4 h-4 text-sky-500" />
                                        X (Twitter)
                                    </label>
                                    <div className="flex items-center bg-muted/5 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                        <span className="pl-4 py-2.5 text-xs font-medium text-muted-foreground select-none">x.com/</span>
                                        <input
                                            type="text"
                                            name="twitter_username"
                                            value={formData.twitter_username}
                                            onChange={handleFormChange}
                                            placeholder="username"
                                            className="flex-1 px-1 py-2.5 bg-transparent focus:outline-none text-sm text-foreground"
                                            maxLength={100}
                                        />
                                    </div>
                                </div>

                                {/* LinkedIn */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5 ml-1">
                                        <Linkedin className="w-4 h-4 text-blue-600" />
                                        LinkedIn
                                    </label>
                                    <div className="flex items-center bg-muted/5 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                        <span className="pl-4 py-2.5 text-xs font-medium text-muted-foreground select-none">in/</span>
                                        <input
                                            type="text"
                                            name="linkedin_username"
                                            value={formData.linkedin_username}
                                            onChange={handleFormChange}
                                            placeholder="username"
                                            className="flex-1 px-1 py-2.5 bg-transparent focus:outline-none text-sm text-foreground"
                                            maxLength={100}
                                        />
                                    </div>
                                </div>

                                {/* Portfolio */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5 ml-1">
                                        <Globe className="w-4 h-4 text-emerald-500" />
                                        Portfolio
                                    </label>
                                    <div className="flex items-center bg-muted/5 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                        <span className="pl-4 py-2.5 text-xs font-medium text-muted-foreground select-none">https://</span>
                                        <input
                                            type="text"
                                            name="portfolio_username"
                                            value={formData.portfolio_username}
                                            onChange={handleFormChange}
                                            placeholder="yourbrand.com"
                                            className="flex-1 px-1 py-2.5 bg-transparent focus:outline-none text-sm text-foreground"
                                            maxLength={200}
                                        />
                                    </div>
                                </div>

                                {/* YouTube */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5 ml-1">
                                        <Youtube className="w-4 h-4 text-red-600" />
                                        YouTube
                                    </label>
                                    <div className="flex items-center bg-muted/5 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                        <span className="pl-4 py-2.5 text-xs font-medium text-muted-foreground select-none">@</span>
                                        <input
                                            type="text"
                                            name="youtube_username"
                                            value={formData.youtube_username}
                                            onChange={handleFormChange}
                                            placeholder="channel"
                                            className="flex-1 px-1 py-2.5 bg-transparent focus:outline-none text-sm text-foreground"
                                            maxLength={100}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* USERNAME MANAGEMENT SECTION */}
                        {/* Username change feature removed for now */}

                        {/* GLOBAL SAVE ACTION */}
                        <div className="pt-8 border-t border-border mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">
                                <Check className="w-3 h-3 text-emerald-500" /> Auto-saved drafts supported
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                {saving ? "Saving Changes..." : "Save All Changes"}
                            </button>
                        </div>
                    </form>
                );

            case "danger":
                return (
                    <div className="space-y-6">
                        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-destructive/10 pb-4 mb-6">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">
                                        Delete Your Account
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed max-w-xl">
                                        Permanently delete your profile and all associated projects. This action is irreversible. All your data will be removed from our servers.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-destructive/10 active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "notifications":
                return (
                    <div className="space-y-8">
                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <Bell className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
                            </div>

                            <p className="text-sm text-muted-foreground mb-6">
                                Manage how and when you want to receive communications from Launchit.
                            </p>

                            <div className="bg-muted/5 border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
                                {/* Marketing Emails */}
                                <div className="p-6 flex items-start justify-between gap-6 hover:bg-muted/5 transition-colors">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-emerald-500" /> Platform Updates
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                            Newsletters, feature announcements, and curated content to help you build better.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!formData.marketing_emails}
                                            onChange={(e) => setFormData({ ...formData, marketing_emails: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                {/* Milestone Emails */}
                                <div className="p-6 flex items-start justify-between gap-6 hover:bg-muted/5 transition-colors">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            <Rocket className="w-4 h-4 text-amber-500" /> Launch Milestones
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                            Celebrate your success! Get notified when your projects hit significant upvote milestones.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!formData.milestone_emails}
                                            onChange={(e) => setFormData({ ...formData, milestone_emails: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                {/* Reminders Emails */}
                                <div className="p-6 flex items-start justify-between gap-6 hover:bg-muted/5 transition-colors">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-primary" /> Action Reminders
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                            Important notifications about your account, drafts, and pending actions.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!formData.reminders_emails}
                                            onChange={(e) => setFormData({ ...formData, reminders_emails: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                    {saving ? "Updating..." : "Update Preferences"}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "billing":
                return (
                    <div className="space-y-8">
                        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-foreground">Billing & Plans</h2>
                            </div>

                            {subscription.loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Plan Card */}
                                    <div className="relative group p-6 rounded-2xl border border-border bg-muted/5 transition-all hover:border-primary/50">
                                        <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {(subscription.plan === "Standard" && !subscription.hasAnyPaidProject) ? "Free" : "Premium"}
                                        </div>
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Plan</h3>
                                        <div className="flex items-baseline gap-2 mb-6">
                                            <span className="text-3xl font-black text-foreground">{subscription.plan}</span>
                                            {(subscription.plan !== "Standard" || subscription.hasAnyPaidProject) && (
                                                <span className={`text-xs font-bold uppercase ${subscription.hasAccess ? "text-emerald-500" : "text-muted-foreground"}`}>
                                                    {subscription.hasAccess ? "Active" : (subscription.status === "on_hold" ? "Payment issue" : subscription.status === "expired" || subscription.daysRemaining === 0 ? "Expired" : subscription.status || "—")}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>{(subscription.plan === "Standard" && !subscription.hasAnyPaidProject) ? "1" : subscription.plan === "Spotlight" ? "7" : "5"} SEO Backlinks</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>{(subscription.plan === "Standard" && !subscription.hasAnyPaidProject) ? "Standard rotation" : "Priority placement"}</span>
                                            </div>
                                            {(subscription.plan !== "Standard" || subscription.hasAnyPaidProject) && (
                                                <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                    <span>Verified Dofollow links</span>
                                                </div>
                                            )}
                                        </div>

                                        {(subscription.plan === "Standard" && !subscription.hasAnyPaidProject) ? (
                                            <button
                                                onClick={() => navigate("/pricing")}
                                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                                            >
                                                Upgrade to Showcase
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    if (portalLoading) return;
                                                    if (subscription.dodoCustomerId) {
                                                        window.open(`/customer-portal?customer_id=${encodeURIComponent(subscription.dodoCustomerId)}`, '_blank', 'noopener,noreferrer');
                                                        return;
                                                    }
                                                    setPortalLoading(true);
                                                    try {
                                                        const res = await fetch('/api/customer-portal-link');
                                                        const data = await res.json().catch(() => ({}));
                                                        if (res.ok && data?.url) {
                                                            window.open(data.url, '_blank', 'noopener,noreferrer');
                                                        } else {
                                                            setSnackbar({ open: true, message: 'Could not open billing portal. Try again or contact support.', severity: 'error' });
                                                        }
                                                    } catch {
                                                        setSnackbar({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
                                                    } finally {
                                                        setPortalLoading(false);
                                                    }
                                                }}
                                                disabled={portalLoading}
                                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                                Manage subscription
                                            </button>
                                        )}
                                    </div>

                                    {/* Stats Card */}
                                    <div className="space-y-4">
                                        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Subscription Stats</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Days Remaining</p>
                                                    <p className="text-2xl font-black text-foreground">
                                                        {subscription.daysRemaining != null ? subscription.daysRemaining : "—"}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Next Payment</p>
                                                    <p className="text-sm font-bold text-foreground">{subscription.nextPayment || "—"}</p>
                                                </div>
                                            </div>
                                            {(subscription.plan !== "Standard" || subscription.hasAnyPaidProject) && (subscription.daysRemaining == null || !subscription.nextPayment) && (
                                                <p className="text-xs text-muted-foreground mt-2">Renewal date is set by Dodo when you subscribe. Open the portal below to see exact dates.</p>
                                            )}
                                        </div>

                                        {/* Cancel subscription: only cancel at period end (user keeps access until period end) */}
                                        {(subscription.plan !== "Standard" || subscription.hasAnyPaidProject) && (
                                            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Cancel subscription</h3>
                                                {subscription.cancelAtPeriodEnd ? (
                                                    <p className="text-sm text-foreground">
                                                        You&apos;ve chosen to cancel at the end of your billing period. You&apos;ll keep <strong>{subscription.plan}</strong> until {subscription.nextPayment || 'the end of your period'}. We won&apos;t charge you again.
                                                    </p>
                                                ) : (subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'on_hold') && subscription.subscriptionId ? (
                                                    <>
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            You&apos;ll keep <strong>{subscription.plan}</strong> until {subscription.nextPayment || 'the end of your period'}. We won&apos;t charge you after that.
                                                        </p>
                                                        <button
                                                            onClick={async () => {
                                                                if (cancelLoading) return;
                                                                setCancelLoading(true);
                                                                try {
                                                                    const res = await fetch('/api/cancel-subscription', { method: 'POST' });
                                                                    const data = await res.json().catch(() => ({}));
                                                                    if (res.ok && data?.success) {
                                                                        setSubscription(prev => ({ ...prev, cancelAtPeriodEnd: true }));
                                                                        setSnackbar({ open: true, message: data.message || 'Subscription set to cancel at period end.', severity: 'success' });
                                                                    } else {
                                                                        setSnackbar({ open: true, message: data?.error || 'Could not update subscription. Try again.', severity: 'error' });
                                                                    }
                                                                } catch {
                                                                    setSnackbar({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
                                                                } finally {
                                                                    setCancelLoading(false);
                                                                }
                                                            }}
                                                            disabled={cancelLoading}
                                                            className="w-full py-2.5 border border-border rounded-xl font-bold text-sm text-foreground hover:bg-muted/50 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                                        >
                                                            {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                            Cancel at end of billing period
                                                        </button>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">Update payment or view invoices in the portal above. Your plan runs until the end of your paid period.</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-6 rounded-2xl border border-destructive/10 bg-destructive/5">
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Update payment method or view invoices in the portal. To cancel, use the option above so you keep access until the end of your paid period.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div className="min-h-screen bg-background transition-colors duration-300">
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <MuiAlert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: "100%" }}
                        elevation={6}
                        variant="filled"
                    >
                        {snackbar.message}
                    </MuiAlert>
                </Snackbar>

                <header className="bg-card border-b border-border transition-colors duration-300">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-2xl font-bold text-foreground">
                            Account Settings
                        </h1>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
                        <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
                            <nav className="space-y-1">
                                <a
                                    onClick={() => setActiveTab("profile")}
                                    className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-md font-medium ${activeTab === "profile" ? "bg-muted text-primary" : "text-foreground hover:bg-muted/50"}`}
                                >
                                    <User
                                        className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "profile" ? "text-primary" : "text-muted-foreground"}`}
                                    />
                                    <span className="truncate">Profile</span>
                                </a>

                                <a
                                    onClick={() => setActiveTab("notifications")}
                                    className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-md font-medium ${activeTab === "notifications" ? "bg-muted text-primary" : "text-foreground hover:bg-muted/50"}`}
                                >
                                    <Bell
                                        className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "notifications" ? "text-primary" : "text-muted-foreground"}`}
                                    />
                                    <span className="truncate">Notifications</span>
                                </a>

                                <a
                                    onClick={() => setActiveTab("billing")}
                                    className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-md font-medium ${activeTab === "billing" ? "bg-muted text-primary" : "text-foreground hover:bg-muted/50"}`}
                                >
                                    <CreditCard
                                        className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "billing" ? "text-primary" : "text-muted-foreground"}`}
                                    />
                                    <span className="truncate">Billing & Plan</span>
                                </a>

                                <a
                                    onClick={() => setActiveTab("danger")}
                                    className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-md font-medium ${activeTab === "danger" ? "bg-destructive/10 text-destructive" : "text-foreground hover:bg-muted/50"}`}
                                >
                                    <Trash2
                                        className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "danger" ? "text-destructive" : "text-muted-foreground"}`}
                                    />
                                    <span className="truncate">Danger Zone</span>
                                </a>
                            </nav>
                        </aside>

                        <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
                            <div className="sm:overflow-hidden">
                                <div className="bg-transparent py-6 px-4 sm:p-0 transition-colors duration-300">
                                    {renderContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-card rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 sm:mx-0">
                                        <AlertTriangle className="h-6 w-6 text-destructive" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        Delete Account
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-muted-foreground mb-6">
                                Are you sure you want to delete your account? This will permanently remove:
                            </p>

                            <ul className="text-muted-foreground mb-6 text-md space-y-1">
                                <li>• All your launches/projects</li>
                                <li>• All your comments and replies</li>
                                <li>• All your pitch submissions</li>
                                <li>• All your likes, follows, and saved projects</li>
                                <li>• All your notifications and activity history</li>
                                <li>• Your profile and all personal data</li>
                            </ul>

                            <p className="text-destructive mb-6 font-semibold">
                                ⚠️ This action cannot be undone. Please be certain.
                            </p>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-5 py-2 text-foreground bg-muted hover:bg-muted/80 rounded-lg font-semibold text-md transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="px-5 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-semibold text-md transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Drawer
                    anchor="right"
                    open={showAvatarStudio}
                    onClose={() => setShowAvatarStudio(false)}
                    PaperProps={{
                        className: "w-full sm:w-[500px] bg-card border-l border-border",
                        style: { backgroundColor: 'transparent' }
                    }}
                >
                    <div className="h-full flex flex-col bg-card">
                        {/* Drawer Header */}
                        <div className="px-6 py-8 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent uppercase tracking-tight">
                                    Avatar Studio
                                </h3>
                                <button
                                    onClick={() => setShowAvatarStudio(false)}
                                    className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-70">
                                Crafted Identities for makers
                            </p>
                        </div>

                        {/* Style Selector Chips */}
                        <div className="px-6 py-4 bg-muted/5 border-b border-border overflow-x-auto no-scrollbar flex items-center gap-2">
                            {[
                                { id: "adventurer", name: "Modern" },
                                { id: "avataaars", name: "Classic" },
                                { id: "bottts", name: "Robots" },
                                { id: "micah", name: "Hand-drawn" },
                                { id: "big-smile", name: "Minimal" }
                            ].map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setAvatarTab(style.id)}
                                    className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${avatarTab === style.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                        }`}
                                >
                                    {style.name}
                                </button>
                            ))}
                        </div>

                        {/* Options Grid */}
                        <div className="p-6 overflow-y-auto flex-grow bg-card custom-scrollbar">
                            <div className="grid grid-cols-2 xs:grid-cols-3 gap-4">
                                {randomSeeds.map((seed, index) => {
                                    const url = `https://api.dicebear.com/7.x/${avatarTab}/svg?seed=${seed}`;
                                    return (
                                        <button
                                            key={index}
                                            onClick={async () => {
                                                try {
                                                    const { error } = await supabase
                                                        .from("profiles")
                                                        .update({ avatar_url: url })
                                                        .eq("id", profile.id);
                                                    if (error) throw error;
                                                    setFormData(prev => ({ ...prev, avatar_url: url }));
                                                    setProfile(prev => ({ ...prev, avatar_url: url }));
                                                    setShowAvatarStudio(false);
                                                    setSnackbar({
                                                        open: true,
                                                        message: "Identity updated! 🚀",
                                                        severity: "success"
                                                    });
                                                } catch (err) {
                                                    setSnackbar({
                                                        open: true,
                                                        message: "Failed to update",
                                                        severity: "error"
                                                    });
                                                }
                                            }}
                                            className="group relative"
                                        >
                                            <div className="aspect-square w-full rounded-2xl border-2 border-border p-2 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl bg-muted/20">
                                                <img
                                                    src={url}
                                                    alt="Avatar Style"
                                                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <div className="bg-primary text-primary-foreground p-2 rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg">
                                                        <Check className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-6 border-t border-border bg-card sticky bottom-0">
                            <button
                                onClick={generateSeeds}
                                className="w-full group flex items-center justify-center gap-3 py-4 bg-foreground text-background rounded-2xl text-md font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                Generate New Styles
                            </button>
                        </div>
                    </div>
                </Drawer>
            </div>
        </>
    );
};

export default Settings;
