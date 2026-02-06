'use client';

import React, { useState, useEffect } from "react";
import {
    Home, Scissors, Monitor, ChevronRight, Rocket, Bookmark, ThumbsUp, History, MessageSquare, Users, User, CreditCard, BookOpen
} from "lucide-react";
import Link from "next/link";
import { getCategoryIcon } from "@/constants/categoryIcons";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const SHOW_PITCH_FEATURE = false;

const Sidebar = ({ isOpen, onClose }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showMoreCategories, setShowMoreCategories] = useState(false);
    const [projectCount, setProjectCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();
    const isProjectDetails = pathname.startsWith("/launches/");

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                const currentUser = data?.user || null;
                setUser(currentUser);
                if (currentUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', currentUser.id)
                        .maybeSingle();
                    setUserRole(profile?.role || null);
                }
            } catch (err) {
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        const fetchCounts = async () => {
            if (!user) return;

            // Fetch project count
            const { count: pCount } = await supabase
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setProjectCount(pCount || 0);

            // Fetch comment count
            const { count: cCount } = await supabase
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setCommentCount(cCount || 0);
        };
        fetchCounts();
    }, [user]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('projects')
                .select('category_type')
                .eq('status', 'launched')
                .not('category_type', 'is', null)
                .limit(10000);

            if (!data?.length) return;

            const counts = {};
            data.forEach((p) => {
                const c = p.category_type?.trim() || "";
                if (c) counts[c] = (counts[c] || 0) + 1;
            });

            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .map(([category_type]) => category_type);

            setCategories(sorted);
        };
        fetchCategories();
    }, []);

    const handleYouItemClick = (route) => {
        onClose();
        if (!user) {
            toast.error("Please sign in first");
            router.push("/UserRegister");
            return;
        }
        router.push(route);
    };

    const handleProfileClick = async () => {
        onClose();
        if (!user) {
            toast.error("Please sign in first");
            router.push("/UserRegister");
            return;
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();

        if (profile?.username) {
            router.push(`/profile/${profile.username}`);
        } else {
            router.push(`/profile/me`);
        }
    };

    const mainItems = [
        { title: "Home", icon: Home, to: "/" },
        { title: "Blog", icon: BookOpen, to: "/blog" },
        ...(userRole === 'admin' ? [{ title: "Dashboard", icon: Monitor, to: "/admin" }] : []),
        ...(SHOW_PITCH_FEATURE ? [{ title: "pitch", icon: Scissors, to: "/approved-pitches" }] : []),
        { title: "Pricing", icon: CreditCard, to: "/pricing" },
        { title: "You", icon: User, isProfile: true },
    ];

    const youItems = [
        { title: "Your Launches", icon: Rocket, route: "/my-launches?tab=projects", count: projectCount },
        { title: "My Comments", icon: MessageSquare, route: "/profile/me?tab=comments", count: commentCount },
        { title: "Saved Launches", icon: Bookmark, route: "/saved-projects?tab=saved" },
        { title: "Upvoted Launches", icon: ThumbsUp, route: "/upvoted-projects?tab=upvoted" },
        { title: "Viewed Launches", icon: History, route: "/viewed-history?tab=history" },
        { title: "Connections", icon: Users, route: "/followers-following?tab=social" },
    ];

    const displayedCategories = showMoreCategories ? categories : categories.slice(0, 5);

    const sidebarClasses = `fixed left-0 top-[64px] sm:top-[82px] w-64 lg:w-60 h-[calc(100vh-64px)] sm:h-[calc(100vh-82px)] bg-card overflow-y-auto transition-all duration-300 z-[100] lg:z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`;

    return (
        <aside className={sidebarClasses}>
            <div className={`py-4 px-2 ${!isOpen && 'lg:px-1'}`}>
                <div className="space-y-1">
                    {mainItems.map((item) => (
                        item.isProfile ? (
                            <button
                                key={item.title}
                                onClick={handleProfileClick}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-md font-medium transition-colors text-foreground hover:bg-muted ${!isOpen && 'lg:justify-center lg:px-0'}`}
                                title={!isOpen ? item.title : ''}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className={!isOpen ? 'lg:hidden' : ''}>{item.title}</span>
                            </button>
                        ) : (
                            <Link
                                key={item.title}
                                href={item.to}
                                onClick={onClose}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-md font-medium transition-colors ${pathname === item.to ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"
                                    } ${!isOpen && 'lg:justify-center lg:px-0'}`}
                                title={!isOpen ? item.title : ''}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className={!isOpen ? 'lg:hidden' : ''}>{item.title}</span>
                            </Link>
                        )
                    ))}
                </div>

                <div className="my-4 border-t border-border/50 mx-3" />

                <div className="space-y-1">
                    <div
                        onClick={() => isOpen && handleProfileClick()}
                        className={`px-3 py-2 text-foreground font-medium text-lg flex items-center gap-1 ${!isOpen && 'lg:hidden'} cursor-pointer hover:text-primary transition-colors`}
                    >
                        You <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>

                    {youItems.map((item) => (
                        <button
                            key={item.title}
                            onClick={() => handleYouItemClick(item.route)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-md transition-colors ${pathname === item.route ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted'
                                } ${!isOpen && 'lg:hidden'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.title}</span>
                            </div>
                            {item.count > 0 && (
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={`my-4 border-t border-border/50 mx-3 ${!isOpen && 'lg:hidden'}`} />

                <div className={`space-y-1 ${!isOpen && 'lg:hidden'}`}>
                    <div className="px-3 py-2 text-foreground font-medium text-lg">Explore</div>
                    {displayedCategories.map((category) => {
                        const Icon = getCategoryIcon(category);
                        return (
                            <Link
                                key={category}
                                href={`/category/${category}`}
                                onClick={onClose}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-md transition-colors capitalize ${pathname === `/category/${category}` ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted'
                                    }`}
                            >
                                <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{category}</span>
                            </Link>
                        );
                    })}
                    {categories.length > 5 && (
                        <button
                            onClick={() => setShowMoreCategories(!showMoreCategories)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                        >
                            <span className="w-5"></span>
                            <span>{showMoreCategories ? 'Show less' : 'Show more'}</span>
                        </button>
                    )}
                </div>

                <div className={`my-4 pt-3 border-t border-border/50 mx-3 ${!isOpen && 'lg:hidden'}`}>
                    <div className="space-y-4 text-xs text-muted-foreground">
                        <div className="px-3 leading-relaxed">
                            <p className="mb-2">Made with ☕️ by <a href="https://x.com/vweekk_" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors font-medium">vwek</a></p>
                            <p className="mb-4 opacity-70">Join makers who trust Launchit to ship their products.</p>
                        </div>

                        <div className="flex flex-wrap gap-3 px-3 font-medium text-md">
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                            <a href="https://x.com/launchit__" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium">Contact us on X</a>
                        </div>

                        <div className="px-3 pt-4 text-[10px] uppercase tracking-widest font-black">© 2025 Launchit</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
