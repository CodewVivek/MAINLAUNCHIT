'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Save,
    X,
    Image as ImageIcon,
    ExternalLink,
    Clock,
    User,
    Bold,
    List as ListIcon,
    Link as LinkIcon,
    Type,
    Copy,
    Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminBlog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [activePost, setActivePost] = useState(null);
    const [recentUploads, setRecentUploads] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        category: 'Guide',
        status: 'draft'
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Failed to fetch posts");
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    const handleEdit = (post) => {
        setActivePost(post);
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content,
            cover_image: post.cover_image || '',
            category: post.category || 'Guide',
            status: post.status
        });
        setIsEditing(true);
    };

    const handleNew = () => {
        setActivePost(null);
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            cover_image: '',
            category: 'Guide',
            status: 'draft'
        });
        setIsEditing(true);
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: prev.slug || generateSlug(title)
        }));
    };
    const handleMediaUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `blog-media/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('startup-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('startup-media')
                .getPublicUrl(filePath);

            setRecentUploads(prev => [{ url: publicUrl, name: file.name, id: fileName }, ...prev]);
            toast.success("Image uploaded!");

            // Auto-append to content
            setFormData(prev => ({
                ...prev,
                content: prev.content + `\n\n![${file.name}](${publicUrl})\n`
            }));
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(`![Image](${text})`);
        setCopiedId(id);
        toast.success("Markdown copied!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const insertFormat = (prefix, suffix = '') => {
        const textarea = document.getElementById('blog-editor');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const selection = text.substring(start, end);

        const newContent = before + prefix + selection + suffix + after;
        setFormData(prev => ({ ...prev, content: newContent }));

        // Refocus and place cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                end + prefix.length
            );
        }, 0);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.slug || !formData.content) {
            toast.error("Title, Slug, and Content are required");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        const postData = {
            ...formData,
            author_id: user.id
        };

        let error;
        if (activePost) {
            const { error: updateError } = await supabase
                .from('blog_posts')
                .update(postData)
                .eq('id', activePost.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('blog_posts')
                .insert([postData]);
            error = insertError;
        }

        if (error) {
            toast.error("Failed to save post");
        } else {
            toast.success("Post saved successfully");
            setIsEditing(false);
            fetchPosts();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Failed to delete post");
        } else {
            toast.success("Post deleted");
            fetchPosts();
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{activePost ? 'Edit Post' : 'New Blog Post'}</h2>
                        <p className="text-sm text-gray-500">Draft your next platform article</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Post
                        </button>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Post Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="How to get 100 upvotes in 24h"
                                className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 text-lg font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                                >
                                    <option value="Article">Article</option>
                                    <option value="Case Study">Case Study</option>
                                    <option value="Milestone">Milestone</option>
                                    <option value="News">News</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Cover Image URL</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.cover_image}
                                        onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 pl-10 p-3 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Excerpt (Short Summary)</label>
                            <textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={2}
                                className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 text-sm"
                                placeholder="A brief summary for the blog list..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight text-blue-600">Post Status</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${formData.status === 'draft' ? 'bg-gray-100 border-gray-300 text-gray-700 shadow-inner' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                >
                                    Draft
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, status: 'published' })}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${formData.status === 'published' ? 'bg-green-50 border-green-200 text-green-700 shadow-inner' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                >
                                    Published
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col h-full min-h-[500px] space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight flex items-center gap-2">
                                <Type className="w-4 h-4 text-blue-600" /> Content (Markdown)
                            </label>
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => insertFormat('**', '**')}
                                    className="p-1.5 hover:bg-white rounded-md transition-all text-gray-600 hover:text-blue-600"
                                    title="Bold"
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => insertFormat('- ')}
                                    className="p-1.5 hover:bg-white rounded-md transition-all text-gray-600 hover:text-blue-600"
                                    title="List"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => insertFormat('[', '](url)')}
                                    className="p-1.5 hover:bg-white rounded-md transition-all text-gray-600 hover:text-blue-600"
                                    title="Link"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow flex gap-6">
                            <textarea
                                id="blog-editor"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="flex-grow w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl font-mono p-6 text-sm leading-relaxed border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                                placeholder="# Write your masterpiece here..."
                            ></textarea>

                            {/* Media Sidebar */}
                            <div className="w-72 flex flex-col space-y-4">
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Blog Media Studio</h4>
                                    <label className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                                        <input type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" disabled={uploading} />
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-6 h-6 text-blue-400 mb-2" />
                                                <span className="text-[10px] font-bold text-blue-600">UPLOAD IMAGE</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <div className="flex-grow overflow-y-auto max-h-[400px] space-y-3 pr-2 scrollbar-thin">
                                    {recentUploads.map((img) => (
                                        <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                                            <img src={img.url} className="w-full h-24 object-cover" alt="Uploaded" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => copyToClipboard(img.url, img.id)}
                                                    className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                    title="Copy Markdown"
                                                >
                                                    {copiedId === img.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {recentUploads.length === 0 && (
                                        <div className="py-10 text-center border border-dashed border-gray-200 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">No uploads yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={handleNew}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    Write New Post
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-20 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-sm font-medium">Loading your stories...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <Edit className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No articles yet</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Start writing articles to build authority and help makers grow their startups.</p>
                    <button onClick={handleNew} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                        Write your first post <Plus className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                        <div key={post.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                            <div className="relative h-48 bg-gray-100">
                                {post.cover_image ? (
                                    <img src={post.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={post.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${post.status === 'published' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                                        {post.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex-grow flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{post.category || 'Guide'}</span>
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{post.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-6">{post.excerpt || 'No excerpt provided.'}</p>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(post)}
                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            title="Edit Post"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                            title="Delete Post"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <a
                                        href={`/blog/${post.slug}`}
                                        target="_blank"
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                        title="View Live"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminBlog;
