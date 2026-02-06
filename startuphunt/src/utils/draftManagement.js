import { generateUniqueSlug, slugify, sanitizeFileName } from './registerUtils';

/**
 * Auto-save a draft (silent, non-blocking) with retry mechanism.
 * Returns true on success, false on failure (useful if caller wants to know).
 */
export const handleAutoSaveDraft = async ({
  user,
  isEditing,
  isFormEmpty,
  formData,
  isAutoSaving,
  autoSaveDraftId,
  editingProjectId,
  selectedCategory,
  links = [],
  builtWith = [],
  tags = [],
  existingMediaUrls = [],
  logoFile,
  thumbnailFile,
  coverFiles = [],
  supabase,
  setAutoSaveDraftId,
  setIsAutoSaving,
  setHasUnsavedChanges,
  setLastSavedAt,
}, retryCount = 0) => {
  // guard conditions
  if (!user || isEditing || (isFormEmpty && isFormEmpty()) || !formData?.name || isAutoSaving) {
    return false;
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s

  if (typeof setIsAutoSaving === 'function') setIsAutoSaving(true);
  try {
    let draftId = autoSaveDraftId || editingProjectId;
    let existingDraftData = null;

    // If we don't have a draft id, try to find an existing draft with same name
    if (!draftId) {
      const { data: existingDraft, error: findErr } = await supabase
        .from('projects')
        .select('id, logo_url, thumbnail_url, cover_urls')
        .eq('user_id', user.id)
        .eq('name', formData.name)
        .eq('status', 'draft')
        .maybeSingle();

      if (!findErr && existingDraft?.id) {
        draftId = existingDraft.id;
        existingDraftData = existingDraft;
        if (typeof setAutoSaveDraftId === 'function') setAutoSaveDraftId(draftId);
      }
    } else {
      // Fetch existing draft data to preserve URLs if upload fails
      const { data: existingDraft } = await supabase
        .from('projects')
        .select('logo_url, thumbnail_url, cover_urls')
        .eq('id', draftId)
        .maybeSingle();
      existingDraftData = existingDraft;
    }

    // defensive defaults - extract from formData if not provided as separate arguments
    const safeLinks = Array.isArray(links) && links.length > 0 ? links : (Array.isArray(formData?.links) ? formData.links : []);
    const safeBuiltWith = Array.isArray(builtWith) && builtWith.length > 0 ? builtWith : (Array.isArray(formData?.builtWith) ? formData.builtWith : []);
    const safeTags = Array.isArray(tags) && tags.length > 0 ? tags : (Array.isArray(formData?.tags) ? formData.tags : []);
    const safeExistingMedia = Array.isArray(existingMediaUrls) && existingMediaUrls.length > 0 ? existingMediaUrls : (Array.isArray(formData?.existingMediaUrls) ? formData.existingMediaUrls : []);
    const safeCoverFiles = Array.isArray(coverFiles) && coverFiles.length > 0 ? coverFiles : (Array.isArray(formData?.screenshots) ? formData.screenshots : []);
    const safeLogoFile = logoFile || formData?.logo;
    const safeThumbnailFile = thumbnailFile || formData?.thumbnail;
    const safeSelectedCategory = selectedCategory || (formData?.category ? { value: formData.category } : null);

    // Upload images to cloud if they're File objects
    // Preserve existing URLs if upload fails
    let logoUrl = typeof safeLogoFile === 'string' ? safeLogoFile : (existingDraftData?.logo_url || null);
    if (safeLogoFile && typeof safeLogoFile !== 'string') {
      try {
        const { preserveImageQuality } = await import('./imageHandling');
        const qualityFile = await preserveImageQuality(safeLogoFile);
        const logoPath = `draft-${Date.now()}-logo-${sanitizeFileName(safeLogoFile.name)}`;
        const { data: logoData, error: logoError } = await supabase.storage
          .from('startup-media')
          .upload(logoPath, qualityFile);

        if (!logoError && logoData) {
          const { data: logoUrlData } = supabase.storage
            .from('startup-media')
            .getPublicUrl(logoPath);
          logoUrl = logoUrlData.publicUrl;
        }
      } catch (error) {
      }
    }

    let thumbnailUrl = typeof safeThumbnailFile === 'string' ? safeThumbnailFile : (existingDraftData?.thumbnail_url || null);
    if (safeThumbnailFile && typeof safeThumbnailFile !== 'string') {
      try {
        const { preserveImageQuality } = await import('./imageHandling');
        const qualityFile = await preserveImageQuality(safeThumbnailFile);
        const thumbPath = `draft-${Date.now()}-thumbnail-${sanitizeFileName(safeThumbnailFile.name)}`;
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('startup-media')
          .upload(thumbPath, qualityFile);

        if (!thumbError && thumbData) {
          const { data: thumbUrlData } = supabase.storage
            .from('startup-media')
            .getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      } catch (error) {
        // keep existing thumbnail on upload failure
      }
    }

    const existingCoverUrls = existingDraftData?.cover_urls || [];
    const coverUrls = [];
    for (let i = 0; i < safeCoverFiles.length; i++) {
      const file = safeCoverFiles[i];
      if (file && typeof file === 'string') {
        coverUrls.push(file);
      } else if (file && typeof file !== 'string') {
        try {
          const { preserveImageQuality } = await import('./imageHandling');
          const qualityFile = await preserveImageQuality(file);
          const coverPath = `draft-${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
          const { data: coverData, error: coverErrorUpload } = await supabase.storage
            .from('startup-media')
            .upload(coverPath, qualityFile);

          if (!coverErrorUpload && coverData) {
            const { data: coverUrlData } = supabase.storage
              .from('startup-media')
              .getPublicUrl(coverPath);
            coverUrls.push(coverUrlData.publicUrl);
          } else if (existingCoverUrls[i]) {
            coverUrls.push(existingCoverUrls[i]);
          }
        } catch (error) {
          if (existingCoverUrls[i]) coverUrls.push(existingCoverUrls[i]);
        }
      } else if (existingCoverUrls[i]) {
        coverUrls.push(existingCoverUrls[i]);
      }
    }

    const draftData = {
      name: formData.name,
      website_url: formData.websiteUrl || '',
      tagline: formData.tagline || '',
      description: formData.description || '',
      category_type: safeSelectedCategory?.value || '',
      links: safeLinks.filter(l => typeof l === 'string' && l.trim() !== ''),
      built_with: safeBuiltWith.map(item => item?.value || item).filter(Boolean),
      tags: safeTags,
      updated_at: new Date().toISOString(),
      user_id: user.id,
      status: 'draft',
      media_urls: [...safeExistingMedia],
      logo_url: logoUrl,
      thumbnail_url: thumbnailUrl,
      cover_urls: coverUrls,
    };

    // For auto-save, only set created_at & slug when creating NEW draft (not when updating)
    if (!draftId) {
      draftData.created_at = new Date().toISOString();
      try {
        draftData.slug = await generateUniqueSlug(formData.name, supabase);
      } catch (error) {
        // Fallback to timestamp-based slug
        const baseSlug = slugify(formData.name);
        draftData.slug = `${baseSlug}-${Date.now()}`;
      }
    }

    if (draftId) {
      const { error: updateErr } = await supabase
        .from('projects')
        .update(draftData)
        .eq('id', draftId);

      if (updateErr) throw updateErr;
    } else {
      // Retry logic for race condition: if slug conflict, generate new slug and retry
      let retries = 0;
      const maxRetries = 3;
      let insertSuccess = false;

      while (retries <= maxRetries && !insertSuccess) {
        const { data: newDraft, error: insertErr } = await supabase
          .from('projects')
          .insert([draftData])
          .select('id')
          .single();

        if (!insertErr) {
          if (newDraft?.id && typeof setAutoSaveDraftId === 'function') {
            setAutoSaveDraftId(newDraft.id);
          }
          insertSuccess = true;
          break; // Success, exit retry loop
        }

        // Check if error is due to duplicate slug
        if (insertErr.message && (insertErr.message.includes('duplicate key') || insertErr.message.includes('unique constraint') || insertErr.message.includes('slug'))) {
          retries++;
          if (retries <= maxRetries) {
            // Generate a new unique slug and retry
            try {
              draftData.slug = await generateUniqueSlug(formData.name, supabase);
            } catch (slugError) {
              // If slug generation fails, use timestamp fallback
              const baseSlug = slugify(formData.name);
              draftData.slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            }
            continue; // Retry with new slug
          }
        }

        throw insertErr;
      }
    }

    if (typeof setHasUnsavedChanges === 'function') setHasUnsavedChanges(false);
    if (typeof setLastSavedAt === 'function') setLastSavedAt(new Date());
    return true;
  } catch (err) {
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount] || 10000;

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry with incremented count
      return handleAutoSaveDraft({
        user,
        isEditing,
        isFormEmpty,
        formData,
        isAutoSaving: false, // Reset flag for retry
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
      }, retryCount + 1);
    }

    // All retries exhausted
    return false;
  } finally {
    if (typeof setIsAutoSaving === 'function') setIsAutoSaving(false);
  }
};


/**
 * Save draft explicitly (shows snackbar feedback to user).
 */
export const handleSaveDraft = async ({
  user,
  isFormEmpty,
  isEditing,
  editingLaunched,
  formData,
  autoSaveDraftId,
  editingProjectId,
  selectedCategory,
  links = [],
  builtWith = [],
  tags = [],
  existingMediaUrls = [],
  logoFile,
  thumbnailFile,
  coverFiles = [],
  supabase,
  setAutoSaveDraftId,
  setHasUnsavedChanges,
  setLastSavedAt,
  setSnackbar,
  navigate,
}) => {
  // Auth guard
  if (!user) {
    setSnackbar?.({ open: true, message: 'Please sign in to save', severity: 'warning' });
    navigate?.('/register');
    return false;
  }

  // Form validation
  if (isFormEmpty?.()) {
    setSnackbar?.({ open: true, message: 'Cannot save an empty draft.', severity: 'warning' });
    return false;
  }
  if (isEditing && editingLaunched) {
    setSnackbar?.({ open: true, message: 'Cannot save launched project as draft.', severity: 'warning' });
    return false;
  }
  if (!formData?.name) {
    setSnackbar?.({ open: true, message: 'Please enter a project name before saving.', severity: 'warning' });
    return false;
  }

  // Find existing draft id if needed
  let draftId = autoSaveDraftId || editingProjectId;
  if (!isEditing && !draftId) {
    try {
      const { data: existingDraft, error: findErr } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', formData.name)
        .eq('status', 'draft')
        .maybeSingle();

      if (!findErr && existingDraft?.id) {
        draftId = existingDraft.id;
        if (typeof setAutoSaveDraftId === 'function') setAutoSaveDraftId(draftId);
      }
    } catch (err) {
      // continue without draftId
    }
  }

  // Defensive defaults - extract from formData if not provided as separate arguments
  const safeLinks = Array.isArray(links) && links.length > 0 ? links : (Array.isArray(formData?.links) ? formData.links : []);
  const safeBuiltWith = Array.isArray(builtWith) && builtWith.length > 0 ? builtWith : (Array.isArray(formData?.builtWith) ? formData.builtWith : []);
  const safeTags = Array.isArray(tags) && tags.length > 0 ? tags : (Array.isArray(formData?.tags) ? formData.tags : []);
  const safeExistingMedia = Array.isArray(existingMediaUrls) && existingMediaUrls.length > 0 ? existingMediaUrls : (Array.isArray(formData?.existingMediaUrls) ? formData.existingMediaUrls : []);
  const safeCoverFiles = Array.isArray(coverFiles) && coverFiles.length > 0 ? coverFiles : (Array.isArray(formData?.screenshots) ? formData.screenshots : []);
  const safeLogoFile = logoFile || formData?.logo;
  const safeThumbnailFile = thumbnailFile || formData?.thumbnail;
  const safeSelectedCategory = selectedCategory || (formData?.category ? (typeof formData.category === 'object' ? formData.category : { value: formData.category }) : null);

  // Upload images to cloud if they're File objects
  let logoUrl = typeof logoFile === 'string' ? logoFile : null;
  if (logoFile && typeof logoFile !== 'string') {
    try {
      const { preserveImageQuality } = await import('./imageHandling');
      const qualityFile = await preserveImageQuality(logoFile);
      const logoPath = `draft-${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
      const { data: logoData, error: logoError } = await supabase.storage
        .from('startup-media')
        .upload(logoPath, qualityFile);

      if (!logoError && logoData) {
        const { data: logoUrlData } = supabase.storage
          .from('startup-media')
          .getPublicUrl(logoPath);
        logoUrl = logoUrlData.publicUrl;
      }
    } catch (error) {
      // keep existing logo on upload failure
    }
  }

  let thumbnailUrl = typeof thumbnailFile === 'string' ? thumbnailFile : null;
  if (thumbnailFile && typeof thumbnailFile !== 'string') {
    try {
      const { preserveImageQuality } = await import('./imageHandling');
      const qualityFile = await preserveImageQuality(thumbnailFile);
      const thumbPath = `draft-${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('startup-media')
        .upload(thumbPath, qualityFile);

      if (!thumbError && thumbData) {
        const { data: thumbUrlData } = supabase.storage
          .from('startup-media')
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
    } catch (error) {
      // keep existing thumbnail on upload failure
    }
  }

  // Upload cover files if they're File objects
  const coverUrls = [];
  for (let i = 0; i < safeCoverFiles.length; i++) {
    const file = safeCoverFiles[i];
    if (file && typeof file === 'string') {
      coverUrls.push(file);
    } else if (file && typeof file !== 'string') {
      try {
        const { preserveImageQuality } = await import('./imageHandling');
        const qualityFile = await preserveImageQuality(file);
        const coverPath = `draft-${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('startup-media')
          .upload(coverPath, qualityFile);

        if (!coverError && coverData) {
          const { data: coverUrlData } = supabase.storage
            .from('startup-media')
            .getPublicUrl(coverPath);
          coverUrls.push(coverUrlData.publicUrl);
        }
      } catch (error) {
        // skip this cover on upload failure
      }
    }
  }

  // Only set created_at & slug for NEW drafts
  const draftData = {
    name: formData.name,
    website_url: formData.websiteUrl || '',
    tagline: formData.tagline || '',
    description: formData.description || '',
    category_type: safeSelectedCategory?.value || '',
    links: safeLinks.filter(l => typeof l === 'string' && l.trim() !== ''),
    built_with: safeBuiltWith.map(item => item?.value || item).filter(Boolean),
    tags: safeTags,
    user_id: user.id,
    status: 'draft',
    media_urls: [...safeExistingMedia],
    logo_url: logoUrl,
    thumbnail_url: thumbnailUrl,
    cover_urls: coverUrls,
    updated_at: new Date().toISOString(),
  };

  if (!draftId) {
    draftData.created_at = new Date().toISOString();
    try {
      draftData.slug = await generateUniqueSlug(formData.name, supabase);
    } catch (error) {
      // Fallback to timestamp-based slug
      const baseSlug = slugify(formData.name);
      draftData.slug = `${baseSlug}-${Date.now()}`;
    }
  }

  try {
    let savedDraftId = null;
    if (draftId) {
      const { error: updateErr } = await supabase
        .from('projects')
        .update(draftData)
        .eq('id', draftId);

      if (updateErr) throw updateErr;
      savedDraftId = draftId;
    } else {
      // Retry logic for race condition: if slug conflict, generate new slug and retry
      let retries = 0;
      const maxRetries = 3;
      let insertSuccess = false;

      while (retries <= maxRetries && !insertSuccess) {
        const { data: newDraft, error: insertErr } = await supabase
          .from('projects')
          .insert([draftData])
          .select('id')
          .single();

        if (!insertErr) {
          savedDraftId = newDraft?.id ?? null;
          if (savedDraftId && typeof setAutoSaveDraftId === 'function') {
            setAutoSaveDraftId(savedDraftId);
          }
          insertSuccess = true;
          break; // Success, exit retry loop
        }

        // Check if error is due to duplicate slug
        if (insertErr.message && (insertErr.message.includes('duplicate key') || insertErr.message.includes('unique constraint') || insertErr.message.includes('slug'))) {
          retries++;
          if (retries <= maxRetries) {
            // Generate a new unique slug and retry
            try {
              draftData.slug = await generateUniqueSlug(formData.name, supabase);
            } catch (slugError) {
              // If slug generation fails, use timestamp fallback
              const baseSlug = slugify(formData.name);
              draftData.slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            }
            continue; // Retry with new slug
          }
        }

        // Non-slug error or max retries reached
        throw insertErr;
      }
    }

    setHasUnsavedChanges?.(false);
    setLastSavedAt?.(new Date());
    setSnackbar?.({ open: true, message: 'Launch saved!', severity: 'success' });
    return savedDraftId;
  } catch (error) {
    setSnackbar?.({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
    return false;
  }
};
