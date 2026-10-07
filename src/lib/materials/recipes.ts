import mcDataInit from 'minecraft-data';

const mcData = mcDataInit('1.20.4');

export interface RecipeRequirement {
  id: number;
  count: number;
  name: string;
}

export interface RecipeResult {
  ingredients: RecipeRequirement[];
  outputCount: number;
}

/**
 * Strips the 'minecraft:' prefix if present.
 */
export function normalizeName(name: string): string {
  return name.replace(/^minecraft:/, '');
}

/**
 * Gets item by name.
 */
export function getItemByName(name: string) {
  return mcData.itemsByName[normalizeName(name)] || mcData.blocksByName[normalizeName(name)];
}

/**
 * Gets item by id.
 */
export function getItemById(id: number) {
  return mcData.items[id] || mcData.blocks[id];
}

/**
 * Given an item ID, returns the deterministic default recipe ingredients.
 * For MVP, we simply take the first available recipe.
 */
export function getDefaultRecipe(itemId: number): RecipeResult | null {
  const recipes = mcData.recipes[itemId];
  if (!recipes || recipes.length === 0) {
    return null;
  }

  // Deterministically take the first recipe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipe: any = recipes[0];
  const ingredientsMap: Record<number, number> = {};

  if (recipe.ingredients) {
    // Shapeless recipe
    for (const ingId of recipe.ingredients) {
      if (ingId !== null) {
        ingredientsMap[ingId] = (ingredientsMap[ingId] || 0) + 1;
      }
    }
  } else if (recipe.inShape) {
    // Shaped recipe
    for (const row of recipe.inShape) {
      for (const ingId of row) {
        if (ingId !== null) {
          ingredientsMap[ingId] = (ingredientsMap[ingId] || 0) + 1;
        }
      }
    }
  }

  const ingredients: RecipeRequirement[] = Object.entries(ingredientsMap).map(([idStr, count]) => {
    const id = parseInt(idStr, 10);
    const item = getItemById(id);
    return {
      id,
      count,
      name: item ? item.name : `unknown_${id}`
    };
  });

  return {
    ingredients,
    outputCount: recipe.result?.count || 1
  };
}
