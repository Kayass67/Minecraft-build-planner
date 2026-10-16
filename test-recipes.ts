import {
  MC_VERSION,
  resolveItemId,
  getItem,
  getItemByNameFromIndex,
  getRecipesForItem,
  parseRecipe,
  searchItems,
  getRecommendations,
  hasRecipe,
  normalizeItemName,
  getItemTextureUrl,
  getBlockTextureUrl,
} from './src/lib/materials/recipeIndex';
import { calculateInventoryStatus, canonicalizeInventoryKey } from './src/lib/materials/inventory';
import { formatDisplayName } from './src/lib/materials/recipes';
import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testRecipeNavigationAndIdentifiers() {
  console.log('Testing Recipe Navigation and Namespaced Identifiers...');

  // 1. Namespaced identifiers resolution
  const woodenSword = resolveItemId('minecraft:wooden_sword');
  assert(woodenSword !== undefined, 'resolveItemId(minecraft:wooden_sword) must return item');
  assert(woodenSword?.name === 'wooden_sword', 'wooden_sword name mismatch');
  assert(woodenSword?.displayName === 'Wooden Sword', 'wooden_sword displayName mismatch');

  const oakSlab = resolveItemId('minecraft:oak_slab');
  assert(oakSlab !== undefined, 'resolveItemId(minecraft:oak_slab) must return item');
  assert(oakSlab?.name === 'oak_slab', 'oak_slab name mismatch');

  // 2. Non-namespaced clean names
  const chest = resolveItemId('chest');
  assert(chest !== undefined, 'resolveItemId(chest) must resolve');
  assert(chest?.name === 'chest', 'chest name mismatch');

  // 3. craft_ prefixed IDs must not confuse identity
  const craftOakSlab = resolveItemId('craft_oak_slab');
  assert(craftOakSlab !== undefined, 'resolveItemId(craft_oak_slab) must resolve to oak_slab');
  assert(craftOakSlab?.id === oakSlab?.id, 'craft_oak_slab must match oak_slab id');

  const craftWoodenSword = resolveItemId('craft_wooden_sword');
  assert(craftWoodenSword !== undefined, 'resolveItemId(craft_wooden_sword) must resolve to wooden_sword');
  assert(craftWoodenSword?.id === woodenSword?.id, 'craft_wooden_sword must match wooden_sword id');

  // 4. Case-insensitivity and whitespace in identifier resolution
  const upperCaseItem = resolveItemId('  MINECRAFT:FURNACE  ');
  assert(upperCaseItem !== undefined, 'resolveItemId must handle case and whitespace');
  assert(upperCaseItem?.name === 'furnace', 'furnace name mismatch');

  // 5. Unknown item IDs fail safely
  const fakeItem = resolveItemId('minecraft:non_existent_fake_item_9999');
  assert(fakeItem === undefined, 'non-existent item must resolve to undefined');

  // 6. Block-to-item mapping (e.g. redstone_wire -> redstone)
  const redstoneWire = resolveItemId('minecraft:redstone_wire');
  assert(redstoneWire !== undefined, 'redstone_wire should resolve to redstone item');
  assert(redstoneWire?.name === 'redstone', 'redstone_wire must map to redstone');

  console.log('  Navigation & identifier tests PASSED.');
}

