"use client";

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Pickaxe, Search, X, Clock, Sparkles, ChevronRight, Trash2, ArrowLeft, BookOpen, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MinecraftIcon } from "@/components/MinecraftIcon";
import { useRecentRecipes } from "@/hooks/useRecentRecipes";
import {
  MC_VERSION,
  resolveItemId,
  getRecipesForItem,
  parseRecipe,
  searchItems,
  getRecommendations,
  getItem,
  type McItem,
  type ParsedRecipe,
  type SearchableItem,
  type Recommendation,
} from "@/lib/materials/recipeIndex";

// ── Recipe Search Component ────────────────────────────────────────────────

function RecipeSearch({
  onSelect,
  initialQuery = "",
}: {
  onSelect: (item: SearchableItem) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive results directly during render — eliminates cascading render warnings
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchItems(query, 12);
  }, [query]);

  const [prevInit, setPrevInit] = useState(initialQuery);
  if (prevInit !== initialQuery) {
    setPrevInit(initialQuery);
    setQuery(initialQuery);
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(
    (item: SearchableItem) => {
      setQuery(item.displayName);
      setShowDropdown(false);
      onSelect(item);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search items… (e.g. Wooden Sword, Oak Planks, Furnace, Iron Ingot)"
          className="pl-12 pr-10 h-14 text-base bg-slate-900/90 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500 focus-visible:border-cyan-600 rounded-xl shadow-lg shadow-black/20"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search Minecraft items"
          aria-autocomplete="list"
          aria-expanded={showDropdown && results.length > 0}
          role="combobox"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl shadow-black/40 overflow-hidden max-h-80 overflow-y-auto"
            role="listbox"
          >
            {results.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === highlightedIndex
                    ? "bg-cyan-950/60 text-white"
                    : "text-slate-200 hover:bg-slate-800/60"
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="p-1 bg-slate-950/70 rounded border border-slate-800 shrink-0">
                  <MinecraftIcon itemName={item.name} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.displayName}</p>
                  <p className="text-xs text-slate-400 font-mono truncate">minecraft:{item.name}</p>
                </div>
                {item.hasRecipe ? (
                  <Badge variant="outline" className="text-[9px] uppercase font-semibold text-cyan-300 border-cyan-800/80 bg-cyan-950/40 shrink-0">
                    Recipe
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] uppercase font-semibold text-slate-500 border-slate-800 bg-slate-900/40 shrink-0">
                    No Recipe
                  </Badge>
                )}
              </button>
            ))}
          </motion.div>
        )}
        {showDropdown && query.trim().length > 0 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-6 text-center"
          >
            <p className="text-slate-300 text-sm">No items found matching &quot;{query}&quot;</p>
            <p className="text-slate-500 text-xs mt-1">Try another clean name or Minecraft identifier</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Crafting Grid Component ────────────────────────────────────────────────

function CraftingGrid({ recipe }: { recipe: ParsedRecipe }) {
  if (recipe.type === "shaped" && recipe.grid) {
    const is2x2 = recipe.is2x2;
    const gridCols = is2x2 ? 2 : 3;
    const gridRows = is2x2 ? 2 : 3;

    return (
      <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center py-4">
        {/* Crafting Grid */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {is2x2 ? "Player Crafting (2×2)" : "Crafting Table (3×3)"}
          </p>
          <div
            className="grid gap-1.5 bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/70 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((_, c) => {
                const itemId = recipe.grid?.[r]?.[c] ?? null;
                const item = itemId !== null ? getItem(itemId) : null;
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-14 h-14 bg-slate-950/90 border border-slate-700/60 rounded-lg flex items-center justify-center relative shadow-sm"
                    title={item ? `${item.displayName} (minecraft:${item.name})` : "Empty Slot"}
                  >
                    {item ? (
                      <MinecraftIcon itemName={item.name} size={38} alt={item.displayName} />
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center pt-5">
          <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center shadow-md">
            <ChevronRight className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Output</p>
          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-cyan-800/60 shadow-lg shadow-cyan-950/30">
            <div className="w-16 h-16 bg-slate-950/90 border border-cyan-600/60 rounded-lg flex items-center justify-center relative shadow-inner">
              {(() => {
                const outputItem = getItem(recipe.outputId);
                return outputItem ? (
                  <>
                    <MinecraftIcon itemName={outputItem.name} size={44} alt={outputItem.displayName} />
                    {recipe.outputCount > 1 && (
                      <span className="absolute -bottom-1.5 -right-1.5 bg-cyan-600 text-white text-xs font-extrabold rounded-full px-1.5 py-0.5 shadow-md border border-cyan-400">
                        {recipe.outputCount}
                      </span>
                    )}
                  </>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Shapeless recipe
  const ingredients = recipe.ingredientList?.filter((i): i is number => i !== null) || [];
  return (
    <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center py-4">
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Shapeless Crafting</p>
        <div className="flex flex-wrap gap-1.5 bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/70 max-w-[220px] justify-center shadow-inner">
          {ingredients.map((ingId, i) => {
            const item = getItem(ingId);
            return (
              <div
                key={i}
                className="w-14 h-14 bg-slate-950/90 border border-slate-700/60 rounded-lg flex items-center justify-center shadow-sm"
                title={item ? `${item.displayName} (minecraft:${item.name})` : "Ingredient"}
              >
                {item ? (
                  <MinecraftIcon itemName={item.name} size={38} alt={item.displayName} />
                ) : (
                  <div className="w-8 h-8 bg-slate-850 rounded" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-5">
        <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center shadow-md">
          <ChevronRight className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Output</p>
        <div className="bg-slate-800/70 p-2.5 rounded-xl border border-cyan-800/60 shadow-lg shadow-cyan-950/30">
          <div className="w-16 h-16 bg-slate-950/90 border border-cyan-600/60 rounded-lg flex items-center justify-center relative shadow-inner">
            {(() => {
              const outputItem = getItem(recipe.outputId);
              return outputItem ? (
                <>
                  <MinecraftIcon itemName={outputItem.name} size={44} alt={outputItem.displayName} />
                  {recipe.outputCount > 1 && (
                    <span className="absolute -bottom-1.5 -right-1.5 bg-cyan-600 text-white text-xs font-extrabold rounded-full px-1.5 py-0.5 shadow-md border border-cyan-400">
                      {recipe.outputCount}
                    </span>
                  )}
                </>
              ) : null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ingredient List ────────────────────────────────────────────────────────

function IngredientList({ recipe }: { recipe: ParsedRecipe }) {
  const entries = Array.from(recipe.ingredientCounts.entries());
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-slate-700/50">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Required Ingredients</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([itemId, count]) => {
          const item = getItem(itemId);
          if (!item) return null;
          return (
            <div
              key={itemId}
              className="flex items-center gap-2 bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-sm"
            >
              <MinecraftIcon itemName={item.name} size={22} alt={item.displayName} />
              <span className="text-sm font-medium text-slate-200">{item.displayName}</span>
              <Badge variant="secondary" className="text-xs font-mono bg-slate-950 text-cyan-300 border-slate-700 font-bold px-1.5">
                ×{count}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recipe Detail Card ─────────────────────────────────────────────────────

function RecipeDetail({
  item,
  onNavigate,
}: {
  item: McItem;
  onNavigate: (name: string) => void;
}) {
  const rawRecipes = useMemo(() => getRecipesForItem(item.id), [item.id]);
  const parsedRecipes = useMemo(() => rawRecipes.map(parseRecipe), [rawRecipes]);
  const recommendations: Recommendation[] = useMemo(() => getRecommendations(item.id, 8), [item.id]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [prevItemId, setPrevItemId] = useState(item.id);

  // Reset variant index when item changes during render
  if (prevItemId !== item.id) {
    setPrevItemId(item.id);
    setSelectedVariantIndex(0);
  }

  const currentRecipe = parsedRecipes[selectedVariantIndex] || parsedRecipes[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Main Recipe Card */}
      <div className="bg-slate-900/80 border border-slate-700/70 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-md">
            <MinecraftIcon itemName={item.name} size={48} alt={item.displayName} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">{item.displayName}</h2>
            <p className="text-sm text-cyan-400 font-mono">minecraft:{item.name}</p>
          </div>
        </div>

        {parsedRecipes.length === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/50 space-y-2">
            <p className="text-slate-200 font-medium text-base">
              No crafting table recipe available in Minecraft Java Edition {MC_VERSION} data.
            </p>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              This item cannot be crafted in a crafting grid. It is typically obtained through smelting, mining, trading, mob drops, or world generation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alternative Recipe Variant Selector */}
            {parsedRecipes.length > 1 && (
              <div className="space-y-2 pb-2 border-b border-slate-700/60">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                      Recipe Variants ({parsedRecipes.length} available)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                    Showing Variant {selectedVariantIndex + 1} of {parsedRecipes.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {parsedRecipes.map((r, idx) => {
                    const primaryIngId = Array.from(r.ingredientCounts.keys())[0];
                    const primaryIng = primaryIngId ? getItem(primaryIngId) : null;
                    const label = primaryIng ? primaryIng.displayName : `Variant ${idx + 1}`;
                    const isSelected = idx === selectedVariantIndex;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-cyan-950/80 border-cyan-600 text-cyan-200 shadow-sm"
                            : "bg-slate-850/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        {primaryIng && (
                          <MinecraftIcon itemName={primaryIng.name} size={18} alt={primaryIng.displayName} />
                        )}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipe Method Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] uppercase font-semibold text-cyan-300 border-cyan-800/80 bg-cyan-950/50 px-2.5 py-0.5"
              >
                {currentRecipe.type === "shaped"
                  ? currentRecipe.is2x2
                    ? "2×2 Inventory Crafting"
                    : "3×3 Crafting Table"
                  : "Shapeless Crafting"}
              </Badge>
              {currentRecipe.outputCount > 1 && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-semibold text-violet-300 border-violet-800/80 bg-violet-950/50 px-2.5 py-0.5"
                >
                  Yields {currentRecipe.outputCount} Items
                </Badge>
              )}
            </div>

            {/* Visual Crafting Grid */}
            <CraftingGrid recipe={currentRecipe} />

            {/* Required Ingredients Breakdown */}
            <IngredientList recipe={currentRecipe} />
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h3 className="text-xl font-bold text-slate-100">Recommended Recipes</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recommendations.map((rec) => (
              <button
                key={rec.item.id}
                onClick={() => onNavigate(rec.item.name)}
                className="flex flex-col items-center gap-2 p-4 bg-slate-900/70 border border-slate-700/60 rounded-xl hover:border-cyan-600/80 hover:bg-slate-850/80 transition-all group shadow-sm text-center"
              >
                <div className="p-1 bg-slate-950/60 rounded border border-slate-800 group-hover:border-cyan-800/60 transition-colors">
                  <MinecraftIcon itemName={rec.item.name} size={36} alt={rec.item.displayName} />
                </div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white leading-tight">
                  {rec.item.displayName}
                </span>
                <span className="text-[10px] text-cyan-300/80 font-medium leading-none">
                  {rec.reason}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase font-semibold text-slate-400 border-slate-700 group-hover:text-cyan-300 group-hover:border-cyan-800 mt-1"
                >
                  View Recipe
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page Content (uses searchParams) ──────────────────────────────────

function RecipesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recentIds, addRecent, clearRecent, isHydrated } = useRecentRecipes();

  const itemParam = searchParams.get("item");

  // Derive selected item directly from URL searchParams
  const selectedItem = useMemo(() => {
    if (!itemParam) return null;
    return resolveItemId(itemParam);
  }, [itemParam]);

  // Record viewed item in localStorage
  useEffect(() => {
    if (selectedItem) {
      addRecent(`minecraft:${selectedItem.name}`);
    }
  }, [selectedItem, addRecent]);

  const handleSelectItem = useCallback(
    (item: SearchableItem) => {
      router.push(`/recipes?item=minecraft:${encodeURIComponent(item.name)}`, { scroll: false });
    },
    [router]
  );

  const handleNavigateToItem = useCallback(
    (name: string) => {
      router.push(`/recipes?item=minecraft:${encodeURIComponent(name)}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router]
  );

  // Resolve recent items to McItem objects
  const recentItems: McItem[] = useMemo(() => {
    return recentIds
      .map((id) => resolveItemId(id))
      .filter((item): item is McItem => item !== undefined);
  }, [recentIds]);

  return (
    <>
      {/* Search */}
      <section className="mb-10">
        <RecipeSearch
          key={selectedItem ? selectedItem.displayName : "empty"}
          onSelect={handleSelectItem}
          initialQuery={selectedItem ? selectedItem.displayName : ""}
        />
      </section>

      {/* Selected Recipe Detail */}
      <AnimatePresence mode="wait">
        {selectedItem && (
          <motion.section
            key={selectedItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-12"
          >
            <RecipeDetail item={selectedItem} onNavigate={handleNavigateToItem} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Recently Viewed */}
      {isHydrated && recentItems.length > 0 && (
        <section className="space-y-4 mb-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-xl font-bold text-slate-100">Recently Viewed</h3>
            </div>
            <button
              onClick={clearRecent}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 transition-colors px-2 py-1 rounded hover:bg-slate-900"
              aria-label="Clear recently viewed recipes"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {recentItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateToItem(item.name)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-cyan-950/60 border-cyan-600 text-cyan-200 shadow-sm"
                      : "bg-slate-900/70 border-slate-700/60 text-slate-200 hover:border-cyan-800/80 hover:bg-slate-850"
                  }`}
                >
                  <div className="p-0.5 bg-slate-950/60 rounded border border-slate-800 shrink-0">
                    <MinecraftIcon itemName={item.name} size={22} alt={item.displayName} />
                  </div>
                  <span className="text-sm font-medium">{item.displayName}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state when nothing selected */}
      {!selectedItem && isHydrated && (
        <div className="text-center py-16 space-y-4 max-w-lg mx-auto">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50 inline-block shadow-lg">
            <BookOpen className="w-12 h-12 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-100">Search any Minecraft Recipe</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Browse crafting grids, view ingredients, and explore related items directly from the bundled Minecraft Java Edition {MC_VERSION} database.
          </p>
        </div>
      )}
    </>
  );
}

// ── Page Component ─────────────────────────────────────────────────────────

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden selection:bg-cyan-900/50 relative">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-slate-950 to-slate-950 blur-3xl mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900 via-slate-950 to-slate-950 blur-3xl mix-blend-screen" />
      </div>

      <main className="relative z-10 flex flex-col min-h-screen container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="mb-10 flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 mb-2"
          >
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            >
              <div className="p-3 bg-cyan-950/50 rounded-xl border border-cyan-900/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Pickaxe className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-400">
                MineBuild
              </h1>
            </Link>
          </motion.div>

          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-4 text-sm font-medium"
            aria-label="Main Navigation"
          >
            <Link
              href="/planner"
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-900/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Build Planner</span>
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-300 font-semibold px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/60 shadow-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Recipes</span>
            </span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-1"
          >
            <h2 className="text-xl text-slate-300 font-semibold">Crafting & Recipe Guide</h2>
            <p className="text-xs text-slate-400 font-mono">
              Minecraft Java Edition {MC_VERSION}
            </p>
          </motion.div>
        </header>

        {/* Content wrapped in Suspense for useSearchParams */}
        <Suspense fallback={
          <div className="text-center py-20">
            <p className="text-slate-400">Loading recipes…</p>
          </div>
        }>
          <RecipesPageContent />
        </Suspense>
      </main>
    </div>
  );
}
