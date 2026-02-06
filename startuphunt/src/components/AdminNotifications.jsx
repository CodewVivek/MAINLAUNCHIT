import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Bell, Send, Users, User } from 'lucide-react';

const AdminNotifications = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        type: 'single', // 'single' or 'all'
        selectedUserId: '',
        title: '',
        message: '',
        notificationType: 'admin_notification'
    });

    useEffect(() => {
        if (formData.type === 'single') {
            fetchUsers();
        }
    }, [formData.type]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, username')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (formData.type === 'single' && !formData.selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        if (!formData.title || !formData.message) {
            toast.error('Please fill in all fields');
            return;
        }

        setSending(true);
        try {
            let notificationsToSend = [];

            if (formData.type === 'single') {
                notificationsToSend.push({
                    user_id: formData.selectedUserId,
                    type: formData.notificationType,
                    title: formData.title,
                    message: formData.message,
                    read: false,
                    created_at: new Date().toISOString()
                });
            } else {
                // Fetch all user IDs if sending to all
                const { data: allUsers, error: usersError } = await supabase
                    .from('profiles')
                    .select('id');

                if (usersError) throw usersError;

                notificationsToSend = allUsers.map(user => ({
                    user_id: user.id,
                    type: formData.notificationType,
                    title: formData.title,
                    message: formData.message,
                    read: false,
                    created_at: new Date().toISOString()
                }));
            }

            const { error } = await supabase
                .from('notifications')
                .insert(notificationsToSend);

            if (error) throw error;

            toast.success(`Notification sent to ${formData.type === 'single' ? 'user' : 'all users'} successfully!`);

            // Reset form
            setFormData({
                type: 'single',
                selectedUserId: '',
                title: '',
                message: '',
                notificationType: 'admin_notification'
            });

        } catch (error) {
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Send Notifications</h2>
                <p className="text-sm text-gray-500">Send alerts to specific users or broadcast to everyone</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <form onSubmit={handleSend} className="space-y-6">
                    {/* Recipient Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Recipient</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'single' })}
                                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${formData.type === 'single'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span className="font-medium">Single User</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'all' })}
                                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${formData.type === 'all'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span className="font-medium">All Users</span>
                            </button>
                        </div>
                    </div>

                    {/* User Selection (if single) */}
                    {formData.type === 'single' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                            {loadingUsers ? (
                                <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                            ) : (
                                <select
                                    value={formData.selectedUserId}
                                    onChange={(e) => setFormData({ ...formData, selectedUserId: e.target.value })}
                                    className="w-full h-10 pl-3 pr-10 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    required
                                >
                                    <option value="">Choose a user...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name || user.username} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Notification Title"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={4}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Type your message here..."
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                Send Notification
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminNotifications;
