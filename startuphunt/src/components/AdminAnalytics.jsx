import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Users,
    Eye,
    Heart,
    MessageSquare,
    Rocket,
    TrendingUp,
    Calendar,
    BarChart3,
    Activity,
    Globe,
    AlertTriangle
} from 'lucide-react';

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProjects: 0,
        totalLikes: 0,
        totalPitches: 0,
        recentSignups: [],
        topProjects: [],
        userGrowth: []
    });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchAnalyticsData();
        }
    }, [timeRange, isAdmin]);

    const checkAdminStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile?.role === 'admin') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            setIsAdmin(false);
        }
    };

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            // Fetch basic stats
            const [
                { count: userCount },
                { count: projectCount },
                { count: likeCount },
                { count: pitchCount }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('projects').select('*', { count: 'exact', head: true }),
                supabase.from('project_likes').select('*', { count: 'exact', head: true }),
                supabase.from('pitch_submissions').select('*', { count: 'exact', head: true })
            ]);

            // Fetch recent signups
            const { data: recentUsers } = await supabase
                .from('profiles')
                .select('id, username, full_name, created_at, avatar_url')
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch top projects by likes
            const { data: topProjects } = await supabase
                .from('projects')
                .select(`
          id, name, tagline, category_type, created_at, logo_url,
          project_likes(count)
        `)
                .order('created_at', { ascending: false })
                .limit(5);

            // Calculate user growth over time
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

            const { data: userGrowth } = await supabase
                .from('profiles')
                .select('created_at')
                .gte('created_at', daysAgo.toISOString())
                .order('created_at', { ascending: true });

            // Group by date
            const growthData = userGrowth?.reduce((acc, user) => {
                const date = new Date(user.created_at).toLocaleDateString();
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {}) || {};

            setStats({
                totalUsers: userCount || 0,
                totalProjects: projectCount || 0,
                totalLikes: likeCount || 0,
                totalPitches: pitchCount || 0,
                recentSignups: recentUsers || [],
                topProjects: topProjects || [],
                userGrowth: Object.entries(growthData).map(([date, count]) => ({ date, count }))
            });

        } catch (error) {
            // Error fetching analytics
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
        <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-md font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-full bg-${color}-100`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
            </div>
        </div>
    );

    // Check if user is admin
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                    <p className="text-gray-600">You need admin privileges to view analytics.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                    <p className="text-gray-600">Overview of your platform's performance</p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-md"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Total Projects"
                    value={stats.totalProjects}
                    icon={Rocket}
                    color="green"
                />
                <StatCard
                    title="Total Likes"
                    value={stats.totalLikes}
                    icon={Heart}
                    color="red"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {stats.userGrowth.map((item, index) => (
                            <div key={index} className="flex flex-col items-center space-y-2">
                                <div
                                    className="bg-blue-500 rounded-t w-8"
                                    style={{ height: `${(item.count / Math.max(...stats.userGrowth.map(x => x.count))) * 200}px` }}
                                ></div>
                                <span className="text-sm text-gray-500">{item.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Projects */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Projects</h3>
                    <div className="space-y-3">
                        {stats.topProjects.map((project, index) => (
                            <div key={project.id} className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-md font-medium text-gray-600">{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-md font-medium text-gray-900 truncate">{project.name}</p>
                                    <p className="text-sm text-gray-500">{project.category_type}</p>
                                </div>
                                <div className="text-md text-gray-600">
                                    {project.project_likes?.[0]?.count || 0} likes
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Signups</h3>
                <div className="space-y-3">
                    {stats.recentSignups.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full" />
                                ) : (
                                    <span className="text-md font-medium text-gray-600">
                                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-md font-medium text-gray-900">{user.full_name || user.username}</p>
                                <p className="text-sm text-gray-500">
                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Google Analytics Integration Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="text-md font-medium text-blue-900">Google Analytics Integration</h4>
                        <p className="text-md text-blue-700 mt-1">
                            Your site is now tracking page views, user actions, and events.
                            View detailed analytics in your{' '}
                            <a
                                href="https://analytics.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                            >
                                Google Analytics dashboard
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics; 