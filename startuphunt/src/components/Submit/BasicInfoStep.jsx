'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Rocket, ArrowRight, X, Plus, Clock } from 'lucide-react';
import CategorySearch from './CategorySearch';
import BuiltWithSelect from './BuiltWithSelect';

export default function BasicInfoStep({ formData, onChange, onAIGenerate, handleNext, handleSaveDraft, isStepValid, isEditing = false }) {
    const [taglineCount, setTaglineCount] = useState(formData.tagline?.length || 0);
    const [descriptionCount, setDescriptionCount] = useState(formData.description?.split(' ').length || 0);
    const [newTag, setNewTag] = useState('');

    const addTag = () => {
        if (newTag.trim() && (formData.tags || []).length < 5) {
            const newTags = [...(formData.tags || []), newTag.trim()];
            onChange('tags', newTags);
            setNewTag('');
        }
    };

    const removeTag = (index) => {
        const newTags = (formData.tags || []).filter((_, i) => i !== index);
        onChange('tags', newTags);
    };

    const handleTaglineChange = (e) => {
        const value = e.target.value;
        if (value.length <= 60) {
            setTaglineCount(value.length);
            onChange('tagline', value);
        }
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount <= 260) {
            setDescriptionCount(wordCount);
            onChange('description', value);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                    Tell us about your product
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We'll need its name, URL, tagline, and description to get started.
                </p>
            </div>

            <div className="space-y-6">
                {/* Product Name & Website URL Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">Project name <span className="text-red-500">*</span></span>
                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">{formData.name?.length || 0}/45</span>
                        </label>
                        <input
                            type="text"
                            maxLength={45}
                            value={formData.name || ''}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder="Launchit"
                            className="w-full px-4 h-11 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1">
                            Project URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.websiteUrl || ''}
                            onChange={(e) => onChange('websiteUrl', e.target.value)}
                            placeholder="https://launchit.site/"
                            className="w-full px-4 h-11 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Row 2: Tagline & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                                Tagline <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                                {taglineCount}/60
                            </span>
                        </div>
                        <input
                            type="text"
                            value={formData.tagline || ''}
                            onChange={handleTaglineChange}
                            placeholder="Where Builders Launch Projects"
                            className="w-full px-4 h-11 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative z-20">
                        <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">Category(ies) <span className="text-red-500">*</span></span>
                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest ml-auto">Upto 3</span>
                        </label>
                        <CategorySearch
                            value={formData.category}
                            onChange={(val) => onChange('category', val)}
                        />
                    </div>
                </div>

                {/* Row 3: Tags & Built With */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Built With Section (Moved to match reference better) */}
                    <div>
                        <BuiltWithSelect
                            value={formData.builtWith || []}
                            onChange={(val) => onChange('builtWith', val)}
                        />
                    </div>

                    {/* Tags Section */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                Tags
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">Optional</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-blue-600/30" />
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                                    {(formData.tags || []).length}/5
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Add a tag..."
                                className="flex-1 px-4 h-11 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm"
                            />
                            <button
                                onClick={addTag}
                                className="px-6 h-11 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all font-bold text-xs uppercase tracking-widest"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                            {(formData.tags || []).map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 border border-border text-foreground rounded-md text-[11px] font-medium hover:border-blue-600/50 transition-colors"
                                >
                                    {tag}
                                    <button onClick={() => removeTag(index)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                        <X className="w-3 h-3" strokeWidth={3} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                            Description (Highly recommended) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-muted-foreground/40 font-medium">
                            {descriptionCount}/260 words
                        </span>
                    </div>
                    <div className="relative">
                        <textarea
                            value={formData.description || ''}
                            onChange={handleDescriptionChange}
                            placeholder="Description (Highly recommended) Significantly boosts your SEO and makes your project easier to find on Google."
                            rows={6}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/5 transition-all resize-none leading-relaxed"
                        />
                    </div>
                </div>

                {/* Relaunch Protocol (Only if needed) */}
                {formData.isRelaunch && (
                    <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-4 animate-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                            <Rocket className="w-5 h-5" />
                            <h3 className="text-sm uppercase tracking-tight">Relaunch Protocol</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {['minor', 'major'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => onChange('relaunchType', type)}
                                    className={`py-3 rounded-lg border transition-all font-bold uppercase tracking-tight text-[10px] ${formData.relaunchType === type
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-background border-border text-muted-foreground hover:border-blue-200'
                                        }`}
                                >
                                    {type} Update
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={formData.relaunchUpdateNotes || ''}
                            onChange={(e) => onChange('relaunchUpdateNotes', e.target.value)}
                            placeholder="What's new in this version?"
                            rows={3}
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-600 transition-all resize-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
