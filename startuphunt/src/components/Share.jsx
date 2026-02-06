import React, { useState, useEffect } from "react";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  TwitterIcon,
  TwitterShareButton,
} from "react-share";
import { Copy, Check, Share2, X, ExternalLink } from "lucide-react";
import { trackShare } from "../utils/analytics";
import { addUtmParams } from "../utils/registerUtils";

const Share = ({ projectSlug, projectName = "this project", isProfile = false, imageUrl }) => {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Force base URL to Launchit.site (Capital L)
  const baseUrl = 'https://Launchit.site';
  // Use profile URL if it's a profile, otherwise use project URL
  const baseShareUrl = isProfile ? `${baseUrl}/profile/${projectSlug}` : `${baseUrl}/launches/${projectSlug}`;
  const title = isProfile ? `Check out ${projectName} on launchit!` : `Check out ${projectName} on launchit!`;

  // Create a function to get share URL with UTM params
  const getShareUrl = (platform) => {
    const campaign = isProfile ? 'profile_share' : 'project_share';
    return addUtmParams(baseShareUrl, platform, 'social_share', campaign);
  };



  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleCopyLink = async () => {
    try {
      const urlWithUtm = addUtmParams(baseShareUrl, 'copy', 'social_share', isProfile ? 'profile_share' : 'project_share');
      await navigator.clipboard.writeText(urlWithUtm);
      setCopied(true);
      trackShare('copy', projectSlug);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {

    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium hover:scale-105 active:scale-95 shadow-md"
        aria-label="Share project"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-8 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={projectName}
                    className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-100"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{projectName}</h2>
                  <p className="text-md text-gray-500">Share this project</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Copy Link */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">
                Project Link
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                {/* Input */}
                <input
                  type="text"
                  value={baseShareUrl}
                  readOnly
                  className="w-full text-md bg-transparent border-none outline-none text-gray-700"
                />

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center justify-center gap-1 px-3 py-1 rounded-md text-md font-medium transition-all duration-200 flex-shrink-0 ${copied
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200"
                      }`}
                    title={copied ? "Link copied!" : "Copy link"}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>

                  <a
                    href={addUtmParams(baseShareUrl, 'direct', 'social_share', isProfile ? 'profile_share' : 'project_share')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-3 py-1 rounded-md text-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-all duration-200 flex-shrink-0"
                    title="Open project link"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                </div>
              </div>
            </div>


            {/* Social Media Buttons */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-3">
                Share via
              </label>
              <div className="grid grid-cols-5 gap-4 text-center">
                <TwitterShareButton
                  url={getShareUrl('twitter')}
                  title={title}
                  className="hover:scale-105 transition-transform"
                  onShareWindowClose={() => trackShare('twitter', projectSlug)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <TwitterIcon size={32} round className="shadow" />
                    <span className="text-sm text-gray-500">X</span>
                  </div>
                </TwitterShareButton>
                <FacebookShareButton
                  url={getShareUrl('facebook')}
                  quote={title}
                  className="hover:scale-105 transition-transform"
                  onShareWindowClose={() => trackShare('facebook', projectSlug)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <FacebookIcon size={32} round className="shadow" />
                    <span className="text-sm text-gray-500">Facebook</span>
                  </div>
                </FacebookShareButton>
                <LinkedinShareButton
                  url={getShareUrl('linkedin')}
                  title={title}
                  className="hover:scale-105 transition-transform"
                  onShareWindowClose={() => trackShare('linkedin', projectSlug)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <LinkedinIcon size={32} round className="shadow" />
                    <span className="text-sm text-gray-500">LinkedIn</span>
                  </div>
                </LinkedinShareButton>
                <WhatsappShareButton
                  url={getShareUrl('whatsapp')}
                  title={title}
                  className="hover:scale-105 transition-transform"
                  onShareWindowClose={() => trackShare('whatsapp', projectSlug)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <WhatsappIcon size={32} round className="shadow" />
                    <span className="text-sm text-gray-500">WhatsApp</span>
                  </div>
                </WhatsappShareButton>
                <EmailShareButton
                  url={getShareUrl('email')}
                  subject={title}
                  className="hover:scale-105 transition-transform"
                  onShareWindowClose={() => trackShare('email', projectSlug)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <EmailIcon size={32} round className="shadow" />
                    <span className="text-sm text-gray-500">Email</span>
                  </div>
                </EmailShareButton>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-md text-gray-400">
              💡 Help spread the word by sharing this project!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Share;
