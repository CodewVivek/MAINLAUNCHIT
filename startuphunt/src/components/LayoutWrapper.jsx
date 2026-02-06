'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import AuthSuccessToast from './AuthSuccessToast';

export default function LayoutWrapper({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Auto-open sidebar only on first visit (desktop); after that user opens it via menu if they want
    useEffect(() => {
        const isSubmitPage = pathname?.startsWith('/submit');
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

        if (pathname?.startsWith('/submit')) {
            setIsSidebarOpen(false);
            return;
        }

        if (!isDesktop) {
            setIsSidebarOpen(false);
            return;
        }

        try {
            const alreadyOpenedOnce = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('launchit_sidebar_opened_once');
            if (!alreadyOpenedOnce) {
                setIsSidebarOpen(true);
                sessionStorage.setItem('launchit_sidebar_opened_once', '1');
            }
        } catch {
            setIsSidebarOpen(true);
        }
    }, [pathname]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    if (pathname === '/maintenance') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background">
            <AuthSuccessToast />
            <Header onMenuClick={toggleSidebar} />

            <div className="flex relative items-start">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[45] lg:hidden transition-opacity duration-300"
                        onClick={closeSidebar}
                    />
                )}

                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

                <main
                    className={`flex-grow transition-all duration-300 min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-82px)] overflow-x-hidden pt-[64px] sm:pt-[82px] ${isSidebarOpen ? "lg:ml-60" : "lg:ml-0"
                        }`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
