import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Check, X, AlertTriangle, MessageSquare, ExternalLink } from 'lucide-react';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // First, fetch reports with project and comment data
            const { data: reportsData, error: reportsError } = await supabase
                .from("reports")
                .select(
                    ` *,
                    projects:project_id (id, name, slug, website_url),
                    comments:comment_id (id, content, project_id, projects (id, name, slug))`
                )
                .order("created_at", { ascending: false });

            if (reportsError) throw reportsError;

            // Then, fetch user profiles for all unique user IDs
            if (reportsData && reportsData.length > 0) {
                const userIds = [...new Set(reportsData.map((r) => r.user_id))];
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, full_name, email")
                    .in("id", userIds);

                const profilesMap = {};
                profilesData?.forEach((profile) => {
                    profilesMap[profile.id] = profile;
                });

                const combinedData = reportsData.map((report) => ({
                    ...report,
                    profiles: profilesMap[report.user_id],
                }));

                setReports(combinedData);
            } else {
                setReports([]);
            }
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const updateReportStatus = async (reportId, status) => {
        try {
            const { error } = await supabase
                .from("reports")
                .update({
                    status: status,
                    resolved_at: status !== "pending" ? new Date().toISOString() : null,
                })
                .eq("id", reportId);

            if (error) throw error;

            toast.success('Report updated successfully');

            // Update local state
            setReports(prev => prev.map(report =>
                report.id === reportId ? { ...report, status: status } : report
            ));
        } catch (error) {
            toast.error('Failed to update report status');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending": return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>;
            case "resolved": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Resolved</span>;
            case "ignored": return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">Ignored</span>;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
                <p className="text-sm text-gray-500">Review content flagged by users</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                {reports.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">No pending reports</p>
                        <p>Great job! The community is safe.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{report.profiles?.full_name || 'Anonymous'}</div>
                                            <div className="text-xs text-gray-500">{report.profiles?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-red-600 capitalize">{report.reason}</span>
                                            {report.details && <p className="text-xs text-gray-500 mt-1">{report.details}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {report.projects ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Project</span>
                                                    <a href={`/launches/${report.projects.slug}`} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        {report.projects.name} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            ) : report.comments ? (
                                                <div>
                                                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded mb-1 inline-block">Comment</span>
                                                    <p className="text-sm text-gray-600 italic">"{report.comments.content}"</p>
                                                    {report.comments.projects && (
                                                        <a href={`/launches/${report.comments.projects.slug}`} target="_blank" className="text-xs text-gray-400 hover:underline">
                                                            on {report.comments.projects.name}
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Content deleted</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(report.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {report.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updateReportStatus(report.id, 'resolved')}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full hover:bg-green-100 transition-colors"
                                                        title="Resolve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateReportStatus(report.id, 'ignored')}
                                                        className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                                        title="Ignore"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {report.status !== 'pending' && (
                                                <span className="text-xs text-gray-400">
                                                    {new Date(report.resolved_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
