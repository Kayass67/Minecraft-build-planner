"use client";

import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { Dashboard } from "@/components/Dashboard";
import { NormalizedSchematic } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Pickaxe, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [schematic, setSchematic] = useState<NormalizedSchematic | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden selection:bg-cyan-900/50 relative">
      {/* Background gradients for that "night sky" feel */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-slate-950 to-slate-950 blur-3xl mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900 via-slate-950 to-slate-950 blur-3xl mix-blend-screen" />
      </div>

      <main className="relative z-10 flex flex-col min-h-screen container mx-auto px-4 py-12 md:py-24">
        {/* Header */}
        <header className="mb-16 flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 mb-2"
          >
            <div className="p-3 bg-cyan-950/50 rounded-xl border border-cyan-900/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Pickaxe className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-400">
              BlockPlan
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg text-slate-400 max-w-xl mx-auto"
          >
            Turn your Minecraft schematics into practical gathering plans. 
            Upload a <code className="text-cyan-300 font-mono text-sm px-1 py-0.5 bg-slate-900 rounded">.litematic</code> file to get started.
          </motion.p>
        </header>

        <AnimatePresence mode="wait">
          {!schematic ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center w-full max-w-4xl mx-auto"
            >
              {error && (
                <Alert variant="destructive" className="mb-6 w-full max-w-2xl bg-red-950/50 border-red-900 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <FileUploader 
                onParsed={(data) => {
                  setError(null);
                  setSchematic(data);
                }} 
                onError={(err) => setError(err)} 
              />

              <div className="mt-12 text-center text-sm text-slate-500">
                <p>Files are processed locally in your browser.</p>
                <p>No data is uploaded to our servers.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard 
                schematic={schematic} 
                onReset={() => {
                  setSchematic(null);
                  setError(null);
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
