"use client";

import { useEffect, useRef, memo } from "react";
import { MinecraftIcon } from "./MinecraftIcon";
import { CommunityBuild } from "@/lib/community/types";

interface IsometricBuildPreviewProps {
  build: CommunityBuild;
  aspectRatio?: "video" | "wide"; // 16:9 or 21:9
  className?: string;
  showBadges?: boolean;
}

// Map common Minecraft blocks to voxel surface colors for 3D isometric projection
const BLOCK_COLOR_MAP: Record<string, { top: string; left: string; right: string }> = {
  "minecraft:crafter": { top: "#94a3b8", left: "#64748b", right: "#475569" },
  "minecraft:redstone_wire": { top: "#ef4444", left: "#dc2626", right: "#991b1b" },
  "minecraft:light_blue_wool": { top: "#38bdf8", left: "#0284c7", right: "#0369a1" },
  "minecraft:comparator": { top: "#cbd5e1", left: "#94a3b8", right: "#64748b" },
  "minecraft:stone_bricks": { top: "#94a3b8", left: "#64748b", right: "#475569" },
  "minecraft:spruce_planks": { top: "#854d0e", left: "#713f12", right: "#451a03" },
  "minecraft:glass": { top: "#bae6fd", left: "#7dd3fc", right: "#38bdf8" },
  "minecraft:obsidian": { top: "#312e81", left: "#1e1b4b", right: "#0f172a" },
  "minecraft:smooth_sandstone": { top: "#fef08a", left: "#fde047", right: "#eab308" },
  "minecraft:deepslate_tiles": { top: "#334155", left: "#1e293b", right: "#0f172a" },
  "minecraft:mud_bricks": { top: "#78350f", left: "#581c87", right: "#451a03" },
  "minecraft:polished_blackstone_bricks": { top: "#1e293b", left: "#0f172a", right: "#020617" },
  "minecraft:end_stone_bricks": { top: "#fef9c3", left: "#fef08a", right: "#ca8a04" },
  "minecraft:magma_block": { top: "#ea580c", left: "#c2410c", right: "#9a3412" },
  "minecraft:cobblestone": { top: "#64748b", left: "#475569", right: "#334155" },
  "minecraft:barrel": { top: "#a16207", left: "#854d0e", right: "#713f12" },
  "minecraft:hopper": { top: "#475569", left: "#334155", right: "#1e293b" },
};

function getBlockColors(blockName: string) {
  const clean = blockName.startsWith("minecraft:") ? blockName : `minecraft:${blockName}`;
  if (BLOCK_COLOR_MAP[clean]) {
    return BLOCK_COLOR_MAP[clean];
  }
  // Deterministic color from name hash
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    top: `hsl(${hue}, 40%, 65%)`,
    left: `hsl(${hue}, 45%, 50%)`,
    right: `hsl(${hue}, 50%, 35%)`,
  };
}

