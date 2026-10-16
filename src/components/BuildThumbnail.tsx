"use client";

import { useState } from "react";
import Image from "next/image";
import { CommunityBuild } from "@/lib/community/types";
import { MinecraftIcon } from "./MinecraftIcon";
import { CameraOff, ExternalLink } from "lucide-react";

interface BuildThumbnailProps {
  build: CommunityBuild;
  aspectRatio?: "video" | "wide";
  className?: string;
  showBadges?: boolean;
  priority?: boolean;
  size?: "card" | "detail" | "featured";
}

export function BuildThumbnail({
  build,
  aspectRatio = "video",
  className = "",
  showBadges = true,
  priority = false,
  size = "card",
}: BuildThumbnailProps) {
  const [imgError, setImgError] = useState(false);

  const thumb = build.thumbnail;
  const hasAuthorizedImage = Boolean(
    thumb && thumb.isAuthorizedForDisplay && thumb.url && !imgError
  );

  const aspectClass = aspectRatio === "video" ? "aspect-video" : "aspect-[21/9]";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950 group select-none ${aspectClass} ${className}`}
    >
      {hasAuthorizedImage && thumb?.url ? (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={thumb.url}
            alt={thumb.alt || `${build.title} build screenshot`}
            fill
            sizes={
              size === "detail"
                ? "(max-width: 1024px) 100vw, 1024px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            priority={priority}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Subtle bottom vignette to ensure readability of any bottom badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

          {/* Genuine Screenshot Verification Pill */}
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
            <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 text-cyan-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>In-Game Screenshot</span>
            </span>
          </div>
        </div>
      ) : (
        /* ── Polished MineBuild Missing-Image Fallback ──────────────────────── */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/90 relative overflow-hidden">
          {/* Subtle background blueprint grid */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-500 shadow-inner group-hover:border-cyan-900/60 transition-colors">
              <CameraOff className="w-7 h-7 text-slate-400 stroke-[1.5]" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-300 tracking-wide">
                Screenshot unavailable
              </p>
              <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                {build.listingType === "minebuild_demo"
                  ? "Genuine in-game capture pending release update"
                  : "Awaiting creator authorized in-game preview"}
              </p>
            </div>
          </div>

          {/* Bottom Block Palette Hint in Fallback */}
          {build.topBlockNames && build.topBlockNames.length > 0 && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-[10px] text-slate-500">
              <span className="truncate max-w-[140px] font-mono text-[10px]">
                {build.dimensions.x}×{build.dimensions.y}×{build.dimensions.z} blocks
              </span>
              <div className="flex items-center gap-1">
                {build.topBlockNames.slice(0, 3).map((block) => (
                  <div
                    key={block}
                    className="p-0.5 rounded bg-slate-900/90 border border-slate-800"
                    title={block.replace("minecraft:", "")}
                  >
                    <MinecraftIcon itemName={block} size={14} className="pixelated" alt={block} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Badges (Category & Source Type) */}
      {showBadges && (
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2 z-10">
          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-950/85 border border-slate-700/80 text-cyan-300 backdrop-blur-md shadow-sm">
            {build.category}
          </span>

          {build.listingType === "minebuild_demo" ? (
            <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-800 text-cyan-300 backdrop-blur-md shadow-sm">
              Demo Build
            </span>
          ) : (
            <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-slate-950/85 border border-slate-700 text-slate-300 backdrop-blur-md shadow-sm flex items-center gap-1">
              <span>Curated Source</span>
              {build.sourceUrl && <ExternalLink className="w-2.5 h-2.5 text-slate-400" />}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
