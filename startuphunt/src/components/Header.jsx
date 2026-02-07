'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Rocket, CirclePlus, CircleUserRound, Settings, LogOut, User, Menu, X, Search,
    ChevronDown, Monitor, Moon, Sun, MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import NotificationBell from "./NotificationBell";
import { useTheme } from "./ThemeProvider";
import { toast } from "react-hot-toast";
import FeedbackModal from "./FeedbackModal";

export default function Header({ onMenuClick }) {

    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const [user, setUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [openProfile, setOpenProfile] = useState(false);
    const [openLaunch, setOpenLaunch] = useState(false);
    const [openFeedback, setOpenFeedback] = useState(false);
    const [mobileSearch, setMobileSearch] = useState(false);

    const profileRef = useRef(null);
    const launchRef = useRef(null);

    // ---------------- Auth ----------------
    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            const u = data?.user;
            setUser(u);
            if (u) {
                const { data } = await supabase
                    .from("profiles")
                    .select("avatar_url, role")
                    .eq("id", u.id)
                    .maybeSingle();
                setAvatarUrl(data?.avatar_url);
                setUserRole(data?.role);
            }
        });
    }, []);

    // ---------------- Outside click ----------------
    useEffect(() => {
        const close = e => {
            if (!profileRef.current?.contains(e.target)) setOpenProfile(false);
            if (!launchRef.current?.contains(e.target)) setOpenLaunch(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    // ---------------- Search ----------------
    const doSearch = useCallback(async (q) => {
        if (!q) return setResults([]);

        const { data } = await supabase
            .from("projects")
            .select("id,name,slug")
            .ilike("name", `%${q}%`)
            .limit(5);

        setResults(data || []);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => doSearch(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    // ---------------- Logout ----------------
    const logout = async () => {
        await supabase.auth.signOut();
        toast.success("Signed out");
        location.reload();
    };

    // =====================================================
    return (
        <header className="fixed top-0 inset-x-0 z-[100] h-[72px] backdrop-blur bg-white/70 dark:bg-black/40 border-b">

            <div className="max-w-[1600px] mx-auto h-full px-4 flex items-center justify-between">

                {/* LEFT */}
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 hover:bg-muted rounded-xl">
                        <Menu />
                    </button>

                    <Link href="/" className="flex items-center gap-2">
                        <img src="/images/r6_circle_optimized.png" className="w-8 h-8" />
                        <span className="font-bold text-lg hidden sm:block">Launchit</span>
                    </Link>
                </div>

                {/* SEARCH */}
                <div className="hidden md:block relative w-[420px]">

                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search startups…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-muted/40 focus:ring-2 focus:ring-primary/30 outline-none"
                    />

                    {!!results.length && (
                        <div className="absolute top-full mt-2 w-full bg-card border rounded-2xl shadow-xl overflow-hidden">
                            {results.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => router.push(`/launches/${p.slug}`)}
                                    className="block w-full text-left px-4 py-3 hover:bg-muted"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}

                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-3">

                    <button onClick={() => setMobileSearch(true)} className="md:hidden p-2 rounded-xl hover:bg-muted">
                        <Search />
                    </button>

                    <Link href="/pricing" className="hidden sm:block text-sm font-medium">
                        Pricing
                    </Link>

                    {user && <NotificationBell />}

                    {/* LAUNCH */}
                    <div ref={launchRef} className="relative">
                        <button
                            onClick={() => setOpenLaunch(!openLaunch)}
                            className="relative rounded-full p-[2px] overflow-hidden"
                        >
                            <div className="absolute inset-[-300%] bg-[conic-gradient(from_0deg,transparent_0deg_340deg,#3b82f6_360deg)] animate-spin" />
                            <div className="relative px-4 py-2 rounded-full bg-background flex items-center gap-2 font-bold">
                                <CirclePlus className="w-4 h-4 text-primary" />
                                Launch
                                <ChevronDown className={`w-3 h-3 transition ${openLaunch && "rotate-180"}`} />
                            </div>
                        </button>

                        {openLaunch && (
                            <div className="absolute right-0 mt-2 w-44 bg-card border rounded-2xl shadow-xl overflow-hidden">
                                <button onClick={() => { setOpenLaunch(false); router.push("/submit"); }} className="w-full px-4 py-3 text-left hover:bg-muted flex gap-2">
                                    <Rocket className="w-4 h-4 text-primary" /> Submit
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PROFILE */}
                    <div ref={profileRef} className="relative">

                        <button onClick={() => setOpenProfile(!openProfile)}>
                            {user ? (
                                <img
                                    src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                                    className="w-9 h-9 rounded-full border"
                                />
                            ) : (
                                <CircleUserRound />
                            )}
                        </button>

                        {openProfile && (
                            <div className="absolute right-0 mt-2 w-52 bg-card border rounded-2xl shadow-xl overflow-hidden">

                                {user ? (
                                    <>
                                        {userRole === "admin" && (
                                            <button onClick={() => router.push("/admin")} className="menu-item">
                                                <Monitor /> Admin
                                            </button>
                                        )}

                                        <button onClick={() => router.push("/profile/me")} className="menu-item">
                                            <User /> Profile
                                        </button>

                                        <button onClick={() => router.push("/settings")} className="menu-item">
                                            <Settings /> Settings
                                        </button>

                                        <button onClick={() => { setOpenProfile(false); setOpenFeedback(true); }} className="menu-item">
                                            <MessageCircle className="w-4 h-4" /> Feedback
                                        </button>

                                        <button onClick={logout} className="menu-item text-red-500">
                                            <LogOut /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => router.push("/UserRegister")} className="menu-item">
                                            <CircleUserRound /> Sign in
                                        </button>
                                        <button onClick={() => { setOpenProfile(false); setOpenFeedback(true); }} className="menu-item">
                                            <MessageCircle className="w-4 h-4" /> Feedback
                                        </button>
                                    </>
                                )}

                                {/* Theme toggle — always visible so logged-out users can switch */}
                                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="menu-item border-t border-border">
                                    {theme === "dark" ? <Sun /> : <Moon />}
                                    {theme === "dark" ? "Light mode" : "Dark mode"}
                                </button>

                            </div>
                        )}

                    </div>

                </div>
            </div>

            {/* MOBILE SEARCH */}
            {mobileSearch && (
                <div className="fixed inset-0 bg-background z-[200] p-4">
                    <div className="flex gap-2">
                        <button onClick={() => setMobileSearch(false)}><X /></button>
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="flex-1 border rounded-xl px-4"
                        />
                    </div>
                </div>
            )}

            <FeedbackModal
                isOpen={openFeedback}
                onClose={() => setOpenFeedback(false)}
                user={user}
            />

            <style jsx>{`
        .menu-item {
          display:flex;
          gap:8px;
          align-items:center;
          width:100%;
          padding:12px 16px;
          text-align:left;
        }
        .menu-item:hover {
          background:rgba(0,0,0,.04);
        }
      `}</style>

        </header>
    );
}
