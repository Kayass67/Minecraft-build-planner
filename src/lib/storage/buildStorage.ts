import { NormalizedSchematic } from "@/lib/types";
import { MaterialAnalysis } from "@/lib/materials/types";

export interface RecentBuild {
  id: string; // Stable unique build ID
  filename: string; // Original filename (e.g. "DualFullBlockCrafter.litematic")
  name: string; // Clean build name (schematic metadata name or filename)
  createdAt: number; // Timestamp when first saved
  lastOpenedAt: number; // Timestamp when last opened/analyzed
  minecraftVersion: string; // Target Minecraft version, e.g. "1.20.4"
  dimensions: { x: number; y: number; z: number };
  regionCount: number;
  totalSolidBlocks: number;
  schematic: NormalizedSchematic;
  analysis: MaterialAnalysis;
  inventory: Record<string, number>; // Saved per-build inventory
}

export interface RecentBuildSummary {
  id: string;
  filename: string;
  name: string;
  createdAt: number;
  lastOpenedAt: number;
  minecraftVersion: string;
  dimensions: { x: number; y: number; z: number };
  regionCount: number;
  totalSolidBlocks: number;
  topBlockNames: string[];
}

export const DB_NAME = "blockplan_builds_db";
export const DB_VERSION = 1;
export const STORE_BUILDS = "builds";
export const MAX_RECENT_BUILDS = 10;
export const ACTIVE_BUILD_STORAGE_KEY = "blockplan:active_build_id";

// In-memory fallback store for environments without IndexedDB (e.g. Node.js unit tests or restricted SSR)
const memoryStore = new Map<string, RecentBuild>();
let memoryActiveBuildId: string | null = null;

/**
 * Generate a deterministic stable ID for a build based on schematic characteristics.
 */
export function generateBuildId(
  filename: string,
  schematic: NormalizedSchematic,
  analysis: MaterialAnalysis
): string {
  const metaName = schematic.metadata.name || "";
  const author = schematic.metadata.author || "";
  const timeCreated = schematic.metadata.timeCreated || 0;
  const solidBlocks = analysis.totalSolidBlocks;
  const dim = `${analysis.dimensions.x}x${analysis.dimensions.y}x${analysis.dimensions.z}`;
  
  // Combine core signature
  const rawKey = `${filename.trim()}|${metaName.trim()}|${author.trim()}|${timeCreated}|${solidBlocks}|${dim}`;
  
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = ((hash << 5) - hash) + rawKey.charCodeAt(i);
    hash |= 0;
  }
  const safeHash = Math.abs(hash).toString(36);
  const cleanPrefix = (metaName || filename)
    .replace(/\.litematic$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase()
    .slice(0, 20);
  
  return `build_${cleanPrefix}_${safeHash}`;
}

/**
 * Extract 1-4 top block names to use for icon thumbnails.
 */
export function extractTopBlockNames(analysis: MaterialAnalysis): string[] {
  if (!analysis.exactBlockCounts) return [];
  return Object.entries(analysis.exactBlockCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);
}

function getIDB(): IDBFactory | null {
  if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") {
    return window.indexedDB;
  }
  return null;
}

/**
 * Open the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIDB();
    if (!idb) {
      return reject(new Error("IndexedDB is not available in this environment"));
    }

    const req = idb.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BUILDS)) {
        const store = db.createObjectStore(STORE_BUILDS, { keyPath: "id" });
        store.createIndex("lastOpenedAt", "lastOpenedAt", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB"));
  });
}

/**
 * Validate that a stored record has the required fields.
 */
export function isValidRecentBuild(record: unknown): record is RecentBuild {
  if (!record || typeof record !== "object") return false;
  const b = record as Partial<RecentBuild>;
  return (
    typeof b.id === "string" &&
    typeof b.filename === "string" &&
    typeof b.name === "string" &&
    typeof b.lastOpenedAt === "number" &&
    b.dimensions !== undefined &&
    typeof b.totalSolidBlocks === "number" &&
    b.schematic !== undefined &&
    b.schematic.metadata !== undefined &&
    Array.isArray(b.schematic.regions) &&
    b.analysis !== undefined &&
    b.analysis.gatheringPlan !== undefined &&
    b.analysis.exactBlockCounts !== undefined &&
    typeof b.inventory === "object" &&
    b.inventory !== null
  );
}

