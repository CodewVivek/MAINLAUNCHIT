import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Flag, AlertTriangle, X, CheckCircle, AlertCircle } from "lucide-react";

const ReportModal = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  commentId,
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const reportReasons = [
    { value: "spam", label: "Spam or misleading content" },
    { value: "inappropriate", label: "Inappropriate or offensive content" },
    { value: "fake", label: "Fake project or scam" },
    { value: "copyright", label: "Copyright infringement" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !user) return;

    // Validate that description is provided when "other" is selected
    if (reason === "other" && !description.trim()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    setSubmitting(true);

    // Prepare report object
    const reportData = {
      project_id: projectId,
      user_id: user.id,
      reason: reason,
      description: description.trim() || null,
      status: "pending",
    };
    if (commentId) {
      reportData.comment_id = commentId;
    }

    const { error } = await supabase.from("reports").insert(reportData);

    setSubmitting(false);

    if (error) {
      
      alert("Failed to submit report. Please try again.");
    } else {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setReason("");
        setDescription("");
      }, 3000);
    }
  };

  const handleClose = () => {
    onClose();
    setReason("");
    setDescription("");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const isDescriptionRequired = reason === "other";

  if (!isOpen) return null;

  return (
    <>
      {/* MUI-style Alert at top left */}
      {showAlert && (
        <div className="fixed top-4 left-4 z-[60] max-w-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-md font-medium text-red-800">
                  Description Required
                </h4>
                <p className="text-md text-red-700 mt-1">
                  Please provide a description when selecting "Other" as the
                  reason.
                </p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl p-5 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Flag className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {commentId ? "Report Comment" : "Report Project"}
                </h3>
                <p className="text-sm text-gray-600">
                  Help us keep the community safe
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Success Alert */}
          {showSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-md font-medium text-green-800">
                    Report submitted successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Thank you for helping keep our community safe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Report Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-md font-medium text-gray-700 mb-2">
                Reason for report *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select a reason</option>
                {reportReasons.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-md font-medium text-gray-700 mb-2">
                Additional details{" "}
                {isDescriptionRequired && (
                  <span className="text-red-500">*</span>
                )}
                {isDescriptionRequired && (
                  <span className="text-sm text-gray-500 ml-1">
                    (Required for "Other")
                  </span>
                )}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isDescriptionRequired
                    ? "Please provide details about the issue..."
                    : "Please provide more details about the issue..."
                }
                className={`w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${
                  isDescriptionRequired
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-200 focus:ring-red-500"
                }`}
                rows="2"
                maxLength="200"
                required={isDescriptionRequired}
              />
              <div className="flex justify-between items-center mt-1">
                <span
                  className={`text-sm ${isDescriptionRequired ? "text-red-500" : "text-gray-500"}`}
                >
                  {description.length}/200 characters
                </span>
                {isDescriptionRequired && (
                  <span className="text-sm text-red-500">
                    {description.length === 0 ? "Required" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Important
                </span>
              </div>
              <p className="text-sm text-amber-700">
                False reports may result in account suspension. Please only
                report projects that violate our community guidelines.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !reason ||
                  submitting ||
                  (isDescriptionRequired && !description.trim())
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReportModal;
