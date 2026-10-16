"use client";

import { useState, useEffect, useCallback } from "react";
import { FileUploader } from "@/components/FileUploader";
import { Dashboard } from "@/components/Dashboard";
import { RecentBuilds } from "@/components/RecentBuilds";
import { NormalizedSchematic } from "@/lib/types";
import { analyzeSchematic } from "@/lib/materials/engine";
import {
  RecentBuild,
  RecentBuildSummary,
  generateBuildId,
  saveRecentBuild,
  getRecentBuild,
  listRecentBuilds,
  deleteRecentBuild,
  clearAllRecentBuilds,
  getActiveBuildId,
  getActiveBuild,
  setActiveBuildId,
  updateBuildInventory,
  updateBuildLastOpened,
} from "@/lib/storage/buildStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Pickaxe, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PlannerPage() {
  const [activeBuild, setActiveBuild] = useState<RecentBuild | null>(null);
  const [recentList, setRecentList] = useState<RecentBuildSummary[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore active build session & recent builds on mount
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const activeId = getActiveBuildId();
      if (activeId) {
        setIsLoadingSession(true);
      }
      try {
        const [currentActive, recents] = await Promise.all([
          getActiveBuild(),
          listRecentBuilds(),
        ]);
        if (!isMounted) return;
        if (currentActive) {
          setActiveBuild(currentActive);
          updateBuildLastOpened(currentActive.id).catch(() => {});
        }
        setRecentList(recents);
      } catch (err) {
        console.warn("Failed to restore build session from storage:", err);
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    }
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshRecents = useCallback(async () => {
    try {
      const recents = await listRecentBuilds();
      setRecentList(recents);
    } catch (err) {
      console.warn("Failed to refresh recent builds:", err);
    }
  }, []);

  const handleParsed = async (
    data: NormalizedSchematic,
    fileInfo?: { filename: string }
  ) => {
    try {
      const result = analyzeSchematic(data);
      const filename = fileInfo?.filename || data.metadata.name || "schematic.litematic";
      const buildId = generateBuildId(filename, data, result);

      const newBuild: RecentBuild = {
        id: buildId,
        filename,
        name: data.metadata.name || filename.replace(/\.litematic$/i, ""),
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        minecraftVersion: "1.20.4",
        dimensions: result.dimensions,
        regionCount: data.regions.length,
        totalSolidBlocks: result.totalSolidBlocks,
        schematic: data,
        analysis: result,
        inventory: {},
      };

      await saveRecentBuild(newBuild);
      setActiveBuildId(newBuild.id);
      setActiveBuild(newBuild);
      setError(null);
      refreshRecents();
    } catch (e) {
      console.error("Analysis or storage failed:", e);
      setError("Failed to analyze materials for this schematic.");
    }
  };

  const handleOpenRecent = async (id: string) => {
    try {
      const build = await getRecentBuild(id);
      if (!build) {
        setError("Could not restore this saved build. The record may be missing or corrupt.");
        refreshRecents();
        return;
      }
      await updateBuildLastOpened(id);
      setActiveBuildId(id);
      setActiveBuild(build);
      setError(null);
      refreshRecents();
    } catch (e) {
      console.error("Failed to open recent build:", e);
      setError("Failed to open the selected build.");
    }
  };

  const handleDeleteRecent = async (id: string) => {
    try {
      await deleteRecentBuild(id);
      if (activeBuild?.id === id) {
        setActiveBuild(null);
      }
      refreshRecents();
    } catch (e) {
      console.error("Failed to delete recent build:", e);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllRecentBuilds();
      setActiveBuild(null);
      setRecentList([]);
    } catch (e) {
      console.error("Failed to clear recent builds:", e);
    }
  };

  const handleInventoryChange = (newInventory: Record<string, number>) => {
    if (!activeBuild) return;
    updateBuildInventory(activeBuild.id, newInventory).catch((err) => {
      console.warn("Failed to persist updated inventory:", err);
    });
    setActiveBuild((prev) => (prev ? { ...prev, inventory: newInventory } : null));
  };

  const handleReset = () => {
    setActiveBuildId(null);
    setActiveBuild(null);
    setError(null);
    refreshRecents();
  };

  return (
    <main className="flex flex-col min-h-[calc(100vh-4rem)] container mx-auto px-4 py-8 md:py-16">
      {/* Header section when no active build */}
      {!activeBuild && (
        <header className="mb-12 flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 mb-1"
          >
            <div className="p-3 bg-cyan-950/60 rounded-xl border border-cyan-800/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Pickaxe className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-400">
              Build Planner
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base md:text-lg text-slate-400 max-w-xl mx-auto"
          >
            Upload your Minecraft schematic to calculate exact block requirements, gathering breakdowns, and crafting steps.
          </motion.p>
        </header>
      )}

      {isLoadingSession ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-cyan-300 font-medium">Restoring build session…</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {!activeBuild ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center w-full max-w-4xl mx-auto"
            >
              {error && (
                <Alert
                  variant="destructive"
                  className="mb-6 w-full max-w-2xl bg-red-950/60 border-red-900 text-red-200"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FileUploader
                onParsed={handleParsed}
                onError={(err) => setError(err)}
              />

              <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
                <p>Files and build history are processed and saved locally in your browser.</p>
                <p>No schematic data is uploaded to any remote server.</p>
              </div>

              {/* Recent Builds Section */}
              <RecentBuilds
                builds={recentList}
                onOpenBuild={handleOpenRecent}
                onDeleteBuild={handleDeleteRecent}
                onClearAll={handleClearAll}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeBuild.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Dashboard
                key={activeBuild.id}
                buildId={activeBuild.id}
                schematic={activeBuild.schematic}
                analysis={activeBuild.analysis}
                initialInventory={activeBuild.inventory}
                onInventoryChange={handleInventoryChange}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </main>
  );
}
