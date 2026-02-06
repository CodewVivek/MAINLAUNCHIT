import { Helmet } from 'react-helmet-async';

export const SEO = ({
    title,
    description,
    image,
    url,
    type = 'website',
    noindex = false,
    structuredData = null,
    keywords = null
}) => {
    const siteName = 'Launchit';
    const siteUrl = 'https://launchit.site';
    const defaultImage = `${siteUrl}/images/r6_circle_optimized.png`;

    // Build full title (auto-truncate to 60 chars for SEO)
    let baseTitle = title || `${siteName} - Where Builders Launch Projects`;
    
    // If title doesn't include "|" and doesn't start with site name, add site name
    if (!baseTitle.includes('|') && !baseTitle.trim().startsWith(siteName)) {
        baseTitle = `${baseTitle} | ${siteName}`;
    }
    
    // Truncate to 60 chars max (optimal for SEO) - smart truncation at word boundary if possible
    let finalTitle = baseTitle;
    if (baseTitle.length > 60) {
        // Try to truncate at a space near 57 chars to avoid cutting words
        const truncateAt = baseTitle.lastIndexOf(' ', 57);
        finalTitle = truncateAt > 50 
            ? baseTitle.substring(0, truncateAt) + '...'
            : baseTitle.substring(0, 57) + '...';
    }

    // Build description (auto-truncate to 160 chars for SEO)
    const baseDescription = description ||
        'Launchit is the instant platform for startup founders who want to ship their products and get visibility — without gatekeeping or delays.';
    const fullDescription = baseDescription.length > 160
        ? baseDescription.substring(0, 157) + '...'
        : baseDescription;

    // Build image URL (ensure absolute)
    const fullImage = image
        ? (image.startsWith('http') ? image : `${siteUrl}${image}`)
        : defaultImage;

    // Build canonical URL
    const fullUrl = url || (typeof window !== 'undefined' ? `${siteUrl}${window.location.pathname}` : siteUrl);

    // Default keywords
    const defaultKeywords = 'startups, early-stage, launch platform, side projects, beta startups, projects, innovation, entrepreneurship';
    const metaKeywords = keywords || defaultKeywords;

    return (
        <Helmet>
            {/* Basic Meta */}
            <title>{finalTitle}</title>
            <meta name="description" content={fullDescription} />
            <meta name="keywords" content={metaKeywords} />

            {/* Robots / Canonical - Only one canonical tag */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <>
                    <meta name="robots" content="index, follow" />
                    <link rel="canonical" href={fullUrl} key="canonical" />
                </>
            )}

            {/* Open Graph */}
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={finalTitle} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={fullImage} />
            <meta name="twitter:image:alt" content={finalTitle} />
            <meta name="twitter:site" content="@launchit" />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

