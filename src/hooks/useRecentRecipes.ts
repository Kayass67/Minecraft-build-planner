"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "blockplan_recent_recipes";
const MAX_RECENT = 8;
const CHANGE_EVENT = "blockplan_recent_recipes_change";

function getStoredSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/**
 * Hook for managing recently viewed recipe items.
 * Stores stable Minecraft item IDs (e.g. "minecraft:wooden_sword") in localStorage.
 * Uses useSyncExternalStore to eliminate SSR hydration mismatches and React 19 effect warnings.
 */
export function useRecentRecipes() {
  const jsonStr = useSyncExternalStore(subscribe, getStoredSnapshot, getServerSnapshot);

  let recentIds: string[] = [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      recentIds = parsed.slice(0, MAX_RECENT);
    }
  } catch {
    recentIds = [];
  }

  const addRecent = useCallback((rawId: string) => {
    if (typeof window === "undefined" || !rawId) return;
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const filtered = Array.isArray(current) ? current.filter((id: string) => id !== rawId) : [];
      const next = [rawId, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearRecent = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    recentIds,
    addRecent,
    clearRecent,
    isHydrated: true,
  };
}
