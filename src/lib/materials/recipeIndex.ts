/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pre-computed recipe index for the Recipes page.
 * Built once from the bundled minecraft-data 1.20.4 JSON.
 * Does NOT import the full minecraft-data npm package at runtime.
 */
import { mcData, normalizeName } from './recipes';

// ── Types ──────────────────────────────────────────────────────────────────

export const MC_VERSION = '1.20.4';

export interface McItem {
  id: number;
  name: string;          // e.g. "oak_planks"
  displayName: string;   // e.g. "Oak Planks"
  stackSize: number;
}

export interface RawRecipe {
  /** Shaped recipe grid (rows × cols of item IDs, null = empty slot) */
  inShape?: (number | null)[][];
  /** Shapeless ingredient list (item IDs, may contain null) */
  ingredients?: (number | null)[];
  /** Result */
  result: { count: number; id: number };
}

export type RecipeType = 'shaped' | 'shapeless';

export interface ParsedRecipe {
  type: RecipeType;
  /** 3×3 grid (or 2×2 if applicable) for shaped, null for shapeless */
  grid: (number | null)[][] | null;
  /** Dimensions of the shaped recipe */
  gridRows: number;
  gridCols: number;
  /** Can be crafted in 2×2 player inventory */
  is2x2: boolean;
  /** Flat ingredient list for shapeless, null for shaped */
  ingredientList: (number | null)[] | null;
  /** Aggregated ingredient counts: itemId → count */
  ingredientCounts: Map<number, number>;
  outputId: number;
  outputCount: number;
}

export interface SearchableItem {
  id: number;
  name: string;
  displayName: string;
  /** lowercase displayName for search */
  searchKey: string;
  /** lowercase name for search */
  nameKey: string;
  hasRecipe: boolean;
}

export interface Recommendation {
  item: McItem;
  reason: string;
}

// ── Common Block-to-Item / Alias Mappings ───────────────────────────────────

const BLOCK_TO_ITEM: Record<string, string> = {
  redstone_wire: 'redstone',
  wall_torch: 'torch',
  soul_wall_torch: 'soul_torch',
  redstone_wall_torch: 'redstone_torch',
  oak_wall_sign: 'oak_sign',
  spruce_wall_sign: 'spruce_wall_sign',
  birch_wall_sign: 'birch_sign',
  jungle_wall_sign: 'jungle_sign',
  acacia_wall_sign: 'acacia_sign',
  dark_oak_wall_sign: 'dark_oak_sign',
  mangrove_wall_sign: 'mangrove_sign',
  cherry_wall_sign: 'cherry_sign',
  bamboo_wall_sign: 'bamboo_sign',
  crimson_wall_sign: 'crimson_sign',
  warped_wall_sign: 'warped_sign',
  piston_head: 'piston',
  moving_piston: 'piston',
  water: 'water_bucket',
  lava: 'lava_bucket',
  tripwire: 'string',
  carrots: 'carrot',
  potatoes: 'potato',
  beetroots: 'beetroot',
  sweet_berry_bush: 'sweet_berries',
};

// ── Build indices once ─────────────────────────────────────────────────────

/** All items keyed by numeric id */
const itemsById: Map<number, McItem> = new Map();
/** All items keyed by name (no namespace) */
const itemsByName: Map<string, McItem> = new Map();
/** Recipes keyed by output item id */
const recipesByOutputId: Map<number, RawRecipe[]> = new Map();
/** Downstream recipes: ingredientItemId → outputItemIds[] */
const recipesByIngredientId: Map<number, Set<number>> = new Map();
/** Searchable items list (pre-sorted alphabetically) */
let _searchableItems: SearchableItem[] | null = null;

