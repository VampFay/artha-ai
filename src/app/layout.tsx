import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { NavProvider } from "@/lib/nav-context";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["italic", "normal"], display: "swap" });

export const metadata: Metadata = {
  title: "Artha AI — Wealth Intelligence",
  description: "Privacy-first AI-powered wealth intelligence and tax readiness platform.",
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} antialiased`}>
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
