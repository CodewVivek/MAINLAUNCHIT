import { useState, useEffect } from "react";
import { ArrowBigUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";
import { Snackbar, Alert } from "@mui/material";
import toast from "react-hot-toast";
import { trackLike } from "../utils/analytics";
import ProfileCompletionModal from "./ProfileCompletionModal";


const Like = ({ projectId, iconOnly = false, initialCount = null, variant = "default" }) => {
  const [count, setCount] = useState(initialCount || 0);
  const [liked, setLiked] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [animateUpvote, setAnimateUpvote] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Sync count if initialCount changes (e.g. from batch fetch)
    if (initialCount !== null) {
      setCount(initialCount);
    }
  }, [initialCount]);

  useEffect(() => {
    const fetchUserAndLike = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: likedData } = await supabase
          .from("project_likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("project_id", projectId)
          .maybeSingle();
        setLiked(!!likedData);

        // Fetch user profile for completion check
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        setUserProfile(profileData);
      } else {
        setLiked(false);
      }
    };

    const fetchLikes = async () => {
      // Only fetch if initialCount was not provided
      if (initialCount === null) {
        const { count: likesCount } = await supabase
          .from("project_likes")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId);
        setCount(likesCount || 0);
      }
    };

    fetchUserAndLike();
    fetchLikes();
  }, [projectId, initialCount]);

  const handleLike = async (e) => {
    // Prevent event bubbling if used inside a clickable card
    e.stopPropagation();

    if (!user) {
      setSnackbar({
        open: true,
        message: "Please sign in to upvote projects",
        severity: "error",
      });
      return;
    }


    try {
      if (liked) {
        // Prevent unliking - upvotes are permanent
        toast.success("Upvotes are permanent to keep rankings fair. Thanks for supporting this project!", {
          duration: 3000,
          icon: '🚀',
        });
        return;
      } else {
        // Upvote
        const { error } = await supabase
          .from("project_likes")
          .insert([{ user_id: user.id, project_id: projectId }]);

        if (error) throw error;
        setCount((prev) => prev + 1);
        setLiked(true);
        setAnimateUpvote(true);
        setTimeout(() => setAnimateUpvote(false), 1000);

        // Track like (keep standard event name for analytics)
        trackLike('like', projectId);

        // Create notification for project owner
        const { data: projectData } = await supabase
          .from("projects")
          .select("user_id, name")
          .eq("id", projectId)
          .maybeSingle();

        if (projectData && projectData.user_id !== user.id) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          await supabase.from("notifications").insert([
            {
              user_id: projectData.user_id,
              type: "project_like",
              title: `${userProfile?.full_name || "Someone"} upvoted your project`,
              project_name: projectData.name,
            },
          ]);
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update upvote",
        severity: "error",
      });
    }
  };

  const isCompact = variant === "compact";

  return (
    <>
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 rounded-xl font-medium transition-all duration-300 ${isCompact ? "px-3 py-1.5 text-[11px] h-[34px]" : "px-7 py-3 rounded-full"
          } ${liked
            ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-sm"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
      >
        <ArrowBigUp
          className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} ${animateUpvote ? "animate-bounce" : ""} ${liked ? "fill-green-600" : ""}`}
        />
        {!iconOnly && (liked ? "Upvoted" : "Upvote")} {count}
      </button>

      {/* MUI Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={userProfile}
        action="upvote"
      />
    </>
  );
};

export default Like;
