import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { NavProvider } from "@/lib/nav-context";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinSight AI — Tax Readiness + Financial Health",
  description: "Privacy-first AI assistant for tax readiness and financial health.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased bg-background text-foreground`}>
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
