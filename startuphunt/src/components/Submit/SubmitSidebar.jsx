'use client';

import { Zap, Image as ImageIcon, Flame } from 'lucide-react';

export default function SubmitSidebar({ currentStep, onStepClick }) {
    const steps = [
        { id: 1, name: 'Main info', icon: Zap, color: 'text-blue-500' },
        { id: 2, name: 'Images', icon: ImageIcon, color: 'text-purple-500' },
        { id: 3, name: 'Promote', icon: Flame, color: 'text-orange-500' },
    ];

    return (
        <aside className="w-full lg:w-64 bg-background border-b lg:border-r border-border flex-shrink-0 flex flex-col relative overflow-hidden">
            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-6">
                {/* Steps Section */}
                <div>
                    <div className="mb-4 hidden lg:block">
                        <h2 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-2">
                            Submission Flow
                        </h2>
                    </div>

                    <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => onStepClick(step.id)}
                                    className={`
                                        flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg text-left
                                        transition-all flex-shrink-0 min-w-fit border
                                        ${isActive
                                            ? 'bg-muted border-border text-foreground font-semibold shadow-sm'
                                            : 'bg-transparent border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground'}
                                    `}
                                >
                                    <div className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-background text-blue-600 shadow-sm' : 'bg-transparent'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    <span className="text-sm whitespace-nowrap">
                                        {step.name}
                                    </span>

                                    {isCompleted && (
                                        <div className="ml-auto hidden lg:block">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

            </div>
        </aside>
    );
}