function testSearch() {
  console.log('Testing Recipe Search...');

  // 1. Search by clean user-facing name
  const swordResults = searchItems('Wooden Sword', 5);
  assert(swordResults.length > 0, 'Searching "Wooden Sword" must return results');
  assert(swordResults[0].displayName === 'Wooden Sword', 'First result must be Wooden Sword');
  assert(swordResults[0].hasRecipe === true, 'Wooden Sword must have recipe');

  // 2. Search Oak Slab
  const slabResults = searchItems('Oak Slab', 5);
  assert(slabResults.length > 0, 'Searching "Oak Slab" must return results');
  assert(slabResults[0].name === 'oak_slab', 'First result must be oak_slab');

  // 3. Case-insensitive search
  const lowerResults = searchItems('wooden axe', 5);
  const upperResults = searchItems('WOODEN AXE', 5);
  assert(lowerResults.length > 0 && upperResults.length > 0, 'Case-insensitive search failed');
  assert(lowerResults[0].id === upperResults[0].id, 'Lower and upper query results must match');

  // 4. Searching with internal craft_ prefix should still work seamlessly
  const prefixResults = searchItems('craft_oak_slab', 5);
  assert(prefixResults.length > 0, 'Searching "craft_oak_slab" must find oak_slab');
  assert(prefixResults[0].name === 'oak_slab', 'Prefix search did not match oak_slab');

  // 5. Searching with namespaced ID
  const namespacedResults = searchItems('minecraft:furnace', 5);
  assert(namespacedResults.length > 0, 'Searching "minecraft:furnace" must find furnace');
  assert(namespacedResults[0].name === 'furnace', 'Namespaced search did not match furnace');

  // 6. Searching required items
  const requiredSearchQueries = [
    'Wooden Sword',
    'Wooden Axe',
    'Wooden Pickaxe',
    'Oak Planks',
    'Oak Slab',
    'Chest',
    'Furnace',
    'Crafter',
    'Iron Ingot',
  ];
  for (const q of requiredSearchQueries) {
    const res = searchItems(q, 3);
    assert(res.length > 0, `Search query "${q}" returned no results`);
  }

  // 7. Crafter must return hasRecipe: false in 1.20.4 bundled data
  const crafterRes = searchItems('Crafter', 1);
  assert(crafterRes.length > 0, 'Crafter item must exist in database');
  assert(crafterRes[0].hasRecipe === false, 'Crafter must have hasRecipe=false in 1.20.4 data');

  // 8. Empty query returns empty array
  assert(searchItems('').length === 0, 'Empty query must return empty array');
  assert(searchItems('   ').length === 0, 'Whitespace query must return empty array');

  // 9. Non-existent item query returns empty array
  assert(searchItems('xyz_totally_impossible_item_123').length === 0, 'Non-existent item query must return []');

  console.log('  Search tests PASSED.');
}

function testRecipeDetailsAndAlternatives() {
  console.log('Testing Recipe Details and Alternatives (1.20.4 data)...');
  assert(MC_VERSION === '1.20.4', 'MC_VERSION must be 1.20.4');

  // 1. Wooden Sword recipe validation
  const swordItem = resolveItemId('wooden_sword')!;
  const swordRecipes = getRecipesForItem(swordItem.id);
  assert(swordRecipes.length >= 11, `Wooden sword should have 11 variants, got ${swordRecipes.length}`);

  const parsedSword = parseRecipe(swordRecipes[0]);
  assert(parsedSword.type === 'shaped', 'Wooden sword must be shaped recipe');
  assert(parsedSword.grid !== null, 'Wooden sword grid must exist');
  assert(parsedSword.outputCount === 1, 'Wooden sword output count must be 1');
  assert(parsedSword.is2x2 === false, 'Wooden sword requires 3x3 table');

  // 2. 2x2 Crafting Grid detection
  const stickItem = resolveItemId('stick')!;
  const stickRecipes = getRecipesForItem(stickItem.id);
  assert(stickRecipes.length > 0, 'Stick recipes must exist');
  const parsedStick = parseRecipe(stickRecipes[0]);
  assert(parsedStick.is2x2 === true, 'Stick recipe (2 planks vertical) should fit 2x2 grid');

  const tableItem = resolveItemId('crafting_table')!;
  const tableRecipes = getRecipesForItem(tableItem.id);
  const parsedTable = parseRecipe(tableRecipes[0]);
  assert(parsedTable.is2x2 === true, 'Crafting table (2x2 planks) should fit 2x2 grid');

  // 3. Shapeless recipe
  const planksItem = resolveItemId('oak_planks')!;
  const planksRecipes = getRecipesForItem(planksItem.id);
  assert(planksRecipes.length > 0, 'Oak planks recipes must exist');
  const parsedPlanks = parseRecipe(planksRecipes[0]);
  assert(parsedPlanks.type === 'shapeless', 'Oak planks from log is shapeless');
  assert(parsedPlanks.outputCount === 4, 'Oak planks yields 4 items');
  assert(parsedPlanks.ingredientList !== null, 'Shapeless ingredient list must exist');

  // 4. Oak Slab yield
  const slabItem = resolveItemId('oak_slab')!;
  const slabRecipes = getRecipesForItem(slabItem.id);
  assert(slabRecipes.length > 0, 'Oak slab recipes must exist');
  const parsedSlab = parseRecipe(slabRecipes[0]);
  assert(parsedSlab.type === 'shaped', 'Oak slab is shaped');
  assert(parsedSlab.outputCount === 6, 'Oak slab yields 6 slabs');

  // 5. Furnace alternatives
  const furnaceItem = resolveItemId('furnace')!;
  const furnaceRecipes = getRecipesForItem(furnaceItem.id);
  assert(furnaceRecipes.length === 3, `Furnace should have 3 alternatives in 1.20.4 data, got ${furnaceRecipes.length}`);

  // 6. hasRecipe checks
  assert(hasRecipe('wooden_sword') === true, 'wooden_sword must report hasRecipe=true');
  assert(hasRecipe('oak_planks') === true, 'oak_planks must report hasRecipe=true');
  assert(hasRecipe('oak_slab') === true, 'oak_slab must report hasRecipe=true');
  assert(hasRecipe('chest') === true, 'chest must report hasRecipe=true');
  assert(hasRecipe('furnace') === true, 'furnace must report hasRecipe=true');
  assert(hasRecipe('crafter') === false, 'crafter must report hasRecipe=false in 1.20.4');
  assert(hasRecipe('oak_log') === false, 'oak_log (raw material) must report hasRecipe=false');
  assert(hasRecipe('bedrock') === false, 'bedrock must report hasRecipe=false');

  console.log('  Recipe details & alternatives tests PASSED.');
}

