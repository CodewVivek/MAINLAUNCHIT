'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/supabaseClient';
import Share from "@/components/Share";
import { UserProfileSkeleton } from "@/components/Skeletons";
import {
  ExternalLink,
  Calendar,
  Tag,
  MessageCircle,
  Rss,
  Star,
  Edit3,
  Trash2,
  HelpCircle,
  Menu,
  X,
  Briefcase,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Youtube,
  Eye,
  Clock,
  Check,
  X as XIcon,
  UserPlus,
  UserCheck,
  Users,
  Rocket,
  MessageSquare,
  BookmarkCheck,
  Bookmark,
  AlertTriangle,
  Upload,
  Camera,
  Plus,
  Zap,
} from "lucide-react";
import Like from "@/components/Like";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import SortByDateFilter from "@/components/SortByDateFilter";
import CategorySearch from "@/components/Submit/CategorySearch";
import toast from "react-hot-toast";

// Feature flag for pitch feature
const SHOW_PITCH_FEATURE = false; // Set to true to re-enable pitch feature

// Helper function to sort projects
function sortProjectsByDate(projects, dateField = "created_at", order = "newest") {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    return order === "newest" ? dateB - dateA : dateA - dateB;
  });
}

// Helper component for video preview
function PitchVideoPlayer({ filePath }) {
  const [signedUrl, setSignedUrl] = useState("");
  useEffect(() => {
    async function getSignedUrl() {
      if (!filePath) return;
      try {
        const { data, error } = await supabase.storage
          .from("pitch-videos")
          .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

        if (error) {

          // Fallback to public URL if signed URL creation fails
          const { data: publicUrlData } = supabase.storage
            .from("pitch-videos")
            .getPublicUrl(filePath);
          setSignedUrl(publicUrlData.publicUrl);
        } else {
          setSignedUrl(data?.signedUrl || "");
        }
      } catch (error) {

        const { data: publicUrlData } = supabase.storage
          .from("pitch-videos")
          .getPublicUrl(filePath);
        setSignedUrl(publicUrlData.publicUrl);
      }
    }
    getSignedUrl();
  }, [filePath]);

  if (!signedUrl) return <span>Loading video...</span>;
  return (
    <video src={signedUrl} controls className="w-48 rounded-lg" />
  );
}

