import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import LayoutWrapper from "@/components/LayoutWrapper";

import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata = {
  title: "Launchit - Where Builders Launch Projects",
  description: "Instant platform for startup founders to ship products and get visibility — without gatekeeping or delays.",
  keywords: "startups, early-stage, launch platform, side projects, beta startups, projects, innovation, entrepreneurship",
  icons: {
    icon: "/images/r6_circle_optimized.png",
    apple: "/images/r6_circle_optimized.png",
  },
  openGraph: {
    title: "Launchit - Where Builders Launch Projects",
    description: "Instant platform for startup founders to ship products and get visibility",
    url: "https://launchit.site",
    siteName: "Launchit",
    images: [
      {
        url: "https://launchit.site/images/r6_circle_optimized.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Launchit - Where Builders Launch Projects",
    description: "Instant platform for startup founders to ship products and get visibility",
    images: ["https://launchit.site/images/r6_circle_optimized.png"],
    site: "@launchit__",
  },
};

// Inline script runs before first paint so theme class is on <html> immediately (avoids CSS flash / "styles missing" on load)
const themeScript = `
(function() {
  var key = 'launchit-theme';
  var theme = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  if (theme === 'system' || !theme) {
    theme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider defaultTheme="light" storageKey="launchit-theme">
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
