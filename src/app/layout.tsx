import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { NavProvider } from "@/lib/nav-context";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Artha AI — Wealth Intelligence",
  description: "Privacy-first AI-powered wealth intelligence and tax readiness platform.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Geist Pixel — not available via next/font, load via CSS @import */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Pixel&display=swap" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NavProvider>
            {children}
          </NavProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
