import Link from "next/link";
import { Pickaxe } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-950/60 rounded-xl border border-cyan-800/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
                <Pickaxe className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-sans">
                MineBuild
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan your Minecraft builds, discover crafting recipes, and explore creations from the community.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/planner" className="hover:text-cyan-400 transition-colors">
                  Build Planner
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="hover:text-cyan-400 transition-colors">
                  Crafting Recipes
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-cyan-400 transition-colors">
                  Explore Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Contact */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Community & Inquiries
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/contact?type=sponsorship" className="hover:text-cyan-400 transition-colors">
                  Sponsorship Inquiries
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-cyan-400 transition-colors">
                  Submit a Build
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Legal & Policies
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-cyan-400 transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-cyan-400 transition-colors">
                  Copyright & Removal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            <span className="font-medium text-slate-400">Disclaimer:</span> MineBuild is an independent fan-made project and is not affiliated with, associated with, or endorsed by Mojang Studios or Microsoft Corporation. Minecraft is a registered trademark of Mojang Synergies AB.
          </p>
          <div className="text-xs text-slate-500 shrink-0">
            © {new Date().getFullYear()} MineBuild. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
