"use client";

import { useState } from "react";
import { parseLitematic } from "@/lib/parser";
import { BuildCategory } from "@/lib/community/types";
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Shield,
  Loader2,
  Camera,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES: BuildCategory[] = [
  "Redstone & Automation",
  "Survival & Starter",
  "Farms & Generators",
  "Architecture & Castles",
  "Nether & End",
  "Decorative & Botanical",
];

interface SubmitBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitBuildModal({ isOpen, onClose }: SubmitBuildModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [screenshotPermission, setScreenshotPermission] = useState(false);

  const [parsedInfo, setParsedInfo] = useState<{
    dimensions: { x: number; y: number; z: number };
    solidBlocks: number;
    regions: number;
    topBlocks: string[];
  } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BuildCategory>("Survival & Starter");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".litematic")) {
      setParseError("Please select a .litematic schematic file.");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setParseError("File is too large. Maximum supported size is 50MB.");
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setParsing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const schematic = await parseLitematic(buffer);

      let solidBlocks = 0;
      const counts: Record<string, number> = {};
      for (const [name, mat] of Object.entries(schematic.materials)) {
        if (!name.includes("air")) {
          solidBlocks += mat.count;
          counts[name] = mat.count;
        }
      }

      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([n]) => n);

      setParsedInfo({
        dimensions: schematic.metadata.enclosingSize || { x: 0, y: 0, z: 0 },
        solidBlocks,
        regions: schematic.regions.length,
        topBlocks: top,
      });

      if (!title) {
        setTitle(schematic.metadata.name || selectedFile.name.replace(/\.litematic$/i, ""));
      }
      if (!creatorName && schematic.metadata.author && schematic.metadata.author !== "Unknown") {
        setCreatorName(schematic.metadata.author);
      }
    } catch (e: unknown) {
      console.warn("Schematic parse warning:", e);
      setParseError("Could not inspect schematic file structure. Please ensure it is a valid .litematic file.");
    } finally {
      setParsing(false);
    }
  };

  const handleScreenshotChange = (selectedFile: File) => {
    const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const hasValidExt = validExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setScreenshotError("Unsupported image format. Please select a PNG, JPEG, or WebP screenshot.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setScreenshotError("Screenshot exceeds 5MB size limit.");
      return;
    }

    setScreenshotFile(selectedFile);
    setScreenshotError(null);
    setScreenshotPreview(URL.createObjectURL(selectedFile));
    setScreenshotPermission(true);
  };

  const handleRemoveScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotError(null);
    setScreenshotPermission(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setSubmitError("Please select a .litematic schematic file.");
      return;
    }
    if (!title.trim() || !creatorName.trim() || !description.trim()) {
      setSubmitError("Please fill out all required fields (title, creator name, description).");
      return;
    }
    if (!rightsConfirmed) {
      setSubmitError("You must confirm that you created this build or have explicit authorization to share it.");
      return;
    }
    if (screenshotFile && !screenshotPermission) {
      setSubmitError("Please confirm authorization for your attached screenshot before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (screenshotFile) {
        formData.append("screenshot", screenshotFile);
        formData.append("screenshotPermission", String(screenshotPermission));
      }
      formData.append("title", title.trim());
      formData.append("creatorName", creatorName.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("tags", tags.trim());
      formData.append("sourceUrl", sourceUrl.trim());
      formData.append("rightsConfirmed", String(rightsConfirmed));
      formData.append("allowDownload", String(allowDownload));
      if (parsedInfo) {
        formData.append("dimensions", JSON.stringify(parsedInfo.dimensions));
        formData.append("solidBlocks", String(parsedInfo.solidBlocks));
        formData.append("regionCount", String(parsedInfo.regions));
        formData.append("topBlocks", JSON.stringify(parsedInfo.topBlocks));
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please check your inputs.");
      }

      setSubmitSuccess(
        "Build submitted successfully! Your creation has been queued for moderation review and will appear in Explore once approved."
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to submit build. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 my-8 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="submit-modal-title" className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Submit a Minecraft Build
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Share your creation with the MineBuild community. Submissions are reviewed for quality and creator rights before publishing.
          </p>
        </div>

        {submitSuccess ? (
          <div className="space-y-4 py-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Thank You!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">{submitSuccess}</p>
            <Button
              onClick={onClose}
              className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <Alert variant="destructive" className="bg-red-950/60 border-red-900 text-red-200">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">{submitError}</AlertDescription>
              </Alert>
            )}

            {/* File Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Schematic File (.litematic) *
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-5 text-center bg-slate-950/50 cursor-pointer relative transition-colors">
                <input
                  type="file"
                  accept=".litematic"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange(f);
                  }}
                  required
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                        {parsedInfo && ` • ${parsedInfo.dimensions.x}×${parsedInfo.dimensions.y}×${parsedInfo.dimensions.z} blocks`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <UploadCloud className="w-8 h-8 text-cyan-400" />
                    <span className="text-sm font-medium text-slate-300">
                      Click or drag .litematic file here
                    </span>
                    <span className="text-xs text-slate-500">Max size 50MB</span>
                  </div>
                )}
              </div>
              {parsing && <p className="text-xs text-cyan-400 mt-1 animate-pulse">Inspecting schematic structure…</p>}
              {parseError && <p className="text-xs text-rose-400 mt-1">{parseError}</p>}
            </div>

            {/* Optional Genuine Screenshot Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Build Screenshot (Optional Genuine In-Game Photo)
                </label>
                <span className="text-[11px] text-cyan-400 font-medium">PNG, JPEG, WebP • Max 5MB</span>
              </div>

              {screenshotPreview ? (
                <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-950 p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate max-w-xs">{screenshotFile?.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {screenshotFile && (screenshotFile.size / 1024).toFixed(0)} KB • Authenticated format
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                    title="Remove screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-800 hover:border-cyan-600/70 rounded-xl p-4 text-center bg-slate-950/40 relative cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleScreenshotChange(f);
                    }}
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-400 group-hover:text-cyan-300">
                    <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Upload a genuine in-game screenshot to feature on your build card</span>
                  </div>
                </div>
              )}
              {screenshotError && <p className="text-xs text-rose-400 mt-1">{screenshotError}</p>}
            </div>

            {/* Title & Creator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Build Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Compact Bamboo Farm"
                  required
                  maxLength={80}
                  className="bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Creator Name / Handle *
                </label>
                <Input
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. SteveBuilder"
                  required
                  maxLength={50}
                  className="bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Short Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what the build does, key features, or building tips…"
                required
                rows={3}
                maxLength={400}
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BuildCategory)}
                  className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="redstone, survival, starter, farm"
                  className="bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>
            </div>

            {/* Creator / Source Link */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Creator or Video Link (Optional)
              </label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                type="url"
                className="bg-slate-950 border-slate-800 text-slate-200"
              />
            </div>

            {/* Permissions & Copyright Checkboxes */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={(e) => setRightsConfirmed(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
                <span>
                  <strong className="text-slate-200">Creator Rights Confirmation: *</strong> I confirm that I created this build or have express authorization from the creator to share it on MineBuild.
                </span>
              </label>

              {screenshotFile && (
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-700/50">
                  <input
                    type="checkbox"
                    checked={screenshotPermission}
                    onChange={(e) => setScreenshotPermission(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span>
                    <strong className="text-cyan-300">Screenshot Display Authorization: *</strong> I created this in-game screenshot or have express permission to submit it for public display on MineBuild.
                    <span className="block text-[11px] text-slate-400 mt-1">
                      <em>Rights Separation:</em> Screenshot display permission is independent from .litematic schematic redistribution rights. You can grant screenshot display permission while leaving file downloads disabled below.
                    </span>
                  </span>
                </label>
              )}

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
                <span>
                  <strong className="text-slate-200">Download Permission (Opt-In):</strong> Allow other players to download the original .litematic file. If unchecked, visitors can view dimensions, materials, and preview, but cannot download the raw file.
                </span>
              </label>
            </div>

            {/* Notice of What Will Be Public */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Submissions enter moderation before appearing in Explore. Your title, creator name, dimensions, material summary, and preview will be public once approved.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit for Moderation"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
