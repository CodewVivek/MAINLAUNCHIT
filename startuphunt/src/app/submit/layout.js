// Force submit to be dynamic so useSearchParams works at build time (no prerender).
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';

function SubmitLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        </div>
    );
}

export default function SubmitLayout({ children }) {
    return (
        <Suspense fallback={<SubmitLoading />}>
            {children}
        </Suspense>
    );
}
