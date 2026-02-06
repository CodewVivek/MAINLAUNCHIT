import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import {
    Trash2,
    ExternalLink,
    Eye,
    Search,
    Calendar,
    ArrowUp,
    ArrowDown,
    Crown,
    Zap,
    X,
    DollarSign,
    UserCircle,
    AlertCircle
} from 'lucide-react';

const AdminProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

    useEffect(() => {
        fetchProjects();
    }, [sortOrder]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: sortOrder === 'oldest' });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            toast.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const updateSponsorship = async (projectId, type) => {
        const toastId = toast.loading('Updating sponsorship...');
        try {
            const lowerType = type.toLowerCase();
            const isSponsored = lowerType !== 'none';

            const { data: updateData, error } = await supabase
                .from('projects')
                .update({
                    sponsored_tier: lowerType,
                    is_sponsored: isSponsored
                })
                .eq('id', projectId)
                .select();

            if (error) throw error;

            // Detect RLS/Permission block
            if (!updateData || updateData.length === 0) {
                toast.error('Permission Denied: Your admin account may not have database update permissions. Please run the SQL fix.', { id: toastId, duration: 5000 });
                return;
            }
            toast.success(`Sponsorship updated to ${type}`, { id: toastId });

            // Update local state
            setProjects(projects.map(p =>
                p.id === projectId ? { ...p, sponsored_tier: lowerType, is_sponsored: isSponsored } : p
            ));
        } catch (error) {
            toast.error('Failed to update sponsorship. Please try again.', { id: toastId });
        }
    };

    const deleteProject = async (projectId, mediaUrls = []) => {
        if (!window.confirm('Are you sure you want to delete this project and all its associated data? This action cannot be undone.')) {
            return;
        }

        const toastId = toast.loading('Deleting project...');

        try {
            // 1. Delete likes
            await supabase.from('project_likes').delete().eq('project_id', projectId);

            // 2. Delete comments
            await supabase.from('comments').delete().eq('project_id', projectId);

            // 3. Delete media files
            if (mediaUrls && mediaUrls.length > 0) {
                const filePaths = mediaUrls
                    .map(url => {
                        try {
                            const parts = url.split('/startup-media/');
                            return parts[1] || '';
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(Boolean);

                if (filePaths.length > 0) {
                    await supabase.storage.from('startup-media').remove(filePaths);
                }
            }

            // 4. Delete the project
            const { error } = await supabase.from('projects').delete().eq('id', projectId);

            if (error) throw error;

            toast.success('Project deleted successfully', { id: toastId });
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (error) {
            toast.error('Failed to delete project. Please try again.', { id: toastId });
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                    <p className="text-sm text-gray-500">Manage all submitted projects</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                        <Calendar className="w-4 h-4" />
                        {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProjects.map((project) => (
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
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{project.tagline}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit
                                                ${project.status === 'launched' ? 'bg-green-100 text-green-800' :
                                                    project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {project.status || 'draft'}
                                            </span>
                                            {project.sponsored_tier && project.sponsored_tier.toUpperCase() !== 'NONE' && (
                                                <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full w-fit
                                                    ${project.sponsored_tier.toUpperCase() === 'PREMIUM' ? 'bg-blue-600 text-white' : 'bg-yellow-500 text-white'}`}>
                                                    {project.sponsored_tier.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {/* Sponsorship Controls */}
                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => updateSponsorship(project.id, 'premium')}
                                                        className={`flex-1 flex items-center justify-center p-2 hover:bg-blue-50 transition-colors ${(project.sponsored_tier || '').toLowerCase() === 'premium' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                                                        title="Promote to Premium ($19)"
                                                    >
                                                        <Crown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateSponsorship(project.id, 'highlight')}
                                                        className={`flex-1 flex items-center justify-center p-2 hover:bg-yellow-50 transition-colors border-l border-gray-200 ${(project.sponsored_tier || '').toLowerCase() === 'highlight' ? 'bg-yellow-500 text-white' : 'text-gray-400'}`}
                                                        title="Promote to Highlight ($9)"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateSponsorship(project.id, 'none')}
                                                        className={`flex-1 flex items-center justify-center p-2 hover:bg-red-50 hover:text-red-600 transition-colors border-l border-gray-200 text-gray-400`}
                                                        title="Remove Promotion"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {project.is_sponsored && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight px-1">
                                                            <span className="text-purple-600 flex items-center gap-0.5"><UserCircle className="w-2.5 h-2.5" /> Admin</span>
                                                        </div>
                                                        {project.status === 'draft' && (
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 italic">
                                                                <AlertCircle className="w-2.5 h-2.5" /> Hidden (Draft)
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <a
                                                href={`/launches/${project.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="View Project"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </a>
                                            <a
                                                href={project.website_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="Visit Website"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                            <button
                                                onClick={() => deleteProject(project.id, project.media_urls || [])}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Delete Project"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProjects.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No projects found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProjects;
