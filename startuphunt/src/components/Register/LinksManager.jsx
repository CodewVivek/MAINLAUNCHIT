import React from 'react';
import { Plus, X } from 'lucide-react';
import { getLinkType } from '../../utils/registerUtils';

const LinksManager = ({ links, updateLink, addLink, removeLink }) => {
    return (
        <div>
            <label className="form-label">Links</label>
            <div className="space-y-4 mt-2">
                {links.map((link, index) => {
                    const { label, icon } = getLinkType(link);
                    return (
                        <div key={index} className="flex items-center gap-4">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-xl">
                                {icon}
                            </span>
                            <input
                                type="url"
                                value={link}
                                onChange={e => updateLink(index, e.target.value)}
                                placeholder={`Enter ${label} URL`}
                                className="form-input flex-1"
                            />
                            {links.length > 1 && (
                                <button type="button" onClick={() => removeLink(index)} className="p-2 text-red-600 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    );
                })}
                <button
                    type="button"
                    onClick={addLink}
                    className="btn-text-icon"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add another link</span>
                </button>
            </div>
        </div>
    );
};

export default LinksManager;

