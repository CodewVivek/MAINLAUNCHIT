export const viewAIImage = (imageUrl, type, setSnackbar) => {
    if (imageUrl) {
        window.open(imageUrl, '_blank');
    } else {
        setSnackbar({ open: true, message: `No AI-generated ${type} available`, severity: 'info' });
    }
};

export const handleImageError = (e, type, setSnackbar) => {
    // Check if it's a favicon URL (common issue)
    if (e.target.src.includes('favicon.ico')) {
        setSnackbar({
            open: true,
            message: `⚠️ Favicon failed to load. This is common with some websites. You can upload your own ${type} or try again.`,
            severity: 'warning'
        });
    } else {
        setSnackbar({
            open: true,
            message: `⚠️ AI-generated ${type} failed to load. The image URL may be restricted.`,
            severity: 'warning'
        });
    }
};

