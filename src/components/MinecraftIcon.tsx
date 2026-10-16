"use client";

import { useState, useCallback } from "react";
import {
  getItemTextureUrl,
  getBlockTextureUrl,
  getCdnItemTextureUrl,
  getCdnBlockTextureUrl,
  normalizeItemName,
} from "@/lib/materials/recipeIndex";

interface MinecraftIconProps {
  itemName: string;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Displays a Minecraft item/block texture icon.
 * Resolution chain:
 * 1. Local item texture (public/textures/items)
 * 2. Local block texture (public/textures/blocks)
 * 3. CDN item texture
 * 4. CDN block texture
 * 5. Accessible fallback text badge
 */
export function MinecraftIcon({ itemName, size = 32, className = "", alt }: MinecraftIconProps) {
  const cleanName = normalizeItemName(itemName);
  const displayAlt = alt || cleanName.replace(/_/g, " ");

  // 0: local item, 1: local block, 2: cdn item, 3: cdn block, 4: failed
  const [attempt, setAttempt] = useState(0);
  const [prevItemName, setPrevItemName] = useState(itemName);

  // Reset attempt stage when itemName changes during render (React-recommended pattern)
  if (prevItemName !== itemName) {
    setPrevItemName(itemName);
    setAttempt(0);
  }

  const handleError = useCallback(() => {
    setAttempt((prev) => prev + 1);
  }, []);

  if (attempt >= 4 || !cleanName) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-slate-800/80 border border-slate-700/60 rounded select-none ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        role="img"
        aria-label={displayAlt}
        title={displayAlt}
      >
        <span className="text-slate-400 text-[9px] font-mono font-bold leading-none text-center uppercase tracking-tight overflow-hidden px-0.5">
          {cleanName ? cleanName.slice(0, 3) : "?"}
        </span>
      </div>
    );
  }

  const src =
    attempt === 0
      ? getItemTextureUrl(cleanName)
      : attempt === 1
      ? getBlockTextureUrl(cleanName)
      : attempt === 2
      ? getCdnItemTextureUrl(cleanName)
      : getCdnBlockTextureUrl(cleanName);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={`${cleanName}-${attempt}`}
      src={src}
      alt={displayAlt}
      title={displayAlt}
      width={size}
      height={size}
      className={`pixelated shrink-0 select-none ${className}`}
      style={{
        imageRendering: "pixelated",
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}
