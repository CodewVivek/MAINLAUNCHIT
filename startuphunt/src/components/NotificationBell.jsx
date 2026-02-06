import React, { useState, useEffect, useRef } from "react";
import {
    Bell, Check, Trash2, CheckCircle2, Info, MoreHorizontal
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);

    // Custom Toast State
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const notificationRef = useRef(null);

    // --- 1. Init & Realtime ---
    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                fetchNotifications(data.user.id);
                subscribeToNotifications(data.user.id);
            }
        };
        init();
    }, []);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const subscribeToNotifications = (userId) => {
        const channel = supabase.channel(`notifications-${userId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
                (payload) => {
                    setNotifications((prev) => [payload.new, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                    showToast("New notification received", "info");
                }
            )
            .subscribe();
        return () => channel.unsubscribe();
    };

    const fetchNotifications = async (userId) => {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.read).length);
        }
    };

    // --- 2. Action Handlers ---
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    const handleAction = async (action, id = null) => {
        try {
            if (action === 'mark_read') {
                await supabase.from("notifications").update({ read: true }).eq("id", id);
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            else if (action === 'delete') {
                await supabase.from("notifications").delete().eq("id", id);
                const isUnread = notifications.find(n => n.id === id)?.read === false;
                setNotifications(prev => prev.filter(n => n.id !== id));
                if (isUnread) setUnreadCount(prev => Math.max(0, prev - 1));
                showToast("Notification deleted");
            }
            else if (action === 'mark_all') {
                await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                showToast("All marked as read");
            }
            else if (action === 'clear_all') {
                await supabase.from("notifications").delete().eq("user_id", user.id);
                setNotifications([]);
                setUnreadCount(0);
                showToast("Notifications cleared");
            }
        } catch (error) {
            showToast("Something went wrong", "error");
        }
    };

    // --- 3. Style Helpers (Emojis & Colors) ---
    const getEmoji = (type) => {
        switch (type) {
            case "pitch_approved": return "🎉";
            case "pitch_rejected": return "🛑";
            case "project_like": return "❤️";
            case "project_comment": return "💬";
            case "system_alert": return "⚠️";
            case "milestone": return "🚀";
            default: return "🔔";
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case "pitch_approved": return "bg-emerald-500/10 border-emerald-500/20";
            case "pitch_rejected": return "bg-red-500/10 border-red-500/20";
            case "project_like": return "bg-pink-500/10 border-pink-500/20";
            case "project_comment": return "bg-blue-500/10 border-blue-500/20";
            case "milestone": return "bg-purple-500/10 border-purple-500/20";
            default: return "bg-neutral-500/10 border-neutral-500/20";
        }
    };

    if (!user) return null;

    return (
        <div className="relative font-sans" ref={notificationRef}>

            {/* --- Trigger Button --- */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative p-2.5 rounded-full transition-all duration-200 outline-none
                    ${isOpen
                        ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white'
                        : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 dark:hover:text-neutral-200'}
                `}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-[#0A0A0A]"></span>
                    </span>
                )}
            </button>

            {/* --- Dropdown Panel --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-[380px] bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden z-50 origin-top-right backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <h3 className="text-md font-semibold text-neutral-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => handleAction('mark_all')}
                                        className="p-1.5 text-neutral-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Mark all as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => handleAction('clear_all')}
                                        className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Clear all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-neutral-300 dark:hover:scrollbar-thumb-white/20">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="w-14 h-14 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                                    </div>
                                    <p className="text-md font-semibold text-neutral-900 dark:text-white">All caught up!</p>
                                    <p className="text-sm text-neutral-500 mt-1 max-w-[200px]">
                                        We'll notify you when something important happens.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-neutral-100 dark:divide-white/5">
                                    {notifications.map((notif) => (
                                        <li
                                            key={notif.id}
                                            className={`group relative flex gap-4 p-4 transition-colors duration-200 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-500/[0.05]' : 'hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                                                }`}
                                        >
                                            {/* Unread Indicator Bar */}
                                            {!notif.read && (
                                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full" />
                                            )}

                                            {/* Emoji Avatar */}
                                            <div className={`
                                                shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
                                                border text-lg select-none shadow-sm
                                                ${getBgColor(notif.type)}
                                            `}>
                                                {getEmoji(notif.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-md font-semibold text-neutral-900 dark:text-white leading-tight pr-6">
                                                        {notif.title}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-1.5">
                                                    {notif.message || "New activity on your account."}
                                                </p>
                                                <p className="text-[10px] text-neutral-400 font-medium tracking-wide">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </p>
                                            </div>

                                            {/* Hover Action Buttons */}
                                            <div className="flex flex-col gap-1 absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                                {!notif.read && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction('mark_read', notif.id); }}
                                                        className="p-1.5 bg-white dark:bg-[#1A1A1A] text-blue-500 border border-neutral-200 dark:border-white/10 rounded-md shadow-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction('delete', notif.id); }}
                                                    className="p-1.5 bg-white dark:bg-[#1A1A1A] text-neutral-400 hover:text-red-500 border border-neutral-200 dark:border-white/10 rounded-md shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Custom Toast Notification --- */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[100] pointer-events-none"
                    >
                        <div className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-md font-medium backdrop-blur-md
                            ${toast.type === 'error'
                                ? 'bg-[#0A0A0A]/90 text-red-400 border-red-500/20'
                                : 'bg-[#0A0A0A]/90 text-white border-white/10'}
                        `}>
                            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Info className="w-4 h-4" />}
                            {toast.message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}