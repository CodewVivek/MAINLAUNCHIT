export const handleContinueDraft = (draftId, navigate, setShowDraftSelection) => {
    navigate(`/submit?draft=${draftId}`);
    setShowDraftSelection(false);
};

export const handleStartNew = ({
    setFormData,
    setSelectedCategory,
    setLinks,
    setTags,
    setBuiltWith,
    setLogoFile,
    setThumbnailFile,
    setCoverFiles,
    setUrlPreview,
    setAutoSaveDraftId,
    setHasUnsavedChanges,
    setLastSavedAt,
    setShowDraftSelection,
}) => {
    // Clear form state
    setFormData({
        name: '',
        websiteUrl: '',
        description: '',
        tagline: '',
        categoryOptions: '',
    });
    setSelectedCategory(null);
    setLinks(['']);
    setTags([]);
    setBuiltWith([]);
    setLogoFile(null);
    setThumbnailFile(null);
    setCoverFiles([null, null, null, null]);
    setUrlPreview(null);
    setAutoSaveDraftId(null);
    setHasUnsavedChanges(false);
    setLastSavedAt?.(null);
    setShowDraftSelection(false);
};

