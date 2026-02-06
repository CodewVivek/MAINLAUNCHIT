import { isValidUrl } from './registerUtils';

export const validateForm = (formData, selectedCategory, coverFiles, logoFile, thumbnailFile, urlPreview, setSnackbar) => {
    const errors = [];

    // STEP 1: Fully Required Fields
    if (!formData.name || formData.name.trim().length === 0) {
        errors.push('Startup name is required');
    } else if (formData.name.trim().length < 3) {
        errors.push('Startup name must be at least 3 characters long');
    }

    if (!formData.websiteUrl || formData.websiteUrl.trim().length === 0) {
        errors.push('Website URL is required');
    } else if (!isValidUrl(formData.websiteUrl)) {
        errors.push('Please enter a valid website URL (e.g., https://example.com)');
    }

    if (!formData.description || formData.description.trim().length === 0) {
        errors.push('Description is required');
    } else if (formData.description.trim().length < 20) {
        errors.push('Description must be at least 20 characters long');
    }

    if (!formData.tagline || formData.tagline.trim().length === 0) {
        errors.push('Tagline is required');
    } else if (formData.tagline.trim().length < 10) {
        errors.push('Tagline must be at least 10 characters long');
    }

    if (!selectedCategory) {
        errors.push('Please select a category for your startup');
    }

    // Check cover images - require at least 2
    const validCoverFiles = coverFiles.filter(file => file !== null);
    if (validCoverFiles.length < 2) {
        errors.push('Please upload at least 2 cover images for your startup');
    }

    const hasAIGeneratedImages = urlPreview && (urlPreview.logo || urlPreview.screenshot);
    const hasUserUploadedImages = logoFile || thumbnailFile;

    if (!hasAIGeneratedImages && !hasUserUploadedImages) {
        errors.push('Please provide either a logo or thumbnail image (AI generation failed, manual upload required)');
    }

    // STEP 3: Optional Fields (no validation required)
    // - tags
    // - links

    if (errors.length > 0) {
        const errorMessage = `Please fix the following issues:\n${errors.join('\n')}`;
        setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error'
        });
        return false;
    }

    return true;
};

export const isFormEmpty = (formData, selectedCategory) => {
    // Check if all required fields from Step 1 are empty
    return !formData.name && !formData.tagline && !formData.description && !formData.websiteUrl && !selectedCategory;
};

export const getFilledFieldsCount = (formData, selectedCategory, logoFile, thumbnailFile, coverFiles, tags, links, builtWith) => {
    let count = 0;

    // Step 1: Basic required fields
    if (formData.name) count++;
    if (formData.tagline) count++;
    if (formData.description) count++;
    if (selectedCategory) count++;

    // Step 2: Required media fields
    if (logoFile) count++;
    if (thumbnailFile) count++;
    if (coverFiles && coverFiles.some(f => !!f)) count++;

    // Step 3: Optional fields
    if (tags.length > 0) count++;
    if (links.length > 1 || (links.length === 1 && links[0])) count++;
    if (builtWith.length > 0) count++;

    return count;
};

