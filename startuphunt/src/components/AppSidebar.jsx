import React, { useState, useEffect } from "react";
import {
    Home, Scissors, Monitor, Clock, Download, Clipboard, History, PlaySquare, User, ChevronRight,
    Rocket, Bookmark, ThumbsUp, Trophy, MessageSquare, Users, ChevronDown, Plus, CreditCard
} from "lucide-react";
import Link from "next/link";
import { getCategoryIcon } from "@/constants/categoryIcons";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuAction,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Feature flag for pitch feature
const SHOW_PITCH_FEATURE = false;

export function AppSidebar() {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [projectCount, setProjectCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) {
                    setUser(null);
                    return;
                }
                setUser(data?.user || null);
            } catch (err) {
                setUser(null);
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('category_type')
                .eq('status', 'launched')
                .not('category_type', 'is', null)
                .limit(10000);

            if (error || !data?.length) return;

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

    useEffect(() => {
        const fetchProjectCount = async () => {
            if (!user) {
                setProjectCount(0);
                return;
            }

            try {
                const { count, error } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!error) {
                    setProjectCount(count || 0);
                }
            } catch (error) {
            }
        };

        fetchProjectCount();
    }, [user]);

    const handleYouItemClick = async (route) => {
        if (!user) {
            toast.error("Please sign in to access this feature");
            router.push("/UserRegister");
            if (isMobile) setOpenMobile(false);
            return;
        }

        if (route === "profile") {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .maybeSingle();
                if (profile?.username) {
                    router.push(`/profile/${profile.username}`);
                } else {
                    toast.error("Profile not found");
                }
            } catch (error) {
                toast.error("Error loading profile");
            }
        } else {
            router.push(route);
        }
        if (isMobile) setOpenMobile(false);
    };

    const mainItems = [
        { title: "Home", icon: Home, to: "/" },
        ...(SHOW_PITCH_FEATURE ? [{ title: "pitch", icon: Scissors, to: "/approved-pitches" }] : []),
        { title: "Community", icon: Users, to: "/launchit-community" },
        { title: "Pricing", icon: CreditCard, to: "/pricing" },
    ];

    const youItems = [
        { title: "Your Launches", icon: Rocket, route: "/my-launches?tab=projects", count: projectCount },
        { title: "Saved Launches", icon: Bookmark, route: "/saved-projects?tab=saved" },
        { title: "Upvoted Launches", icon: ThumbsUp, route: "/upvoted-projects?tab=upvoted" },
        { title: "Viewed Launches", icon: History, route: "/viewed-history?tab=history" },
        { title: "Connections", icon: Users, route: "/followers-following?tab=social" },
    ];

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
            <SidebarHeader className="h-[72px] flex items-center px-4 border-b border-sidebar-border/50">
                <Link href="/" className="flex items-center gap-3">
                    <img className="w-8 h-8 min-w-[32px]" src="/images/r6_circle_optimized.png" alt="Logo" />
                    <span className="font-bold text-xl tracking-tight text-gray-800 group-data-[collapsible=icon]:hidden truncate">
                        Launchit
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="px-2 pb-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.to}
                                        tooltip={item.title}
                                        className="h-10 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                                    >
                                        <Link href={item.to} onClick={() => isMobile && setOpenMobile(false)}>
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="You"
                                    className="h-10 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
                                    onClick={() => handleYouItemClick("profile")}
                                >
                                    <User className="w-5 h-5" />
                                    <span>You</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-2 opacity-50" />

                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 text-md font-semibold text-muted-foreground mb-2 flex items-center justify-between group-data-[collapsible=icon]:hidden">
                        You <ChevronRight className="w-4 h-4" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {youItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        className="h-10 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
                                        onClick={() => handleYouItemClick(item.route)}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                    {item.count !== undefined && item.count > 0 && (
                                        <SidebarMenuAction className="group-data-[collapsible=icon]:hidden">
                                            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {item.count}
                                            </span>
                                        </SidebarMenuAction>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-2 opacity-50" />

                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 text-md font-semibold text-muted-foreground mb-2 group-data-[collapsible=icon]:hidden">Explore</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Collapsible className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Categories" className="h-10 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg">
                                            <Monitor className="w-5 h-5" />
                                            <span>Categories</span>
                                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenu className="pl-4 mt-1 border-l border-sidebar-border ml-5 group-data-[collapsible=icon]:hidden">
                                            {categories.map((category) => {
                                                const Icon = getCategoryIcon(category);
                                                return (
                                                    <SidebarMenuItem key={category}>
                                                        <SidebarMenuButton asChild className="h-9 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg">
                                                            <Link href={`/category/${category}`} onClick={() => isMobile && setOpenMobile(false)} className="capitalize text-md flex items-center gap-3 w-full">
                                                                <span className="w-5 h-5 rounded-md bg-sidebar-accent flex items-center justify-center flex-shrink-0 text-sidebar-foreground">
                                                                    <Icon className="w-3 h-3" />
                                                                </span>
                                                                {category}
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            })}
                                        </SidebarMenu>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-2 opacity-50" />

                <div className="px-4 py-2 space-y-2 text-md text-muted-foreground group-data-[collapsible=icon]:hidden">
                    <div className="flex flex-wrap gap-2">
                        <Link href="/terms" className="hover:text-foreground">Terms</Link>
                        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                        <a href="https://x.com/launchit__" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">X (Twitter)</a>
                    </div>
                    <div>
                        <Link href="/launchitguide" className="hover:text-foreground">How launchit works</Link>
                    </div>

                    <div className="pt-4 font-black">
                        © 2025 Launchit
                    </div>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
