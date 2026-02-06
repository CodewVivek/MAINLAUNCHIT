import React from 'react';
import { Plus, Eye } from 'lucide-react';

const MediaStep = ({
    logoFile,
    handleLogoChange,
    removeLogo,
    handleImageError,
    viewAIImage,
    isAILoading,
    urlPreview,
    thumbnailFile,
    handleThumbnailChange,
    removeThumbnail,
    coverFiles,
    handleCoverChange,
    removeCover,
}) => {
    return (
        <div className="form-tab-panel active">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Media</h3>
                    <div className="text-md text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                        💡 <strong>AI Tip:</strong> Use the "Auto-generate from URL" button in Step 1 to automatically generate logo and thumbnail!
                    </div>
                </div>
                <div className="space-y-4">
                    {/* Logo Upload */}
                    <div>
                        <label className="form-label">
                            Logo
                            {(!urlPreview || (!urlPreview.logo && !urlPreview.screenshot)) && (
                                <span className="text-red-500">*</span>
                            )}
                            {urlPreview && (urlPreview.logo || urlPreview.screenshot) && (
                                <span className="text-green-500 text-sm ml-2">✓ AI Generated</span>
                            )}
                        </label>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="relative">
                                <label className="w-24 h-24 flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                    {logoFile ? (
                                        <img
                                            src={typeof logoFile === 'string' ? logoFile : URL.createObjectURL(logoFile)}
                                            alt="Logo Preview"
                                            className="w-full h-full object-cover rounded-2xl"
                                            onError={(e) => typeof logoFile === 'string' ? handleImageError(e, 'logo') : null}
                                        />
                                    ) : isAILoading ? (
                                        <div className="flex flex-col items-center justify-center text-blue-600">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                            <span className="text-sm">AI generating...</span>
                                        </div>
                                    ) : (
                                        <Plus className="w-6 h-6 text-gray-400" />
                                    )}
                                </label>
                                {logoFile && typeof logoFile === 'string' && (
                                    <button
                                        type="button"
                                        onClick={() => viewAIImage(logoFile, 'logo')}
                                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow hover:bg-blue-600 transition-colors"
                                        title="View AI-generated logo"
                                    >
                                        <Eye className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div className="text-md text-gray-500">
                                Recommended: 240x240px | JPG, PNG, GIF. Max 2MB
                                {(!urlPreview || (!urlPreview.logo && !urlPreview.screenshot)) && (
                                    <div className="text-red-600 font-medium">Required if AI generation fails</div>
                                )}
                                {logoFile && (
                                    <div className="mt-2 space-y-1">
                                        <button type="button" onClick={removeLogo} className="block text-red-600 hover:text-red-800">Remove</button>
                                        {typeof logoFile === 'string' && (
                                            <div className="text-sm text-blue-600">🤖 AI-generated logo</div>
                                        )}
                                    </div>
                                )}
                                {isAILoading && !logoFile && (
                                    <div className="mt-2 text-sm text-blue-600">🔄 AI is generating logo...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                        <label className="form-label">
                            Thumbnail (Dashboard)
                            {(!urlPreview || (!urlPreview.logo && !urlPreview.screenshot)) && (
                                <span className="text-red-500">*</span>
                            )}
                            {urlPreview && (urlPreview.logo || urlPreview.screenshot) && (
                                <span className="text-green-500 text-sm ml-2">✓ AI Generated</span>
                            )}
                        </label>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="relative">
                                <label className="w-40 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                    <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                                    {thumbnailFile ? (
                                        <img
                                            src={typeof thumbnailFile === 'string' ? thumbnailFile : URL.createObjectURL(thumbnailFile)}
                                            alt="Thumbnail Preview"
                                            className="w-full h-full object-cover rounded-lg"
                                            onError={(e) => typeof thumbnailFile === 'string' ? handleImageError(e, 'thumbnail') : null}
                                        />
                                    ) : isAILoading ? (
                                        <div className="flex flex-col items-center justify-center text-blue-600">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                            <span className="text-sm">AI generating...</span>
                                        </div>
                                    ) : (
                                        <Plus className="w-6 h-6 text-gray-400" />
                                    )}
                                </label>
                                {thumbnailFile && typeof thumbnailFile === 'string' && (
                                    <button
                                        type="button"
                                        onClick={() => viewAIImage(thumbnailFile, 'thumbnail')}
                                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow hover:bg-blue-600 transition-colors"
                                        title="View AI-generated thumbnail"
                                    >
                                        <Eye className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div className="text-md text-gray-500">
                                Recommended: 500x500px or 600x400px. Max 2MB.<br />This will be shown in the dashboard.
                                {thumbnailFile && (
                                    <div className="mt-2 space-y-1">
                                        <button type="button" onClick={removeThumbnail} className="block text-red-600 hover:text-red-800">Remove</button>
                                        {typeof thumbnailFile === 'string' && (
                                            <div className="text-sm text-blue-600">🤖 AI-generated screenshot</div>
                                        )}
                                    </div>
                                )}
                                {isAILoading && !thumbnailFile && (
                                    <div className="mt-2 text-sm text-blue-600">🔄 AI is generating thumbnail...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cover Images */}
                    <div>
                        <label className="form-label">
                            Cover image(s) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {coverFiles.map((file, idx) => (
                                <div key={idx} className="relative">
                                    <label className="w-32 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                        <input type="file" accept="image/*" onChange={e => handleCoverChange(e, idx)} className="hidden" />
                                        {file ? (
                                            <img src={typeof file === 'string' ? file : URL.createObjectURL(file)} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <Plus className="w-6 h-6 text-gray-400" />
                                        )}
                                    </label>
                                    {file && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); removeCover(idx); }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                                        >
                                            <Plus className="w-3 h-3 rotate-45" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-md text-gray-500 mt-2">
                            Upload at least 2 cover images. Recommended: 1200x600px. Max 2MB each.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaStep;

