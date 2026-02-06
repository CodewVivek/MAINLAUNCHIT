'use client';

import { useState } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminAnalytics from '@/components/AdminAnalytics';
import AdminModerationDashboard from '@/components/AdminModerationDashboard';
import AdminProjects from '@/components/AdminProjects';
import AdminSponsorships from '@/components/AdminSponsorships';
import AdminReports from '@/components/AdminReports';
import AdminNotifications from '@/components/AdminNotifications';
import AdminFeedback from '@/components/AdminFeedback';
import AdminBlog from '@/components/AdminBlog';
import {
    LayoutDashboard,
    ShieldAlert,
    Package,
    Flag,
    Bell,
    Zap,
    MessageSquare,
    BookOpen
} from 'lucide-react';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('analytics');

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics': return <AdminAnalytics />;
            case 'moderation': return <AdminModerationDashboard />;
            case 'projects': return <AdminProjects />;
            case 'sponsorships': return <AdminSponsorships />;
            case 'blog': return <AdminBlog />;
            case 'reports': return <AdminReports />;
            case 'notifications': return <AdminNotifications />;
            case 'feedback': return <AdminFeedback />;
            default: return <AdminAnalytics />;
        }
    };

    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
        { id: 'moderation', label: 'Moderation Queue', icon: ShieldAlert },
        { id: 'projects', label: 'Projects', icon: Package },
        { id: 'sponsorships', label: 'Sponsorships', icon: Zap },
        { id: 'blog', label: 'Blog Posts', icon: BookOpen },
        { id: 'reports', label: 'Reports', icon: Flag },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    ];

    return (
        <AdminProtectedRoute>
            <div className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-2">Manage your platform, users, and content</p>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden mb-6">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm"
                        >
                            {tabs.map((tab) => (
                                <option key={tab.id} value={tab.id}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Content Area */}
                    <div className="bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </AdminProtectedRoute>
    );
}
