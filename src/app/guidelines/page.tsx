import Link from "next/link";
import { CheckCircle2, AlertTriangle, ShieldCheck, Heart } from "lucide-react";

export default function GuidelinesPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl flex-1 text-slate-300">
      <div className="space-y-4 mb-10 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Community Standards</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
          Community Guidelines
        </h1>
        <p className="text-sm text-slate-400">
          Standards for sharing, attributing, and discovering Minecraft creations on MineBuild.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            1. Share Authentic Work & Give Honest Credit
          </h2>
          <p>
            The MineBuild community thrives on mutual respect among builders, technical redstone engineers, and survival players.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-300">Original Creations:</strong> You are encouraged to submit builds you designed and constructed yourself.
            </li>
            <li>
              <strong className="text-slate-300">Community Collaborations:</strong> If you submit a build created with a team, acknowledge all co-creators in the creator attribution and description.
            </li>
            <li>
              <strong className="text-slate-300">Attribution Integrity:</strong> Never claim another creator&apos;s published contraption or world download as your own. If a build adapts a public design (e.g., an Ianxofour or Ilmango farm), explicitly credit the original pioneer.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            2. Respect Redistribution Rights
          </h2>
          <p>
            A schematic being downloadable on the internet does not automatically grant permission to rehost or redistribute the file.
          </p>
          <p>
            When submitting files to MineBuild:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              You must confirm that you hold the rights or explicit authorization to publish the schematic.
            </li>
            <li>
              If you wish to showcase a build for inspiration while keeping file downloads hosted on your personal channel or Patreon, leave the download opt-in unchecked and provide your direct creator URL.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            3. Constructive & Safe Community
          </h2>
          <p>
            We maintain a welcoming environment for players of all skill levels. Submissions containing offensive language, hate speech, disruptive content, or malicious file payloads will be immediately rejected and banned from moderation queues.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">4. Moderation & Takedowns</h2>
          <p>
            All community submissions undergo human review before public listing in the <Link href="/explore" className="text-cyan-400 hover:underline">Explore Gallery</Link>. If you discover an entry that violates these guidelines or your intellectual property rights, please submit a notice via our{" "}
            <Link href="/report" className="text-cyan-400 hover:underline">
              Copyright & Removal Page
            </Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
