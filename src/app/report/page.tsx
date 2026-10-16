import Link from "next/link";
import { ShieldAlert, FileText, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl flex-1 text-slate-300">
      <div className="space-y-4 mb-10 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Content Removal & Rights</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
          Copyright & Content Reporting
        </h1>
        <p className="text-sm text-slate-400">
          How creators can report intellectual property issues, request removal, or update attribution.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            1. Notice and Takedown Policy
          </h2>
          <p>
            MineBuild respects the intellectual property and creative effort of all Minecraft builders, content creators, and map makers. It is our strict policy to respond promptly to clear, documented notices of alleged copyright infringement or unauthorized schematic redistribution.
          </p>
          <p>
            If you are a copyright owner or authorized representative, and believe that a build listed in our <Link href="/explore" className="text-cyan-400 hover:underline">Explore Gallery</Link> infringes your rights or misrepresents your permission, you may submit a removal request.
          </p>
        </section>

        <section className="space-y-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            2. How to Submit a Removal Notice
          </h2>
          <p className="text-slate-400">
            To submit an expedited takedown notice, please use our Contact form or send a message with the following details:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-300">
            <li>
              <strong>Identification of the Build:</strong> The exact title and URL of the listing on MineBuild (e.g., <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">minebuild.app/explore/[slug]</code>).
            </li>
            <li>
              <strong>Proof of Original Authorship:</strong> A link to your original YouTube video, Planet Minecraft listing, GitHub repo, or Patreon post documenting your creation.
            </li>
            <li>
              <strong>Requested Action:</strong> Specify whether you request complete removal of the listing, removal of the downloadable file only (retaining visual attribution), or an update to creator links.
            </li>
            <li>
              <strong>Contact Details:</strong> Your name, email address, and creator handle for verification.
            </li>
          </ol>
          <div className="pt-2">
            <Link href="/contact?type=other">
              <Button className="bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-slate-950 font-bold">
                Submit Removal Notice via Contact
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            3. Review Timeline & Processing
          </h2>
          <p>
            Upon receipt of a valid removal notice:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>We review reported listings within <strong>24 to 48 business hours</strong>.</li>
            <li>If unauthorized redistribution is confirmed, the listing or download link is immediately removed from public display.</li>
            <li>We notify the original submitter of the action taken.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-500">
          <p>
            <strong>Disclaimer:</strong> MineBuild is an independent fan-made project and is not affiliated with, associated with, or endorsed by Mojang Studios or Microsoft Corporation.
          </p>
        </section>
      </div>
    </main>
  );
}