function ensureInitialized() {
  if (itemsById.size > 0) return;

  // Populate items
  for (const [idStr, item] of Object.entries(mcData.items)) {
    const id = parseInt(idStr, 10);
    const mcItem: McItem = {
      id,
      name: item.name,
      displayName: item.displayName || item.name,
      stackSize: item.stackSize || 64,
    };
    itemsById.set(id, mcItem);
    itemsByName.set(mcItem.name, mcItem);
  }

  // Populate blocks if not already in items
  for (const [, block] of Object.entries(mcData.blocksByName)) {
    const b = block as any;
    if (b && b.name && !itemsByName.has(b.name)) {
      const mcItem: McItem = {
        id: b.id ?? -1,
        name: b.name,
        displayName: b.displayName || b.name,
        stackSize: 64,
      };
      itemsByName.set(b.name, mcItem);
    }
  }

  // Populate recipes & downstream ingredient index
  for (const [idStr, recipes] of Object.entries(mcData.recipes)) {
    const outputId = parseInt(idStr, 10);
    const rawList = recipes as RawRecipe[];
    recipesByOutputId.set(outputId, rawList);

    for (const r of rawList) {
      const ingredientIds: number[] = [];
      if (r.ingredients) {
        for (const ing of r.ingredients) {
          if (ing !== null && typeof ing === 'number') ingredientIds.push(ing);
        }
      } else if (r.inShape) {
        for (const row of r.inShape) {
          for (const ing of row) {
            if (ing !== null && typeof ing === 'number') ingredientIds.push(ing);
          }
        }
      }

      for (const ingId of ingredientIds) {
        if (!recipesByIngredientId.has(ingId)) {
          recipesByIngredientId.set(ingId, new Set());
        }
        recipesByIngredientId.get(ingId)!.add(outputId);
      }
    }
  }
}

// ── Public Helper & Normalization Functions ─────────────────────────────────

export function normalizeItemName(rawName: string): string {
  if (!rawName) return '';
  let clean = normalizeName(rawName).trim().toLowerCase();
  clean = clean
    .replace(/^minecraft:/, '')
    .replace(/^craft_/, '')
    .replace(/^craft\s+/, '')
    .replace(/\s+/g, '_');
  
  if (BLOCK_TO_ITEM[clean]) {
    return BLOCK_TO_ITEM[clean];
  }
  return clean;
}

export function getItem(id: number): McItem | undefined {
  ensureInitialized();
  return itemsById.get(id);
}

export function getItemByNameFromIndex(name: string): McItem | undefined {
  ensureInitialized();
  const clean = normalizeItemName(name);
  return itemsByName.get(clean);
}

/**
 * Resolve a namespaced ID, raw name, or craft_ prefixed ID to a McItem.
 */
export function resolveItemId(namespacedOrRawId: string): McItem | undefined {
  ensureInitialized();
  const clean = normalizeItemName(namespacedOrRawId);
  const byName = itemsByName.get(clean);
  if (byName) return byName;

  for (const item of itemsById.values()) {
    if (item.name === clean) return item;
  }
  return undefined;
}

/**
 * Get all raw recipes that produce a given item id.
 */
export function getRecipesForItem(itemId: number): RawRecipe[] {
  ensureInitialized();
  return recipesByOutputId.get(itemId) || [];
}

/**
 * Checks if an item has any recipe in the bundled data.
 */
export function hasRecipe(itemName: string): boolean {
  ensureInitialized();
  const item = resolveItemId(itemName);
  if (!item) return false;
  return recipesByOutputId.has(item.id);
}

/**
 * Parse a raw recipe into a structured form with accurate grid dimensions.
 */
export function parseRecipe(raw: RawRecipe): ParsedRecipe {
  ensureInitialized();
  const ingredientCounts = new Map<number, number>();

  if (raw.inShape) {
    const rawRows = raw.inShape.length;
    let rawCols = 0;
    for (const row of raw.inShape) {
      rawCols = Math.max(rawCols, row.length);
    }

    const is2x2 = rawRows <= 2 && rawCols <= 2;
    const targetSize = is2x2 ? 2 : 3;

    // Center 1-column recipes horizontally if in 3x3 table (e.g. swords, shovels)
    const colOffset = (!is2x2 && rawCols === 1) ? 1 : 0;

    const grid: (number | null)[][] = [];
    for (let r = 0; r < targetSize; r++) {
      const row: (number | null)[] = [];
      const srcRow = raw.inShape[r] || [];
      for (let c = 0; c < targetSize; c++) {
        const srcCol = c - colOffset;
        const val = (srcCol >= 0 && srcCol < srcRow.length) ? (srcRow[srcCol] ?? null) : null;
        row.push(val);
        if (val !== null) {
          ingredientCounts.set(val, (ingredientCounts.get(val) || 0) + 1);
        }
      }
      grid.push(row);
    }

    return {
      type: 'shaped',
      grid,
      gridRows: rawRows,
      gridCols: rawCols,
      is2x2,
      ingredientList: null,
      ingredientCounts,
      outputId: raw.result.id,
      outputCount: raw.result.count || 1,
    };
  } else if (raw.ingredients) {
    const list = raw.ingredients.filter((i): i is number => i !== null);
    for (const id of list) {
      ingredientCounts.set(id, (ingredientCounts.get(id) || 0) + 1);
    }
    return {
      type: 'shapeless',
      grid: null,
      gridRows: 0,
      gridCols: 0,
      is2x2: false,
      ingredientList: raw.ingredients,
      ingredientCounts,
      outputId: raw.result.id,
      outputCount: raw.result.count || 1,
    };
  }

  return {
    type: 'shapeless',
    grid: null,
    gridRows: 0,
    gridCols: 0,
    is2x2: false,
    ingredientList: [],
    ingredientCounts,
    outputId: raw.result.id,
    outputCount: raw.result.count || 1,
  };
}