export const IsometricBuildPreview = memo(function IsometricBuildPreview({
  build,
  aspectRatio = "video",
  className = "",
  showBadges = true,
}: IsometricBuildPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = 480);
    const height = (canvas.height = aspectRatio === "video" ? 270 : 200);

    ctx.clearRect(0, 0, width, height);

    // Dark atmospheric vignette background
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      20,
      width / 2,
      height / 2,
      width * 0.7
    );
    bgGrad.addColorStop(0, "#081329");
    bgGrad.addColorStop(0.5, "#040916");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle isometric grid pedestal
    const centerX = width / 2;
    const centerY = height * 0.65;
    const gridCols = Math.min(8, Math.max(4, Math.ceil(build.dimensions.x / 2)));
    const gridRows = Math.min(8, Math.max(4, Math.ceil(build.dimensions.z / 2)));
    const tileW = Math.min(28, Math.max(16, 240 / (gridCols + gridRows)));
    const tileH = tileW * 0.5;

    ctx.strokeStyle = "rgba(34, 211, 238, 0.12)";
    ctx.lineWidth = 1;

    for (let i = -gridCols; i <= gridCols; i++) {
      const x1 = centerX + i * (tileW / 2) - gridRows * (tileW / 2);
      const y1 = centerY + i * (tileH / 2) + gridRows * (tileH / 2);
      const x2 = centerX + i * (tileW / 2) + gridRows * (tileW / 2);
      const y2 = centerY + i * (tileH / 2) - gridRows * (tileH / 2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    for (let j = -gridRows; j <= gridRows; j++) {
      const x1 = centerX - gridCols * (tileW / 2) + j * (tileW / 2);
      const y1 = centerY + gridCols * (tileH / 2) + j * (tileH / 2);
      const x2 = centerX + gridCols * (tileW / 2) + j * (tileW / 2);
      const y2 = centerY - gridCols * (tileH / 2) + j * (tileH / 2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Glow under pedestal
    const pedestalGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      5,
      centerX,
      centerY,
      tileW * (gridCols + 1)
    );
    pedestalGlow.addColorStop(0, "rgba(56, 189, 248, 0.18)");
    pedestalGlow.addColorStop(1, "transparent");
    ctx.fillStyle = pedestalGlow;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, tileW * 3.5, tileH * 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw isometric cubes representing the structure
    // We deterministically arrange a cluster of voxels fitting build.dimensions
    const voxelSize = Math.min(18, Math.max(8, 120 / Math.max(build.dimensions.x, build.dimensions.y, build.dimensions.z, 6)));
    const vW = voxelSize * 2;
    const vH = voxelSize;

    // Generate voxels based on build proportions and top blocks
    const voxels: {
      x: number;
      y: number;
      z: number;
      block: string;
    }[] = [];

    const dimX = Math.min(6, Math.max(2, Math.round(build.dimensions.x / 3)));
    const dimY = Math.min(6, Math.max(2, Math.round(build.dimensions.y / 3)));
    const dimZ = Math.min(6, Math.max(2, Math.round(build.dimensions.z / 3)));

    const primaryBlock = build.topBlockNames[0] || "minecraft:stone_bricks";
    const secondaryBlock = build.topBlockNames[1] || primaryBlock;
    const accentBlock = build.topBlockNames[2] || secondaryBlock;

    for (let y = 0; y < dimY; y++) {
      for (let z = 0; z < dimZ; z++) {
        for (let x = 0; x < dimX; x++) {
          // Hollow or shaped build representation
          const isEdge =
            x === 0 || x === dimX - 1 || z === 0 || z === dimZ - 1 || y === 0 || y === dimY - 1;
          const isArch = y === dimY - 1 && (x > 0 && x < dimX - 1 && z > 0 && z < dimZ - 1);

          if (isEdge || isArch || (y === 0)) {
            let block = primaryBlock;
            if (y === dimY - 1) block = accentBlock;
            else if ((x + z) % 2 === 0) block = secondaryBlock;

            voxels.push({ x: x - dimX / 2, y, z: z - dimZ / 2, block });
          }
        }
      }
    }

    // Sort voxels back-to-front (painter's algorithm: sort by X + Z, then Y)
    voxels.sort((a, b) => {
      const depthA = a.x + a.z + a.y * 0.1;
      const depthB = b.x + b.z + b.y * 0.1;
      return depthA - depthB;
    });

    const drawCube = (cx: number, cy: number, size: number, colors: { top: string; left: string; right: string }) => {
      const halfW = size;
      const halfH = size * 0.5;
      const h = size * 1.0;

      // Top face
      ctx.fillStyle = colors.top;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h - halfH);
      ctx.lineTo(cx + halfW, cy - h);
      ctx.lineTo(cx, cy - h + halfH);
      ctx.lineTo(cx - halfW, cy - h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Left face
      ctx.fillStyle = colors.left;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, cy - h);
      ctx.lineTo(cx, cy - h + halfH);
      ctx.lineTo(cx, cy + halfH);
      ctx.lineTo(cx - halfW, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.fillStyle = colors.right;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h + halfH);
      ctx.lineTo(cx + halfW, cy - h);
      ctx.lineTo(cx + halfW, cy);
      ctx.lineTo(cx, cy + halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Render sorted voxels
    for (const v of voxels) {
      const isoX = centerX + (v.x - v.z) * (vW / 2);
      const isoY = centerY + (v.x + v.z) * (vH / 2) - v.y * (vW * 0.6);
      const colors = getBlockColors(v.block);
      drawCube(isoX, isoY, voxelSize, colors);
    }

    // Subtle beacon or lantern beam if present
    if (build.topBlockNames.some((n) => n.includes("lantern") || n.includes("beacon"))) {
      const beamGrad = ctx.createLinearGradient(centerX, 0, centerX, centerY - 40);
      beamGrad.addColorStop(0, "rgba(56, 189, 248, 0.4)");
      beamGrad.addColorStop(1, "transparent");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(centerX - 4, 0, 8, centerY - 40);
    }
  }, [build, aspectRatio]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950 group ${className} ${
        aspectRatio === "video" ? "aspect-video" : "aspect-[21/9]"
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full object-cover select-none" />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

      {/* Top badges: Category & Listing Type */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-cyan-300 backdrop-blur-md">
          {build.category}
        </span>
        {build.listingType === "minebuild_demo" ? (
          <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-800 text-cyan-300 backdrop-blur-md">
            Demo Build
          </span>
        ) : (
          <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 backdrop-blur-md">
            Curated Source
          </span>
        )}
      </div>

      {/* Bottom Block Icons Preview */}
      {showBadges && build.topBlockNames.length > 0 && (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
          {build.topBlockNames.slice(0, 4).map((blockName) => (
            <div key={blockName} className="p-0.5 rounded bg-slate-900/80" title={blockName.replace("minecraft:", "")}>
              <MinecraftIcon
                itemName={blockName}
                size={18}
                className="pixelated"
                alt={blockName}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
