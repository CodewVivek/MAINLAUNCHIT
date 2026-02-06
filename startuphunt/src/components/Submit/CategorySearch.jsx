'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import categoryOptions from '../categoryOptions';

export default function CategorySearch({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Flatten options for easier searching but keep group info
    const allOptions = useMemo(() => {
        const flattened = [];
        categoryOptions.forEach(group => {
            group.options.forEach(opt => {
                flattened.push({
                    ...opt,
                    groupLabel: group.label
                });
            });
        });
        return flattened;
    }, []);

    // Filtered options based on search
    const filteredGroups = useMemo(() => {
        if (!search.trim()) return categoryOptions;

        const searchTerm = search.toLowerCase();
        return categoryOptions.map(group => ({
            ...group,
            options: group.options.filter(opt =>
                opt.label.toLowerCase().includes(searchTerm) ||
                opt.value.toLowerCase().includes(searchTerm) ||
                group.label.toLowerCase().includes(searchTerm)
            )
        })).filter(group => group.options.length > 0);
    }, [search]);

    // Find the current selected label
    const selectedOption = useMemo(() => {
        return allOptions.find(opt => opt.value === value);
    }, [value, allOptions]);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 h-11 bg-background border rounded-lg transition-all duration-200 shadow-sm ${isOpen ? 'border-blue-600 ring-2 ring-blue-600/5' : 'border-border hover:border-blue-600/30'
                    }`}
            >
                <span className={`block truncate text-sm ${selectedOption ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {selectedOption ? selectedOption.label : 'Select a category'}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground/30 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                    {/* Search Input */}
                    <div className="p-2 border-b border-border bg-muted/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-9 pr-8 h-9 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-blue-600 transition-colors"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground p-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-2 custom-scrollbar">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => (
                                <div key={group.label} className="space-y-0.5">
                                    <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
                                        {group.label}
                                    </div>
                                    <div className="space-y-px">
                                        {group.options.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => handleSelect(option.value)}
                                                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-all group ${value === option.value
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : 'text-foreground hover:bg-muted/60'
                                                    }`}
                                            >
                                                <span className="truncate">{option.label}</span>
                                                {value === option.value && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-xs text-muted-foreground font-medium">No matches found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