/**
 * Save or update a completed build in storage.
 */
export async function saveRecentBuild(build: RecentBuild): Promise<void> {
  const idb = getIDB();
  if (!idb) {
    // Memory fallback
    memoryStore.set(build.id, { ...build });
    enforceMemoryLimit();
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readwrite");
      const store = tx.objectStore(STORE_BUILDS);
      
      // Check if existing record has inventory that shouldn't be overwritten if incoming is empty
      const getReq = store.get(build.id);
      getReq.onsuccess = () => {
        const existing = getReq.result as RecentBuild | undefined;
        const inventoryToSave =
          Object.keys(build.inventory).length > 0
            ? build.inventory
            : existing?.inventory || {};

        const recordToSave: RecentBuild = {
          ...build,
          inventory: inventoryToSave,
          createdAt: existing?.createdAt || build.createdAt,
          lastOpenedAt: Date.now(),
        };

        const putReq = store.put(recordToSave);
        putReq.onerror = () => reject(putReq.error || new Error("Failed to put record"));
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error("Transaction failed"));
      };
    });

    // Enforce max count
    await trimOldBuilds(MAX_RECENT_BUILDS);
  } catch (err) {
    console.warn("IndexedDB save failed, falling back to in-memory store:", err);
    memoryStore.set(build.id, { ...build });
    enforceMemoryLimit();
  }
}

/**
 * Get a specific build by ID.
 */
export async function getRecentBuild(id: string): Promise<RecentBuild | null> {
  if (!id) return null;
  const idb = getIDB();
  if (!idb) {
    return memoryStore.get(id) || null;
  }

  try {
    const db = await openDB();
    return await new Promise<RecentBuild | null>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readonly");
      const store = tx.objectStore(STORE_BUILDS);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result;
        if (!record || !isValidRecentBuild(record)) {
          resolve(null);
        } else {
          resolve(record);
        }
      };
      req.onerror = () => reject(req.error || new Error("Failed to get record"));
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error("Transaction error"));
      };
    });
  } catch (err) {
    console.warn("IndexedDB read failed, checking memory store:", err);
    return memoryStore.get(id) || null;
  }
}

/**
 * Update the inventory for a specific build.
 */
export async function updateBuildInventory(
  id: string,
  inventory: Record<string, number>
): Promise<void> {
  if (!id) return;
  const idb = getIDB();
  if (!idb) {
    const existing = memoryStore.get(id);
    if (existing) {
      existing.inventory = { ...inventory };
    }
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readwrite");
      const store = tx.objectStore(STORE_BUILDS);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as RecentBuild | undefined;
        if (record) {
          record.inventory = { ...inventory };
          store.put(record);
        }
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error("Failed to update inventory"));
      };
    });
  } catch (err) {
    console.warn("Failed to persist inventory to IndexedDB:", err);
    const existing = memoryStore.get(id);
    if (existing) {
      existing.inventory = { ...inventory };
    }
  }
}

/**
 * Update the last-opened timestamp for a build.
 */
export async function updateBuildLastOpened(id: string): Promise<void> {
  if (!id) return;
  const idb = getIDB();
  if (!idb) {
    const existing = memoryStore.get(id);
    if (existing) existing.lastOpenedAt = Date.now();
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readwrite");
      const store = tx.objectStore(STORE_BUILDS);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as RecentBuild | undefined;
        if (record) {
          record.lastOpenedAt = Date.now();
          store.put(record);
        }
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("Failed to update lastOpenedAt in IndexedDB:", err);
  }
}

/**
 * List all recent builds as summaries, sorted by lastOpenedAt descending.
 */
export async function listRecentBuilds(limit: number = MAX_RECENT_BUILDS): Promise<RecentBuildSummary[]> {
  const idb = getIDB();
  if (!idb) {
    const list = Array.from(memoryStore.values())
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .slice(0, limit)
      .map((b) => toSummary(b));
    return list;
  }

  try {
    const db = await openDB();
    const records = await new Promise<RecentBuild[]>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readonly");
      const store = tx.objectStore(STORE_BUILDS);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as unknown[]) || [];
        const valid = list.filter(isValidRecentBuild);
        resolve(valid);
      };
      req.onerror = () => reject(req.error || new Error("Failed to list builds"));
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    records.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    return records.slice(0, limit).map(toSummary);
  } catch (err) {
    console.warn("IndexedDB list failed, falling back to memoryStore:", err);
    return Array.from(memoryStore.values())
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .slice(0, limit)
      .map(toSummary);
  }
}

