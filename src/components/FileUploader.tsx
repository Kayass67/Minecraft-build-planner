"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { parseLitematic } from "@/lib/parser";
import { NormalizedSchematic } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export function FileUploader({
  onParsed,
  onError,
}: {
  onParsed: (data: NormalizedSchematic) => void;
  onError: (error: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("Analyzing blocks...");

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".litematic")) {
      onError("Please upload a .litematic file");
      return;
    }
    
    if (file.size === 0) {
      onError("The uploaded file is empty.");
      return;
    }
    
    // 50MB limit to prevent unreasonable memory allocation in browser
    if (file.size > 50 * 1024 * 1024) {
      onError("File is too large. Maximum supported size is 50MB.");
      return;
    }

    try {
      setIsParsing(true);
      setParseStatus("Reading file...");
      
      const buffer = await file.arrayBuffer();
      
      const schematic = await parseLitematic(buffer, (status) => {
        setParseStatus(status);
      });
      
      onParsed(schematic);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        onError(e.message || "Failed to parse the schematic. The file might be corrupt or unsupported.");
      } else {
        onError("Failed to parse the schematic. The file might be corrupt or unsupported.");
      }
    } finally {
      setIsParsing(false);
      // Reset file input so same file can be uploaded again if needed
      setParseStatus("Analyzing blocks...");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={onDrop}
      className={`relative w-full max-w-2xl mx-auto rounded-xl border-2 border-dashed transition-all p-12 text-center cursor-pointer overflow-hidden ${
        isDragging
          ? "border-cyan-400 bg-cyan-950/20"
          : "border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700"
      }`}
    >
      <input
        type="file"
        accept=".litematic"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Clear the input value so the exact same file can be selected again
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none relative z-10">
        <div className="p-4 rounded-full bg-slate-800/50 shadow-inner">
          <UploadCloud className="w-10 h-10 text-cyan-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200">
          Upload your .litematic schematic
        </h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Drag and drop your file here, or click to browse. Processing is done safely and securely in your browser.
        </p>
      </div>

      <AnimatePresence>
        {isParsing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          >
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-cyan-400 font-medium animate-pulse">{parseStatus}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
