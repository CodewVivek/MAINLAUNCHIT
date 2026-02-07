import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { url } = await request.json();

        // Validate URL
        if (!url) {
            return NextResponse.json({
                success: false,
                message: 'Please provide a website URL.'
            }, { status: 400 });
        }

        // Normalize URL
        let websiteUrl = url.trim();
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
            websiteUrl = 'https://' + websiteUrl;
        }

        // Validate URL format
        try {
            new URL(websiteUrl);
        } catch (error) {
            return NextResponse.json({
                success: false,
                message: 'Please provide a valid website URL (e.g., https://example.com).'
            }, { status: 400 });
        }

        // Fetch the website HTML
        let html;
        try {
            const response = await fetch(websiteUrl, {
                headers: {
                    'User-Agent': 'LaunchitBot/1.0 (Badge Verification)',
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                return NextResponse.json({
                    success: false,
                    message: `Unable to access your website (HTTP ${response.status}). Please check the URL and try again.`
                }, { status: 400 });
            }

            html = await response.text();
        } catch (error) {
            if (error.name === 'AbortError') {
                return NextResponse.json({
                    success: false,
                    message: 'Website took too long to respond. Please try again.'
                }, { status: 400 });
            }

            return NextResponse.json({
                success: false,
                message: 'Unable to access your website. Please check the URL and ensure your site is publicly accessible.'
            }, { status: 400 });
        }

        // Parse HTML to find Launchit badge links
        const launchitLinkRegex = /<a\s+([^>]*href=["']https?:\/\/(?:www\.)?launchit\.site[^"']*["'][^>]*)>/gi;
        const matches = [...html.matchAll(launchitLinkRegex)];

        if (matches.length === 0) {
            return NextResponse.json({
                success: false,
                message: '❌ Badge not found. Please add the Launchit badge to your website and try again.',
                hint: 'Make sure the badge code is visible in your website\'s HTML.'
            }, { status: 400 });
        }

        // Check each match for nofollow/ugc/sponsored
        let hasValidLink = false;
        let hasNofollowLink = false;

        for (const match of matches) {
            const linkTag = match[1];

            // Check if link has rel attribute with nofollow, ugc, or sponsored
            const relMatch = linkTag.match(/rel=["']([^"']*)["']/i);

            if (relMatch) {
                const relValue = relMatch[1].toLowerCase();
                if (relValue.includes('nofollow') || relValue.includes('ugc') || relValue.includes('sponsored')) {
                    hasNofollowLink = true;
                    continue; // This link is invalid, check next one
                }
            }

            // If we get here, this link is valid (no rel or rel without nofollow/ugc/sponsored)
            hasValidLink = true;
            break;
        }

        if (!hasValidLink) {
            if (hasNofollowLink) {
                return NextResponse.json({
                    success: false,
                    message: '⚠️ Badge link must be dofollow. Please remove rel="nofollow", rel="ugc", or rel="sponsored" from the badge link.',
                    hint: 'A dofollow link helps both of us with SEO! Use the code exactly as provided.'
                }, { status: 400 });
            } else {
                return NextResponse.json({
                    success: false,
                    message: '❌ Badge not found. Please add the Launchit badge to your website and try again.'
                }, { status: 400 });
            }
        }

        // Success!
        return NextResponse.json({
            success: true,
            message: '✅ Badge verified successfully! Your dofollow backlink is active.'
        });

    } catch (error) {
        console.error('Badge verification error:', error);
        return NextResponse.json({
            success: false,
            message: 'Verification failed. Please try again in a moment.'
        }, { status: 500 });
    }
}