function testRecommendations() {
  console.log('Testing Recommendations Logic...');

  // 1. Wooden Sword recommendations
  const swordItem = resolveItemId('wooden_sword')!;
  const swordRecs = getRecommendations(swordItem.id, 8);
  assert(swordRecs.length > 0, 'Wooden sword must produce recommendations');

  // Must not recommend itself
  assert(!swordRecs.some((r) => r.item.id === swordItem.id), 'Recommendations must exclude selected item');

  // Check Tool Family recommendations
  const swordRecNames = swordRecs.map((r) => r.item.name);
  assert(swordRecNames.includes('wooden_axe'), 'Must recommend wooden_axe for wooden_sword');
  assert(swordRecNames.includes('wooden_pickaxe'), 'Must recommend wooden_pickaxe for wooden_sword');
  assert(swordRecNames.includes('wooden_shovel'), 'Must recommend wooden_shovel for wooden_sword');
  assert(swordRecNames.includes('wooden_hoe'), 'Must recommend wooden_hoe for wooden_sword');

  // Check reasons are populated
  const axeRec = swordRecs.find((r) => r.item.name === 'wooden_axe');
  assert(axeRec?.reason === 'Tool Family', `Expected 'Tool Family' reason, got '${axeRec?.reason}'`);

  // 2. Oak Planks recommendations (items crafted from oak planks)
  const planksItem = resolveItemId('oak_planks')!;
  const planksRecs = getRecommendations(planksItem.id, 8);
  const planksRecNames = planksRecs.map((r) => r.item.name);
  assert(
    planksRecNames.includes('stick') ||
    planksRecNames.includes('crafting_table') ||
    planksRecNames.includes('chest') ||
    planksRecNames.includes('oak_slab'),
    'Oak Planks must recommend items crafted from planks or wood family'
  );

  // 3. Iron Ingot recommendations (items crafted with iron)
  const ironItem = resolveItemId('iron_ingot')!;
  const ironRecs = getRecommendations(ironItem.id, 8);
  assert(ironRecs.length > 0, 'Iron Ingot must have recommendations');
  assert(!ironRecs.some((r) => r.item.id === ironItem.id), 'Iron Ingot recommendations must exclude itself');

  // 4. All recommended items must have verified recipes
  for (const rec of [...swordRecs, ...planksRecs, ...ironRecs]) {
    assert(hasRecipe(rec.item.name), `Recommended item ${rec.item.name} must have a verified recipe`);
  }

  // 5. No duplicates in recommendations list
  const seenIds = new Set<number>();
  for (const rec of swordRecs) {
    assert(!seenIds.has(rec.item.id), `Duplicate recommendation found for ${rec.item.name}`);
    seenIds.add(rec.item.id);
  }

  console.log('  Recommendations tests PASSED.');
}

