import { notFound } from "next/navigation";
import Link from "next/link";
import { getBuildBySlug, SEED_BUILDS } from "@/lib/community/seedBuilds";
import { BuildDetailVisual } from "@/components/BuildDetailVisual";
import { MinecraftIcon } from "@/components/MinecraftIcon";
import {
  Box,
  Layers,
  Map,
  User,
  Calendar,
  ExternalLink,
  Download,
  ArrowLeft,
  Shield,
  Wrench,
  Tag,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SEED_BUILDS.map((b) => ({
    slug: b.slug,
  }));
}

export default async function BuildDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const build = getBuildBySlug(slug);

  if (!build) {
    notFound();
  }

  const isDemo = build.listingType === "minebuild_demo";

  return (
    <main className="container mx-auto px-4 py-8 md:py-16 max-w-5xl flex-1 flex flex-col">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Gallery</span>
        </Link>
      </div>

      {/* Main Header */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-300">
            {build.category}
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            Minecraft Java {build.minecraftVersion}
          </span>
          {isDemo ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              MineBuild Demo
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              Curated Community Listing
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
          {build.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-500" />
            <span>
              Created by <strong className="text-slate-200">{build.creatorName}</strong>
            </span>
            {build.creatorUrl && (
              <a
                href={build.creatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 ml-1 inline-flex items-center gap-0.5"
              >
                <span>Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Published {new Date(build.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Hero Visual Preview */}
      <div className="mb-10">
        <BuildDetailVisual build={build} />
      </div>

      {/* Two Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column: Description & Materials */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-200">About this Build</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {build.description}
            </p>
          </div>

          {/* Tags */}
          {build.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Tags</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {build.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Materials Requirement */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-200">Key Materials Required</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {build.keyMaterials.map((mat) => (
                <div
                  key={mat.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <MinecraftIcon itemName={mat.name} size={24} />
                    <span className="text-xs font-medium text-slate-200 capitalize">
                      {mat.name.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {mat.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Card & Download / External Actions */}
        <div className="space-y-6">
          {/* Quick Specifications Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Build Specifications
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <span className="text-slate-400 flex items-center gap-2">
                  <Box className="w-4 h-4 text-cyan-400" />
                  <span>Bounding Dimensions</span>
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {build.dimensions.x} × {build.dimensions.y} × {build.dimensions.z}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <span className="text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span>Total Solid Blocks</span>
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {build.solidBlockCount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <span className="text-slate-400 flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-400" />
                  <span>Sub-Regions</span>
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {build.regionCount}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-2">
              {build.downloadable && build.downloadUrl ? (
                <>
                  <a
                    href={build.downloadUrl}
                    download
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-950/40 transition-all text-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .litematic</span>
                  </a>
                  <Link
                    href="/planner"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open in Build Planner</span>
                  </Link>
                </>
              ) : build.sourceUrl ? (
                <a
                  href={build.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-semibold text-sm shadow-md transition-all text-center"
                >
                  <span>View on Creator Page</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="text-xs text-slate-500 text-center p-2 rounded bg-slate-950/60 border border-slate-800">
                  View-only community inspiration. Download not requested by uploader.
                </div>
              )}
            </div>
          </div>

          {/* Creator Attribution & License Banner */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Provenance & Licensing</span>
            </div>
            <div className="space-y-1 text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-300">License:</strong> {build.license}
              </p>
              <p>{build.attributionText}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Verified on {build.dateChecked}. To report an issue with this listing, visit our{" "}
                <Link href="/report" className="text-cyan-400 hover:underline">
                  Content Reporting
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
