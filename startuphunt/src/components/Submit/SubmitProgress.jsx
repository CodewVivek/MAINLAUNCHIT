'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { useMemo } from 'react';

export default function SubmitProgress({ formData = {} }) {
    const checklistItems = useMemo(() => [
        { label: 'Project name', completed: !!formData.name, required: true },
        { label: 'Website URL', completed: !!formData.websiteUrl, required: true },
        { label: 'Tagline', completed: !!formData.tagline, required: true },
        { label: 'Category', completed: !!formData.category, required: true },
        { label: 'Description', completed: !!formData.description, required: true },
        { label: 'Logo', completed: !!formData.logo || !!formData.logoPreview, required: true },
        { label: 'Thumbnail (Dashboard)', completed: !!formData.thumbnail || !!formData.thumbnailPreview, required: true },
    ], [formData]);

    const completionPercentage = useMemo(() => {
        const requiredItems = checklistItems.filter(item => item.required);
        const completedRequiredItems = requiredItems.filter(item => item.completed).length;
        return Math.round((completedRequiredItems / requiredItems.length) * 100);
    }, [checklistItems]);

    return (
        <aside className="hidden xl:flex w-80 bg-background border-l border-border flex-shrink-0 flex-col overflow-y-auto no-scrollbar p-8">
            <div className="space-y-8">
                <div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold tracking-tight text-foreground">
                            {completionPercentage}%
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Project Completion
                        </span>
                    </div>

                    <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
                        Complete 100% of your project details to make it eligible for launching on Launchit.
                    </p>

                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {checklistItems.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-3 transition-all duration-300 ${item.completed ? 'opacity-100' : 'opacity-40'}`}
                        >
                            <div className={`p-0.5 rounded-full ${item.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                                <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                            </div>
                            <span className={`text-[13px] font-medium tracking-tight text-foreground ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
