"use client";

import { useState } from "react";
import { CommunityBuild } from "@/lib/community/types";
import { BuildThumbnail } from "./BuildThumbnail";
import { IsometricBuildPreview } from "./IsometricBuildPreview";
import { Camera, Layers, Info, ExternalLink, ShieldCheck } from "lucide-react";

interface BuildDetailVisualProps {
  build: CommunityBuild;
}

export function BuildDetailVisual({ build }: BuildDetailVisualProps) {
  const [activeTab, setActiveTab] = useState<"screenshot" | "schematic">("screenshot");
  const thumb = build.thumbnail;
  const hasAuthorizedImage = Boolean(thumb && thumb.isAuthorizedForDisplay && thumb.url);

  return (
    <div className="space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("screenshot")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "screenshot"
                ? "bg-cyan-950 border border-cyan-700/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>In-Game Build View</span>
            {hasAuthorizedImage && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Genuine screenshot available" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("schematic")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "schematic"
                ? "bg-slate-800 border border-slate-700 text-slate-200"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Technical Schematic Geometry</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          {activeTab === "screenshot" ? "Primary Visual" : "Secondary Geometry Analysis"}
        </div>
      </div>

      {/* Primary Display Area */}
      {activeTab === "screenshot" ? (
        <div className="space-y-3">
          <BuildThumbnail build={build} size="detail" priority={true} className="shadow-2xl" />

          {/* Screenshot Provenance / Attribution Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/70 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              {hasAuthorizedImage ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-slate-300">Screenshot Attribution:</strong>{" "}
                    {thumb?.attribution || `Provided by ${build.creatorName}`}
                  </span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong className="text-slate-300">Image Status:</strong> No authentic screenshot
                    has been submitted yet. A clean placeholder is displayed rather than a fake or generated image.
                  </span>
                </>
              )}
            </div>

            {thumb?.sourceProjectUrl && (
              <a
                href={thumb.sourceProjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 shrink-0 ml-auto sm:ml-0"
              >
                <span>Creator Project Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ) : (
        /* ── Technical Schematic Visualization (Secondary Feature) ────────── */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-semibold text-amber-300">
                Technical Schematic Visualization
              </strong>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                This is a procedural voxel geometry projection rendered directly from schematic coordinates to inspect structure bounds and block layout. It is <strong>not</strong> an in-game Minecraft screenshot.
              </p>
            </div>
          </div>

          <IsometricBuildPreview build={build} aspectRatio="video" className="shadow-2xl" />
        </div>
      )}
    </div>
  );
}
