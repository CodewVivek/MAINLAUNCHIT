'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/supabaseClient";

import EmbedBadge from "@/components/EmbedBadge";
import ReportModal from "@/components/ReportModal";
import RelatedProjects from "@/components/RelatedProjects";
import TrendingProjects from "@/components/TrendingProjects";
import LastWeekTopProjects from "@/components/LastWeekTopProjects";

import Like from "@/components/Like";
import Share from "@/components/Share";
import Image from "next/image";
import dynamic from "next/dynamic";
import Comments from "@/components/Comments";

const Slider = dynamic(() => import("react-slick"), {
  ssr: false,
  loading: () => <div className="aspect-video bg-muted animate-pulse rounded-2xl" />
});

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import toast from "react-hot-toast";
import { getTechLogo } from "@/utils/techLogos";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flag,
  Calendar,
  UserPlus,
  Bookmark,
  BookmarkCheck,
  Code,
  Home,
  Crown,
} from "lucide-react";

import { trackOutboundClick, trackScrollDepth } from "@/utils/analytics";
import { addUtmParams } from "@/utils/registerUtils";

// -------------------------
// Slider arrows
// -------------------------
const NextArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      absolute top-1/2 right-4 -translate-y-1/2 z-20
      h-10 w-10 rounded-full flex items-center justify-center
      bg-background border border-border shadow-xl hover:scale-110 active:scale-95 transition-all
    "
    aria-label="Next image"
  >
    <ChevronRight className="w-5 h-5 text-foreground" />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      absolute top-1/2 left-4 -translate-y-1/2 z-20
      h-10 w-10 rounded-full flex items-center justify-center
      bg-background border border-border shadow-xl hover:scale-110 active:scale-95 transition-all
    "
    aria-label="Previous image"
  >
    <ChevronLeft className="w-5 h-5 text-foreground" />
  </button>
);

// Helper to get link label
function getLinkLabel(url) {
  if (!url) return "Website";
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("github.com")) return "GitHub";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("play.google.com")) return "Play Store";
  if (url.includes("apps.apple.com")) return "App Store";
  return "Website";
}

