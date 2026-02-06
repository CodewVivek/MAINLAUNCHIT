import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const EmbedBadge = ({ isOpen, onClose, projectSlug, projectName = 'this project' }) => {
    const [badgeType, setBadgeType] = useState('featured'); // 'featured' | 'minimal'
    const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
    const [copied, setCopied] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setBadgeType('featured');
            setTheme('dark');
            setCopied(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filename = `${badgeType}-${theme}-v2.svg`;
    // Use relative path for preview - this is the most reliable way in Vite/React apps
    const previewUrl = `/badges/${filename}`;
    const badgeUrl = `https://launchit.site/badges/${filename}`;
    const projectUrl = `https://launchit.site/launches/${projectSlug}`;

    // Get dimensions based on badge type
    const width = badgeType === 'featured' ? '250' : '180';
    const height = '54';

    // Generate embed code
    const getEmbedCode = () => {
        // Badge embed - nofollow to prevent backlinks until enabled
        return `<a href="${projectUrl}" target="_blank" rel="noopener nofollow">
    <img src="${badgeUrl}" alt="${projectName} - Featured on LaunchIt" width="${width}" height="${height}" />
</a>`;
    };

    const embedCode = getEmbedCode();

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        toast.success("Embed code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>

                {/* Sidebar: Selection & Preview */}
                <div className="w-full md:w-72 bg-gray-50 border-r border-gray-100 p-5 flex flex-col gap-6 flex-shrink-0">
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Badge Style</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setBadgeType('featured')}
                                className={`w-full text-left px-4 py-3 rounded-lg text-md font-medium transition-all ${badgeType === 'featured'
                                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                Featured on LaunchIt
                            </button>
                            <button
                                onClick={() => setBadgeType('minimal')}
                                className={`w-full text-left px-4 py-3 rounded-lg text-md font-medium transition-all ${badgeType === 'minimal'
                                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                Minimal (Logo + Name)
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Theme</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-4 py-2 rounded-lg text-md font-medium transition-all border ${theme === 'dark'
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                                    }`}
                            >
                                Dark
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-4 py-2 rounded-lg text-md font-medium transition-all border ${theme === 'light'
                                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                Light
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Preview</h3>
                        <div className="flex items-center justify-center">
                            <img
                                src={previewUrl}
                                alt="Badge Preview"
                                className="shadow-lg rounded-xl transition-all duration-300 max-w-full"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<span class="text-gray-400 text-md">Preview not available</span>';
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content: Code */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900">Embed Badge</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-center">
                        {/* Code */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-md font-semibold text-gray-700">Copy Code</label>
                                <button
                                    onClick={handleCopy}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy to clipboard'}
                                </button>
                            </div>
                            <div className="relative group" onClick={handleCopy}>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-md font-mono border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors whitespace-pre-wrap break-all">
                                    {embedCode}
                                </pre>
                            </div>
                            <p className="text-sm text-gray-500">
                                Paste this code into your website's footer or sidebar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmbedBadge;
