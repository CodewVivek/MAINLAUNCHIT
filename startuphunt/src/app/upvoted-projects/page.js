'use client';

import UserProfileClient from '@/components/pages/UserProfileClient';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function UpvotedProjectsPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8">
                <UserProfileClient />
            </div>
        </ProtectedRoute>
    );
}
