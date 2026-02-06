import React, { useState, useEffect, useCallback, useRef } from "react";
import { Rabbit, ThumbsUp, MoreVertical, Heart } from "lucide-react";
import { supabase } from "../supabaseClient";
import ReportModal from "./ReportModal";
import { toast } from "react-hot-toast";
import { sanitizeAndValidateComment, checkRateLimit } from "../utils/inputSanitization";
import { checkProfileCompletion } from "../utils/profileCompletion";
import ProfileCompletionModal from "./ProfileCompletionModal";

// Helper to show relative time (e.g., '1h ago', '2d ago', 'just now')
function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000); // in seconds

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

const Comments = ({ projectId, ownerId }) => {
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [openReplies, setOpenReplies] = useState({});
  const [expandedComments, setExpandedComments] = useState({}); // For "Read more"
  const [openMenus, setOpenMenus] = useState({}); // For three dots menu
  const [commentLikes, setCommentLikes] = useState({}); // { commentId: { count: number, likedByOwner: boolean } }

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState(null);

  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isPostingReply, setIsPostingReply] = useState(false);

  // Profile completion state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const textareaRef = useRef(null);
  const replyTextareaRef = useRef(null);

  // Auto-expand textarea
  const autoExpandTextarea = (textarea) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Fetch comment likes
  const fetchCommentLikes = useCallback(async (commentIds, currentUserId) => {
    if (!commentIds.length) return {};

    const likesMap = {};

    try {
      // Fetch like counts
      for (const commentId of commentIds) {
        const { count, error } = await supabase
          .from("comment_likes")
          .select("id", { count: "exact", head: true })
          .eq("comment_id", commentId);

        if (error) {
          likesMap[commentId] = { count: 0, likedByOwner: false, userLiked: false };
        } else {
          likesMap[commentId] = {
            count: count || 0,
            likedByOwner: false,
            userLiked: false
          };
        }
      }

      // Check if current user liked each comment
      if (currentUserId) {
        const { data: userLikes, error: userLikesError } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", currentUserId)
          .in("comment_id", commentIds);

        if (!userLikesError && userLikes) {
          userLikes.forEach((like) => {
            if (likesMap[like.comment_id]) {
              likesMap[like.comment_id].userLiked = true;
            }
          });
        }
      }

      // Check if owner liked each comment (for heart indicator)
      if (ownerId) {
        const { data: ownerLikes, error: ownerLikesError } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", ownerId)
          .in("comment_id", commentIds);

        if (!ownerLikesError && ownerLikes) {
          ownerLikes.forEach((like) => {
            if (likesMap[like.comment_id]) {
              likesMap[like.comment_id].likedByOwner = true;
            }
          });
        }
      }
    } catch (error) {
      // Return empty map if table doesn't exist
      commentIds.forEach((id) => {
        likesMap[id] = { count: 0, likedByOwner: false, userLiked: false };
      });
    }

    return likesMap;
  }, [ownerId]);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(full_name, avatar_url, username)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load comments.");
      return;
    }

    setComments(data || []);

    // Fetch likes for all comments
    if (data && data.length > 0) {
      const commentIds = data.map((c) => c.id);
      const currentUserId = user?.id || null;
      const likes = await fetchCommentLikes(commentIds, currentUserId);
      setCommentLikes(likes);
    }
  }, [projectId, fetchCommentLikes, user]);

  const checkUser = useCallback(async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        return;
      }

      setUser(user || null);

      if (user) {
        // Fetch full profile for completion check
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")  // Changed from just "role" to "*"
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          return;
        }

        setUserProfile(profile); // Store full profile
        setUserRole(profile?.role || null);
      } else {
        setUserProfile(null);
        setUserRole(null);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        await checkUser();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [projectId, checkUser]);

  // Fetch comments after user is loaded
  useEffect(() => {
    if (user !== null) {
      fetchComments();
    }
  }, [projectId, user, fetchComments]);

  // Handle like comment - anyone can like
  const handleLikeComment = async (commentId, commentUserId) => {
    if (!user) {
      toast.error("Please sign in to like comments");
      return;
    }

    // SECURITY: Rate limiting - prevent spam likes
    const rateLimitKey = `like-comment-${user.id}`;
    if (!checkRateLimit(rateLimitKey, 20, 60000)) { // 20 likes per minute
      toast.error("Please wait before liking again");
      return;
    }

    // Check if current user has already liked this comment
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isLiked = !!existingLike;
    const wasLikedByOwner = commentLikes[commentId]?.likedByOwner;

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;

        const newCount = Math.max(0, (commentLikes[commentId]?.count || 0) - 1);
        const stillLikedByOwner = wasLikedByOwner && user.id !== ownerId;

        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: {
            count: newCount,
            likedByOwner: stillLikedByOwner,
            userLiked: false,
          },
        }));
      } else {
        // Like
        const { error } = await supabase
          .from("comment_likes")
          .insert([{ comment_id: commentId, user_id: user.id }]);

        if (error) throw error;

        const newCount = (commentLikes[commentId]?.count || 0) + 1;
        const nowLikedByOwner = wasLikedByOwner || user.id === ownerId;

        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: {
            count: newCount,
            likedByOwner: nowLikedByOwner,
            userLiked: true,
          },
        }));

        // Send notification to comment owner (if liker is not the comment owner)
        if (commentUserId && commentUserId !== user.id) {
          try {
            const { data: likerProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .maybeSingle();

            // If project owner liked, use special message
            const notificationTitle = user.id === ownerId
              ? `Project owner ${likerProfile?.full_name || ""} liked your comment`
              : `${likerProfile?.full_name || "Someone"} liked your comment`;

            await supabase.from("notifications").insert([
              {
                user_id: commentUserId,
                type: "comment_like",
                title: notificationTitle,
                project_name: "",
              },
            ]);
          } catch (notifError) {
            // notification optional
          }
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    // Check profile completion
    if (userProfile) {
      const completion = checkProfileCompletion(userProfile);
      if (!completion.isComplete) {
        setShowProfileModal(true);
        return;
      }
    } else {
      // Fetch profile if not loaded
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserProfile(profileData);
        const completion = checkProfileCompletion(profileData);
        if (!completion.isComplete) {
          setShowProfileModal(true);
          return;
        }
      } else {
        // No profile - show modal
        setShowProfileModal(true);
        return;
      }
    }

    // SECURITY: Sanitize and validate comment
    const { sanitized, valid, error: validationError } = sanitizeAndValidateComment(newComment, 500);
    if (!valid) {
      toast.error(validationError || "Invalid comment");
      return;
    }

    // SECURITY: Rate limiting - prevent spam comments
    const rateLimitKey = `add-comment-${user.id}`;
    if (!checkRateLimit(rateLimitKey, 10, 60000)) { // 10 comments per minute
      toast.error("Please wait before posting another comment");
      return;
    }

    setIsPostingComment(true);

    try {
      await supabase.from("comments").insert({
        project_id: projectId,
        user_id: user.id,
        content: sanitized, // Use sanitized content
        parent_id: null,
        deleted: false,
      });

      // Create notification for project owner (if commenter is not the owner)
      if (ownerId && ownerId !== user.id) {
        try {
          const { data: projectData } = await supabase
            .from("projects")
            .select("name, slug")
            .eq("id", projectId)
            .maybeSingle();

          const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          await supabase.from("notifications").insert([
            {
              user_id: ownerId,
              type: "project_comment",
              title: `${userProfile?.full_name || "Someone"} commented on your project`,
              project_name: projectData?.name || "your project",
            },
          ]);
        } catch (notifError) {
          // notification optional
        }
      }

      setNewComment("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      await fetchComments();
    } catch (error) {
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!user || !replyContent.trim()) return;

    // Check profile completion
    if (userProfile) {
      const completion = checkProfileCompletion(userProfile);
      if (!completion.isComplete) {
        setShowProfileModal(true);
        return;
      }
    } else {
      // Fetch profile if not loaded
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserProfile(profileData);
        const completion = checkProfileCompletion(profileData);
        if (!completion.isComplete) {
          setShowProfileModal(true);
          return;
        }
      } else {
        // No profile - show modal
        setShowProfileModal(true);
        return;
      }
    }

    // SECURITY: Sanitize and validate reply
    const { sanitized, valid, error: validationError } = sanitizeAndValidateComment(replyContent, 500);
    if (!valid) {
      toast.error(validationError || "Invalid reply");
      return;
    }

    // SECURITY: Rate limiting - prevent spam replies
    const rateLimitKey = `reply-comment-${user.id}`;
    if (!checkRateLimit(rateLimitKey, 10, 60000)) { // 10 replies per minute
      toast.error("Please wait before posting another reply");
      return;
    }

    setIsPostingReply(true);

    try {
      await supabase.from("comments").insert({
        project_id: projectId,
        user_id: user.id,
        content: sanitized, // Use sanitized content
        parent_id: parentId,
        deleted: false,
      });

      // Create notification for project owner (if replier is not the owner)
      if (ownerId && ownerId !== user.id) {
        try {
          const { data: projectData } = await supabase
            .from("projects")
            .select("name")
            .eq("id", projectId)
            .maybeSingle();

          const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          await supabase.from("notifications").insert([
            {
              user_id: ownerId,
              type: "project_comment",
              title: `${userProfile?.full_name || "Someone"} replied to a comment on your project`,
              project_name: projectData?.name || "your project",
            },
          ]);
        } catch (notifError) {
          // notification optional
        }
      }

      setReplyTo(null);
      setReplyContent("");
      if (replyTextareaRef.current) {
        replyTextareaRef.current.style.height = "auto";
      }
      await fetchComments();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPostingReply(false);
    }
  };

  const deleteComment = async (comment) => {
    try {
      // SECURITY FIX: Always check database for replies, not client state
      // This prevents race condition where a reply is added between check and delete
      const { data: replies, error: repliesError } = await supabase
        .from("comments")
        .select("id")
        .eq("parent_id", comment.id)
        .limit(1); // Just need to know if any exist

      if (repliesError) {
        toast.error("Failed to delete comment.");
        return;
      }

      if (replies && replies.length > 0) {
        // Soft delete if replies exist
        const { error } = await supabase
          .from("comments")
          .update({ content: "", deleted: true })
          .eq("id", comment.id);

        if (error) throw error;
      } else {
        // Hard delete if no replies
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", comment.id);

        if (error) throw error;
      }

      setOpenMenus((prev) => ({ ...prev, [comment.id]: false }));
      await fetchComments();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const nestComments = (flatComments) => {
    const map = {};
    flatComments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    const roots = [];
    flatComments.forEach((c) => {
      if (c.parent_id) {
        if (map[c.parent_id]) {
          map[c.parent_id].replies.push(map[c.id]);
        }
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  };

  const toggleReplies = (commentId) => {
    setOpenReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const toggleCommentExpand = (commentId) => {
    setExpandedComments((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const toggleMenu = (commentId) => {
    setOpenMenus((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Truncate text for "Read more"
  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderComments = (list, level = 0) =>
    list.map((comment) => {
      const repliesOpen = openReplies[comment.id] || false;
      const isDeleted = comment.deleted;
      const isExpanded = expandedComments[comment.id] || false;
      const showMenu = openMenus[comment.id] || false;
      const likeData = commentLikes[comment.id] || { count: 0, likedByOwner: false, userLiked: false };
      const displayName = comment.profiles?.username
        ? `@${comment.profiles.username}`
        : comment.profiles?.full_name || "User";
      const shouldTruncate = comment.content && comment.content.length > 150 && !isExpanded;

      return (
        <div
          key={comment.id}
          className={`flex items-start gap-3 mb-4 ${level > 0 ? "ml-8 relative pl-4" : ""}`}
        >
          {/* Connecting line for replies */}
          {level > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border"></div>
          )}

          {/* Avatar with heart indicator */}
          <div className="relative flex-shrink-0">
            <img
              src={comment.profiles?.avatar_url || "/default-avatar.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            {likeData.likedByOwner && (
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <Heart size={14} className="text-destructive fill-destructive" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Username + Time */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground text-md">
                {displayName}
              </span>
              {ownerId && comment.user_id === ownerId && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white text-[10px] font-bold uppercase">
                  <Rabbit size={12} className="fill-current" />
                  <span>Launcher</span>
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {getRelativeTime(comment.created_at)}
              </span>
            </div>

            {/* Comment content with Read more */}
            <div className="text-foreground/90 text-md mb-2 whitespace-pre-line break-words">
              {isDeleted ? (
                <span className="italic text-muted-foreground/60">This comment was deleted.</span>
              ) : (
                <>
                  {shouldTruncate ? truncateText(comment.content) : comment.content}
                  {comment.content && comment.content.length > 150 && (
                    <button
                      onClick={() => toggleCommentExpand(comment.id)}
                      className="text-primary hover:underline ml-1 font-medium"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Actions: Like, Reply, Menu */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Like button - available to everyone */}
              <button
                onClick={() => handleLikeComment(comment.id, comment.user_id)}
                disabled={!user}
                className={`flex items-center gap-1.5 transition-colors ${user
                  ? "hover:text-primary cursor-pointer"
                  : "cursor-not-allowed opacity-50"
                  }`}
                title={user ? "Like comment" : "Sign in to like"}
              >
                <ThumbsUp size={16} className={likeData.userLiked ? "text-primary fill-primary" : ""} />
                {likeData.count > 0 && <span>{likeData.count}</span>}
              </button>

              {/* Reply button */}
              {!isDeleted && user && (
                <button
                  className="hover:text-primary transition-colors"
                  onClick={() => {
                    setReplyTo(comment.id);
                    setOpenReplies((prev) => ({
                      ...prev,
                      [comment.id]: true,
                    }));
                  }}
                >
                  Reply
                </button>
              )}

              {/* Three dots menu */}
              {!isDeleted && user && (
                <div className="relative menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(comment.id);
                    }}
                    className="hover:text-gray-700 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                      {(user.id === comment.user_id || userRole === "admin") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteComment(comment);
                          }}
                          className="w-full text-left px-4 py-2 text-md text-destructive hover:bg-muted rounded-t-lg"
                        >
                          Delete
                        </button>
                      )}
                      {user.id !== comment.user_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportCommentId(comment.id);
                            setIsReportModalOpen(true);
                            setOpenMenus((prev) => ({ ...prev, [comment.id]: false }));
                          }}
                          className={`w-full text-left px-4 py-2 text-md text-yellow-600 hover:bg-gray-50 ${user.id === comment.user_id || userRole === "admin" ? "" : "rounded-t-lg"
                            }`}
                        >
                          Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Hide replies button */}
              {comment.replies && comment.replies.length > 0 && (
                <button
                  className="hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {repliesOpen ? (
                    <>
                      <span>Hide replies</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>View replies ({comment.replies.length})</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Reply box */}
            {replyTo === comment.id && !isDeleted && (
              <div className="flex gap-3 mt-3">
                <img
                  src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    ref={replyTextareaRef}
                    className="w-full resize-none border-b border-border bg-transparent pb-2 text-md focus:outline-none focus:border-primary text-foreground placeholder-muted-foreground"
                    placeholder="Reply..."
                    rows={1}
                    value={replyContent}
                    onChange={(e) => {
                      setReplyContent(e.target.value);
                      autoExpandTextarea(e.target);
                    }}
                    maxLength={500}
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      className="text-md text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent("");
                        if (replyTextareaRef.current) {
                          replyTextareaRef.current.style.height = "auto";
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(comment.id)}
                      className="px-4 py-1.5 bg-primary hover:opacity-90 text-primary-foreground text-md rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                      disabled={isPostingReply}
                    >
                      {isPostingReply ? "Posting…" : "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {repliesOpen && comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {renderComments(comment.replies, level + 1)}
              </div>
            )}
          </div>
        </div>
      );
    });

  const nested = nestComments(comments);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setOpenMenus({});
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div>
      <h3 className="text-[20px] font-semibold mb-6 text-foreground">
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>

      {/* Top comment input */}
      {user && (
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex gap-3">
            <img
              src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newComment}
                maxLength={500}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  autoExpandTextarea(e.target);
                }}
                placeholder="Add a comment..."
                className="w-full resize-none border-b border-border bg-transparent pb-2 text-md focus:outline-none focus:border-primary text-foreground placeholder-muted-foreground overflow-hidden"
                rows={1}
                style={{ maxHeight: "200px" }}
              />
              {newComment.trim() !== "" && (
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    className="text-md text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                    onClick={() => {
                      setNewComment("");
                      if (textareaRef.current) {
                        textareaRef.current.style.height = "auto";
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-primary hover:opacity-90 text-primary-foreground text-md rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                    disabled={isPostingComment}
                  >
                    {isPostingComment ? "Posting…" : "Comment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Comment List */}
      {loading ? (
        <p className="text-muted-foreground">Loading comments…</p>
      ) : nested.length === 0 ? (
        <p className="text-muted-foreground italic">Be the first to comment!</p>
      ) : (
        renderComments(nested)
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportCommentId(null);
        }}
        commentId={reportCommentId}
        projectId={projectId}
      />

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={userProfile}
        action="comment"
      />
    </div>
  );
};

export default Comments;
