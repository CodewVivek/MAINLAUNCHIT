'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Shows "Signed in successfully!" when user lands with ?signed_in=1 (e.g. after Google OAuth).
 * Clears the param so the toast only fires once. Uses window.location to avoid useSearchParams in layout.
 */
export default function AuthSuccessToast() {
    const shown = useRef(false);

    useEffect(() => {
        if (shown.current || typeof window === 'undefined') return;
        const signedIn = new URLSearchParams(window.location.search).get('signed_in') === '1';
        if (!signedIn) return;

        const checkAndShow = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                shown.current = true;
                toast.success('Signed in successfully!', { icon: '✅', duration: 4000 });
                const url = new URL(window.location.href);
                url.searchParams.delete('signed_in');
                window.history.replaceState({}, '', url.pathname + url.search);
            }
        };
        checkAndShow();
    }, []);

    return null;
}
