import React, { useState, useEffect } from 'react';
import { getModerationQueue, updateModerationStatus } from '../utils/aiApi';
import { toast } from 'react-hot-toast';

const AdminModerationDashboard = () => {
    const [moderationRecords, setModerationRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('pending_review');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadModerationQueue();
    }, [selectedStatus]);

    const loadModerationQueue = async () => {
        setLoading(true);
        try {
            const result = await getModerationQueue(selectedStatus, 50);
            setModerationRecords(result.records || []);
        } catch (error) {

            toast.error('Failed to load moderation queue');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (recordId, action) => {
        setUpdating(true);
        try {
            await updateModerationStatus(recordId, action, adminNotes);

            // Update local state
            setModerationRecords(prev =>
                prev.map(record =>
                    record.id === recordId
                        ? { ...record, status: action, admin_notes: adminNotes }
                        : record
                )
            );

            // Close modal
            setSelectedRecord(null);
            setAdminNotes('');

            toast.success(`Content ${action} successfully`);

            // Reload queue if needed
            if (action !== 'pending_review') {
                loadModerationQueue();
            }

        } catch (error) {

            toast.error('Failed to update moderation status');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_review': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
            'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
            'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' }
        };

        const config = statusConfig[status] || statusConfig['pending_review'];

        return (
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getContentTypeBadge = (contentType) => {
        return (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {contentType.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="admin-moderation-dashboard p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Content Moderation Dashboard
                </h1>
                <p className="text-gray-600">
                    Review and manage flagged content from users
                </p>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
                <div className="flex gap-2">
                    {['pending_review', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status.replace('_', ' ').toUpperCase()}
                            <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                                {moderationRecords.filter(r => r.status === status).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Moderation Records */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {moderationRecords.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-lg">No {selectedStatus.replace('_', ' ')} content found</p>
                        <p className="text-md">All caught up! 🎉</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        Content
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {moderationRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <p className="text-md text-gray-900 font-medium">
                                                    {truncateContent(record.content)}
                                                </p>
                                                {record.moderation_result?.issues?.length > 0 && (
                                                    <div className="mt-1">
                                                        <p className="text-sm text-red-600 font-medium">Issues:</p>
                                                        <ul className="text-sm text-red-600">
                                                            {record.moderation_result.issues.slice(0, 2).map((issue, index) => (
                                                                <li key={index}>• {issue}</li>
                                                            ))}
                                                            {record.moderation_result.issues.length > 2 && (
                                                                <li>• +{record.moderation_result.issues.length - 2} more</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getContentTypeBadge(record.content_type)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-md text-gray-900">
                                                {record.username || 'Unknown User'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {record.email || 'No email'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(record.status)}
                                        </td>
                                        <td className="px-6 py-4 text-md text-gray-500">
                                            {formatDate(record.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.status === 'pending_review' && (
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="text-blue-600 hover:text-blue-800 text-md font-medium"
                                                >
                                                    Review
                                                </button>
                                            )}
                                            {record.status !== 'pending_review' && (
                                                <span className="text-gray-400 text-md">
                                                    {record.status === 'approved' ? 'Approved' : 'Rejected'}
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

            {/* Review Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Review Content
                            </h3>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        {/* Content Details */}
                        <div className="mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Content:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.content}</p>
                            </div>
                        </div>

                        {/* Relaunch Request Details */}
                        {selectedRecord.content_type === 'relaunch_request' && (
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">Relaunch Details:</h4>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-md text-blue-800">
                                        <p><span className="font-bold">Update Type:</span> {selectedRecord.moderation_result?.relaunch_type?.toUpperCase()}</p>
                                        <p className="mt-2 text-sm italic">{selectedRecord.moderation_result?.update_notes}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Moderation Result (AI Analysis) */}
                        {selectedRecord.content_type !== 'relaunch_request' && (
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">AI Analysis:</h4>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="text-md text-yellow-800">
                                        <p className="font-medium mb-2">Issues Detected:</p>
                                        <ul className="space-y-1">
                                            {selectedRecord.moderation_result?.issues?.map((issue, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-yellow-600 mt-1">•</span>
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                            {(!selectedRecord.moderation_result?.issues || selectedRecord.moderation_result.issues.length === 0) && (
                                                <li>No critical issues flagged by AI.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Notes */}
                        <div className="mb-4">
                            <label className="block text-md font-medium text-gray-700 mb-2">
                                Admin Notes (Optional):
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add notes about your decision..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleStatusUpdate(selectedRecord.id, 'approved')}
                                disabled={updating}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? 'Approving...' : 'Approve Content'}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(selectedRecord.id, 'rejected')}
                                disabled={updating}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? 'Rejecting...' : 'Reject Content'}
                            </button>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                disabled={updating}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModerationDashboard; 