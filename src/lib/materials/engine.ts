import { NormalizedSchematic } from '../types';
import { MaterialAnalysis, GatheringPlan } from './types';
import { getDefaultRecipe, normalizeName, getItemByName, getItemById } from './recipes';
import { getGatheringCategory } from './categories';

export function analyzeSchematic(schematic: NormalizedSchematic): MaterialAnalysis {
  const dimensions = schematic.metadata.enclosingSize;
  const totalSolidBlocks = schematic.metadata.totalBlocks;
  
  const exactBlockCounts: Record<string, number> = {};
  const unrecognizedBlocks: Record<string, number> = {};

  const baseMaterials: Record<string, number> = {};
  const craftedItems: Record<string, number> = {};
  const processingOperations: Record<string, number> = {};

  // 1. Calculate exact block counts
  for (const [blockName, data] of Object.entries(schematic.materials)) {
    if (blockName.includes('air')) continue;

    exactBlockCounts[blockName] = data.count;

    const item = getItemByName(blockName);
    if (!item) {
      unrecognizedBlocks[blockName] = data.count;
    }
  }

  // 2. Recursively calculate crafting requirements
  function resolveMaterial(itemId: number, count: number, visited: Set<number>) {
    // Prevent zero/negative count bugs
    if (count <= 0) return;

    const item = getItemById(itemId);
    const itemData = item || { name: `unknown_${itemId}` };

    if (visited.has(itemId)) {
      // Circular dependency detected! Treat as base material to break the cycle.
      baseMaterials[itemData.name] = (baseMaterials[itemData.name] || 0) + count;
      return;
    }

    const recipe = getDefaultRecipe(itemId);

    if (recipe) {
      // It's a crafted item
      craftedItems[itemData.name] = (craftedItems[itemData.name] || 0) + count;
      
      const craftsNeeded = Math.ceil(count / recipe.outputCount);
      processingOperations[`craft_${itemData.name}`] = (processingOperations[`craft_${itemData.name}`] || 0) + craftsNeeded;

      const newVisited = new Set(visited);
      newVisited.add(itemId);

      // Add ingredients
      for (const ingredient of recipe.ingredients) {
        resolveMaterial(ingredient.id, ingredient.count * craftsNeeded, newVisited);
      }
    } else {
      // It's a base material
      baseMaterials[itemData.name] = (baseMaterials[itemData.name] || 0) + count;
    }
  }

  // Bootstrap the resolution with the exact blocks
  for (const [blockName, count] of Object.entries(exactBlockCounts)) {
    const item = getItemByName(blockName);
    if (item) {
      resolveMaterial(item.id, count, new Set());
    } else {
      // Unknown items are considered base materials for the plan
      baseMaterials[normalizeName(blockName)] = (baseMaterials[normalizeName(blockName)] || 0) + count;
    }
  }

  // 3. Build Gathering Plan
  const gatheringPlan: GatheringPlan = {
    categories: {
      'Mining': {},
      'Wood': {},
      'Farming': {},
      'Mob/Organic': {},
      'Nether': {},
      'End': {},
      'Processing': {},
      'Other': {}
    }
  };

  for (const [material, count] of Object.entries(baseMaterials)) {
    const category = getGatheringCategory(material);
    gatheringPlan.categories[category][material] = count;
  }

  for (const [operation, count] of Object.entries(processingOperations)) {
    gatheringPlan.categories['Processing'][operation] = count;
  }

  return {
    dimensions,
    totalSolidBlocks,
    exactBlockCounts,
    unrecognizedBlocks,
    baseMaterials,
    craftedItems,
    processingOperations,
    gatheringPlan
  };
}
