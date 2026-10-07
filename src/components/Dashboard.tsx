"use client";

import { NormalizedSchematic } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Box, Layers, Clock, ArrowLeft } from "lucide-react";

export function Dashboard({
  schematic,
  onReset,
}: {
  schematic: NormalizedSchematic;
  onReset: () => void;
}) {
  const materialsList = Object.entries(schematic.materials).sort(
    (a, b) => b[1].count - a[1].count
  );

  const totalBlocks = materialsList.reduce((acc, [, { count }]) => acc + count, 0);

  // A very rough time estimate: say 1 second per block on average to gather & build
  // Just an arbitrary heuristic to give the user *some* rough idea
  const estimatedSeconds = totalBlocks * 1.5; 
  const estimatedHours = Math.floor(estimatedSeconds / 3600);
  const estimatedMinutes = Math.floor((estimatedSeconds % 3600) / 60);

  // Basic inventory calculation: 1 stack = 64 blocks
  // Shulker box = 27 stacks = 1728 blocks
  const calculateInventory = (count: number) => {
    const shulkers = Math.floor(count / 1728);
    const stacks = Math.floor((count % 1728) / 64);
    const remainder = count % 64;
    
    const parts = [];
    if (shulkers > 0) parts.push(`${shulkers} shulker${shulkers > 1 ? 's' : ''}`);
    if (stacks > 0) parts.push(`${stacks} stack${stacks > 1 ? 's' : ''}`);
    if (remainder > 0) parts.push(`${remainder} block${remainder > 1 ? 's' : ''}`);
    return parts.join(", ") || "0 blocks";
  };

  const calculateSlots = (count: number) => {
    return Math.ceil(count / 64);
  };

  const totalSlots = materialsList.reduce((acc, [, { count }]) => acc + calculateSlots(count), 0);
  const totalShulkers = Math.ceil(totalSlots / 27);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{schematic.metadata.name}</h1>
          <p className="text-slate-400">By {schematic.metadata.author}</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Another</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Dimensions</CardTitle>
            <Box className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {schematic.metadata.enclosingSize.x} × {schematic.metadata.enclosingSize.y} × {schematic.metadata.enclosingSize.z}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total volume: {schematic.metadata.totalVolume.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Blocks</CardTitle>
            <Layers className="w-4 h-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {totalBlocks.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Excluding air blocks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Est. Time</CardTitle>
            <Clock className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {estimatedHours}h {estimatedMinutes}m
            </div>
            <p className="text-xs text-slate-500 mt-1">Gathering & building</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 mb-4">
          <TabsTrigger value="materials">Materials List</TabsTrigger>
          <TabsTrigger value="logistics">Logistics & Storage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Material Requirements</CardTitle>
              <CardDescription>Exact block counts needed to complete this build.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {materialsList.map(([name, { count }], index) => {
                    const cleanName = name.replace("minecraft:", "").replace(/_/g, " ");
                    const percentage = (count / totalBlocks) * 100;
                    
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                        key={name}
                        className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 w-1/3">
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                            {/* In a real app we'd load minecraft item textures here */}
                            <Box className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 capitalize truncate" title={cleanName}>
                              {cleanName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono text-left">{name}</p>
                          </div>
                        </div>

                        <div className="flex-1 w-full">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{calculateInventory(count)}</span>
                            <span className="text-slate-500">{percentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={percentage} className="h-1.5" />
                        </div>

                        <div className="w-24 text-right">
                          <Badge variant="secondary" className="bg-slate-800 text-slate-300 font-mono text-sm px-2">
                            {count.toLocaleString()}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Storage Requirements</CardTitle>
              <CardDescription>Estimated chests and shulkers required to transport these materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-slate-800 bg-slate-800/30 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="text-4xl font-bold text-cyan-400">{totalSlots.toLocaleString()}</div>
                  <p className="text-slate-300 font-medium">Inventory Slots</p>
                  <p className="text-sm text-slate-500">Total 64-stack slots required</p>
                </div>
                
                <div className="p-6 rounded-xl border border-slate-800 bg-slate-800/30 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="text-4xl font-bold text-violet-400">{totalShulkers}</div>
                  <p className="text-slate-300 font-medium">Shulker Boxes</p>
                  <p className="text-sm text-slate-500">Minimum boxes for transport</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
