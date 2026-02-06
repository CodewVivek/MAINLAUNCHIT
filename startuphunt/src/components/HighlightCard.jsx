import React from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import Image from 'next/image';

const HighlightCard = ({ project, onClick }) => {
    if (!project) return null;

    return (
        <div
            onClick={() => onClick(project)}
            className="group relative w-full mb-8 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl"
        >
            <div className="flex flex-col sm:flex-row items-stretch">
                {/* Thumbnail */}
                <div className="w-full sm:w-1/3 aspect-video sm:aspect-auto relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {project.thumbnail_url ? (
                        <Image
                            src={project.thumbnail_url}
                            alt={project.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 30vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Zap className="w-8 h-8 text-blue-500/20" />
                        </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-slate-900 text-[10px] font-black tracking-widest uppercase rounded shadow-lg" style={{ zIndex: 1 }}>
                        Highlight
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {project.logo_url && (
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <Image
                                        src={project.logo_url}
                                        alt=""
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                {project.name}
                            </h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed mb-4">
                            {project.tagline}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Sparkles className="w-3 h-3 text-yellow-500" /> Today's Pick
                        </div>
                        <span className="text-blue-500 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Details <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HighlightCard;