function testTexturesAndIcons() {
  console.log('Testing Item and Block Textures...');

  // 1. Static asset paths
  const swordUrl = getItemTextureUrl('wooden_sword');
  assert(swordUrl.endsWith('/textures/items/wooden_sword.png'), 'sword texture URL mismatch');

  const planksUrl = getBlockTextureUrl('oak_planks');
  assert(planksUrl.endsWith('/textures/blocks/oak_planks.png'), 'planks texture URL mismatch');

  // 2. Namespaced and craft_ prefixes are stripped in texture URLs
  const namespacedUrl = getItemTextureUrl('minecraft:wooden_sword');
  assert(namespacedUrl.endsWith('/textures/items/wooden_sword.png'), 'namespaced texture URL mismatch');

  const craftUrl = getItemTextureUrl('craft_oak_slab');
  assert(craftUrl.endsWith('/textures/items/oak_slab.png'), 'craft_ prefixed texture URL mismatch');

  // 3. Verify key local texture files exist on disk
  const itemsDir = path.join(process.cwd(), 'public', 'textures', 'items');
  const blocksDir = path.join(process.cwd(), 'public', 'textures', 'blocks');

  const criticalItems = ['wooden_sword', 'wooden_axe', 'wooden_pickaxe', 'chest', 'furnace', 'crafter', 'iron_ingot'];
  for (const item of criticalItems) {
    const itemPath = path.join(itemsDir, `${item}.png`);
    assert(fs.existsSync(itemPath), `Texture ${item}.png must exist in public/textures/items`);
  }

  const criticalBlocks = ['oak_planks', 'oak_slab', 'cobblestone', 'stone'];
  for (const block of criticalBlocks) {
    const blockPath = path.join(blocksDir, `${block}.png`);
    assert(fs.existsSync(blockPath), `Texture ${block}.png must exist in public/textures/blocks`);
  }

  console.log('  Texture & icon tests PASSED.');
}

function testGatheringPlanAndCraftableBadges() {
  console.log('Testing Gathering Plan and Craftable Badge logic...');

  // 1. Canonical item key matches recipe item ID
  const testItems = [
    { raw: 'craft_oak_slab', expectedId: 'oak_slab' },
    { raw: 'minecraft:oak_slab', expectedId: 'oak_slab' },
    { raw: 'Oak Slab', expectedId: 'oak_slab' },
    { raw: 'craft_wooden_sword', expectedId: 'wooden_sword' },
    { raw: 'minecraft:wooden_sword', expectedId: 'wooden_sword' },
  ];

  for (const { raw, expectedId } of testItems) {
    const canonical = canonicalizeInventoryKey(raw);
    assert(canonical === expectedId, `Canonical key mismatch for ${raw}: expected ${expectedId}, got ${canonical}`);
    assert(hasRecipe(canonical), `Item ${canonical} must be craftable`);
  }

  // 2. Base materials without recipe must NOT be marked craftable
  assert(hasRecipe('oak_log') === false, 'oak_log must not be marked craftable');
  assert(hasRecipe('iron_ore') === false, 'iron_ore must not be marked craftable');
  assert(hasRecipe('dirt') === false, 'dirt must not be marked craftable');

  // 3. Display name formatting never leaks "Craft "
  assert(formatDisplayName('craft_oak_slab') === 'Oak Slab', 'Display name must not have Craft');
  assert(formatDisplayName('craft_wooden_sword') === 'Wooden Sword', 'Display name must not have Craft');

  // 4. Inventory status calculations remain intact
  const statMissing = calculateInventoryStatus(10, 0);
  assert(statMissing.status === 'MISSING' && statMissing.missing === 10, 'Status MISSING check failed');

  const statPartial = calculateInventoryStatus(10, 4);
  assert(statPartial.status === 'PARTIAL' && statPartial.missing === 6, 'Status PARTIAL check failed');

  const statEnough = calculateInventoryStatus(10, 10);
  assert(statEnough.status === 'ENOUGH' && statEnough.missing === 0, 'Status ENOUGH check failed');

  console.log('  Gathering Plan & Craftable Badge tests PASSED.');
}

function runAll() {
  console.log('=== RUNNING RECIPES & CRAFTING GUIDE TEST SUITE ===\n');
  testRecipeNavigationAndIdentifiers();
  testSearch();
  testRecipeDetailsAndAlternatives();
  testRecommendations();
  testTexturesAndIcons();
  testGatheringPlanAndCraftableBadges();
  console.log('\n=== ALL RECIPES TESTS PASSED SUCCESSFULLY! ===\n');
}

runAll();