/**
 * Returns a pre-sorted, searchable list of all items.
 */
export function getSearchableItems(): SearchableItem[] {
  ensureInitialized();
  if (_searchableItems) return _searchableItems;

  const items: SearchableItem[] = [];
  for (const item of itemsById.values()) {
    if (item.name === 'air') continue;
    items.push({
      id: item.id,
      name: item.name,
      displayName: item.displayName,
      searchKey: item.displayName.toLowerCase(),
      nameKey: item.name.toLowerCase(),
      hasRecipe: recipesByOutputId.has(item.id),
    });
  }
  items.sort((a, b) => a.displayName.localeCompare(b.displayName));
  _searchableItems = items;
  return items;
}

/**
 * Search items by query string. Case-insensitive, matches displayName and identifier.
 * Automatically strips internal craft_ or minecraft: prefixes.
 */
export function searchItems(query: string, limit = 20): SearchableItem[] {
  const q = normalizeItemName(query);
  if (!q) return [];

  const all = getSearchableItems();
  const exactMatches: SearchableItem[] = [];
  const prefixMatches: SearchableItem[] = [];
  const substringMatches: SearchableItem[] = [];

  for (const item of all) {
    if (item.nameKey === q || item.searchKey === q) {
      exactMatches.push(item);
    } else if (item.searchKey.startsWith(q) || item.nameKey.startsWith(q)) {
      prefixMatches.push(item);
    } else if (item.searchKey.includes(q) || item.nameKey.includes(q)) {
      substringMatches.push(item);
    }
    if (exactMatches.length + prefixMatches.length + substringMatches.length >= limit * 2) break;
  }

  const results = [...exactMatches, ...prefixMatches, ...substringMatches];
  return results.slice(0, limit);
}

/**
 * Get recommended recipes for a given item with deterministic reasons.
 * Only returns items that have verified recipes, excluding current item.
 */