/**
 * Delete a single recent build.
 */
export async function deleteRecentBuild(id: string): Promise<void> {
  if (!id) return;

  // If deleted build is currently active, clear active pointer
  if (getActiveBuildId() === id) {
    setActiveBuildId(null);
  }

  const idb = getIDB();
  if (!idb) {
    memoryStore.delete(id);
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readwrite");
      const store = tx.objectStore(STORE_BUILDS);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB delete failed:", err);
    memoryStore.delete(id);
  }
}

/**
 * Clear all recent builds.
 */
export async function clearAllRecentBuilds(): Promise<void> {
  setActiveBuildId(null);
  memoryStore.clear();

  const idb = getIDB();
  if (!idb) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readwrite");
      const store = tx.objectStore(STORE_BUILDS);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB clear failed:", err);
  }
}

/**
 * Get active build ID from localStorage.
 */
export function getActiveBuildId(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(ACTIVE_BUILD_STORAGE_KEY);
    } catch {
      return memoryActiveBuildId;
    }
  }
  return memoryActiveBuildId;
}

/**
 * Set active build ID in localStorage.
 */
export function setActiveBuildId(id: string | null): void {
  memoryActiveBuildId = id;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (id) {
        window.localStorage.setItem(ACTIVE_BUILD_STORAGE_KEY, id);
      } else {
        window.localStorage.removeItem(ACTIVE_BUILD_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to set active build ID in localStorage:", e);
    }
  }
}

/**
 * Retrieve the currently active build, or null if none active or record missing.
 */
export async function getActiveBuild(): Promise<RecentBuild | null> {
  const activeId = getActiveBuildId();
  if (!activeId) return null;
  const build = await getRecentBuild(activeId);
  if (!build) {
    // Stale pointer, clean up
    setActiveBuildId(null);
    return null;
  }
  return build;
}

// ── Internal Helpers ────────────────────────────────────────────────────────

function toSummary(build: RecentBuild): RecentBuildSummary {
  return {
    id: build.id,
    filename: build.filename,
    name: build.name,
    createdAt: build.createdAt,
    lastOpenedAt: build.lastOpenedAt,
    minecraftVersion: build.minecraftVersion || "1.20.4",
    dimensions: build.dimensions,
    regionCount: build.regionCount,
    totalSolidBlocks: build.totalSolidBlocks,
    topBlockNames: extractTopBlockNames(build.analysis),
  };
}

async function trimOldBuilds(maxCount: number): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BUILDS], "readwrite");
      const store = tx.objectStore(STORE_BUILDS);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as RecentBuild[]) || [];
        if (records.length <= maxCount) {
          return;
        }

        // Sort ascending by lastOpenedAt (oldest first)
        records.sort((a, b) => a.lastOpenedAt - b.lastOpenedAt);
        const activeId = getActiveBuildId();

        let currentCount = records.length;
        // First pass: delete oldest non-active records
        for (const item of records) {
          if (currentCount <= maxCount) break;
          if (item.id !== activeId) {
            store.delete(item.id);
            currentCount--;
          }
        }

        // Second pass: if still over limit, delete remaining oldest
        for (const item of records) {
          if (currentCount <= maxCount) break;
          store.delete(item.id);
          currentCount--;
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("Failed to trim old builds in IndexedDB:", err);
  }
}

function enforceMemoryLimit(): void {
  if (memoryStore.size <= MAX_RECENT_BUILDS) return;
  const list = Array.from(memoryStore.values()).sort((a, b) => a.lastOpenedAt - b.lastOpenedAt);
  // Delete oldest non-active items first
  for (const b of list) {
    if (memoryStore.size <= MAX_RECENT_BUILDS) break;
    if (b.id !== memoryActiveBuildId) {
      memoryStore.delete(b.id);
    }
  }
  // If still over, delete oldest remaining
  while (memoryStore.size > MAX_RECENT_BUILDS) {
    const remaining = Array.from(memoryStore.values()).sort((a, b) => a.lastOpenedAt - b.lastOpenedAt);
    memoryStore.delete(remaining[0].id);
  }
}
