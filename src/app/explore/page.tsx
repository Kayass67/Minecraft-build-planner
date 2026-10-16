"use client";

import { useState, useMemo } from "react";
import { SEED_BUILDS, queryCommunityBuilds } from "@/lib/community/seedBuilds";
import { BuildCard } from "@/components/BuildCard";
import { SubmitBuildModal } from "@/components/SubmitBuildModal";
import {
  Compass,
  Search,
  PlusCircle,
  SlidersHorizontal,
  FolderOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  "All",
  "Redstone & Automation",
  "Survival & Starter",
  "Farms & Generators",
  "Architecture & Castles",
  "Nether & End",
  "Decorative & Botanical",
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "blocks">("newest");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredBuilds = useMemo(() => {
    return queryCommunityBuilds(SEED_BUILDS, searchQuery, selectedCategory, sortBy);
  }, [searchQuery, selectedCategory, sortBy]);

  const displayedBuilds = filteredBuilds.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBuilds.length;

  return (
    <main className="container mx-auto px-4 py-8 md:py-16 flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-800/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Community Gallery</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
            Explore Builds
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl">
            Browse survival plans, redstone contraptions, and architecture from the Minecraft community. Inspect dimensions, materials, and 3D previews.
          </p>
        </div>

        <Button
          onClick={() => setIsSubmitOpen(true)}
          className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold shadow-lg shadow-cyan-950/30"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          <span>Submit a Build</span>
        </Button>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by title, creator, or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/80 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl focus:border-cyan-500"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "name" | "blocks")}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="newest">Newest First</option>
              <option value="name">Alphabetical</option>
              <option value="blocks">Most Solid Blocks</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all select-none ${
                  active
                    ? "bg-cyan-950 border border-cyan-700/80 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                    : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
        <span>
          Showing <strong className="text-slate-200">{filteredBuilds.length}</strong> creations
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
        </span>
        <span className="text-[11px] text-slate-500">
          Transparent licensing: hosted demos & curated creator links
        </span>
      </div>

      {/* Builds Grid */}
      {displayedBuilds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedBuilds.map((build) => (
            <BuildCard key={build.id} build={build} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800/60 p-8 my-8">
          <FolderOpen className="w-12 h-12 text-slate-600 mb-2" />
          <h3 className="text-lg font-semibold text-slate-200">No builds match your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Try adjusting your search terms or selecting a different category.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="text-cyan-400 hover:text-cyan-300 mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mb-12">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Load More Creations ({filteredBuilds.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {/* Submission Modal */}
      <SubmitBuildModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
      />
    </main>
  );
}
