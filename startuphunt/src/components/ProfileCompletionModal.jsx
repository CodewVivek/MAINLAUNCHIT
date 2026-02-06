import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Settings } from "lucide-react";
import { checkProfileCompletion } from "../utils/profileCompletion";

const ProfileCompletionModal = ({
    isOpen,
    onClose,
    profile,
    action = "launch",
    formData = null,
    selectedCategory = null,
    links = [],
    builtWith = [],
    tags = [],
    existingMediaUrls = [],
    logoFile = null,
    thumbnailFile = null,
    coverFiles = [],
    autoSaveDraftId = null,
    editingProjectId = null,
    isEditing = false,
    editingLaunched = false,
    user = null,
    supabase = null,
    setAutoSaveDraftId = null,
    setHasUnsavedChanges = null,
    isFormEmpty = null,
    setSnackbar = null,
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(typeof document !== "undefined" && !!document.body), []);

    if (!isOpen || !mounted) return null;

    let completion;
    try {
        completion = checkProfileCompletion(profile);
    } catch {
        completion = {
            isComplete: false,
            missing: ["Name", "At least one social link (X/Twitter, LinkedIn, Portfolio, or YouTube)", "Location"],
            completionPercentage: 0
        };
    }
    const missing = Array.isArray(completion.missing) ? completion.missing : [];
    const displayPercentage = completion.isComplete ? 100 : (typeof completion.completionPercentage === 'number' ? completion.completionPercentage : 0);
    const missingFields = missing.length > 0 ? missing : ["Name", "At least one social link (X/Twitter, LinkedIn, Portfolio, or YouTube)", "Location"];
    const actionText = action === "launch"
        ? "launch a project"
        : action === "comment"
            ? "comment"
            : "upvote projects";

    const handleContinueToProfile = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onClose();
        setTimeout(() => {
            window.location.href = "/settings";
        }, 100);
    };

    const modalContent = (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Complete Your Profile
                        </h3>
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-600 mb-4">
                    To {actionText}, please complete your profile first. This helps us tag you when we promote your launch and show where you&apos;re based. 🚀
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Missing required fields:</p>
                    <ul className="text-sm text-gray-700 space-y-2 list-none pl-0">
                        {missingFields.map((field, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>
                                    {field === "At least one social link (X/Twitter, LinkedIn, Portfolio, or YouTube)"
                                        ? (
                                            <>
                                                <span className="font-medium">At least one social link</span>
                                                <span className="block text-gray-500 text-xs mt-0.5">X/Twitter, LinkedIn, Portfolio, or YouTube</span>
                                            </>
                                        )
                                        : field}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Profile completion</span>
                            <span className="text-sm font-medium text-gray-700">{displayPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${displayPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
                        className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-md transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleContinueToProfile}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-md transition-all flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Continue to Profile
                    </button>
                </div>
            </div>
        </div>
    );

    const target = typeof document !== 'undefined' && document.body ? document.body : null;
    if (!target) return null;
    return createPortal(modalContent, target);
};

export default ProfileCompletionModal;
