import { generateUniqueSlug, slugify, sanitizeFileName } from './registerUtils';
import { preserveImageQuality } from './imageHandling';
import { trackError, addBreadcrumb } from './errorTracking';
import { trackSubmission } from './analytics';
import { normalizeUrl } from './urlUtils';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

export const handleFormSubmission = async ({
    formData,
    selectedCategory,
    links,
    builtWith,
    tags,
    logoFile,
    thumbnailFile,
    coverFiles,
    existingMediaUrls,
    existingLogoUrl,
    isEditing,
    editingProjectId,
    user,
    supabase,
    setSnackbar,
    navigate,
    setFormData,
    setSelectedCategory,
    setLinks,
    setTags,
    setLogoFile,
    setThumbnailFile,
    setCoverFiles,
    setEditingProjectId,
    setUrlPreview,
    setPendingAIData,
    setShowSmartFillDialog,
    setRetryCount,
    setIsAILoading,
    setIsRetrying,
    setIsGeneratingPreview,
    selectedPlan,
}) => {
    // Safety checks for arrays
    const safeLinks = Array.isArray(links) ? links : [];
    const safeBuiltWith = Array.isArray(builtWith) ? builtWith : [];
    const safeTags = Array.isArray(tags) ? tags : [];

    const submissionData = {
        name: formData.name,
        website_url: formData.websiteUrl,
        tagline: formData.tagline,
        description: formData.description,
        category_type: selectedCategory?.value,
        links: safeLinks.filter(link => link && typeof link === 'string' && link.trim() !== ''),
        built_with: safeBuiltWith
            .filter(item => item && typeof item === 'object' && item.value)
            .map(item => item.value),
        tags: safeTags.filter(tag => tag && typeof tag === 'string'),
        media_urls: [], // Required NOT NULL field - empty array for now
        user_id: user.id,
        updated_at: new Date().toISOString(),
        status: selectedPlan === 'standard' ? 'launched' : 'draft',
        // Security: paid tiers are set ONLY by webhook after payment. Never trust client (Inspect tampering).
        is_sponsored: false,
        sponsored_tier: null,
    };

    // We will set/reset created_at later based on whether it's a new launch or a draft-to-launch transition

    // Only generate new slug for new projects, not when editing
    if (!isEditing) {
        try {
            // ANTI-SPAM: Check Daily Launch Limit (1 per 24h)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count, error: limitError } = await supabase
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'launched')
                .gte('created_at', twentyFourHoursAgo);

            if (limitError) {
                // fail open on limit check error
            } else if (count >= 1) {
                toast.error("🚀 You've reached your daily launch limit (1/1). Please wait 24h or save as draft!", {
                    duration: 6000,
                    icon: '🛑'
                });
                throw new Error('launch_limit_reached');
            }

            submissionData.slug = await generateUniqueSlug(formData.name, supabase);
        } catch (error) {
            if (error.message === 'launch_limit_reached') throw error;
            // Fallback for slug generation
            const baseSlug = slugify(formData.name);
            submissionData.slug = `${baseSlug}-${Date.now()}`;
        }
    }

    try {
        let fileUrls = [...existingMediaUrls];
        let logoUrl = existingLogoUrl;
        let thumbnailUrl = typeof thumbnailFile === 'string' ? thumbnailFile : '';
        let coverUrls = [];

        // Validate required fields before submission
        if (!formData.name || !formData.websiteUrl || !formData.description || !formData.tagline) {
            throw new Error('Missing required fields: name, website URL, description, or tagline');
        }

        if (!selectedCategory) {
            throw new Error('Please select a category for your startup');
        }

        // SPECIAL CASE: Relaunch Request
        if (formData.isRelaunch && formData.relaunchProjectId) {
            const { error: relaunchError } = await supabase
                .from('moderation')
                .insert([{
                    project_id: formData.relaunchProjectId,
                    user_id: user.id,
                    content_type: 'relaunch_request',
                    content: `Relaunch Request (${formData.relaunchType || 'minor'}): ${formData.relaunchUpdateNotes || 'No notes provided'}`,
                    status: 'pending_review',
                    moderation_result: {
                        relaunch_type: formData.relaunchType,
                        update_notes: formData.relaunchUpdateNotes,
                        current_data: submissionData
                    },
                    created_at: new Date().toISOString()
                }]);

            if (relaunchError) throw relaunchError;

            toast.success('🚀 Relaunch request submitted for admin approval!');

            // Track successful relaunch submission
            if (typeof trackSubmission === 'function') {
                trackSubmission('relaunch_submitted');
            }

            setTimeout(() => {
                navigate(`/launches/${formData.relaunchProjectId}?relaunch_pending=true`);
            }, 1000);

            // Complete form reset
            if (setFormData) setFormData({ name: '', websiteUrl: '', description: '', tagline: '' });
            if (setSelectedCategory) setSelectedCategory(null);
            if (setLinks) setLinks(['']);
            if (setTags) setTags([]);
            if (setLogoFile) setLogoFile(null);
            if (setThumbnailFile) setThumbnailFile(null);
            if (setCoverFiles) setCoverFiles([null, null, null, null]);
            if (setEditingProjectId) setEditingProjectId(null);
            return; // Exit early form submission logic
        }

        // Check for duplicate URL (only for new projects or if URL changed)
        const normalizedUrl = normalizeUrl(formData.websiteUrl);

        const { data: existingProject, error: duplicateError } = await supabase
            .from('projects')
            .select('id, name, slug, website_url, status')
            .eq('website_url', formData.websiteUrl)
            .eq('status', 'launched') // ONLY block if there is ALREADY a LAUNCHED project with this URL
            .maybeSingle();

        if (existingProject && (!isEditing || existingProject.id !== editingProjectId)) {
            // Show toast with existing project info
            toast.error("⚠️ This website is already on Launchit!", {
                duration: 6000,
            });

            setSnackbar({
                open: true,
                message: `"${existingProject.name}" is already using this URL. Each website can only be launched once.`,
                severity: 'error'
            });

            throw new Error('duplicate_url');
        }

        // Check deletion cooldown (only for new projects or if URL changed)
        const { data: deletedProject, error: cooldownError } = await supabase
            .from('deleted_projects')
            .select('can_relaunch_at, website_url')
            .eq('website_url', formData.websiteUrl)
            .gt('can_relaunch_at', new Date().toISOString())
            .maybeSingle();

        if (deletedProject) {
            const daysRemaining = Math.ceil(
                (new Date(deletedProject.can_relaunch_at) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const relaunchDate = new Date(deletedProject.can_relaunch_at).toLocaleDateString();

            toast.error(`🕐 This URL is in cooldown period`, {
                duration: 6000,
            });

            setSnackbar({
                open: true,
                message: `This website was recently deleted. You can re-launch it after ${relaunchDate} (${daysRemaining} days remaining).`,
                severity: 'warning'
            });

            throw new Error('cooldown_active');
        }

        if (logoFile && typeof logoFile !== 'string') {
            // User uploaded file - preserve quality and upload
            try {
                const qualityFile = await preserveImageQuality(logoFile);

                // Verify quality was maintained
                if (qualityFile.size < logoFile.size * 0.8) {
                    throw new Error('Quality preservation resulted in significant size reduction');
                }

                const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, qualityFile);
                if (logoErrorUpload) {
                    throw new Error(`Logo upload failed: ${logoErrorUpload.message}`);
                }
                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            } catch (error) {
                // Fallback to original file if quality preservation fails
                const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, logoFile);
                if (logoErrorUpload) {
                    throw new Error(`Logo upload failed: ${logoErrorUpload.message}`);
                }
                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            }
        } else if (logoFile && typeof logoFile === 'string') {
            try {
                const response = await fetch(logoFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch AI logo: ${response.status}`);
                }

                const blob = await response.blob();
                const aiLogoFile = new File([blob], 'ai-generated-logo.png', { type: blob.type || 'image/png' });

                // Preserve quality and upload
                const qualityFile = await preserveImageQuality(aiLogoFile);

                const logoPath = `${Date.now()}-ai-logo-${nanoid(6)}.png`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, qualityFile);

                if (logoErrorUpload) {
                    throw new Error(`AI logo upload failed: ${logoErrorUpload.message}`);
                }

                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            } catch (error) {
                logoUrl = logoFile;
            }
        }
        submissionData.logo_url = logoUrl;

        if (thumbnailFile && typeof thumbnailFile !== 'string') {
            // User uploaded file - preserve quality and upload
            try {
                const qualityFile = await preserveImageQuality(thumbnailFile);

                // Verify quality was maintained
                if (qualityFile.size < thumbnailFile.size * 0.8) {
                    throw new Error('Quality preservation resulted in significant size reduction');
                }

                const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, qualityFile);
                if (thumbError) {
                    throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
                }
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            } catch (error) {
                // Fallback to original file if quality preservation fails
                const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, thumbnailFile);
                if (thumbError) {
                    throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
                }
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            }
        } else if (thumbnailFile && typeof thumbnailFile === 'string') {
            // AI-generated thumbnail URL - download and upload to our storage
            try {
                const response = await fetch(thumbnailFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch AI thumbnail: ${response.status}`);
                }

                const blob = await response.blob();
                const aiThumbnailFile = new File([blob], 'ai-generated-thumbnail.png', { type: blob.type || 'image/png' });

                // Preserve quality and upload
                const qualityFile = await preserveImageQuality(aiThumbnailFile);
                const thumbPath = `${Date.now()}-ai-thumbnail-${nanoid(6)}.png`;
                const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, qualityFile);
                if (thumbError) {
                    throw new Error(`AI thumbnail upload failed: ${thumbError.message}`);
                }
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            } catch (error) {
                // Keep the original AI thumbnail URL as fallback
                thumbnailUrl = thumbnailFile;
            }
        }
        submissionData.thumbnail_url = thumbnailUrl;

        if (coverFiles && coverFiles.length > 0) {
            for (let i = 0; i < coverFiles.length; i++) {
                const file = coverFiles[i];
                if (file && typeof file !== 'string') {
                    // User uploaded file - preserve quality and upload
                    try {
                        const qualityFile = await preserveImageQuality(file);

                        // Verify quality was maintained
                        if (qualityFile.size < file.size * 0.8) {
                            throw new Error('Quality preservation resulted in significant size reduction');
                        }

                        const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                        const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, qualityFile);
                        if (coverErrorUpload) {
                            throw new Error(`Cover file upload failed: ${coverErrorUpload.message}`);
                        }
                        const { data: coverUrlData } = supabase.storage.from('startup-media').getPublicUrl(coverPath);
                        coverUrls.push(coverUrlData.publicUrl);
                    } catch (error) {
                        // Fallback to original file if quality preservation fails
                        const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                        const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, file);
                        if (coverErrorUpload) {
                            throw new Error(`Cover file upload failed: ${coverErrorUpload.message}`);
                        }
                        const { data: coverUrlData } = supabase.storage.from('startup-media').getPublicUrl(coverPath);
                        coverUrls.push(coverUrlData.publicUrl);
                    }
                } else if (typeof file === 'string') {
                    coverUrls.push(file);
                }
            }
        }
        submissionData.cover_urls = coverUrls;

        let finalSubmissionData;
        if (isEditing && editingProjectId) {
            submissionData.status = 'launched';

            // Do not overwrite paid-tier fields on edit (set only by webhook after payment)
            delete submissionData.is_sponsored;
            delete submissionData.sponsored_tier;

            // Check if it was previously a draft to reset created_at
            const { data: currentProject } = await supabase
                .from('projects')
                .select('status, created_at')
                .eq('id', editingProjectId)
                .maybeSingle();

            if (currentProject?.status === 'draft') {
                submissionData.created_at = new Date().toISOString();
                submissionData.relaunched = false; // Ensure it's treated as a fresh launch
            }

            const { data, error } = await supabase.from('projects').update(submissionData).eq('id', editingProjectId).select().maybeSingle();
            if (error) {
                throw new Error(`Update failed: ${error.message}`);
            }
            finalSubmissionData = data;
        } else {
            // New project launch
            submissionData.created_at = new Date().toISOString();
            submissionData.status = 'launched';
            let retries = 0;
            const maxRetries = 3;
            let finalError = null;

            while (retries <= maxRetries) {
                const { data, error } = await supabase.from('projects').insert([submissionData]).select().maybeSingle();

                if (!error) {
                    finalSubmissionData = data;
                    break; // Success, exit retry loop
                }

                // Check if error is due to duplicate slug
                if (error.message && (error.message.includes('duplicate key') || error.message.includes('unique constraint') || error.message.includes('slug'))) {
                    retries++;
                    if (retries <= maxRetries) {
                        // Generate a new unique slug and retry
                        try {
                            submissionData.slug = await generateUniqueSlug(formData.name, supabase);
                        } catch (slugError) {
                            // If slug generation fails, use timestamp fallback
                            const baseSlug = slugify(formData.name);
                            submissionData.slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                        }
                        continue; // Retry with new slug
                    }
                }

                // Non-slug error or max retries reached
                finalError = error;
                break;
            }

            if (finalError || !finalSubmissionData) {
                throw new Error(`Insert failed: ${finalError?.message || 'Unknown error'}`);
            }
        }

        // Auto-like: Owner automatically likes their own project (only for new projects, not edits)
        if (!isEditing && finalSubmissionData && finalSubmissionData.id) {
            try {
                await supabase
                    .from('project_likes')
                    .insert([{
                        user_id: user.id,
                        project_id: finalSubmissionData.id
                    }]);

                addBreadcrumb('Auto-like added for new project', { projectId: finalSubmissionData.id });
            } catch (_likeError) {
                addBreadcrumb('Auto-like failed', { error: 'auto_like' });
            }
        }

        // Success handling - different for free vs paid
        if (selectedPlan === 'standard') {
            const message = isEditing ? 'Project updated successfully!' : 'Launch submitted successfully!';
            setSnackbar({ open: true, message, severity: 'success' });
            trackSubmission('success');
            setTimeout(() => {
                navigate(`/launches/${finalSubmissionData.slug}?new_launch=true`);
            }, 1000);
        } else {
            // Paid Plan - Redirect to pricing to complete payment
            const planToSelect = selectedPlan === 'showcase' ? 'Showcase' : 'Spotlight';
            setSnackbar({ open: true, message: 'Redirecting to checkout...', severity: 'success' });
            trackSubmission('checkout_redirect');

            setTimeout(() => {
                // Redirecting to pricing tells it which project AND which plan to pre-select
                navigate(`/pricing?projectId=${finalSubmissionData.id}&plan=${planToSelect}`);
            }, 1000);
        }

        // Complete form reset
        setFormData({ name: '', websiteUrl: '', description: '', tagline: '' });
        setSelectedCategory(null);
        setLinks(['']);
        setTags([]);
        setLogoFile(null);
        setThumbnailFile(null);
        setCoverFiles([null, null, null, null]);
        setEditingProjectId(null);
        setUrlPreview(null);
        setPendingAIData(null);
        setShowSmartFillDialog(false);
        setRetryCount(0);
        setIsAILoading(false);
        setIsRetrying(false);
        setIsGeneratingPreview(false);
    } catch (error) {
        // Track error automatically
        trackError(error, {
            type: 'form_submission',
            formData: {
                hasName: !!formData.name,
                hasUrl: !!formData.websiteUrl,
                hasCategory: !!selectedCategory,
                coverFilesCount: coverFiles.filter(f => f !== null).length,
                hasLogo: !!logoFile,
                hasThumbnail: !!thumbnailFile,
                isEditing
            }
        });

        // Track failed submission
        trackSubmission('failed', error.message || 'Unknown error');

        // User-friendly error messages (no raw DB/stack in production)
        let errorMessage = 'Something went wrong. Please try again.';
        let severity = 'error';

        if (error.message) {
            if (error.message.includes('Missing required fields')) {
                errorMessage = `❌ ${error.message}`;
            } else if (error.message.includes('upload failed')) {
                errorMessage = '📁 Upload failed. Please check your files and try again.';
            } else if (error.message.includes('Insert failed') || error.message.includes('Update failed')) {
                errorMessage = '💾 Could not save. Please try again.';
            } else if (error.message.includes('duplicate key')) {
                errorMessage = '⚠️ A startup with this name already exists. Please choose a different name.';
                severity = 'warning';
            } else if (error.message.includes('violates')) {
                errorMessage = '⚠️ Some data is invalid. Please check your inputs and try again.';
                severity = 'warning';
            } else if (error.message === 'duplicate_url') {
                errorMessage = 'This website is already on Launchit.';
            } else if (error.message === 'cooldown_active') {
                errorMessage = 'This URL is in cooldown. Please try again later.';
            } else {
                errorMessage = 'Something went wrong. Please try again.';
            }
        }

        setSnackbar({ open: true, message: errorMessage, severity });

        // Re-throw error so caller can handle state reset (e.g., isSubmitting)
        throw error;
    }
};

