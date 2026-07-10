import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { NavProvider } from "@/lib/nav-context";
import { PortalProvider } from "@/lib/portal-context";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Artha AI — Wealth Intelligence",
  description: "Privacy-first AI-powered wealth intelligence and tax readiness platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Artha AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Michroma (futuristic geometric sans) + Geist Pixel (pixelated monospace) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Geist+Pixel&family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NavProvider>
            <PortalProvider>
              {children}
            </PortalProvider>
          </NavProvider>
        </AuthProvider>
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((reg) => {
                    // Force update: check for new service worker every load
                    reg.update();
                  }).catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
