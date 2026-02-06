// Force profile to be dynamic so useSearchParams in UserProfileClient works at build time (no prerender).
export const dynamic = 'force-dynamic';

export default function ProfileLayout({ children }) {
    return children;
}
