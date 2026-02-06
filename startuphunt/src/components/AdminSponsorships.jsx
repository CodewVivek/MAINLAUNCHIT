import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import {
    Zap,
    Crown,
    Calendar,
    ExternalLink,
    Eye,
    XCircle,
    CheckCircle2,
    DollarSign,
    UserCircle
} from 'lucide-react';

const AdminSponsorships = () => {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSponsors();
    }, []);

    const fetchSponsors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('is_sponsored', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSponsors(data || []);
        } catch (error) {
            toast.error('Failed to fetch active sponsors');
        } finally {
            setLoading(false);
        }
    };

    const deactivateSponsorship = async (projectId) => {
        if (!window.confirm('Are you sure you want to deactivate this sponsorship?')) return;

        const toastId = toast.loading('Deactivating...');
        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    is_sponsored: false,
                    sponsored_tier: 'none'
                })
                .eq('id', projectId);

            if (error) throw error;

            toast.success('Sponsorship deactivated', { id: toastId });
            setSponsors(sponsors.filter(s => s.id !== projectId));
        } catch (error) {
            toast.error('Failed to deactivate', { id: toastId });
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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Active Sponsorships</h2>
                    <p className="text-sm text-gray-500">Overview of all premium and highlighted projects</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                        <Crown className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">
                            {sponsors.filter(s => (s.sponsored_tier || '').toLowerCase() === 'premium').length} Premium
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-100">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-700">
                            {sponsors.filter(s => (s.sponsored_tier || '').toLowerCase() === 'highlight').length} Highlights
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sponsors.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {project.logo_url ? (
                                                    <img className="h-10 w-10 rounded-lg object-cover" src={project.logo_url} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                                                        {project.name?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                                <div className="text-sm text-gray-500">{project.tagline}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full
                                            ${(project.sponsored_tier || '').toLowerCase() === 'premium'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-yellow-500 text-white shadow-sm'}`}>
                                            {(project.sponsored_tier || '').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                            {project.sponsorship_source === 'paid' ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <DollarSign className="w-4 h-4" />
                                                    <span>Paid Stripe</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-purple-600">
                                                    <UserCircle className="w-4 h-4" />
                                                    <span>Admin/Manual</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Active
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <a
                                                href={`/launches/${project.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title="View Page"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </a>
                                            <button
                                                onClick={() => deactivateSponsorship(project.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Stop Sponsorship"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sponsors.length === 0 && (
                    <div className="p-12 text-center">
                        <Crown className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No active sponsors</h3>
                        <p className="text-gray-500">Go to the Projects tab to promote a project.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSponsorships;