export function getRecommendations(itemId: number, limit = 8): Recommendation[] {
  ensureInitialized();
  const item = itemsById.get(itemId);
  if (!item) return [];

  const name = item.name;
  const recommendations: Recommendation[] = [];
  const seen = new Set<number>([itemId]);

  const addRec = (candidate: McItem | undefined, reason: string) => {
    if (
      candidate &&
      candidate.id !== itemId &&
      !seen.has(candidate.id) &&
      recipesByOutputId.has(candidate.id)
    ) {
      seen.add(candidate.id);
      recommendations.push({ item: candidate, reason });
      return true;
    }
    return false;
  };

  // Strategy 1: Items crafted using this item as an ingredient
  const downstreamSet = recipesByIngredientId.get(itemId);
  if (downstreamSet) {
    for (const downstreamId of downstreamSet) {
      if (recommendations.length >= limit) break;
      const dItem = itemsById.get(downstreamId);
      addRec(dItem, `Uses ${item.displayName}`);
    }
  }

  // Strategy 2: Same tool / weapon / armor family
  const materialPrefixes = [
    'wooden_', 'stone_', 'iron_', 'golden_', 'diamond_', 'netherite_',
  ];
  const toolSuffixes = [
    '_sword', '_axe', '_pickaxe', '_shovel', '_hoe',
  ];
  const armorSuffixes = [
    '_helmet', '_chestplate', '_leggings', '_boots',
  ];

  let myPrefix = '';
  for (const p of materialPrefixes) {
    if (name.startsWith(p)) {
      myPrefix = p;
      break;
    }
  }

  let mySuffix = '';
  for (const s of [...toolSuffixes, ...armorSuffixes]) {
    if (name.endsWith(s)) {
      mySuffix = s;
      break;
    }
  }

  if (myPrefix && mySuffix) {
    const isTool = toolSuffixes.includes(mySuffix);
    const familySuffixes = isTool ? toolSuffixes : armorSuffixes;
    const label = isTool ? 'Tool Family' : 'Armor Set';

    for (const suffix of familySuffixes) {
      if (recommendations.length >= limit) break;
      const relatedName = myPrefix + suffix.slice(1);
      const related = itemsByName.get(relatedName);
      addRec(related, label);
    }
  }

  // Strategy 3: Processing utility items (furnace, blast_furnace, smoker, etc.)
  const processingItems = [
    'furnace', 'blast_furnace', 'smoker', 'campfire', 'crafting_table', 'chest', 'hopper', 'anvil'
  ];
  if (processingItems.includes(name)) {
    for (const pName of processingItems) {
      if (recommendations.length >= limit) break;
      const pItem = itemsByName.get(pName);
      addRec(pItem, 'Processing');
    }
  }

  // Strategy 4: Same wood species items
  const woodSpecies = [
    'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak',
    'cherry', 'mangrove', 'bamboo', 'crimson', 'warped',
  ];
  let mySpecies = '';
  for (const species of woodSpecies) {
    if (name.startsWith(species + '_')) {
      mySpecies = species;
      break;
    }
  }

  if (mySpecies && recommendations.length < limit) {
    const woodItems = ['_planks', '_slab', '_stairs', '_fence', '_door', '_trapdoor', '_sign', '_button', '_pressure_plate'];
    for (const suffix of woodItems) {
      if (recommendations.length >= limit) break;
      const relatedName = mySpecies + suffix;
      const related = itemsByName.get(relatedName);
      addRec(related, 'Wood Variant');
    }
  }

  // Strategy 5: Shared ingredients
  if (recommendations.length < limit) {
    const myRecipes = getRecipesForItem(itemId);
    if (myRecipes.length > 0) {
      const parsed = parseRecipe(myRecipes[0]);
      const myIngredients = new Set(parsed.ingredientCounts.keys());

      const scored: { item: McItem; score: number }[] = [];
      for (const [otherId, otherRecipes] of recipesByOutputId.entries()) {
        if (seen.has(otherId)) continue;
        const otherItem = itemsById.get(otherId);
        if (!otherItem) continue;

        const otherParsed = parseRecipe(otherRecipes[0]);
        let overlap = 0;
        for (const ingId of otherParsed.ingredientCounts.keys()) {
          if (myIngredients.has(ingId)) overlap++;
        }
        if (overlap > 0) {
          scored.push({ item: otherItem, score: overlap });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      for (const { item: si } of scored) {
        if (recommendations.length >= limit) break;
        addRec(si, 'Shared Ingredients');
      }
    }
  }

  // Strategy 6: Essential progression items
  if (recommendations.length < limit) {
    const progressionItems = [
      'crafting_table', 'furnace', 'chest', 'stick', 'torch',
    ];
    for (const pName of progressionItems) {
      if (recommendations.length >= limit) break;
      const pi = itemsByName.get(pName);
      addRec(pi, 'Core Utility');
    }
  }

  return recommendations.slice(0, limit);
}

// ── Texture Resolution ─────────────────────────────────────────────────────

export function getAssetBasePath(): string {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/Minecraft-build-planner')) {
      return '/Minecraft-build-planner';
    }
  }
  return process.env.NODE_ENV === 'production' ? '/Minecraft-build-planner' : '';
}

/**
 * Returns local static asset URL for item texture.
 */
export function getItemTextureUrl(itemName: string): string {
  const clean = normalizeItemName(itemName);
  const basePath = getAssetBasePath();
  return `${basePath}/textures/items/${clean}.png`;
}

/**
 * Returns local static asset URL for block texture.
 */
export function getBlockTextureUrl(itemName: string): string {
  const clean = normalizeItemName(itemName);
  const basePath = getAssetBasePath();
  return `${basePath}/textures/blocks/${clean}.png`;
}

/**
 * Fallback CDN URLs (PrismarineJS 1.20.2 data matching 1.20.4 specification)
 */
export function getCdnItemTextureUrl(itemName: string): string {
  const clean = normalizeItemName(itemName);
  return `https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets@master/data/1.20.2/items/${clean}.png`;
}

export function getCdnBlockTextureUrl(itemName: string): string {
  const clean = normalizeItemName(itemName);
  return `https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets@master/data/1.20.2/blocks/${clean}.png`;
}
