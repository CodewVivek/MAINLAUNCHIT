import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Centralized Google Analytics hook
 * Handles initialization and page view tracking
 * Prevents double counting and fragile initialization
 */
export const useAnalytics = () => {
    const pathname = usePathname();
    const isInitialized = useRef(false);
    const prevPath = useRef(pathname);
    const scriptLoaded = useRef(false);

    // Initialize GA on mount (only once)
    useEffect(() => {
        if (isInitialized.current) return;

        const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
        if (!gaId) return;

        // Initialize dataLayer and gtag function if not exists
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;

        // Check if script already loaded
        if (scriptLoaded.current && window.gtag) {
            // Already loaded, just configure
            window.gtag('config', gaId, {
                anonymize_ip: true,
                debug_mode: process.env.NODE_ENV === 'development',
                page_path: window.location.pathname
            });
            isInitialized.current = true;
            return;
        }

        // Load GA script if not already loaded
        if (!scriptLoaded.current) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script);

            script.onload = () => {
                scriptLoaded.current = true;
                if (window.gtag) {
                    // Configure GA with IP anonymization for GDPR compliance
                    // Track initial page load
                    window.gtag('config', gaId, {
                        anonymize_ip: true, // Required for GDPR compliance
                        debug_mode: process.env.NODE_ENV === 'development', // Only enable debug in development
                        page_path: window.location.pathname // Track initial page
                    });

                    isInitialized.current = true;
                }
            };

            script.onerror = () => {};
        }
    }, []);

    // Track page views on route change (skip initial mount to avoid double counting)
    useEffect(() => {
        if (!isInitialized.current || !scriptLoaded.current) return; // Wait for initialization
        if (prevPath.current === location.pathname) return; // Skip if path didn't change

        if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
            window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
                page_path: pathname
            });
        }

        prevPath.current = pathname;
    }, [pathname]);
};