const UserProfile = ({ initialProfile, initialProjects = [] }) => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params?.username;
  const initialTab = searchParams.get('tab') || "projects";

  const navigate = router.push; // Alias for backward compatibility
  const [profile, setProfile] = useState(initialProfile);
  const [projects, setProjects] = useState(initialProjects);
  const [userPitches, setUserPitches] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [upvotedProjects, setUpvotedProjects] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [viewedProjects, setViewedProjects] = useState([]);
  const [loadingUpvoted, setLoadingUpvoted] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingViewed, setLoadingViewed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // States for modals and notifications
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    tagline: "",
    description: "",
    website_url: "",
    category_type: "",
    logo_url: "",
    thumbnail_url: "",
    cover_urls: [],
    tags: [],
    built_with: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [deleteProject, setDeleteProject] = useState(null);
  const [deletePitchModal, setDeletePitchModal] = useState({ open: false, pitchId: null, status: null });
  const [editError, setEditError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [relaunchProject, setRelaunchProject] = useState(null);
  const [relaunchNotes, setRelaunchNotes] = useState("");
  const [relaunchLoading, setRelaunchLoading] = useState(false);

  // States for follow functionality
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Function to fetch all projects for the current profile
  const fetchUserProjects = async (profileId) => {
    if (!profileId) return;
    try {
      const { data: userProjects, error } = await supabase
        .from("projects")
        .select("id, name, tagline, slug, logo_url, thumbnail_url, website_url, category_type, created_at, status, user_id, last_relaunch_date")
        .eq("user_id", profileId);
      if (error) {
        setProjects([]);
      } else {
        // Batch fetch upvote counts
        const projectIds = userProjects.map(p => p.id);
        if (projectIds.length > 0) {
          const { data: likesData } = await supabase
            .from("project_likes")
            .select("project_id")
            .in("project_id", projectIds);

          const likesMap = (likesData || []).reduce((acc, like) => {
            acc[like.project_id] = (acc[like.project_id] || 0) + 1;
            return acc;
          }, {});

          const projectsWithLikes = userProjects.map(p => ({
            ...p,
            likesCount: likesMap[p.id] || 0
          }));
          setProjects(projectsWithLikes);
        } else {
          setProjects(userProjects || []);
        }
      }
    } catch (err) {
      setProjects([]);
    }
  };

  // Function to fetch all pitches for the current profile
  const fetchUserPitches = async (profileId) => {
    if (!profileId) {
      setLoadingPitches(false);
      return;
    }
    setLoadingPitches(true);
    try {
      const { data, error } = await supabase
        .from("pitch_submissions")
        .select(`*, projects:project_id ( id, name, tagline, logo_url )`)
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      if (!error) {
        setUserPitches(data || []);
      } else {

        setUserPitches([]);
      }
    } catch (err) {

      setUserPitches([]);
    }
    setLoadingPitches(false);
  };

  // Function to fetch all comments for the current profile
  const fetchUserComments = async (profileId) => {
    if (!profileId) {
      setLoadingComments(false);
      return;
    }
    setLoadingComments(true);
    try {
      // Try to fetch comments with project join for nicer UI.
      // If the join fails (missing FK/RLS), fall back to comments-only.
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          created_at,
          project_id,
          projects:project_id ( name, slug )
        `
        )
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (!error) {
        setUserComments(data || []);
      } else {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("comments")
          .select("id, content, created_at, project_id")
          .eq("user_id", profileId)
          .order("created_at", { ascending: false });

        if (fallbackError) {
          setUserComments([]);
        } else {
          setUserComments(fallbackData || []);
        }
      }
    } catch (err) {
      setUserComments([]);
    }
    setLoadingComments(false);
  };

  // Function to fetch all projects the user has upvoted
  const fetchUpvotedProjects = async (profileId) => {
    if (!profileId) {
      setLoadingUpvoted(false);
      return;
    }
    setLoadingUpvoted(true);
    try {
      const { data, error } = await supabase
        .from("project_likes")
        .select(
          `
          project_id,
          projects:project_id (
            id,
            name,
            tagline,
            slug,
            logo_url,
            thumbnail_url,
            category_type,
            created_at,
            status
          )
        `
        )
        .eq("user_id", profileId)
        .order("id", { ascending: false });

      if (error) {
        setUpvotedProjects([]);
      } else {
        const projectsOnly = (data || [])
          .map((row) => row.projects)
          .filter(Boolean);
        setUpvotedProjects(projectsOnly);
      }
    } catch (err) {
      setUpvotedProjects([]);
    }
    setLoadingUpvoted(false);
  };

  // Function to fetch all projects the user has saved
  const fetchSavedProjects = async (profileId) => {
    if (!profileId) {
      setLoadingSaved(false);
      return;
    }
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from("saved_projects")
        .select(
          `
          project_id,
          projects:project_id (
            id,
            name,
            tagline,
            slug,
            logo_url,
            thumbnail_url,
            category_type,
            created_at,
            status
          )
        `
        )
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (error) {
        setSavedProjects([]);
      } else {
        const projectsOnly = (data || [])
          .map((row) => row.projects)
          .filter(Boolean);
        setSavedProjects(projectsOnly);
      }
    } catch (err) {
      setSavedProjects([]);
    }
    setLoadingSaved(false);
  };

  // Function to fetch viewed history
  const fetchViewedProjects = async (profileId) => {
    if (!profileId) {
      setLoadingViewed(false);
      return;
    }
    setLoadingViewed(true);
    try {
      const { data, error } = await supabase
        .from("viewed_history")
        .select(
          `
          project_id,
          viewed_at,
          projects:project_id (
            id,
            name,
            tagline,
            slug,
            logo_url,
            thumbnail_url,
            category_type,
            created_at,
            status
          )
        `
        )
        .eq("user_id", profileId)
        .order("viewed_at", { descending: true })
        .limit(50);

      if (error) {
        setViewedProjects([]);
      } else {
        const projectsOnly = (data || [])
          .map((row) => row.projects)
          .filter(Boolean);
        setViewedProjects(projectsOnly);
      }
    } catch (err) {
      setViewedProjects([]);
    }
    setLoadingViewed(false);
  };

  // Main useEffect to fetch all profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        let targetProfile = null;
        const { data: authData } = await supabase.auth.getUser();
        const loggedInUser = authData?.user || null;
        setCurrentUser(loggedInUser);

        const isMe = username === 'me';
        const isPlaceholder = !username || username.includes("${") || username.includes("profile.username");

        if (isMe || isPlaceholder) {
          // Logic for 'me' remains the same as we need auth state
          if (loggedInUser) {
            const { data: myProfile, error: myError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", loggedInUser.id)
              .maybeSingle();

            if (!myProfile) {
              navigate("/settings");
              return;
            }
            targetProfile = myProfile;
          } else {
            navigate("/UserRegister");
            return;
          }
        } else {
          // Check if initialProfile already matches the requested username
          const decodedUsername = decodeURIComponent(username);
          if (initialProfile && initialProfile.username && initialProfile.username.toLowerCase() === decodedUsername.toLowerCase()) {
            targetProfile = initialProfile;
          } else {
            // Fetch profile by username
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .ilike("username", decodedUsername)
              .maybeSingle();

            if (profileError || !profileData) {
              setProfile(null);
              setLoading(false);
              return;
            }
            targetProfile = profileData;
          }
        }

        setProfile(targetProfile);
        const isProfileOwner = !!(loggedInUser && loggedInUser.id === targetProfile.id);
        setIsOwner(isProfileOwner);

        let userProjects = [];
        if (isProfileOwner) {
          // Fetch ALL projects for the owner (including drafts)
          const { data: ownerProjects, error: ownerProjectsError } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", targetProfile.id)
            .order("created_at", { ascending: false });

          if (ownerProjectsError) {
            userProjects = [];
          } else {
            userProjects = ownerProjects || [];
          }
          // await fetchUserPitches(targetProfile.id);
          await fetchUserComments(targetProfile.id);
          await fetchUpvotedProjects(targetProfile.id);
        } else {
          const { data: nonDraftProjects } = await supabase.from("projects").select("*").eq("user_id", targetProfile.id).neq("status", "draft");
          userProjects = nonDraftProjects || [];
          await fetchUserComments(targetProfile.id);
        }

        // Batch fetch likes for initial load
        if (userProjects.length > 0) {
          const projectIds = userProjects.map(p => p.id);
          const { data: likesData } = await supabase
            .from("project_likes")
            .select("project_id")
            .in("project_id", projectIds);

          const likesMap = (likesData || []).reduce((acc, like) => {
            acc[like.project_id] = (acc[like.project_id] || 0) + 1;
            return acc;
          }, {});

          userProjects = userProjects.map(p => ({
            ...p,
            likesCount: likesMap[p.id] || 0
          }));
        }

        setProjects(userProjects);

        if (loggedInUser && !isProfileOwner) {
          const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', loggedInUser.id).eq('following_id', targetProfile.id).maybeSingle();
          setIsFollowing(!!followData);
        }
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username, navigate, initialTab]);

  // Edit handlers
  const handleEditClick = (project) => {
    setEditProject(project);
    setEditForm({
      name: project.name || "",
      tagline: project.tagline || "",
      description: project.description || "",
      website_url: project.website_url || "",
      category_type: project.category_type || "",
      logo_url: project.logo_url || "",
      thumbnail_url: project.thumbnail_url || "",
      cover_urls: Array.isArray(project.cover_urls) ? [...project.cover_urls] : [],
      tags: Array.isArray(project.tags) ? [...project.tags] : [],
      built_with: Array.isArray(project.built_with) ? [...project.built_with] : []
    });
  };
  const handleEditClose = () => {
    if (isSaving) return;
    setEditProject(null);
    setEditError("");
  };
  const handleEditChange = (name, value) => {
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (file, path) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const fullPath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('startup-media')
      .upload(fullPath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('startup-media')
      .getPublicUrl(fullPath);

    return data.publicUrl;
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    setEditError("");
    try {
      const updateData = {
        tagline: editForm.tagline,
        description: editForm.description,
        category_type: editForm.category_type,
        updated_at: new Date().toISOString(),
      };

      // Handle Logo Upload if it's a File object
      if (editForm.logo_file) {
        console.log('Uploading logo:', editForm.logo_file.name);
        updateData.logo_url = await handleFileUpload(editForm.logo_file, 'logos');
        console.log('Logo uploaded:', updateData.logo_url);
      }

      // Handle Thumbnail Upload if it's a File object
      if (editForm.thumbnail_file) {
        console.log('Uploading thumbnail:', editForm.thumbnail_file.name);
        updateData.thumbnail_url = await handleFileUpload(editForm.thumbnail_file, 'thumbnails');
        console.log('Thumbnail uploaded:', updateData.thumbnail_url);
      }

      // Handle Screenshots Uploads
      console.log('New screenshots to upload:', editForm.new_screenshots?.length || 0);
      console.log('Existing cover URLs:', editForm.cover_urls?.length || 0);

      if (editForm.new_screenshots?.length > 0) {
        try {
          const newUrls = await Promise.all(
            editForm.new_screenshots.map(async (file) => {
              console.log('Uploading screenshot:', file.name);
              const url = await handleFileUpload(file, 'covers');
              console.log('Screenshot uploaded:', file.name, '→', url);
              return url;
            })
          );
          updateData.cover_urls = [...(editForm.cover_urls || []), ...newUrls];
          console.log('Final cover_urls array:', updateData.cover_urls);
        } catch (uploadError) {
          console.error('Screenshot upload failed:', uploadError);
          throw new Error(`Failed to upload screenshots: ${uploadError.message}`);
        }
      } else {
        updateData.cover_urls = editForm.cover_urls;
      }

      console.log('Updating project with data:', updateData);

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", editProject.id);

      if (error) throw error;

      setEditProject(null);
      setSnackbar({ open: true, message: "Project updated successfully!", severity: "success" });
      setTimeout(() => fetchUserProjects(profile.id), 500);
    } catch (err) {
      console.error('Save error:', err);
      setEditError(`Something went wrong: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstantRelaunch = async (project) => {
    const confirmRelaunch = confirm(`Boost ${project.name} to the top of the feed instantly?`);
    if (!confirmRelaunch) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("🚀 Project boosted to the top!");
      fetchUserProjects(profile.id);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Delete handlers
  const handleDeleteClick = (project) => setDeleteProject(project);
  const handleDeleteCancel = () => setDeleteProject(null);
  const handleDeleteConfirm = async () => {
    try {
      // First, track the deletion in deleted_projects table
      const { error: trackError } = await supabase
        .from('deleted_projects')
        .insert([{
          website_url: deleteProject.website_url,
          deleted_by: currentUser?.id,
          original_project_id: deleteProject.id
        }]);

      if (trackError) {
        // Continue with deletion even if tracking fails
      }

      // Delete related data
      await supabase.from("project_likes").delete().eq("project_id", deleteProject.id);

      // Delete the project
      const { error } = await supabase.from("projects").delete().eq("id", deleteProject.id);
      if (error) throw error;

      setDeleteProject(null);

      // Show success toast
      toast.success("🗑️ Project deleted successfully", {
        duration: 5000,
      });

      // Show cooldown info
      toast.info("ℹ️ URL Cooldown Active", {
        duration: 6000,
        description: "This URL cannot be re-launched for 30 days to maintain platform quality."
      });

      setTimeout(() => fetchUserProjects(profile.id), 500);
    } catch (err) {
      setEditError(err.message || "Failed to delete project.");
      toast.error("Failed to delete project", {
        duration: 4000,
      });
    }
  };

  // Delete pitch handlers
  const deletePitch = (pitchId, status) => {
    setDeletePitchModal({ open: true, pitchId, status });
  };
  const handleDeletePitchConfirm = async () => {
    const { pitchId, status } = deletePitchModal;
    try {
      const { data: pitchData, error: fetchError } = await supabase.from("pitch_submissions").select("video_url, video_type").eq("id", pitchId).maybeSingle();
      if (fetchError) throw fetchError;
      if (pitchData?.video_type === "file" && pitchData?.video_url && pitchData.video_url.includes("pitch-videos")) {
        const filePath = pitchData.video_url.split("/pitch-videos/")[1];
        if (filePath) await supabase.storage.from("pitch-videos").remove([filePath]);
      }
      const { error: deleteError } = await supabase.from("pitch_submissions").delete().eq("id", pitchId);
      if (deleteError) throw deleteError;
      setTimeout(() => fetchUserPitches(profile.id), 500);
      setSnackbar({ open: true, message: "Pitch deleted successfully", severity: "success" });
      setDeletePitchModal({ open: false, pitchId: null, status: null });
    } catch (error) {

      setSnackbar({ open: true, message: "Failed to delete pitch: " + error.message, severity: "error" });
      setDeletePitchModal({ open: false, pitchId: null, status: null });
    }
  };
  const handleDeletePitchCancel = () => { setDeletePitchModal({ open: false, pitchId: null, status: null }); };

  const handleRelaunchClick = (project) => {
    setRelaunchProject(project);
    setRelaunchNotes("");
  };

  const handleRequestRelaunch = async () => {
    if (!relaunchNotes.trim()) {
      toast.error("Please describe what's new in this relaunch!");
      return;
    }
    setRelaunchLoading(true);
    try {
      // Prepare the data for admin review
      const { error } = await supabase
        .from('moderation')
        .insert([{
          project_id: relaunchProject.id,
          user_id: currentUser.id,
          content_type: 'relaunch_request',
          content: `Relaunch Request: ${relaunchNotes}`,
          status: 'pending_review',
          moderation_result: {
            update_notes: relaunchNotes,
            current_data: {
              name: relaunchProject.name,
              tagline: relaunchProject.tagline,
              description: relaunchProject.description,
              website_url: relaunchProject.website_url,
              category_type: relaunchProject.category_type,
              logo_url: relaunchProject.logo_url,
              thumbnail_url: relaunchProject.thumbnail_url,
              cover_urls: relaunchProject.cover_urls,
              links: relaunchProject.links,
              tags: relaunchProject.tags,
              built_with: relaunchProject.built_with,
              features: relaunchProject.features
            }
          },
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success("🚀 Relaunch request submitted! Admins will review it soon.", {
        icon: '🚀',
        duration: 5000
      });
      setRelaunchProject(null);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRelaunchLoading(false);
    }
  };



  // Status icons and colors
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved": return <Check className="w-4 h-4 text-green-500" />;
      case "rejected": return <XIcon className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Time ago helper
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Follow functionality
  const handleFollow = async () => {
    if (!currentUser) { toast.error("Please sign in to follow users"); return; }
    if (!profile || currentUser.id === profile.id) { toast.error("Invalid action"); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id);
        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${profile.full_name || profile.username}`);
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id });
        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Following ${profile.full_name || profile.username}`);
      }
    } catch (error) {

      toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow');
    } finally {
      setFollowLoading(false);
    }
  };

  // Check if a draft has at least one required field filled
  const isDraftStarted = (project) => !!(project.name || project.tagline || project.description || project.website_url || project.category_type);

  // Filter and sort projects based on state
  const filteredProjects = projects.filter((project) => {
    if (projectFilter === "all") return true;
    if (projectFilter === "draft") return project.status === "draft" && isDraftStarted(project);
    if (projectFilter === "launched") return project.status !== "draft";
    return true;
  });
  const sortedProjects = sortProjectsByDate(filteredProjects, "created_at", sortOrder);

  if (loading) {
    return <UserProfileSkeleton />;
  }
  if (!profile && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">User Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn't find the profile you're looking for. The user might have changed their handle or deleted their account.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex bg-background min-h-screen font-sans transition-colors duration-300 pt-4">
        {/* Main Content */}
        <main className="w-full flex-1 p-4 sm:p-6 md:p-8">
          {/* Profile Info */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8 mb-8 transition-colors duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <img
                src={profile.avatar_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + profile.username}
                alt="Profile"
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-background object-cover shadow-md"
                loading="lazy"
              />

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {profile.full_name || profile.username || "Unnamed User"}
                </h1>
                <p className="text-muted-foreground text-md mb-3">
                  @{profile.username}
                </p>
                {/* Email only visible to profile owner */}
                {isOwner && (
                  <p className="text-gray-500 text-md mb-3">
                    {profile.email || "No email provided"}
                  </p>
                )}
                <p className="text-foreground/80 mb-4 max-w-xl mx-auto md:mx-0">
                  {profile.bio || "This user has not written a bio yet"}
                </p>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500">
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noreferrer" className="hover:text-blue-500 flex items-center gap-1.5 transition-colors">
                      <Twitter className="w-4 h-4" /><span>Twitter</span>
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                      <Linkedin className="w-4 h-4" /><span>LinkedIn</span>
                    </a>
                  )}
                  {profile.youtube && (
                    <a href={profile.youtube} target="_blank" rel="noreferrer" className="hover:text-red-600 flex items-center gap-1.5 transition-colors">
                      <Youtube className="w-4 h-4" /><span>YouTube</span>
                    </a>
                  )}
                  {profile.portfolio && (
                    <a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-foreground flex items-center gap-1.5 transition-colors">
                      <Briefcase className="w-4 h-4" /><span>Portfolio</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row items-center gap-3 md:ml-auto">
                {/* Follow Button */}
                {currentUser && currentUser.id !== profile.id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-md transition-all shadow-sm hover:shadow-md ${isFollowing
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : isFollowing ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" /> Following
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Follow
                      </div>
                    )}
                  </button>
                )}

                {/* Edit Profile (if owner) */}
                {isOwner && (
                  <button
                    onClick={() => navigate("/settings")}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-md transition-all shadow-sm hover:shadow-md"
                  >
                    Edit Profile
                  </button>
                )}

                {/* Share Button */}
                <Share
                  projectSlug={profile.username}
                  projectName={`${profile.full_name || profile.username}'s Profile`}
                  isProfile={true}
                  imageUrl={profile.avatar_url}
                />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-border">
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-2 px-1 border-b-2 font-medium text-md ${activeTab === "projects" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Projects ({projects.length})
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setActiveTab("saved")}
                  className={`pb-2 px-1 border-b-2 font-medium text-md ${activeTab === "saved" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Saved
                </button>
                <button
                  onClick={() => setActiveTab("upvoted")}
                  className={`pb-2 px-1 border-b-2 font-medium text-md ${activeTab === "upvoted" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Upvoted
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-2 px-1 border-b-2 font-medium text-md ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  History
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab("comments")}
              className={`pb-2 px-1 border-b-2 font-medium text-md ${activeTab === "comments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Comments ({userComments.length})
            </button>
            {SHOW_PITCH_FEATURE && (
              <button
                onClick={() => setActiveTab("pitches")}
                className={`pb-2 px-1 border-b-2 font-medium text-md ${activeTab === "pitches" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Pitches ({userPitches.length})
              </button>
            )}
          </div>
          {activeTab === "projects" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 mt-4">
                <div className="flex flex-wrap gap-2 text-md font-medium">
                  <button
                    onClick={() => setProjectFilter("all")}
                    className={`px-4 py-2 rounded-full transition-colors ${projectFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    All ({projects.length})
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setProjectFilter("draft")}
                      className={`px-4 py-2 rounded-full transition-colors ${projectFilter === "draft" ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      Drafts ({projects.filter((p) => p.status === "draft").length})
                    </button>
                  )}
                  <button
                    onClick={() => setProjectFilter("launched")}
                    className={`px-4 py-2 rounded-full transition-colors ${projectFilter === "launched" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    Launched ({projects.filter((p) => p.status !== "draft").length})
                  </button>
                </div>
                <SortByDateFilter value={sortOrder} onChange={setSortOrder} />
              </div>

              {sortedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => navigate(`/launches/${project.slug}`)}
                    >
                      <div className="relative pt-[56.25%] bg-muted rounded-t-xl overflow-hidden">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={`${project.name} thumbnail`}
                            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-muted-foreground">Nt</div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-start gap-4 mb-3">
                          {project.logo_url ? (
                            <img
                              src={project.logo_url}
                              alt={`${project.name} logo`}
                              className="w-12 h-12 object-contain rounded-lg border border-border bg-card mt-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border flex-shrink-0 mt-1">
                              <span>{project.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">{project.name}</h2>
                            <p className="text-md text-muted-foreground line-clamp-2">{project.tagline}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-md text-gray-500 mt-auto mb-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="capitalize font-medium text-foreground/80">{project.category_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>
                              Launched on{" "}
                              {new Date(project.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <Like projectId={project.id} initialCount={project.likesCount} variant="compact" />
                          {isOwner && (
                            <div className="flex items-center gap-2">
                              {project.status !== "draft" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRelaunchClick(project); }}
                                  className="h-[34px] flex items-center gap-1.5 px-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-tight"
                                >
                                  <Rocket className="w-3.5 h-3.5" />
                                  Update
                                </button>
                              )}
                              {project.status !== "draft" && (project.is_sponsored || (project.sponsored_tier && project.sponsored_tier !== 'free')) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleInstantRelaunch(project); }}
                                  className="h-[34px] w-[34px] flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                                  title="Instant Relaunch"
                                >
                                  <Zap className="w-4 h-4 fill-current" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditClick(project); }}
                                className="h-[34px] w-[34px] flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }}
                                className="h-[34px] w-[34px] flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted rounded-xl border-2 border-dashed border-border">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {isOwner ? "No Launches Yet" : "No Launches Found"}
                  </h4>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {isOwner
                      ? "You haven't launched any projects yet. Start building and share your ideas with the world!"
                      : "This user hasn't launched any projects yet."
                    }
                  </p>
                  {isOwner && (
                    <button
                      onClick={() => navigate('/submit')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium"
                    >
                      <Rocket className="w-4 h-4" />
                      Launch Your First Project
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "saved" && isOwner && (
            <div className="mt-8">
              {loadingSaved ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading saved launches...</p>
                </div>
              ) : savedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => navigate(`/launches/${project.slug}`)}
                    >
                      <div className="relative pt-[56.25%] bg-muted rounded-t-xl overflow-hidden">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={`${project.name} thumbnail`}
                            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-muted-foreground">Nt</div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-start gap-4 mb-3">
                          {project.logo_url ? (
                            <img
                              src={project.logo_url}
                              alt={`${project.name} logo`}
                              className="w-12 h-12 object-contain rounded-lg border border-border bg-card mt-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border flex-shrink-0 mt-1">
                              <span>{project.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">{project.name}</h2>
                            <p className="text-md text-muted-foreground line-clamp-2">{project.tagline}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-md text-gray-500 mt-auto mb-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="capitalize font-medium text-foreground/80">{project.category_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border mt-6">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold">No Saved Launches Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2">Projects you bookmark will appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "upvoted" && isOwner && (
            <div className="mt-8">
              {loadingUpvoted ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading upvoted launches...</p>
                </div>
              ) : upvotedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upvotedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => navigate(`/launches/${project.slug}`)}
                    >
                      <div className="relative pt-[56.25%] bg-muted rounded-t-xl overflow-hidden">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={`${project.name} thumbnail`}
                            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-muted-foreground">Nt</div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-start gap-4 mb-3">
                          {project.logo_url ? (
                            <img
                              src={project.logo_url}
                              alt={`${project.name} logo`}
                              className="w-12 h-12 object-contain rounded-lg border border-border bg-card mt-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border flex-shrink-0 mt-1">
                              <span>{project.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">{project.name}</h2>
                            <p className="text-md text-muted-foreground line-clamp-2">{project.tagline}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-md text-gray-500 mt-auto mb-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="capitalize font-medium text-foreground/80">{project.category_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border mt-6">
                  <Star className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">No Upvoted Launches Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2">Projects you have upvoted will appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && isOwner && (
            <div className="mt-8">
              {loadingViewed ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading viewed history...</p>
                </div>
              ) : viewedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viewedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => navigate(`/launches/${project.slug}`)}
                    >
                      <div className="relative pt-[56.25%] bg-muted rounded-t-xl overflow-hidden">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={`${project.name} thumbnail`}
                            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-muted-foreground">Nt</div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-start gap-4 mb-3">
                          {project.logo_url ? (
                            <img
                              src={project.logo_url}
                              alt={`${project.name} logo`}
                              className="w-12 h-12 object-contain rounded-lg border border-border bg-card mt-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border flex-shrink-0 mt-1">
                              <span>{project.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">{project.name}</h2>
                            <p className="text-md text-muted-foreground line-clamp-2">{project.tagline}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-md text-gray-500 mt-auto mb-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="capitalize font-medium text-foreground/80">{project.category_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border mt-6">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold">Viewed History</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2">Recently viewed projects will appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "social" && isOwner && (
            <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border mt-6">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold">Connections</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">Manage your followers and people you follow.</p>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="mt-8 space-y-6">
              {loadingComments ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading comments...</p>
                </div>
              ) : userComments.length > 0 ? (
                <div className="space-y-4">
                  {userComments.map((comment) => (
                    <div key={comment.id} className="bg-card border border-border rounded-2xl p-6 transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          href={`/launches/${comment.projects?.slug}`}
                          className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                        >
                          <Rocket className="w-4 h-4" />
                          {comment.projects?.name || "Deleted Project"}
                        </Link>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-card rounded-2xl border-2 border-dashed border-border">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">No Comments Yet</h4>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {isOwner
                      ? "You haven't posted any comments yet. Join the conversation on projects to see your activity here!"
                      : "This user hasn't posted any comments yet."
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {SHOW_PITCH_FEATURE && activeTab === "pitches" && isOwner && (
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">My Pitches</h2>
              </div>
              {loadingPitches ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading pitches...</p>
                </div>
              ) : userPitches.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">No Pitches Submitted Yet</h4>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    You haven't submitted any pitch videos yet. Share your startup story and get feedback from the community!
                  </p>
                  <button
                    onClick={() => navigate('/pitch-upload')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Submit Your First Pitch
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {userPitches.map((pitch) => (
                    <div key={pitch.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{pitch.title || "Untitled Pitch"}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(pitch.status)}`}>
                              {getStatusIcon(pitch.status)}{pitch.status}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">Project: {pitch.projects?.name}</p>
                          {pitch.description && (<p className="text-foreground/80 mb-3">{pitch.description}</p>)}
                          {pitch.admin_notes && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                              <p className="text-md text-red-500"><strong>Rejection Reason:</strong> {pitch.admin_notes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-md text-muted-foreground">
                            <span>Submitted: {new Date(pitch.created_at).toLocaleDateString()}</span>
                            <span>Type: {pitch.video_type}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {pitch.video_type === "file" ? (
                            <PitchVideoPlayer filePath={pitch.video_url} />
                          ) : (
                            <a href={pitch.video_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-primary hover:bg-muted transition-colors" title="Watch on external site">
                              <Eye className="w-5 h-5" />
                            </a>
                          )}
                          <button onClick={() => deletePitch(pitch.id, pitch.status)} className="p-2 rounded-full text-destructive hover:bg-muted transition-colors" title="Delete pitch">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Edit Dialog */}
        {/* Edit Dialog */}
        <Dialog open={!!editProject} onClose={handleEditClose} maxWidth="md" fullWidth>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Edit3 className="w-5 h-5 text-primary" />
                </div>
                Edit {editForm.name}
              </h2>
              <button onClick={handleEditClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Category */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                <CategorySearch
                  value={editForm.category_type}
                  onChange={(val) => handleEditChange('category_type', val)}
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Tagline</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => handleEditChange('tagline', e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none transition-all"
                  placeholder="Elevator pitch..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none transition-all min-h-[120px] resize-none"
                  placeholder="Tell us more about it..."
                />
              </div>

              {/* Media Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/20">
                      {editForm.logo_url && !editForm.logo_preview ? (
                        <img src={editForm.logo_url} className="w-full h-full object-cover" />
                      ) : editForm.logo_preview ? (
                        <img src={editForm.logo_preview} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Change
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleEditChange('logo_file', file);
                          handleEditChange('logo_preview', URL.createObjectURL(file));
                        }
                      }} />
                    </label>
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Main Thumbnail</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/20">
                      {editForm.thumbnail_url && !editForm.thumbnail_preview ? (
                        <img src={editForm.thumbnail_url} className="w-full h-full object-cover" />
                      ) : editForm.thumbnail_preview ? (
                        <img src={editForm.thumbnail_preview} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Change
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleEditChange('thumbnail_file', file);
                          handleEditChange('thumbnail_preview', URL.createObjectURL(file));
                        }
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground">Screenshots</label>
                  <label className="cursor-pointer text-xs font-black text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add New
                    <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        const currentNew = editForm.new_screenshots || [];
                        const currentPreviews = editForm.new_previews || [];
                        handleEditChange('new_screenshots', [...currentNew, ...files]);
                        handleEditChange('new_previews', [...currentPreviews, ...files.map(f => URL.createObjectURL(f))]);
                      }
                    }} />
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Existing Screenshots */}
                  {editForm.cover_urls?.map((url, idx) => (
                    <div key={idx} className="group relative aspect-video bg-muted/30 rounded-xl border-2 border-border overflow-hidden">
                      <img src={url} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const updated = editForm.cover_urls.filter((_, i) => i !== idx);
                          handleEditChange('cover_urls', updated);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* New Previews */}
                  {editForm.new_previews?.map((url, idx) => (
                    <div key={`new-${idx}`} className="group relative aspect-video bg-muted/30 rounded-xl border-2 border-primary/20 overflow-hidden">
                      <img src={url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                        <span className="text-[8px] font-black uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded">New</span>
                      </div>
                      <button
                        onClick={() => {
                          const updatedPreviews = editForm.new_previews.filter((_, i) => i !== idx);
                          const updatedFiles = editForm.new_screenshots.filter((_, i) => i !== idx);
                          handleEditChange('new_previews', updatedPreviews);
                          handleEditChange('new_screenshots', updatedFiles);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {editError && (<Alert severity="error" className="mt-4">{editError}</Alert>)}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleEditClose}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSaving}
                className="flex-[2] px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog>

        {/* Relaunch Dialog */}
        <Dialog open={!!relaunchProject} onClose={() => setRelaunchProject(null)} maxWidth="sm" fullWidth>
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-blue-500" />
              Request Major Update
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Upgrading {relaunchProject?.name}? Tell us what's new! Approved relaunches jump to the top of the feed for maximum visibility.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                  What's new? (Mandatory)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm min-h-[120px] resize-none"
                  placeholder="E.g. Version 2.0 is live! Included AI-powered search, a completely new UI, and 3x faster performance."
                  value={relaunchNotes}
                  onChange={(e) => setRelaunchNotes(e.target.value)}
                />
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700/80 leading-relaxed">
                  <strong>Visibility Rule:</strong> Admins review relaunch requests to ensure they are significant enough to warrant a fresh appearance on the homepage.
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setRelaunchProject(null)}
                className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRelaunch}
                disabled={relaunchLoading || !relaunchNotes.trim()}
                className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {relaunchLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Submit for Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog>
        {/* Delete Confirmation with Cooldown Warning */}
        <Dialog open={!!deleteProject} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span>Delete Project?</span>
            </div>
          </DialogTitle>
          <DialogContent>
            <div className="space-y-4 pt-2">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>"{deleteProject?.name}"</strong>?
              </p>

              {/* Cooldown Warning Box */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">
                      30-Day Cooldown Period
                    </p>
                    <p className="text-md text-amber-800">
                      Once deleted, this URL (<strong>{deleteProject?.website_url}</strong>)
                      cannot be re-launched for 30 days. This helps maintain platform quality.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-md text-gray-600">
                This action cannot be undone. All project data and likes will be permanently removed.
              </p>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" startIcon={<Trash2 className="w-4 h-4" />}>
              Delete Project
            </Button>
          </DialogActions>
        </Dialog>
        {/* Delete Pitch Confirmation Modal */}
        <Dialog open={deletePitchModal.open} onClose={handleDeletePitchCancel} maxWidth="sm" fullWidth>
          <DialogTitle className="bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Delete Pitch</h3>
                <p className="text-md text-red-600 mt-1">This action cannot be undone</p>
              </div>
            </div>
          </DialogTitle>
          <DialogContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-full"><HelpCircle className="w-5 h-5 text-yellow-600" /></div>
                <div>
                  <p className="font-medium text-yellow-800">Are you absolutely sure?</p>
                  <p className="text-md text-yellow-700 mt-1">This will permanently delete your pitch video and all associated data. This action cannot be reversed.</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">What will be deleted:</h4>
                <ul className="text-md text-gray-600 space-y-1">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>Your pitch video file</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>Pitch submission record</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>All associated metadata</li>
                </ul>
              </div>
            </div>
          </DialogContent>
          <DialogActions className="p-6 pt-0">
            <Button onClick={handleDeletePitchCancel} variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            <Button onClick={handleDeletePitchConfirm} variant="contained" className="bg-red-600 hover:bg-red-700 text-white" startIcon={<Trash2 className="w-4 h-4" />}>Delete Pitch</Button>
          </DialogActions>
        </Dialog>
        {/* MUI Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </div >
    </>
  );
};

export default UserProfile;