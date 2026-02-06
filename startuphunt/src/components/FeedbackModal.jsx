'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { toast } from 'react-hot-toast';

export default function FeedbackModal({ isOpen, onClose, user }) {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(typeof document !== 'undefined');
    }, []);

    useEffect(() => {
        if (!mounted || !isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [mounted, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('community_feedback')
                .insert([{
                    user_id: user?.id || null,
                    user_email: user?.email || 'anonymous',
                    content: feedback,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            setIsSuccess(true);
            setFeedback('');
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            toast.error('Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const modal = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <div className="flex items-center justify-center w-full min-h-full py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-[#0f0f0f] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Send Feedback</h3>
                                <p className="text-xs text-slate-500 font-medium">Help us make Launchit better</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 text-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <Sparkles className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black">Thank You!</h4>
                                    <p className="text-slate-500 font-medium">Your feedback has been received. <br />We appreciate your support! ❤️</p>
                                </div>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        What's on your mind?
                                    </label>
                                    <textarea
                                        autoFocus
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Tell us what you like, what's broken, or what features you'd love to see..."
                                        className="w-full h-40 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-[15px] font-medium leading-relaxed transition-all placeholder:text-slate-400"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !feedback.trim()}
                                        className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:grayscale active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Send Feedback
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
                                    Founders read every single message.
                                </p>
                            </form>
                        )}
                    </div>
                </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}
