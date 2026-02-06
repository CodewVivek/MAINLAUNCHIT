// Base Skeleton Component
export const Skeleton = ({ className = "", variant = "rectangular", animation = "pulse" }) => {
    const baseClasses = "bg-gray-200";
    const animationClasses = animation === "pulse"
        ? "animate-pulse"
        : animation === "wave"
            ? "animate-shimmer"
            : "";

    const variantClasses = variant === "circular"
        ? "rounded-full"
        : variant === "rounded"
            ? "rounded-lg"
            : "rounded";

    return <div className={`${baseClasses} ${animationClasses} ${variantClasses} ${className}`} />;
};

// Project Card Skeleton
export const ProjectCardSkeleton = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            {/* Header with logo and title */}
            <div className="flex items-start gap-3">
                <Skeleton variant="rounded" className="w-12 h-12 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Tags */}
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>
    );
};

// Project Details Skeleton
export const ProjectDetailsSkeleton = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Cover Image */}
                    <Skeleton className="w-full h-64 md:h-96" />

                    {/* Title and CTA */}
                    <div className="text-center space-y-4">
                        <Skeleton className="h-10 w-3/4 mx-auto" />
                        <Skeleton className="h-6 w-1/2 mx-auto" />
                        <div className="flex gap-4 justify-center">
                            <Skeleton className="h-12 w-40 rounded-full" />
                            <Skeleton className="h-12 w-24 rounded-full" />
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 w-full" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// User Profile Skeleton
export const UserProfileSkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-start gap-6">
                    <Skeleton variant="circular" className="w-24 h-24" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
            </div>
        </div>
    );
};

// Comments Skeleton
export const CommentsSkeleton = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Dashboard Grid Skeleton
export const DashboardSkeleton = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero */}
            <div className="mb-8 space-y-4">
                <Skeleton className="h-12 w-64 mx-auto" />
                <Skeleton className="h-6 w-96 mx-auto" />
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProjectCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

// Settings Skeleton (already existed, but keeping it unified)
export const SettingsSkeleton = () => {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <Skeleton className="h-8 w-48" />

                {/* Form Fields */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                ))}

                <Skeleton className="h-12 w-32 rounded-lg ml-auto" />
            </div>
        </div>
    );
};

// Form/Register Skeleton
export const FormSkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
                {/* Header */}
                <div className="space-y-3">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Form Sections */}
                {[1, 2].map((section) => (
                    <div key={section} className="space-y-6 pt-6 border-t border-gray-100 first:border-0 first:pt-0">
                        <Skeleton className="h-6 w-48" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((field) => (
                                <div key={field} className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Large Text Area */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>

                {/* Submit Button */}
                <Skeleton className="h-14 w-full rounded-xl" />
            </div>
        </div>
    );
};

// Search Page Skeleton
export const SearchSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Search Bar Area */}
                <Skeleton className="h-14 w-full rounded-2xl" />

                {/* Results Section */}
                <div className="space-y-6">
                    {[1, 2].map((group) => (
                        <div key={group} className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-3">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                                        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Stats Card Skeleton (for Admin Dashboard)
export const StatsSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <Skeleton variant="circular" className="w-12 h-12" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-7 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Table Skeleton (for Admin Dashboard)
export const TableSkeleton = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <th key={i} className="px-6 py-4">
                                    <Skeleton className="h-4 w-24" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[1, 2, 3, 4, 5].map((row) => (
                            <tr key={row}>
                                {[1, 2, 3, 4, 5].map((col) => (
                                    <td key={col} className="px-6 py-4">
                                        <Skeleton className="h-4 w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Connection/User List Skeleton (Followers/Following)
export const ConnectionSkeleton = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-4 py-6">
            <Skeleton className="h-8 w-48 mb-6" />
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 text-left">
                        <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            ))}
        </div>
    );
};
