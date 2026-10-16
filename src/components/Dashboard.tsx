"use client";

import { useState } from "react";
import Link from "next/link";
import { NormalizedSchematic } from "@/lib/types";
import { MaterialAnalysis } from "@/lib/materials/types";
import { formatDisplayName } from "@/lib/materials/recipes";
import { useInventory } from "@/hooks/useInventory";
import { hasRecipe } from "@/lib/materials/recipeIndex";
import { canonicalizeInventoryKey } from "@/lib/materials/inventory";
import { MinecraftIcon } from "@/components/MinecraftIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Box, Layers, ArrowLeft, Map, AlertCircle, Pickaxe, Search, Plus, Minus, ListTree, RotateCcw, BookOpen } from "lucide-react";

export function Dashboard({
  schematic,
  analysis,
  onReset,
  initialInventory = {},
  onInventoryChange,
}: {
  schematic: NormalizedSchematic;
  analysis: MaterialAnalysis;
  onReset: () => void;
  buildId?: string;
  initialInventory?: Record<string, number>;
  onInventoryChange?: (inventory: Record<string, number>) => void;
}) {
  const {
    setItemQuantity,
    incrementItem,
    decrementItem,
    resetAll,
    getItemCalculation,
  } = useInventory(initialInventory, onInventoryChange);

  const [searchQuery, setSearchQuery] = useState("");

  const formatName = (name: string) => {
    return formatDisplayName(name);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const hasUnknownBlocks = Object.keys(analysis.unrecognizedBlocks).length > 0;
  const hasCrafting = Object.keys(analysis.processingOperations).length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{schematic.metadata.name || "Untitled Build"}</h1>
          <p className="text-slate-400 mt-1 flex items-center space-x-2">
            <span>By {schematic.metadata.author || "Unknown"}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/recipes"
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-cyan-300 hover:text-white bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-800/70 rounded-lg transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Recipes</span>
          </Link>
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Upload Another</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/70 border-slate-700/60 backdrop-blur-md shadow-lg shadow-black/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Dimensions</CardTitle>
            <Box className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 tracking-tight">
              {analysis.dimensions.x} × {analysis.dimensions.y} × {analysis.dimensions.z}
            </div>
            <p className="text-xs text-slate-400 mt-1">Width × Height × Length</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-700/60 backdrop-blur-md shadow-lg shadow-black/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Solid Blocks</CardTitle>
            <Layers className="w-4 h-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 tracking-tight">
              {analysis.totalSolidBlocks.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Excluding air & voids</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-700/60 backdrop-blur-md shadow-lg shadow-black/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Regions</CardTitle>
            <Map className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 tracking-tight">
              {Object.keys(schematic.regions).length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Sub-structures</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gathering" className="w-full">
        <TabsList className="bg-slate-900/80 border border-slate-700/70 p-1 mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="gathering" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-300 text-slate-300 font-medium">Gathering Plan</TabsTrigger>
          <TabsTrigger value="exact" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-300 text-slate-300 font-medium">Exact Blocks</TabsTrigger>
          {hasCrafting && <TabsTrigger value="crafting" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-300 text-slate-300 font-medium">Crafting Breakdown</TabsTrigger>}
          {hasUnknownBlocks && (
            <TabsTrigger value="unknown" className="data-[state=active]:bg-red-950/70 data-[state=active]:text-red-200 text-red-300 font-medium border border-red-900/50">
              Unrecognized
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* GATHERING PLAN TAB */}
        <TabsContent value="gathering" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Survival Gathering Plan</h2>
              <p className="text-sm text-slate-300">Base resources needed to craft all blocks. Enter your inventory below.</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter materials..."
                  className="pl-9 bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-400 focus-visible:ring-cyan-500"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <button 
                onClick={resetAll}
                className="p-2 text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
                title="Reset Inventory"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {Object.entries(analysis.gatheringPlan.categories).map(([category, items]) => {
              const categoryItems = Object.entries(items).filter(([name, planItem]) => {
                const displayName = planItem.displayName || formatName(name);
                return (
                  name.toLowerCase().includes(searchQuery) ||
                  displayName.toLowerCase().includes(searchQuery)
                );
              });
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-700/70 pb-2">
                    <Pickaxe className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold text-slate-100">{category}</h3>
                    <Badge variant="secondary" className="ml-2 bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                      {categoryItems.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryItems.map(([name, planItem]) => {
                      const itemKey = planItem.id || name;
                      const cleanName = planItem.displayName || formatName(name);
                      const { owned, missing, status } = getItemCalculation(itemKey, planItem.count);
                      const isItemCraftable = hasRecipe(itemKey);
                      const canonicalId = canonicalizeInventoryKey(itemKey);
                      
                      return (
                        <div key={name} className="flex flex-col bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 gap-3 transition-colors hover:border-slate-600 shadow-sm">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-1 bg-slate-950/80 rounded-lg border border-slate-800 shrink-0 flex items-center justify-center">
                                <MinecraftIcon itemName={itemKey} size={28} alt={cleanName} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-slate-100 text-base truncate" title={cleanName}>
                                    {cleanName}
                                  </p>
                                  {isItemCraftable && (
                                    <Link
                                      href={`/recipes?item=minecraft:${encodeURIComponent(canonicalId)}`}
                                      className="inline-flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                                      title={`View crafting recipe for ${cleanName}`}
                                      aria-label={`View crafting recipe for ${cleanName}`}
                                    >
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0 text-cyan-300 border-cyan-800/80 bg-cyan-950/40 group-hover:bg-cyan-900/60 group-hover:border-cyan-500 transition-colors cursor-pointer shrink-0"
                                      >
                                        Craftable
                                      </Badge>
                                    </Link>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0 shrink-0 border ${
                                      status === 'ENOUGH'
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                                        : status === 'PARTIAL'
                                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                                        : 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                                    }`}
                                  >
                                    {status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-400 font-mono truncate">{name}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Required</p>
                              <p className="font-bold text-slate-100 text-base">{planItem.count.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/60">
                            <div className="flex-1">
                              <p className="text-xs text-slate-300 font-medium mb-1 ml-1">In Inventory</p>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => decrementItem(itemKey)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <Input 
                                  type="number"
                                  min="0"
                                  value={owned}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    setItemQuantity(itemKey, isNaN(val) ? 0 : val);
                                  }}
                                  placeholder="0"
                                  className="h-7 w-20 px-2 text-center text-sm bg-slate-950 text-slate-100 border-slate-700 focus-visible:ring-cyan-500 font-medium"
                                />
                                <button 
                                  onClick={() => incrementItem(itemKey)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex-1 text-right border-l border-slate-700/60 pl-3">
                              <div className="flex items-center justify-end gap-1 mb-1">
                                <span className="text-xs text-slate-300 font-medium">Missing:</span>
                                <span className={`text-xs font-bold uppercase ${
                                  status === 'ENOUGH' ? 'text-emerald-400' :
                                  status === 'PARTIAL' ? 'text-amber-300' : 'text-rose-400'
                                }`}>
                                  {status}
                                </span>
                              </div>
                              <p className={`font-bold text-lg leading-none ${
                                status === 'ENOUGH' ? 'text-emerald-400' :
                                status === 'PARTIAL' ? 'text-amber-300' : 'text-rose-400'
                              }`}>
                                {missing.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* EXACT BLOCKS TAB */}
        <TabsContent value="exact" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="bg-slate-900/70 border-slate-700/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-100 font-bold">Exact Block Placements</CardTitle>
              <CardDescription className="text-slate-300">The literal blocks required to build the schematic, regardless of crafting requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(analysis.exactBlockCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="p-1 bg-slate-950/60 rounded border border-slate-800/80 shrink-0 flex items-center justify-center">
                        <MinecraftIcon itemName={name} size={22} alt={formatName(name)} />
                      </div>
                      <p className="text-sm font-medium text-slate-100 truncate" title={formatName(name)}>
                        {formatName(name)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 font-mono bg-slate-950 text-slate-200 border-slate-700 font-semibold">
                      {count.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRAFTING TAB */}
        {hasCrafting && (
          <TabsContent value="crafting" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="bg-slate-900/70 border-slate-700/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100 font-bold">
                  <ListTree className="w-5 h-5 text-cyan-400" />
                  Crafting Breakdown
                </CardTitle>
                <CardDescription className="text-slate-300">Shows the number of crafting/processing operations required for the intermediate blocks.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion className="w-full space-y-2">
                  {Object.entries(analysis.processingOperations).map(([operation, count], idx) => {
                    const cleanOp = formatName(operation);
                    return (
                      <AccordionItem value={`item-${idx}`} key={operation} className="border border-slate-700/60 rounded-lg px-4 bg-slate-800/30 data-[state=open]:bg-slate-800/60">
                        <AccordionTrigger className="hover:no-underline text-slate-100 py-3">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-semibold">{cleanOp}</span>
                            <Badge variant="secondary" className="bg-cyan-950/80 text-cyan-200 border border-cyan-800 font-mono">
                              {count.toLocaleString()} craft{count > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-300 pb-4 pt-1">
                          <p className="text-sm">
                            The engine calculated that {count.toLocaleString()} exact crafting operation{count > 1 ? 's are' : ' is'} needed 
                            to fulfill the requirements for {cleanOp} (including recursive dependencies).
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* UNKNOWN MATERIALS TAB */}
        {hasUnknownBlocks && (
          <TabsContent value="unknown" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <div className="text-sm font-medium">
                The Material Intelligence Engine could not find exact recipes for the following items. 
                They have been treated as base materials in the gathering plan.
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(analysis.unrecognizedBlocks)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                <div key={name} className="flex justify-between items-center p-3 rounded-lg bg-red-950/30 border border-red-900/50">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-slate-100 truncate font-mono" title={name}>
                      {name}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono bg-red-950/70 text-red-200 border-red-800 font-semibold">
                    {count.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

