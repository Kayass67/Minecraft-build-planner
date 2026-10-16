"use client";

import Link from "next/link";
import { CommunityBuild } from "@/lib/community/types";
import { BuildThumbnail } from "./BuildThumbnail";
import { Box, Layers, User, ArrowUpRight } from "lucide-react";

export function BuildCard({ build }: { build: CommunityBuild }) {
  return (
    <article className="flex flex-col bg-slate-900/60 border border-slate-800/80 hover:border-cyan-800/60 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20 group">
      {/* Visual Thumbnail */}
      <Link
        href={`/explore/${build.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        tabIndex={-1}
      >
        <BuildThumbnail build={build} aspectRatio="video" />
      </Link>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Creator Attribution */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">By {build.creatorName}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 shrink-0">
              MC {build.minecraftVersion}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
            <Link
              href={`/explore/${build.slug}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
            >
              {build.title}
            </Link>
          </h3>

          {/* Summary */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {build.description}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Dimensions (W × H × L)">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {build.dimensions.x}×{build.dimensions.y}×{build.dimensions.z}
              </span>
            </span>
            <span className="flex items-center gap-1" title="Solid block count">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>{build.solidBlockCount.toLocaleString()}</span>
            </span>
          </div>

          <Link
            href={`/explore/${build.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform"
          >
            <span>View Build</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
