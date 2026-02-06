import { Plus, Eye, ArrowRight, Rocket } from 'lucide-react';

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
    handleNext,
    handleSaveDraft,
    isStepValid
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-12">
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                    Upload your media
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Make your product stand out with a logo and optional screenshots.
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                        <Rocket className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Images are Optional</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-border/50 pt-10">
                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-semibold mb-4 flex items-center gap-1">
                        Logo <span className="text-red-500">*</span>
                        {urlPreview && (urlPreview.logo || urlPreview.screenshot) && (
                            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold ml-auto border border-green-100">✓ AI Generated</span>
                        )}
                    </label>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <label className="w-24 h-24 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 hover:border-blue-600/40 transition-all overflow-hidden">
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                {logoFile ? (
                                    <img
                                        src={typeof logoFile === 'string' ? logoFile : URL.createObjectURL(logoFile)}
                                        alt="Logo Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => typeof logoFile === 'string' ? handleImageError(e, 'logo') : null}
                                    />
                                ) : isAILoading ? (
                                    <div className="flex flex-col items-center justify-center text-blue-600 p-2 text-center">
                                        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-1"></div>
                                        <span className="text-[10px] font-bold">AI...</span>
                                    </div>
                                ) : (
                                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                                )}
                            </label>
                            {logoFile && typeof logoFile === 'string' && (
                                <button
                                    type="button"
                                    onClick={() => viewAIImage(logoFile, 'logo')}
                                    className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform z-10"
                                >
                                    <Eye className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 text-[11px] text-muted-foreground space-y-2">
                            <p className="font-medium">Recommended: 240x240px | JPG, PNG, GIF. Max 2MB</p>
                            {logoFile && (
                                <button type="button" onClick={removeLogo} className="text-red-500 hover:text-red-600 font-bold uppercase tracking-tight">
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                    <label className="block text-sm font-semibold mb-4 flex items-center gap-1">
                        Thumbnail (Dashboard) <span className="text-red-500">*</span>
                        {urlPreview && (urlPreview.logo || urlPreview.screenshot) && (
                            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold ml-auto border border-green-100">✓ AI Generated</span>
                        )}
                    </label>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <label className="w-32 h-20 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 hover:border-blue-600/40 transition-all overflow-hidden">
                                <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                                {thumbnailFile ? (
                                    <img
                                        src={typeof thumbnailFile === 'string' ? thumbnailFile : URL.createObjectURL(thumbnailFile)}
                                        alt="Thumbnail Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => typeof thumbnailFile === 'string' ? handleImageError(e, 'thumbnail') : null}
                                    />
                                ) : isAILoading ? (
                                    <div className="flex flex-col items-center justify-center text-blue-600 p-2 text-center">
                                        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-1"></div>
                                        <span className="text-[10px] font-bold">AI...</span>
                                    </div>
                                ) : (
                                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                                )}
                            </label>
                            {thumbnailFile && typeof thumbnailFile === 'string' && (
                                <button
                                    type="button"
                                    onClick={() => viewAIImage(thumbnailFile, 'thumbnail')}
                                    className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform z-10"
                                >
                                    <Eye className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 text-[11px] text-muted-foreground space-y-2">
                            <p className="font-medium">600x400px recommended. This shows in search and listings.</p>
                            {thumbnailFile && (
                                <button type="button" onClick={removeThumbnail} className="text-red-500 hover:text-red-600 font-bold uppercase tracking-tight">
                                    Remove Thumbnail
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cover Images */}
            <div className="pt-10 border-t border-border/50">
                <div className="flex items-center justify-between mb-6">
                    <label className="block text-sm font-semibold flex items-center gap-1">
                        Cover image(s)
                        <span className="text-[10px] text-muted-foreground/40 font-medium ml-2 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground/40 font-medium font-bold uppercase tracking-widest">Up to 4</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {coverFiles.map((file, idx) => (
                        <div key={idx} className="relative group animate-in zoom-in-50 duration-300">
                            <label className="w-full h-28 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 hover:border-blue-600/40 transition-all overflow-hidden relative">
                                <input type="file" accept="image/*" onChange={e => handleCoverChange(e, idx)} className="hidden" />
                                {file ? (
                                    <img src={typeof file === 'string' ? file : URL.createObjectURL(file)} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                                )}
                                {file && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
                                    </div>
                                )}
                            </label>
                            {file && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); removeCover(idx); }}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all z-10"
                                >
                                    <Plus className="w-3 h-3 rotate-45" strokeWidth={4} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-muted-foreground/60 font-medium">
                    Show off your product features. Recommended: 1200x600px. Max 2MB each.
                </p>
            </div>
        </div>
    );
};

export default MediaStep;
