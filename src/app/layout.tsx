import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StarField } from "@/components/StarField";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MineBuild — Minecraft Build Planner, Recipes & Community",
  description:
    "Plan your Minecraft builds, discover crafting recipes, and explore creations from the community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-900/50 relative overflow-x-hidden">
        {/* Animated Night-Sky Starfield and Atmosphere */}
        <StarField />

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <div className="flex-1 relative z-10 flex flex-col">{children}</div>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
