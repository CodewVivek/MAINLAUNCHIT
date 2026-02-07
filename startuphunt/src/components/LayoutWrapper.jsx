'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import AuthSuccessToast from './AuthSuccessToast';

export default function LayoutWrapper({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Mobile/Desktop sidebar state handled by toggle; avoid auto-opening on mount to prevent CLS
    useEffect(() => {
        // We only close it automatically on route change for mobile
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
        if (!isDesktop) {
            setIsSidebarOpen(false);
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
                    className={`flex-grow transition-all duration-300 min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] overflow-x-hidden pt-[64px] sm:pt-[80px] ${isSidebarOpen ? "lg:ml-60" : "lg:ml-0"
                        }`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
