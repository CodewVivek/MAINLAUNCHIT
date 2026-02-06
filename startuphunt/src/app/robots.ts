import { MetadataRoute } from 'next'

/**
 * Production robots.txt: allow indexing of all public content.
 * Disallow only private/dashboard/admin and form pages to save crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin',
                    '/dashboard',
                    '/settings',
                    '/submit',
                    '/saved',
                    '/my-launches',
                    '/customer-portal',
                    '/viewed-history',
                    '/upvoted-projects',
                    '/followers-following',
                    '/feedback',
                    '/UserRegister',
                    '/register',
                ],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://launchit.site'}/sitemap.xml`,
        host: process.env.NEXT_PUBLIC_APP_URL || 'https://launchit.site',
    }
}
