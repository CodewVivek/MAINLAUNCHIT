import { useState, useEffect } from 'react';
import { loadProjectForEditing } from '../utils/projectLoading';
import { supabase } from '../supabaseClient';

export const useProjectLoader = (user, searchParams, projectLoaded, setProjectLoaded) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [loadingProject, setLoadingProject] = useState(false);
    const [editingLaunched, setEditingLaunched] = useState(false);
    const [existingMediaUrls, setExistingMediaUrls] = useState([]);
    const [existingLogoUrl, setExistingLogoUrl] = useState('');

    return {
        isEditing,
        setIsEditing,
        editingProjectId,
        setEditingProjectId,
        loadingProject,
        setLoadingProject,
        editingLaunched,
        existingMediaUrls,
        setExistingMediaUrls,
        existingLogoUrl,
        setExistingLogoUrl,
        loadProject: (setFormData, setSelectedCategory, setLinks, setBuiltWith, setTags, setLogoFile, setThumbnailFile, setCoverFiles, setAutoSaveDraftId, setHasUnsavedChanges, setSnackbar) => {
            const editId = searchParams.get('edit');
            const draftId = searchParams.get('draft');
            const projectId = editId || draftId;
            if (user && !projectLoaded && projectId) {
                loadProjectForEditing({
                    projectId,
                    user,
                    supabase,
                    setLoadingProject,
                    setIsEditing,
                    setEditingProjectId,
                    setEditingLaunched,
                    setFormData,
                    setSelectedCategory,
                    setLinks,
                    setBuiltWith,
                    setTags,
                    setExistingMediaUrls,
                    setExistingLogoUrl,
                    setLogoFile,
                    setThumbnailFile,
                    setCoverFiles,
                    setAutoSaveDraftId,
                    setHasUnsavedChanges,
                    setProjectLoaded,
                    setSnackbar,
                });
            }
        },
    };
};

