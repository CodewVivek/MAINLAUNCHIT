'use client';

import React, { useMemo } from 'react';
import { Flame, TrendingUp, Zap, Users } from 'lucide-react';

const HypeMeter = ({ upvotes = 0, views = 0, shares = 0 }) => {
    // Simple "Hype Score" calculation
    // (Upvotes * 5) + (Shares * 10) + (Views * 1)
    const hypeScore = useMemo(() => {
        return (upvotes * 5) + (shares * 10) + (Math.floor(views / 10));
    }, [upvotes, shares, views]);

    // Hype Levels
    // 0-50: Chilling
    // 51-200: Warming Up
    // 201-500: Heating Up
    // 501-1000: On Fire
    // 1001+: Supernova
    const hypeLevel = useMemo(() => {
        if (hypeScore <= 50) return { label: 'Chilling', color: 'blue', icon: Zap, iconColor: 'text-blue-500' };
        if (hypeScore <= 200) return { label: 'Warming Up', color: 'orange', icon: TrendingUp, iconColor: 'text-orange-500' };
        if (hypeScore <= 500) return { label: 'Heating Up', color: 'orange', icon: Flame, iconColor: 'text-orange-600' };
        if (hypeScore <= 1000) return { label: 'On Fire!', color: 'red', icon: Flame, iconColor: 'text-red-600' };
        return { label: 'Supernova!', color: 'purple', icon: Zap, iconColor: 'text-purple-600' };
    }, [hypeScore]);

    // Progress within current level (visual only for now)
    const progress = Math.min((hypeScore / 1000) * 100, 100);

    const Icon = hypeLevel.icon;

    return (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
            {/* Background glow effect */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${hypeLevel.color}-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-${hypeLevel.color}-500/10 ${hypeLevel.iconColor}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Hype Meter</h4>
                        <p className={`text-md font-bold ${hypeLevel.iconColor}`}>{hypeLevel.label}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted-foreground block mb-0.5 uppercase font-semibold">Hype Score</span>
                    <span className="text-xl font-black text-foreground">{hypeScore}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                    <div
                        className={`h-full transition-all duration-1000 bg-gradient-to-r from-${hypeLevel.color}-500 to-${hypeLevel.color}-600 relative overflow-hidden`}
                        style={{ width: `${progress}%` }}
                    >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-3 text-muted-foreground/70">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {views}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {upvotes}</span>
                    </div>
                    <span className="text-muted-foreground/70">Next Goal: {hypeScore > 1000 ? '∞' : (hypeScore <= 50 ? 51 : hypeScore <= 200 ? 201 : hypeScore <= 500 ? 501 : 1001)}</span>
                </div>
            </div>
        </div>
    );
};

export default HypeMeter;
