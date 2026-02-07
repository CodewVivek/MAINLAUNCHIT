// import { config } from '../config';  <-- Removed
import { trackError, addBreadcrumb } from './errorTracking';

const MAX_RETRIES = 3; // Maximum number of retry attempts

// Store active retry timeouts to allow cancellation
const activeRetryTimeouts = new Map();

export const generateLaunchData = async ({
    websiteUrl,
    supabase,
    setSnackbar,
    setIsAILoading,
    setIsRetrying,
    setRetryCount,
    retryCount = 0,
    isRetry,
    formData,
    getFilledFieldsCount,
    applyAIData,
    setPendingAIData,
    setShowSmartFillDialog,
    urlPreview,
    isGeneratingPreview,
    generateBasicPreview,
    cancelToken = null, // Unique token to identify this generation request
}) => {
    // Cancel any existing retries for this cancelToken
    if (cancelToken && activeRetryTimeouts.has(cancelToken)) {
        clearTimeout(activeRetryTimeouts.get(cancelToken));
        activeRetryTimeouts.delete(cancelToken);
    }
    if (!websiteUrl) {
        setSnackbar({ open: true, message: "Please enter a website URL first.", severity: 'warning' });
        return;
    }

    // Check if we've exceeded max retries
    if (isRetry && retryCount >= MAX_RETRIES) {
        setSnackbar({
            open: true,
            message: "🤖 AI generation failed after multiple attempts. Please try again later or fill the form manually.",
            severity: 'error'
        });
        setIsAILoading(false);
        setIsRetrying(false);
        setRetryCount(0);
        return;
    }

    if (isRetry) {
        setIsRetrying(true);
    } else {
        setIsAILoading(true);
        setRetryCount(0);
    }

    const loadingMessage = isRetry
        ? `Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`
        : "🤖 Launching AI engine...";

    setSnackbar({ open: true, message: loadingMessage, severity: 'info' });

    try {
        addBreadcrumb('AI generation started', 'ai', { websiteUrl });

        let user_id = null;
        try {
            const { data, error } = await supabase.auth.getUser();
            if (!error) {
                user_id = data?.user?.id || null;
            }
        } catch (_authError) {
            // Auth optional for AI; continue without user_id
        }

        // Fetch the website and get the html. Never use localhost in production (triggers browser "local network" prompt).
        let backendUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
        // Critical: URL must be absolute (include protocol). Otherwise fetch() treats it as a relative path
        // and requests go to current origin, e.g. vercel.app/mainlaunchit-production.up.railway.app/... → 405
        if (backendUrl && !/^https?:\/\//i.test(backendUrl)) {
            backendUrl = `https://${backendUrl}`;
        }
        const isProd = typeof window !== 'undefined' && !/localhost|127\.0\.0\.1/.test(window.location?.hostname || '');
        const useLocalhost = !backendUrl || /localhost|127\.0\.0\.1/.test(backendUrl);
        if (isProd && useLocalhost) {
            throw new Error('AI generation is not configured for this environment.');
        }
        const baseUrl = useLocalhost ? 'http://localhost:3001' : backendUrl;
        const res = await fetch(`${baseUrl}/generatelaunchdata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: websiteUrl,
                user_id,
            })
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const gptData = await res.json();

        if (gptData.err || gptData.error) {
            throw new Error(gptData.message || 'AI generation failed');
        }

        // Validate that we got the essential data
        const essentialFields = ['name', 'description', 'tagline'];
        const missingFields = essentialFields.filter(field => !gptData[field]);

        if (missingFields.length > 0) {
            setSnackbar({
                open: true,
                message: `⚠️ AI generated partial data. Missing: ${missingFields.join(', ')}`,
                severity: 'warning'
            });
        }

        // Process AI response with better error handling
        // Always use the original URL the user entered - never overwrite it with AI-generated data
        const processedData = {
            name: gptData.name || '',
            website_url: websiteUrl, // Always use the original URL the user entered
            tagline: gptData.tagline || '',
            description: gptData.description || '',
            logo_url: gptData.logo_url || null,
            thumbnail_url: gptData.thumbnail_url || null,
            features: gptData.features || [],
            category: gptData.category || null,
            links: gptData.links || [],
            built_with: gptData.built_with || [],
            tags: gptData.tags || []
        };

        // Check how many fields are already filled
        const filledCount = getFilledFieldsCount();

        if (filledCount < 4) {
            // If less than 4 fields filled, directly apply AI data
            applyAIData(processedData, false); // Fill all fields
            setSnackbar({
                open: true,
                message: `🤖 AI generated data successfully! ${processedData.name ? `Found: ${processedData.name}` : ''}`,
                severity: 'success'
            });
        } else {
            setPendingAIData(processedData);
            setShowSmartFillDialog(true);
        }

        // Reset retry count on success
        setRetryCount(0);
        setIsAILoading(false);
        setIsRetrying(false);

        // Clear cancel token on success
        if (cancelToken && activeRetryTimeouts.has(cancelToken)) {
            activeRetryTimeouts.delete(cancelToken);
        }
    }
    catch (error) {
        let errorMessage = "AI failed to extract startup info...";
        let severity = 'error';
        let showRetry = false;

        if (error.message && error.message.includes("Microlink")) {
            errorMessage = "🖼️ AI extracted text but failed to generate logo/thumbnail. You can upload them manually!";
            severity = 'warning';
        } else if (error.message && (error.message.includes("OpenAI") || error.message.includes("401") || error.message.includes("API key"))) {
            errorMessage = "🤖 OpenAI API Key Error: Please ensure a valid API key is set in gptbackend/.env";
            severity = 'error';
            showRetry = false;
        } else if (error.message && error.message.includes("HTTP")) {
            errorMessage = "🌐 Backend service error. Please try again later.";
            severity = 'error';
            showRetry = true;
        } else if (error.message && error.message.includes("fetch")) {
            errorMessage = "🌐 Network error. Please check your connection and try again.";
            severity = 'error';
            showRetry = true;
        }

        // Try to generate basic preview as fallback
        if (!urlPreview && !isGeneratingPreview) {
            generateBasicPreview(websiteUrl);
        }

        // Only retry if we haven't exceeded max retries
        if (showRetry && retryCount < MAX_RETRIES) {
            const nextRetryCount = retryCount + 1;
            setRetryCount(nextRetryCount);

            // Auto-retry with exponential backoff (2s, 4s, 6s)
            const nextDelay = Math.min(6000, 2000 * nextRetryCount);

            // Keep loading states true for retry
            const timeoutId = setTimeout(() => {
                if (cancelToken) {
                    activeRetryTimeouts.delete(cancelToken);
                }
                generateLaunchData({
                    websiteUrl,
                    supabase,
                    setSnackbar,
                    setIsAILoading,
                    setIsRetrying,
                    setRetryCount,
                    retryCount: nextRetryCount,
                    isRetry: true,
                    formData,
                    getFilledFieldsCount,
                    applyAIData,
                    setPendingAIData,
                    setShowSmartFillDialog,
                    urlPreview,
                    isGeneratingPreview,
                    generateBasicPreview,
                    cancelToken,
                });
            }, nextDelay);

            // Store timeout ID for cancellation
            if (cancelToken) {
                activeRetryTimeouts.set(cancelToken, timeoutId);
            }
        } else {
            // Show error message and stop retrying
            if (retryCount >= MAX_RETRIES) {
                setSnackbar({
                    open: true,
                    message: "🤖 AI generation failed after multiple attempts. Please try again later or fill the form manually.",
                    severity: 'error'
                });
            } else {
                setSnackbar({ open: true, message: errorMessage, severity });
            }
            setIsAILoading(false);
            setIsRetrying(false);
        }
    }
};

// Function to cancel all pending retries for a specific token
export const cancelAIGeneration = (cancelToken) => {
    if (cancelToken && activeRetryTimeouts.has(cancelToken)) {
        clearTimeout(activeRetryTimeouts.get(cancelToken));
        activeRetryTimeouts.delete(cancelToken);
        return true;
    }
    return false;
};

// Function to cancel all pending retries (cleanup)
export const cancelAllAIGenerations = () => {
    activeRetryTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    activeRetryTimeouts.clear();
};

