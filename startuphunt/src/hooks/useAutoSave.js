import { useEffect } from 'react';
import { handleAutoSaveDraft } from '../utils/draftManagement';
import { isFormEmpty } from '../utils/formValidation';

export const useAutoSave = ({
    user,
    isEditing,
    formData,
    selectedCategory,
    isAutoSaving,
    autoSaveDraftId,
    editingProjectId,
    links,
    builtWith,
    tags,
    existingMediaUrls,
    logoFile,
    thumbnailFile,
    coverFiles,
    projectLoaded,
    hasUnsavedChanges,
    supabase,
    setAutoSaveDraftId,
    setIsAutoSaving,
    setHasUnsavedChanges,
    setLastSavedAt,
}) => {
    useEffect(() => {
        if (!user || isEditing || isFormEmpty(formData, selectedCategory) || !formData.name || isAutoSaving) {
            return;
        }
        if (projectLoaded && !hasUnsavedChanges) {
            return;
        }
        const autoSaveTimer = setTimeout(async () => {
            await handleAutoSaveDraft({
                user,
                isEditing,
                isFormEmpty: () => isFormEmpty(formData, selectedCategory),
                formData,
                isAutoSaving,
                autoSaveDraftId,
                editingProjectId,
                selectedCategory,
                links,
                builtWith,
                tags,
                existingMediaUrls,
                logoFile,
                thumbnailFile,
                coverFiles,
                supabase,
                setAutoSaveDraftId,
                setIsAutoSaving,
                setHasUnsavedChanges,
                setLastSavedAt,
            });
        }, 3000);
        return () => clearTimeout(autoSaveTimer);
    }, [formData, selectedCategory, links, tags, builtWith, user, isEditing, hasUnsavedChanges]);
};

