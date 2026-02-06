import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import {
    Trash2,
    User,
    Calendar,
    Search,
    MessageSquare,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const AdminFeedback = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('community_feedback')
                .select('id, user_id, user_email, content, status, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFeedback(data || []);
        } catch (error) {
            console.error('Feedback fetch error:', error);
            toast.error(error?.message || 'Failed to fetch feedback');
        } finally {
            setLoading(false);
        }
    };

    const deleteFeedback = async (id) => {
        if (!window.confirm('Delete this feedback entry?')) return;

        try {
            const { error } = await supabase
                .from('community_feedback')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setFeedback(feedback.filter(f => f.id !== id));
            toast.success('Feedback deleted');
        } catch (error) {
            toast.error('Failed to delete feedback');
        }
    };

    const filteredFeedback = feedback.filter(item =>
        (item.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">User Feedback</h2>
                    <p className="text-sm text-gray-500">View and manage suggestions from the community</p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search feedback..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {filteredFeedback.length > 0 ? (
                        filteredFeedback.map((item) => (
                            <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 truncate">
                                                {item.content?.slice(0, 50) || 'Feedback'}{item.content?.length > 50 ? '…' : ''}
                                            </span>
                                            {item.created_at && (
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-5 w-5 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                                                <User className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">
                                                {item.user_email || 'anonymous'}
                                            </span>
                                        </div>

                                        <p className={`text-sm text-gray-600 leading-relaxed ${expandedId === item.id ? '' : 'line-clamp-2'}`}>
                                            {item.content}
                                        </p>

                                        {item.content?.length > 150 && (
                                            <button
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                className="text-xs text-primary font-bold mt-2 flex items-center gap-1"
                                            >
                                                {expandedId === item.id ? (
                                                    <>Show Less <ChevronUp className="w-3 h-3" /></>
                                                ) : (
                                                    <>Read More <ChevronDown className="w-3 h-3" /></>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => deleteFeedback(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Feedback"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No feedback found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminFeedback;
