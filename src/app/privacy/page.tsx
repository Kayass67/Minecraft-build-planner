import Link from "next/link";
import { Shield, Lock, Database, Server, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl flex-1 text-slate-300">
      <div className="space-y-4 mb-10 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Policy Documentation</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400">
          Last updated: October 13, 2026 • MineBuild Community Standards
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            1. Local-First Build Planning
          </h2>
          <p>
            When you use the MineBuild <Link href="/planner" className="text-cyan-400 hover:underline">Build Planner</Link> to inspect, analyze, or calculate material lists for a <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">.litematic</code> schematic, <strong>all parsing, geometric analysis, and inventory counting occur entirely within your browser</strong> via client-side Web Workers.
          </p>
          <p>
            Your schematics and per-build inventory lists are stored securely in your browser&apos;s local IndexedDB storage (<code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">blockplan_builds_db</code>). They are never transmitted to our servers or third-party storage without your explicit action.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            2. Community Explore Submissions
          </h2>
          <p>
            If you voluntarily submit a schematic to the public <Link href="/explore" className="text-cyan-400 hover:underline">Explore Gallery</Link>, you provide metadata including your creator name, title, description, category, and whether other players may download the schematic file.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-300">Public Information:</strong> Once approved by moderators, your build title, creator handle, description, bounding dimensions, material summaries, and 3D voxel previews will be publicly viewable.
            </li>
            <li>
              <strong className="text-slate-300">Download Permission:</strong> The raw <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">.litematic</code> file is only made available for download if you checked the explicit opt-in box during submission.
            </li>
            <li>
              <strong className="text-slate-300">Moderation State:</strong> All public submissions remain in a private, unlisted &quot;pending&quot; state until reviewed by project maintainers.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            3. Contact and Sponsorship Messages
          </h2>
          <p>
            When you submit inquiries via our <Link href="/contact" className="text-cyan-400 hover:underline">Contact page</Link>, we collect your name, reply email address, inquiry type, subject, and message content.
          </p>
          <p>
            These messages are stored in private, access-restricted database tables accessible only to the MineBuild maintainers for customer service, partnership, and bug resolution purposes. We never sell, rent, or publicly expose your contact information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            4. Third-Party Analytics & Cookies
          </h2>
          <p>
            MineBuild does not deploy third-party advertising cookies, cross-site trackers, or commercial data brokers. Essential local storage is used solely to preserve your recent build history and crafting preferences.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">5. Questions & Data Inquiries</h2>
          <p>
            If you have questions about your stored data, or wish to request removal of an uploaded submission, please contact us through our{" "}
            <Link href="/contact" className="text-cyan-400 hover:underline">
              Contact Page
            </Link>{" "}
            or report via our{" "}
            <Link href="/report" className="text-cyan-400 hover:underline">
              Copyright & Removal Page
            </Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
