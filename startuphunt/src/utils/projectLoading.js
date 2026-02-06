import categoryOptions from '@/components/categoryOptions';

export const loadProjectForEditing = async ({
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
}) => {
    if (projectId && user) {
        setLoadingProject(true);
        setIsEditing(true);
        setEditingProjectId(projectId);

        try {
            const { data: project, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                setSnackbar({ open: true, message: 'Project not found or access denied.', severity: 'error' });
                return;
            }

            if (project) {
                setEditingLaunched(project.status !== 'draft');
                setFormData({
                    name: project.name || '',
                    websiteUrl: project.website_url || '',
                    description: project.description || '',
                    tagline: project.tagline || '',
                });
                if (project.category_type) {
                    const categoryOption = categoryOptions.flatMap(group => group.options).find(option => option.value === project.category_type);
                    setSelectedCategory(categoryOption || null);
                }
                // Ensure links is always an array of strings
                if (project.links && Array.isArray(project.links) && project.links.length > 0) {
                    const safeLinks = project.links.filter(link => link && typeof link === 'string' && link.trim());
                    setLinks(safeLinks.length > 0 ? safeLinks : ['']);
                } else {
                    setLinks(['']);
                }
                setBuiltWith(project.built_with?.map(tech => ({ value: tech, label: tech })) || []);
                // Ensure tags is always an array of strings
                const safeTags = Array.isArray(project.tags)
                    ? project.tags.filter(tag => tag && typeof tag === 'string' && tag.trim())
                    : [];
                setTags(safeTags);
                setExistingMediaUrls(project.media_urls || []);
                setExistingLogoUrl(project.logo_url || '');
                setLogoFile(project.logo_url || null);
                setThumbnailFile(project.thumbnail_url || null);
                // Ensure cover files array is always padded to 4 elements
                const coverUrls = Array.isArray(project.cover_urls) ? project.cover_urls : [];
                // Pad to exactly 4 elements with nulls if needed
                const paddedCoverFiles = [...coverUrls];
                while (paddedCoverFiles.length < 4) {
                    paddedCoverFiles.push(null);
                }
                setCoverFiles(paddedCoverFiles.slice(0, 4)); // Ensure exactly 4 elements

                // Set auto-save draft ID if it's a draft
                if (project.status === 'draft') {
                    setAutoSaveDraftId(project.id);
                    setHasUnsavedChanges(false); // No unsaved changes when loading existing draft
                }
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to load project for editing.', severity: 'error' });
        } finally {
            setLoadingProject(false);
            setProjectLoaded(true);
        }
    }
};

