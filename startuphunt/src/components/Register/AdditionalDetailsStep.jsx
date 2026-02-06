import React from 'react';
import { X } from 'lucide-react';
import BuiltWithSelect from '../BuiltWithSelect';
import LinksManager from './LinksManager';

const AdditionalDetailsStep = ({
    links,
    updateLink,
    addLink,
    removeLink,
    builtWith,
    setBuiltWith,
    tags,
    setTags,
}) => {
    // Safety checks: ensure arrays are always arrays
    const safeTags = Array.isArray(tags) ? tags : [];
    const safeLinks = Array.isArray(links) ? links : [];
    const safeBuiltWith = Array.isArray(builtWith) ? builtWith : [];

    const handleAddTag = (newTag) => {
        if (!newTag) return;
        const normalized = newTag.trim();
        if (!normalized) return;

        // Check if already at limit (5 tags max)
        if (safeTags.length >= 5) {
            return; // Don't add if limit reached
        }

        // Prevent duplicates case-insensitive
        const exists = safeTags.some((t) => t.toLowerCase() === normalized.toLowerCase());
        if (!exists) {
            setTags((prev = []) => [...prev, normalized]);
        }
    };

    const handleRemoveTag = (indexToRemove) => {
        setTags((prev = []) => prev.filter((_, i) => i !== indexToRemove));
    };

    return (
        <div className="form-tab-panel active">
            <div className="space-y-6">
                <div className="space-y-4">
                    <LinksManager
                        links={safeLinks}
                        updateLink={updateLink}
                        addLink={addLink}
                        removeLink={removeLink}
                    />

                    <div>
                        <BuiltWithSelect value={safeBuiltWith} onChange={setBuiltWith} />
                    </div>

                    <div>
                        <label className="form-label">Tags</label>
                        <div className="space-y-2 mt-2">
                            <div className="flex flex-wrap gap-2">
                                {safeTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-md"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(index)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <input
                                type="text"
                                placeholder={safeTags.length >= 5 ? "Maximum 5 tags reached" : "Add tags (press Enter to add)"}
                                className="form-input"
                                disabled={safeTags.length >= 5}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        e.preventDefault();
                                        handleAddTag(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            />

                            <div className="text-md text-gray-500">
                                AI-generated tags appear here. You can remove them or add your own. (Max 5 tags)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdditionalDetailsStep;