const ProjectDetailsClient = ({ initialProject, initialCreator = null, upvotesWithin2Days = null }) => {
  const [project, setProject] = useState(initialProject);
  const [creator, setCreator] = useState(initialCreator);
  const [upvotes, setUpvotes] = useState(initialProject?.likes?.[0]?.count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [showRelaunchModal, setShowRelaunchModal] = useState(false);
  const [relaunchError, setRelaunchError] = useState("");
  const [isRelaunching, setIsRelaunching] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  // New states for editing (if owner)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...initialProject });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});

  const router = useRouter();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false); // No loading since we have server data

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [spotlightProject, setSpotlightProject] = useState(null);


  // Lightbox modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Follow/save
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Inline expansion for links/tech stack
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [showAllTech, setShowAllTech] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);


  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // Do-follow: Standard = 1 (detail page only when badge + 10 upvotes within 2 days). Showcase/Spotlight = on-site backlinks.
  const likesCount = project?.likes?.[0]?.count ?? 0;
  const effectiveUpvotesForDofollow = upvotesWithin2Days != null ? upvotesWithin2Days : likesCount; // fallback when project_likes.created_at missing
  const isDofollowEligible = project?.is_sponsored || (project?.badge_verified && effectiveUpvotesForDofollow >= 10);
  const websiteLinkRel = isDofollowEligible ? "noopener noreferrer" : "noopener nofollow";



  // Show success toast when user lands after launching a project
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const newLaunch = new URLSearchParams(window.location.search).get('new_launch') === 'true';
    if (!newLaunch) return;
    toast.success('Project launched successfully!', { icon: '🚀', duration: 5000 });
    const url = new URL(window.location.href);
    url.searchParams.delete('new_launch');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  // Track scroll depth
  useEffect(() => {
    if (!project) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

      trackScrollDepth(Math.min(100, Math.max(0, scrollPercent)), window.location.pathname);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [project]);

  // Fetch creator data if not provided (Fallback)
  useEffect(() => {
    if (creator || !initialProject?.user_id) return;

    const fetchCreator = async () => {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .eq("id", initialProject.user_id)
        .maybeSingle();

      if (!userError) setCreator(userData);
    };

    fetchCreator();
  }, [initialProject, creator]);

  // Check logged-in user + ensure profile exists
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user || null;
      setUser(authUser);

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", authUser.id)
          .maybeSingle();

        if (!profile || !profile.full_name || !profile.avatar_url) {
          await supabase
            .from("profiles")
            .update({
              full_name: authUser.user_metadata.full_name,
              avatar_url: authUser.user_metadata.avatar_url,
            })
            .eq("id", authUser.id);
        }
      }
    };

    checkUser();
  }, []);

  // Check following + saved
  useEffect(() => {
    const loadUserStates = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user || null;
      setUser(authUser);

      if (authUser && project) {
        // following creator
        if (creator) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", authUser.id)
            .eq("following_id", creator.id)
            .maybeSingle();

          setIsFollowing(!!followData);
        }

        // saved project
        const { data: saveData } = await supabase
          .from("saved_projects")
          .select("id")
          .eq("user_id", authUser.id)
          .eq("project_id", project.id)
          .maybeSingle();

        setIsSaved(!!saveData);

        // viewed history (log this view)
        try {
          await supabase.from("viewed_history").insert({
            user_id: authUser.id,
            project_id: project.id,
          });
        } catch (vhErr) {
          if (process.env.NODE_ENV === 'development') {
          }
        }
      }
    };

    loadUserStates();
  }, [project, creator]);

  // Fetch a random Spotlight project for the sidebar
  useEffect(() => {
    const fetchSpotlight = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, tagline, logo_url, thumbnail_url, slug, website_url")
        .eq("is_sponsored", true)
        .eq("sponsored_tier", "premium")
        .neq("status", "draft")
        .neq("id", project?.id || "") // Don't show the same project if it's already a spotlight
        .limit(10); // Get a pool to pick from

      if (data && data.length > 0) {
        // Pick one randomly
        const random = data[Math.floor(Math.random() * data.length)];
        setSpotlightProject(random);
      }
    };

    fetchSpotlight();
  }, [project?.id]);

  // Modal controls
  const openModal = (idx) => {
    setModalIndex(idx);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const prevModal = () => setModalIndex((i) => (i === 0 ? project.cover_urls.length - 1 : i - 1));
  const nextModal = () => setModalIndex((i) => (i === project.cover_urls.length - 1 ? 0 : i + 1));

  // keyboard for modal
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") prevModal();
      if (e.key === "ArrowRight") nextModal();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, project?.cover_urls?.length]);

  // Follow
  const handleFollow = async () => {
    if (!user) return toast.error("Please sign in to follow users");
    if (!creator) return toast.error("Creator not found");
    if (user.id === creator.id) return toast.error("You cannot follow yourself");

    setFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", creator.id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: creator.id,
        });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("Following");
      }
    } catch (e) {
      toast.error("Failed to update follow");
    } finally {
      setFollowLoading(false);
    }
  };

  // Save
  const handleSave = async () => {
    if (!user) return toast.error("Please sign in to save projects");

    setSaveLoading(true);

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_projects")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", project.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        const { error } = await supabase.from("saved_projects").insert({
          user_id: user.id,
          project_id: project.id,
        });

        if (error) throw error;
        setIsSaved(true);
        toast.success("Saved");
      }
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaveLoading(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 animate-pulse">
          <div className="h-16 w-16 bg-muted rounded-2xl mx-auto" />
          <div className="h-10 w-72 bg-muted rounded-lg mx-auto mt-4" />
          <div className="h-5 w-96 bg-muted/80 rounded-lg mx-auto mt-3" />
          <div className="h-12 w-52 bg-muted rounded-full mx-auto mt-6" />
          <div className="mt-8 aspect-video bg-muted/50 rounded-2xl border border-border" />
        </div>
      </div>
    );
  }

  if (!project) {
    return null; // Server component handles 404
  }

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    description: project.description || project.tagline || `Discover ${project.name} on Launchit`,
    url: project.website_url || `https://launchit.site/launches/${project.slug}`,
    applicationCategory: "BusinessApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    image:
      project.thumbnail_url ||
      project.logo_url ||
      "https://launchit.site/images/r6_circle_optimized.png",
    datePublished: project.created_at,
    dateModified: project.updated_at || project.created_at,
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://launchit.site"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": project.category_type || "Launches",
        "item": `https://launchit.site/category/${encodeURIComponent(project.category_type || "")}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": project.name,
        "item": `https://launchit.site/launches/${project.slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm font-medium text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                Home
              </Link>
            </li>
            <ChevronRight className="w-4 h-4 opacity-40" />
            <li>
              <Link href={`/category/${project.category_type}`} className="hover:text-foreground transition-colors capitalize">
                {project.category_type}
              </Link>
            </li>
            <ChevronRight className="w-4 h-4 opacity-40" />
            <li className="text-foreground truncate max-w-[150px] sm:max-w-none">
              {project.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* LEFT */}
          <main className="min-w-0">
            {/* HERO */}
            <section className="text-center pb-8 border-b border-border flex flex-col items-center">

              {project.logo_url && (
                <Image
                  src={project.logo_url}
                  width={64}
                  height={64}
                  alt={`${project.name} logo`}
                  className="mx-auto rounded-xl border"
                />
              )}

              <div className="w-full text-center">
                <h1 className="mt-4 text-3xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                  {project.name}
                </h1>

                <p className="mt-2 text-xl sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {project.tagline}
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <a
                    href={addUtmParams(project.website_url, "launchit", "referral", "project_launch")}
                    target="_blank"
                    rel={websiteLinkRel}
                    onClick={() => trackOutboundClick(project.website_url, "website")}
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>

                  <div className="w-full sm:w-auto rounded-lg border border-border hover:bg-muted transition">
                    <div className="py-0.5">
                      <Like projectId={project.id} />
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* ABOUT */}
            {project.description && (
              <section className="pt-8 pb-10 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100 tracking-wide uppercase">
                  About
                </h2>
                <div className="mt-3 space-y-4">
                  <p
                    className={`text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg sm:text-lg ${showFullDescription ? "" : "line-clamp-3"
                      }`}
                  >
                    {project.description}
                  </p>

                  {/* Tags - only visible when expanded */}
                  {showFullDescription && project.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      {project.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(project.description.length > 260 || project.tags?.length > 0) && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowFullDescription((prev) => !prev)}
                      className="px-6 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      {showFullDescription ? "Show less" : "View more"}
                    </button>
                  </div>
                )}
              </section>
            )}

            {project.cover_urls?.length > 0 && (
              <section className="mt-8">
                <div className="">
                  <Slider
                    dots={true}
                    infinite={project.cover_urls.length > 1}
                    speed={800}
                    slidesToShow={1}
                    slidesToScroll={1}
                    centerMode={project.cover_urls.length > 1}
                    centerPadding={project.cover_urls.length > 1 ? "150px" : "0px"}
                    nextArrow={project.cover_urls.length > 1 ? <NextArrow /> : null}
                    prevArrow={project.cover_urls.length > 1 ? <PrevArrow /> : null}
                    swipeToSlide={true}
                    adaptiveHeight={false}
                    className="ph-slider"
                    responsive={[
                      {
                        breakpoint: 1024,
                        settings: {
                          centerPadding: "100px",
                        }
                      },
                      {
                        breakpoint: 768,
                        settings: {
                          arrows: false,
                          dots: true,
                          centerMode: true,
                          centerPadding: "40px",
                        }
                      }
                    ]}
                  >
                    {project.cover_urls.map((url, idx) => (
                      <div key={idx} className="px-3">
                        <div
                          className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center cursor-zoom-in transition-all duration-500"
                          onClick={() => openModal(idx)}
                        >
                          <Image
                            src={url}
                            alt={`${project.name} screenshot ${idx + 1}`}
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                            priority={idx === 0}
                            sizes="(max-width: 1280px) 100vw, 850px"
                          />
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </section>
            )}

            {modalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                <button
                  className="absolute top-4 right-4 text-white text-4xl font-bold bg-black/40 rounded-full px-3 py-1 hover:bg-black/60 transition"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  ×
                </button>

                {project.cover_urls.length > 1 && (
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow rounded-full p-2 transition"
                    onClick={prevModal}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                )}

                <img
                  src={project.cover_urls[modalIndex]}
                  alt={`${project.name} screenshot ${modalIndex + 1}`}
                  className="max-h-[85vh] max-w-[95vw] rounded-xl object-contain"
                />

                {project.cover_urls.length > 1 && (
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow rounded-full p-2 transition"
                    onClick={nextModal}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>
            )}

            {/* COMMENTS */}
            <section className="pt-10 mt-10 border-t border-border">
              <Comments projectId={project.id} ownerId={project.user_id} />
            </section>

            {/* RELATED */}
            <section className="pt-10">
              <RelatedProjects
                categoryType={project.category_type}
                excludeProjectId={project.id}
                projectName={project.name}
              />
            </section>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="w-full lg:w-[320px]">
            <div className="lg:sticky lg:top-24 space-y-8">
              {/* SPOTLIGHT AD */}
              {spotlightProject && (
                <div className="group relative rounded-2xl bg-white dark:bg-slate-950 border border-black/5 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl transition-all">

                  {/* soft inner glow */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,215,160,0.25),transparent_55%)] opacity-60" />

                  {/* Spotlight badge */}
                  <div className="absolute top-1 right-1 z-10 rotate-12">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-200 to-yellow-100 dark:from-amber-400 dark:to-yellow-300 text-[9px] font-black uppercase tracking-widest text-black shadow-md flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-black" />
                      Spotlight
                    </span>
                  </div>

                  <Link
                    href={`/launches/${spotlightProject.slug}?utm_source=launchit&utm_medium=spotlight_sidebar&utm_campaign=project_details`}
                    className="block"
                  >

                    {/* Image */}
                    <div className="relative aspect-[1.9/1] overflow-hidden">
                      <Image
                        src={spotlightProject.thumbnail_url || spotlightProject.logo_url}
                        alt={spotlightProject.name}
                        fill
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                      />

                      {/* cinematic fade */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    </div>

                    <div className="p-4">

                      <div className="flex items-center gap-3 mb-2">
                        {spotlightProject.logo_url && (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white shadow-sm">
                            <Image
                              src={spotlightProject.logo_url}
                              alt=""
                              width={40}
                              height={40}
                            />
                          </div>
                        )}

                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">
                          {spotlightProject.name}
                        </h4>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {spotlightProject.tagline}
                      </p>

                    </div>
                  </Link>

                  {/* CTA */}
                  <div className="px-4 pb-4">
                    <a
                      href={`${spotlightProject.website_url}${spotlightProject.website_url.includes('?') ? '&' : '?'}utm_source=launchit&utm_medium=spotlight_sidebar&utm_campaign=project_details`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
          w-full py-2.5 rounded-xl
          bg-black dark:bg-white
          text-white dark:text-black
          text-[10px] font-black uppercase tracking-widest
          flex items-center justify-center gap-2
          hover:scale-[1.02] active:scale-[0.98]
          transition-all shadow-lg
        "
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                </div>
              )}

              {/* MAIN CARD */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-violet-600"></div>

                <div className="p-6 space-y-6 divide-y divide-border/50">
                  {/* Launch Info */}
                  <div className="pt-0">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                      Launch Info
                    </h3>

                    <div className="space-y-3 text-md">
                      <a
                        href={addUtmParams(project.website_url, "launchit", "referral", "project_launch")}
                        target="_blank"
                        rel={websiteLinkRel}
                        onClick={() => trackOutboundClick(project.website_url, "website")}
                        className="flex items-center gap-2.5 text-primary hover:opacity-80 font-medium transition group"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <span className="truncate">Visit Website</span>
                      </a>

                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <div className="p-1.5 rounded-md bg-muted">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Share
                        projectSlug={project.slug}
                        projectName={project.name}
                        imageUrl={project.logo_url || project.thumbnail_url}
                      />
                    </div>
                  </div>

                  {/* Maker */}
                  {creator && (
                    <div className="pt-6">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                        Maker
                      </h3>

                      <div className="flex items-center justify-between gap-3">
                        {creator?.username && (
                          <Link href={`/profile/${creator.username}`} className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border">
                              <Image
                                src={creator.avatar_url || "/default-avatar.png"}
                                alt="creator"
                                fill
                                className="object-cover group-hover:ring-2 ring-primary transition"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-md font-semibold text-foreground truncate group-hover:text-primary transition">
                                {creator.full_name || creator.username}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
                            </div>
                          </Link>
                        )}

                        {user && user.id !== creator.id && (
                          <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`p-2 rounded-full transition ${isFollowing
                              ? "bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-white"
                              : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black"
                              }`}
                            title={isFollowing ? "Unfollow" : "Follow"}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-6 space-y-3">


                    {user && user.id !== project.user_id && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleSave}
                          disabled={saveLoading}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-md font-medium border transition ${isSaved
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "border-border hover:bg-muted text-foreground"
                            }`}
                        >
                          {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          {isSaved ? "Saved" : "Save"}
                        </button>

                        <button
                          onClick={() => setIsReportModalOpen(true)}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-md font-medium border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition"
                        >
                          <Flag className="w-4 h-4" /> Report
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Built With */}
                  {project.built_with?.length > 0 && (
                    <div className="pt-6">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                        Tech Stack
                      </h3>

                      <div className="flex flex-wrap gap-2">
                        {(showAllTech ? project.built_with : project.built_with.slice(0, 2)).map((tech, idx) => {
                          const logoUrl = getTechLogo(tech);
                          return (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900/40 text-black dark:text-white border border-gray-200 dark:border-gray-700 flex items-center gap-2"
                            >
                              {logoUrl && (
                                <img
                                  src={logoUrl}
                                  alt=""
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => (e.target.style.display = 'none')}
                                />
                              )}
                              {tech}
                            </span>
                          );
                        })}

                        {project.built_with.length > 2 && (
                          <button
                            onClick={() => setShowAllTech(!showAllTech)}
                            className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900/40 text-black dark:text-white border border-gray-200 dark:border-gray-700 transition"
                          >
                            {showAllTech ? 'Show less' : `+${project.built_with.length - 2}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}



                  {/* Links */}
                  {project.links?.length > 0 && (
                    <div className="pt-6">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                        Links
                      </h3>

                      <div className="flex flex-col gap-2">
                        {(showAllLinks ? project.links : project.links.slice(0, 2)).map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex items-center justify-between gap-2
                                rounded-xl border border-border
                                bg-card px-4 py-2.5
                                text-md text-foreground
                                hover:bg-muted transition
                              "
                          >
                            <span className="truncate font-medium">{getLinkLabel(link)}</span>
                            <ExternalLink className="w-4 h-4 opacity-60 flex-shrink-0" />
                          </a>
                        ))}

                        {project.links.length > 2 && (
                          <button
                            onClick={() => setShowAllLinks(!showAllLinks)}
                            className="
                                rounded-xl border border-gray-200 dark:border-gray-700
                                bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5
                                text-md font-semibold text-gray-800 dark:text-gray-200
                                hover:bg-gray-100 dark:hover:bg-gray-800 transition
                                text-left
                              "
                          >
                            {showAllLinks ? 'Show less' : `+${project.links.length - 2} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DISCOVERY LISTS */}
              <TrendingProjects limit={5} by="trending" />
              <LastWeekTopProjects />
            </div>
          </aside>
        </div>

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          projectId={project.id}
          projectName={project.name}
        />

      </div >
    </>
  );
};

export default ProjectDetailsClient;

