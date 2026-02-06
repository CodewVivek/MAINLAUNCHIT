import { isValidUrl } from './registerUtils';

export const generateBasicPreview = async (url, setUrlPreview, setIsGeneratingPreview, setSnackbar) => {
    if (!url || !isValidUrl(url)) {
        setSnackbar({
            open: true,
            message: 'Please enter a valid URL',
            severity: 'warning'
        });
        return;
    }

    setIsGeneratingPreview(true);

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await response.text();
        const domain = new URL(url).hostname.replace('www.', '');
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : domain;
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        const description = descMatch ? descMatch[1].trim() : '';
        const logoMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i) ||
            html.match(/<link\s+rel=["']icon["']\s+href=["']([^"']+)["']/i);
        const logo = logoMatch ? logoMatch[1] : null;
        const screenshotMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
        const screenshot = screenshotMatch ? screenshotMatch[1] : null;

        setUrlPreview({
            domain,
            title,
            description,
            logo: logo ? (logo.startsWith('http') ? logo : new URL(logo, url).href) : null,
            screenshot: screenshot ? (screenshot.startsWith('http') ? screenshot : new URL(screenshot, url).href) : null
        });

        setSnackbar({
            open: true,
            message: 'Basic preview generated successfully!',
            severity: 'success'
        });
    } catch (error) {
        setSnackbar({
            open: true,
            message: 'Failed to generate basic preview. Please try again.',
            severity: 'error'
        });
    } finally {
        setIsGeneratingPreview(false);
    }
};

