"use client";

import { useState, useSyncExternalStore } from "react";
import { RecentBuildSummary } from "@/lib/storage/buildStorage";
import { MinecraftIcon } from "@/components/MinecraftIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Box,
  Layers,
  Map,
  Clock,
  Trash2,
  FolderOpen,
  History,
  X,
} from "lucide-react";

const emptySubscribe = () => () => {};

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function formatSavedDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentBuilds({
  builds,
  onOpenBuild,
  onDeleteBuild,
  onClearAll,
}: {
  builds: RecentBuildSummary[];
  onOpenBuild: (id: string) => void;
  onDeleteBuild: (id: string) => void;
  onClearAll: () => void;
}) {
  const isHydrated = useIsHydrated();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <section className="w-full max-w-4xl mx-auto mt-12 space-y-4 animate-in fade-in duration-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Recent Builds
              {builds.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-slate-800/80 text-cyan-300 border border-slate-700/80 font-mono text-xs"
                >
                  {builds.length}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Stored locally on this device. Select any build to resume planning.
            </p>
          </div>
        </div>

        {builds.length > 0 && (
          <div className="flex items-center gap-2">
            {!showClearConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear All
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded-lg">
                <span className="text-xs text-rose-300 font-medium">Clear all recent builds?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                  }}
                  className="h-6 px-2 text-[11px] bg-rose-600 hover:bg-rose-700"
                >
                  Confirm
                </Button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {builds.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-800/80 text-center py-10 px-4">
          <CardContent className="space-y-3 pt-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500">
              <Box className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-300">No analyzed builds yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload a <code className="text-cyan-400">.litematic</code> schematic above to analyze materials and save your build session.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Builds Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {builds.map((build) => {
            const isDeleting = deletingId === build.id;

            return (
              <Card
                key={build.id}
                className="bg-slate-900/70 border-slate-700/60 hover:border-cyan-500/50 backdrop-blur-md shadow-md transition-all flex flex-col justify-between group overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Top row: Name & Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base font-bold text-slate-100 group-hover:text-cyan-200 transition-colors truncate"
                        title={build.name}
                      >
                        {build.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono truncate" title={build.filename}>
                        {build.filename}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(build.id);
                        onDeleteBuild(build.id);
                      }}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-transparent hover:border-rose-900/50 transition-colors shrink-0"
                      title="Delete build"
                      aria-label={`Delete build ${build.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className="bg-slate-950/70 text-slate-300 border-slate-700/80 font-mono text-[11px] flex items-center gap-1.5"
                    >
                      <Box className="w-3 h-3 text-cyan-400" />
                      <span>
                        {build.dimensions.x} × {build.dimensions.y} × {build.dimensions.z}
                      </span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className="bg-slate-950/70 text-slate-300 border-slate-700/80 font-mono text-[11px] flex items-center gap-1.5"
                    >
                      <Layers className="w-3 h-3 text-violet-400" />
                      <span>{build.totalSolidBlocks.toLocaleString()} blocks</span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className="bg-slate-950/70 text-slate-300 border-slate-700/80 font-mono text-[11px] flex items-center gap-1.5"
                    >
                      <Map className="w-3 h-3 text-emerald-400" />
                      <span>
                        {build.regionCount} {build.regionCount === 1 ? "region" : "regions"}
                      </span>
                    </Badge>
                  </div>

                  {/* Thumbnail / Top Blocks Preview */}
                  {build.topBlockNames && build.topBlockNames.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 mr-1">Materials:</span>
                      <div className="flex items-center gap-1">
                        {build.topBlockNames.map((blockName) => (
                          <div
                            key={blockName}
                            className="p-0.5 bg-slate-950/80 rounded border border-slate-800"
                            title={blockName}
                          >
                            <MinecraftIcon itemName={blockName} size={18} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Row: Timestamp & Open Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isHydrated ? formatSavedDate(build.lastOpenedAt) : ""}</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onOpenBuild(build.id)}
                      className="bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-800/80 hover:border-cyan-600 shadow-sm text-xs font-semibold h-8 px-3"
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                      Open Build
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
