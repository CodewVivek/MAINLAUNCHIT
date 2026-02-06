// Force pricing to be dynamic so useSearchParams works at build time (no prerender).
export const dynamic = 'force-dynamic';

export default function PricingLayout({ children }) {
    return children;
}
