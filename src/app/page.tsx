"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Pickaxe,
  Wrench,
  BookOpen,
  Compass,
  ArrowRight,
  Box,
  CheckCircle2,
  Sparkles,
  History,
  ArrowUpRight,
} from "lucide-react";
import { MinecraftIcon } from "@/components/MinecraftIcon";
import { SEED_BUILDS } from "@/lib/community/seedBuilds";
import { IsometricBuildPreview } from "@/components/IsometricBuildPreview";
import { BuildThumbnail } from "@/components/BuildThumbnail";
import { getActiveBuild, RecentBuild } from "@/lib/storage/buildStorage";

export default function HomePage() {
  const [activeBuild, setActiveBuild] = useState<RecentBuild | null>(null);

  useEffect(() => {
    getActiveBuild()
      .then((build) => {
        if (build) setActiveBuild(build);
      })
      .catch(() => {});
  }, []);

  // Featured community builds for Section D: Select genuine, authorized builds
  const featuredBuilds = SEED_BUILDS.filter(
    (b) => b.thumbnail?.isAuthorizedForDisplay
  ).slice(0, 3);

  // Crafter recipe grid definition for Section C interactive preview
  const crafterGrid = [
    "minecraft:iron_ingot",
    "minecraft:iron_ingot",
    "minecraft:iron_ingot",
    "minecraft:iron_ingot",
    "minecraft:crafting_table",
    "minecraft:iron_ingot",
    "minecraft:redstone",
    "minecraft:dropper",
    "minecraft:redstone",
  ];

  return (
    <div className="flex flex-col min-h-screen text-slate-200">
      {/* ── SECTION A — HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 container mx-auto flex flex-col items-center text-center">
        {/* Active build resume pill (if in session) */}
        {activeBuild && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 text-xs font-medium shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:border-cyan-400 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Active Build in Session: <strong>{activeBuild.name}</strong>
            </span>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1 font-semibold text-white hover:text-cyan-200 underline ml-1"
            >
              Resume in Planner <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold mb-6 shadow-sm"
        >
          <Pickaxe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Minecraft Java Edition 1.20+ & 1.21 Ready</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-cyan-300"
        >
          Your Next Great Minecraft Build Starts Here.
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Turn schematics into survival plans, uncover crafting recipes, and explore incredible builds from the community.
        </motion.p>

        {/* Primary & Secondary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16"
        >
          <Link
            href="/planner"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-xl shadow-cyan-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wrench className="w-5 h-5" />
            <span>Analyze a Build</span>
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Explore Builds</span>
          </Link>
          <Link
            href="/recipes"
            className="text-xs font-semibold text-slate-400 hover:text-cyan-300 underline-offset-4 hover:underline py-2 sm:px-2 flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Or browse Crafting Recipes</span>
          </Link>
        </motion.div>

        {/* Hero Visual Composition */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 md:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-slate-300">DualFullBlockCrafter.litematic</span>
            </div>
            <span className="text-cyan-400 font-mono">1.20.4 • 23 Solid Blocks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Technical Schematic Geometry View */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Box className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Schematic Geometry Analysis</span>
                </span>
                <span className="text-slate-500">Procedural Voxel Model</span>
              </div>
              <IsometricBuildPreview build={SEED_BUILDS[0]} aspectRatio="video" />
            </div>

            {/* Live Materials Breakdown */}
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gathering Breakdown
                </span>
                <p className="text-xs text-slate-500">Auto-calculated material items</p>
              </div>

              <div className="space-y-2">
                {[
                  { name: "light_blue_wool", count: 11 },
                  { name: "redstone", count: 4 },
                  { name: "comparator", count: 3 },
                  { name: "crafter", count: 2 },
                  { name: "hopper", count: 2 },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/70 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MinecraftIcon itemName={item.name} size={20} />
                      <span className="text-slate-300 capitalize">
                        {item.name.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="font-mono text-cyan-300 font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/planner"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 hover:text-white text-xs font-semibold transition-all hover:bg-cyan-900/80"
                >
                  <span>Open Full Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── SECTION B — THE BUILD PLANNER ─────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-slate-900 bg-slate-950/40 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
                <Wrench className="w-3.5 h-3.5" />
                <span>The Core Engine</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
                From Schematic to Survival Plan.
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Building in survival requires knowing what to gather before you place block one. MineBuild processes your <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">.litematic</code> files in milliseconds and outputs an actionable gathering roadmap.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    title: "Dimensions & Volumes",
                    desc: "Bounding box, solid blocks, and region volume calculations.",
                  },
                  {
                    title: "Categorized Materials",
                    desc: "Grouped by Redstone, Building, Organic, and Natural gathering sources.",
                  },
                  {
                    title: "Crafting Tree Breakdown",
                    desc: "Recursive recipes showing base raw materials required.",
                  },
                  {
                    title: "Live Inventory Tracking",
                    desc: "Input what you already have to see exact missing material counts.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1"
                  >
                    <h4 className="text-xs font-bold text-slate-200">{f.title}</h4>
                    <p className="text-[11px] text-slate-400">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/planner"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-950/30"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Open Build Planner</span>
                </Link>
              </div>
            </div>

            {/* Interactive Feature Visual Preview */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Box className="w-4 h-4 text-cyan-400" />
                  <span>Build Analysis Dashboard</span>
                </span>
                <span className="text-emerald-400 font-mono font-medium">100% Client-Side</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="text-slate-400">Dimensions</span>
                  <span className="font-mono text-slate-200 font-bold">12 × 9 × 10 Blocks</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="text-slate-400">Total Solid Blocks</span>
                  <span className="font-mono text-slate-200 font-bold">384 Solid</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="text-slate-400">Inventory Status</span>
                  <span className="font-mono text-amber-300 font-bold">PARTIAL (244 Remaining)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No Server Uploads Needed</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Your files never leave your computer. Web Workers parse the GZIP/NBT data locally with high memory safety.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION C — THE RECIPES GUIDE ─────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-slate-900 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual 3x3 Crafting Grid Walkthrough */}
            <div className="order-2 lg:order-1 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-2xl flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 text-xs mb-6">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Minecraft 1.20+ Recipe Engine</span>
                </span>
                <span className="text-slate-500 font-mono">3×3 Grid</span>
              </div>

              {/* 3x3 Grid Interface */}
              <div className="flex items-center justify-center gap-6 my-4">
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 border-2 border-slate-800 rounded-xl shadow-inner">
                  {crafterGrid.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded bg-slate-900/80 border border-slate-700/60 flex items-center justify-center relative shadow-sm"
                      title={item.replace("minecraft:", "")}
                    >
                      <MinecraftIcon itemName={item} size={28} />
                    </div>
                  ))}
                </div>

                <div className="text-cyan-400">
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </div>

                <div className="w-16 h-16 rounded-xl bg-cyan-950/60 border-2 border-cyan-700/80 flex flex-col items-center justify-center shadow-lg shadow-cyan-950/50">
                  <MinecraftIcon itemName="minecraft:crafter" size={36} />
                  <span className="text-[10px] font-mono font-bold text-cyan-300 mt-0.5">Crafter</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center mt-4">
                Example: Crafting the new <strong>Autocrafter</strong> block using 5 Iron Ingots, 1 Crafting Table, 2 Redstone, and 1 Dropper.
              </p>
            </div>

            {/* Explanation Copy */}
            <div className="order-1 lg:order-2 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Crafting Intelligence</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
                Know Exactly How to Craft It.
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Whether you need a dispenser, observer, or 50 stonecutter slabs, MineBuild provides a searchable database of authentic version-matched Minecraft recipes.
              </p>

              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Search:</strong> Find recipes by item name or category tags.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Interactive 3×3 Grids:</strong> Visual crafting tables, furnace smelting, and stonecutter paths.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Direct Link from Builds:</strong> Click any craftable badge in your build to jump straight to its recipe.
                  </span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  href="/recipes"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
                >
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Explore Recipes Guide</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION D — THE COMMUNITY / EXPLORE SECTION ──────────────────── */}
      <section className="py-20 md:py-28 border-t border-slate-900 bg-slate-950/50 relative">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="space-y-3 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>Public Gallery</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
                Discover Your Next Build.
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-xl">
                Explore community-curated builds complete with genuine project screenshots, exact dimensions, and material requirements.
              </p>
            </div>

            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>View All 20+ Creations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Featured Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBuilds.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col justify-between p-4 space-y-4 hover:border-cyan-800/60 transition-colors"
              >
                <Link
                  href={`/explore/${b.slug}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  tabIndex={-1}
                >
                  <BuildThumbnail build={b} aspectRatio="video" />
                </Link>
                <div className="space-y-1.5 text-left">
                  <div className="text-[11px] text-slate-500 font-mono">By {b.creatorName}</div>
                  <h3 className="text-base font-bold text-slate-100 line-clamp-1">{b.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{b.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {b.dimensions.x}×{b.dimensions.y}×{b.dimensions.z}
                  </span>
                  <Link
                    href={`/explore/${b.slug}`}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View Build</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-950/30"
            >
              <Compass className="w-4 h-4" />
              <span>Explore the Gallery</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION E — RECENT BUILDS ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-slate-900 relative">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-400 shadow-md">
            <History className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Pick Up Where You Left Off.
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            All builds analyzed on your computer are saved locally in your current browser&apos;s IndexedDB database. Reopen them anytime without uploading again.
          </p>
          <div className="pt-2">
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Open Build Planner History</span>
            </Link>
          </div>
          <p className="text-[11px] text-slate-500">
            Note: Build history is stored securely on this device and does not sync across separate computers.
          </p>
        </div>
      </section>

      {/* ── SECTION F — HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-slate-900 bg-slate-950/40 relative">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              How MineBuild Works
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Four simple steps from design schematic to survival completion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                step: "01",
                title: "Upload Schematic",
                desc: "Drag and drop any .litematic file. Processed safely inside your browser.",
              },
              {
                step: "02",
                title: "Inspect Materials",
                desc: "View dimensions, solid block counts, and categorized resource requirements.",
              },
              {
                step: "03",
                title: "Explore Recipes",
                desc: "Compare what you have against missing items and explore crafting steps.",
              },
              {
                step: "04",
                title: "Save & Share",
                desc: "Resume your progress anytime locally or submit creations to Explore.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative group hover:border-cyan-800/60 transition-colors"
              >
                <div className="text-2xl font-mono font-extrabold text-cyan-400/60 group-hover:text-cyan-400 transition-colors">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-slate-100">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION G — WHY MINEBUILD ─────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-slate-900 relative">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Why Builders Use MineBuild
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Designed by Minecraft players for authentic survival and creative workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: "Clear Material Requirements",
                desc: "Never run out of quartz or terracotta halfway through an underground build.",
              },
              {
                title: "Visual Crafting Guidance",
                desc: "Instant 3x3 recipe grids showing both primary and alternative recipes.",
              },
              {
                title: "Inventory Status & Tracking",
                desc: "Color-coded ENOUGH, PARTIAL, and MISSING status badges keep you organized.",
              },
              {
                title: "Privacy & Speed",
                desc: "No accounts required, no file uploads to remote servers, instant calculations.",
              },
              {
                title: "Community Inspiration",
                desc: "Browse dozens of verified redstone farms, houses, and survival builds.",
              },
              {
                title: "Persistent Local Storage",
                desc: "Your saved builds and custom item inventory stay right where you left them.",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <h4 className="text-sm font-bold text-slate-200">{b.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION H — FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-20 md:py-32 border-t border-slate-900 bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-3xl space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight">
            Ready to Start Your Next Build?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Upload your schematic now or explore designs crafted by the Minecraft community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/planner"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wrench className="w-4 h-4" />
              <span>Analyze a Build</span>
            </Link>
            <Link
              href="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Explore Builds</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
