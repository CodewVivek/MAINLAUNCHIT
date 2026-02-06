import { applyAIData } from './aiDataApplication';

export const handleSmartFillAll = ({
    pendingAIData,
    setFormData,
    setLinks,
    links,
    setLogoFile,
    logoFile,
    setThumbnailFile,
    thumbnailFile,
    setTags,
    tags,
    setSelectedCategory,
    selectedCategory,
    dynamicCategoryOptions,
    setDynamicCategoryOptions,
    setShowSmartFillDialog,
    setPendingAIData,
    setSnackbar,
}) => {
    applyAIData({
        gptData: pendingAIData,
        onlyEmptyFields: false,
        setFormData,
        setLinks,
        links,
        setLogoFile,
        logoFile,
        setThumbnailFile,
        thumbnailFile,
        setTags,
        tags,
        setSelectedCategory,
        selectedCategory,
        dynamicCategoryOptions,
        setDynamicCategoryOptions,
    });
    setShowSmartFillDialog(false);
    setPendingAIData(null);
    setSnackbar({ open: true, message: "🤖 All fields updated with AI data!", severity: 'success' });
};

export const handleSmartFillEmpty = ({
    pendingAIData,
    setFormData,
    setLinks,
    links,
    setLogoFile,
    logoFile,
    setThumbnailFile,
    thumbnailFile,
    setTags,
    tags,
    setSelectedCategory,
    selectedCategory,
    dynamicCategoryOptions,
    setDynamicCategoryOptions,
    setShowSmartFillDialog,
    setPendingAIData,
    setSnackbar,
}) => {
    applyAIData({
        gptData: pendingAIData,
        onlyEmptyFields: true,
        setFormData,
        setLinks,
        links,
        setLogoFile,
        logoFile,
        setThumbnailFile,
        thumbnailFile,
        setTags,
        tags,
        setSelectedCategory,
        selectedCategory,
        dynamicCategoryOptions,
        setDynamicCategoryOptions,
    });
    setShowSmartFillDialog(false);
    setPendingAIData(null);
    setSnackbar({ open: true, message: "🤖 Empty fields filled with AI data!", severity: 'success' });
};

export const handleSmartFillCancel = (setShowSmartFillDialog, setPendingAIData) => {
    setShowSmartFillDialog(false);
    setPendingAIData(null);
};

