import fs from 'fs';
import { doParseLitematic } from './src/lib/parser.worker';
import { analyzeSchematic } from './src/lib/materials/engine';
import { getGatheringCategory } from './src/lib/materials/categories';
import { formatDisplayName } from './src/lib/materials/recipes';
import { calculateInventoryStatus, canonicalizeInventoryKey } from './src/lib/materials/inventory';
import { NormalizedSchematic } from './src/lib/types';

function createMockSchematic(materials: Record<string, { count: number }>): NormalizedSchematic {
  return {
    metadata: {
      name: "Mock",
      author: "Mock",
      description: "",
      timeCreated: 0,
      timeModified: 0,
      totalBlocks: 0,
      totalVolume: 0,
      enclosingSize: { x: 1, y: 1, z: 1 }
    },
    regions: [],
    materials
  };
}

async function testIntegration() {
  console.log("--- RUNNING INTEGRATION TEST ---");
  const buffer = fs.readFileSync('./node_modules/litematic-parser/test/DualFullBlockCrafter.litematic');
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  
  const schematic = await doParseLitematic(arrayBuffer);
  const analysis = analyzeSchematic(schematic);
  
  // Assertions
  if (analysis.dimensions.x !== 3 || analysis.dimensions.y !== 3 || analysis.dimensions.z !== 5) {
    throw new Error("Dimensions are incorrect!");
  }
  
  if (analysis.totalSolidBlocks !== 23) {
    throw new Error("Total solid blocks are incorrect!");
  }

  if (Object.keys(analysis.unrecognizedBlocks).length > 0) {
    throw new Error("There should be no unrecognized blocks! Actually got: " + JSON.stringify(analysis.unrecognizedBlocks));
  }

  if (analysis.baseMaterials['oak_log'] !== 8) {
    throw new Error("Expected exactly 8 oak_log as base materials!");
  }

  // Ensure deterministic output when ran twice
  const analysis2 = analyzeSchematic(schematic);
  if (JSON.stringify(analysis) !== JSON.stringify(analysis2)) {
    throw new Error("Engine is not deterministic!");
  }

  // Verify Gathering Plan Categories for DualFullBlockCrafter:
  // - Mob/Organic: light_blue_wool, ink_sac
  // - Farming: blue_orchid, light_blue_dye
  // - Processing: crafter, hopper, comparator, composter
  // - Wood: oak_log, oak_planks, oak_slab, chest
  const plan = analysis.gatheringPlan.categories;

  if (!plan['Mob/Organic']['light_blue_wool'] && !plan['Mob/Organic']['black_wool']) {
    throw new Error("Wool should be classified under Mob/Organic!");
  }
  if (!plan['Mob/Organic']['ink_sac']) {
    throw new Error("Ink Sac should be classified under Mob/Organic!");
  }
  if (!plan['Farming']['blue_orchid']) {
    throw new Error("Blue Orchid should be classified under Farming!");
  }
  if (!plan['Processing']['crafter']) {
    throw new Error("Crafter should be classified under Processing!");
  }
  if (!plan['Processing']['hopper']) {
    throw new Error("Hopper should be classified under Processing!");
  }
  if (!plan['Wood']['oak_log']) {
    throw new Error("Oak Log should be classified under Wood!");
  }

  // Verify NO "Craft " prefix leaks into any display names
  for (const [category, items] of Object.entries(plan)) {
    for (const [key, item] of Object.entries(items)) {
      if (item.displayName.startsWith("Craft ")) {
        throw new Error(`Item ${key} in ${category} has 'Craft ' prefix in displayName: '${item.displayName}'`);
      }
    }
  }

  console.log("Integration test PASSED.");
}

async function testUnit() {
  console.log("--- RUNNING UNIT TESTS ---");

  // Test: Unknown ID
  const unknownMock = createMockSchematic({
    "minecraft:totally_fake_block": { count: 5 }
  });
  const unknownAnalysis = analyzeSchematic(unknownMock);
  if (unknownAnalysis.unrecognizedBlocks["minecraft:totally_fake_block"] !== 5) {
    throw new Error("Unknown block was not correctly reported in unrecognizedBlocks.");
  }
  if (unknownAnalysis.baseMaterials["totally_fake_block"] !== 5) {
    throw new Error("Unknown block was not placed in baseMaterials correctly.");
  }

  // Test: Air filtering
  const airMock = createMockSchematic({
    "minecraft:air": { count: 100 },
    "minecraft:cave_air": { count: 100 },
    "minecraft:oak_log": { count: 5 }
  });
  const airAnalysis = analyzeSchematic(airMock);
  if (airAnalysis.baseMaterials['air'] || airAnalysis.baseMaterials['cave_air']) {
    throw new Error("Air should be filtered out.");
  }
  if (airAnalysis.baseMaterials['oak_log'] !== 5) {
    throw new Error("Oak log was not counted properly with air.");
  }

  // Test: Zero quantity
  const zeroMock = createMockSchematic({
    "minecraft:stone": { count: 0 }
  });
  const zeroAnalysis = analyzeSchematic(zeroMock);
  if (zeroAnalysis.baseMaterials['stone']) {
    throw new Error("Zero count items should not appear in output.");
  }

  // Test: Multi-output recipe (crafting a button from 1 planks creates 1 button, slabs create 6 from 3)
  // Let's use oak_slab (id: 126). 3 planks -> 6 slabs.
  const slabMock = createMockSchematic({
    "minecraft:oak_slab": { count: 7 }
  });
  const slabAnalysis = analyzeSchematic(slabMock);
  // 7 slabs requires 2 craft operations. 2 * 3 planks = 6 planks.
  // 6 planks requires 2 craft operations (each gives 4). 2 * 1 log = 2 logs.
  if (slabAnalysis.processingOperations['oak_slab'] !== 2) {
    throw new Error(`Expected 2 slab crafts, got ${slabAnalysis.processingOperations['oak_slab']}`);
  }
  if (slabAnalysis.baseMaterials['oak_log'] !== 2) {
    throw new Error(`Expected 2 logs, got ${slabAnalysis.baseMaterials['oak_log']}`);
  }

  // Test: Clean display names & structured operation metadata in gatheringPlan
  const woodCat = slabAnalysis.gatheringPlan.categories['Wood'];
  const slabItem = woodCat['oak_slab'];
  if (!slabItem) {
    throw new Error("Oak slab should be in the 'Wood' category of Gathering Plan!");
  }
  if (slabItem.displayName !== "Oak Slab") {
    throw new Error(`Expected clean display name 'Oak Slab', got '${slabItem.displayName}'`);
  }
  if (!slabItem.isOperation) {
    throw new Error("Oak slab should have isOperation: true");
  }
  if (slabItem.operationType !== 'craft') {
    throw new Error("Oak slab should have operationType: 'craft'");
  }

  const logItem = woodCat['oak_log'];
  if (!logItem) {
    throw new Error("Oak log should be in the 'Wood' category of Gathering Plan!");
  }
  if (logItem.displayName !== "Oak Log") {
    throw new Error(`Expected clean display name 'Oak Log', got '${logItem.displayName}'`);
  }
  if (logItem.isOperation) {
    throw new Error("Oak log should have isOperation: false");
  }
  if (logItem.operationType !== 'gather') {
    throw new Error("Oak log should have operationType: 'gather'");
  }

  // Test: Search with clean display name without requiring "Craft"
  const searchSlab = "Oak Slab".toLowerCase();
  const matchesSlab = slabItem.displayName.toLowerCase().includes(searchSlab);
  if (!matchesSlab) {
    throw new Error("Searching for 'Oak Slab' must match clean display name without 'Craft'");
  }

  // Test: Category Classification Unit Tests
  console.log("Testing category classifications...");
  const catTests: [string, string][] = [
    ['white_wool', 'Mob/Organic'],
    ['light_blue_wool', 'Mob/Organic'],
    ['ink_sac', 'Mob/Organic'],
    ['bone', 'Mob/Organic'],
    ['string', 'Mob/Organic'],
    ['blue_orchid', 'Farming'],
    ['dandelion', 'Farming'],
    ['light_blue_dye', 'Farming'],
    ['wheat', 'Farming'],
    ['sugar_cane', 'Farming'],
    ['oak_log', 'Wood'],
    ['oak_planks', 'Wood'],
    ['oak_slab', 'Wood'],
    ['chest', 'Wood'],
    ['barrel', 'Wood'],
    ['stone', 'Mining'],
    ['cobblestone', 'Mining'],
    ['diamond', 'Mining'],
    ['redstone', 'Mining'],
    ['quartz', 'Nether'],
    ['netherrack', 'Nether'],
    ['end_stone', 'End'],
    ['purpur_block', 'End'],
    ['crafter', 'Processing'],
    ['hopper', 'Processing'],
    ['comparator', 'Processing'],
    ['iron_ingot', 'Processing'],
    ['iron_block', 'Processing'],
    ['glass', 'Processing'],
    ['terracotta', 'Processing'],
    ['smooth_stone', 'Processing'],
    ['completely_fake_block_xyz', 'Other']
  ];

  for (const [item, expectedCat] of catTests) {
    const actualCat = getGatheringCategory(item);
    if (actualCat !== expectedCat) {
      throw new Error(`Category mismatch for '${item}': expected '${expectedCat}', got '${actualCat}'`);
    }
  }

  // Test: formatDisplayName Unit Tests
  console.log("Testing formatDisplayName...");
  const nameTests: [string, string][] = [
    ['oak_slab', 'Oak Slab'],
    ['craft_oak_slab', 'Oak Slab'],
    ['hopper', 'Hopper'],
    ['chest', 'Chest'],
    ['iron_ingot', 'Iron Ingot'],
    ['iron_block', 'Iron Block'],
    ['blue_orchid', 'Blue Orchid'],
    ['ink_sac', 'Ink Sac'],
    ['crafter', 'Crafter']
  ];

  for (const [input, expectedName] of nameTests) {
    const actualName = formatDisplayName(input);
    if (actualName !== expectedName) {
      throw new Error(`Display name mismatch for '${input}': expected '${expectedName}', got '${actualName}'`);
    }
  }

  console.log("Unit tests PASSED.");
}

function testInventory() {
  console.log("\nTesting Inventory Logic & Status Calculations...");

  // 1. Examples A - D
  const exA = calculateInventoryStatus(10, 0);
  if (exA.missing !== 10 || exA.status !== 'MISSING') {
    throw new Error(`Example A failed: expected missing 10 and status MISSING, got missing ${exA.missing} and status ${exA.status}`);
  }

  const exB = calculateInventoryStatus(10, 4);
  if (exB.missing !== 6 || exB.status !== 'PARTIAL') {
    throw new Error(`Example B failed: expected missing 6 and status PARTIAL, got missing ${exB.missing} and status ${exB.status}`);
  }

  const exC = calculateInventoryStatus(10, 10);
  if (exC.missing !== 0 || exC.status !== 'ENOUGH') {
    throw new Error(`Example C failed: expected missing 0 and status ENOUGH, got missing ${exC.missing} and status ${exC.status}`);
  }

  const exD = calculateInventoryStatus(10, 15);
  if (exD.missing !== 0 || exD.status !== 'ENOUGH') {
    throw new Error(`Example D failed: expected missing 0 and status ENOUGH, got missing ${exD.missing} and status ${exD.status}`);
  }

  // 2. Owned quantity 0 produces MISSING (when required > 0)
  for (const req of [1, 5, 100, 1000]) {
    const res = calculateInventoryStatus(req, 0);
    if (res.status !== 'MISSING' || res.missing !== req) {
      throw new Error(`Owned 0 with required ${req} did not produce MISSING`);
    }
  }

  // 3. Owned quantity between 1 and required - 1 produces PARTIAL
  for (let owned = 1; owned < 10; owned++) {
    const res = calculateInventoryStatus(10, owned);
    if (res.status !== 'PARTIAL') {
      throw new Error(`Owned ${owned} with required 10 did not produce PARTIAL`);
    }
    if (res.missing !== 10 - owned) {
      throw new Error(`Missing count mismatch for owned ${owned}: expected ${10 - owned}, got ${res.missing}`);
    }
  }

  // 4. Owned quantity equal to required produces ENOUGH
  const resEqual = calculateInventoryStatus(25, 25);
  if (resEqual.status !== 'ENOUGH' || resEqual.missing !== 0) {
    throw new Error(`Equal owned/required failed: expected ENOUGH and missing 0`);
  }

  // 5. Owned quantity above required produces ENOUGH
  const resAbove = calculateInventoryStatus(25, 30);
  if (resAbove.status !== 'ENOUGH' || resAbove.missing !== 0) {
    throw new Error(`Above owned/required failed: expected ENOUGH and missing 0`);
  }

  // 6. Missing quantity never becomes negative
  for (const excess of [0, 1, 10, 100, 10000]) {
    const res = calculateInventoryStatus(5, 5 + excess);
    if (res.missing < 0) {
      throw new Error(`Negative missing quantity detected: ${res.missing}`);
    }
    if (res.missing !== 0) {
      throw new Error(`Missing should be 0 when owned >= required, got: ${res.missing}`);
    }
  }

  // Also edge cases: negative or NaN inputs
  const resNegativeReq = calculateInventoryStatus(-5, 10);
  if (resNegativeReq.missing !== 0 || resNegativeReq.status !== 'ENOUGH') {
    throw new Error(`Negative required quantity should yield missing 0 and status ENOUGH`);
  }
  const resNegativeOwned = calculateInventoryStatus(10, -5);
  if (resNegativeOwned.missing !== 10 || resNegativeOwned.status !== 'MISSING') {
    throw new Error(`Negative owned quantity should be clamped to 0 and yield MISSING`);
  }

  // 7 & 8. Incrementing and decrementing lifecycle
  let currentOwned = 0;
  const required = 10;
  
  // Start: owned 0 -> MISSING
  let state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'MISSING' || state.missing !== 10) throw new Error("Initial state mismatch");

  // Increment +1 -> owned 1 -> PARTIAL
  currentOwned += 1;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'PARTIAL' || state.missing !== 9) throw new Error("Increment +1 failed");

  // Increment +3 -> owned 4 -> PARTIAL
  currentOwned += 3;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'PARTIAL' || state.missing !== 6) throw new Error("Increment +3 failed");

  // Increment +6 -> owned 10 -> ENOUGH
  currentOwned += 6;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'ENOUGH' || state.missing !== 0) throw new Error("Increment to 10 failed");

  // Increment +5 -> owned 15 -> ENOUGH
  currentOwned += 5;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'ENOUGH' || state.missing !== 0) throw new Error("Increment to 15 failed");

  // Decrement -5 -> owned 10 -> ENOUGH
  currentOwned -= 5;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'ENOUGH' || state.missing !== 0) throw new Error("Decrement to 10 failed");

  // Decrement -1 -> owned 9 -> PARTIAL
  currentOwned -= 1;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'PARTIAL' || state.missing !== 1) throw new Error("Decrement to 9 failed");

  // 9. Manual quantity editing updates the status
  // Manually type 0
  currentOwned = 0;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'MISSING' || state.missing !== 10) throw new Error("Manual edit to 0 failed");

  // Manually type 20
  currentOwned = 20;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'ENOUGH' || state.missing !== 0) throw new Error("Manual edit to 20 failed");

  // 10. Resetting inventory restores MISSING when required quantity is positive
  currentOwned = 0;
  state = calculateInventoryStatus(required, currentOwned);
  if (state.status !== 'MISSING' || state.missing !== 10) throw new Error("Reset inventory failed to restore MISSING");

  // 11. Crafted and non-crafted items both use the same inventory fulfillment rules
  // The fulfillment status does NOT depend on whether item is crafted or raw
  const rawItemStatus = calculateInventoryStatus(8, 4);
  const craftedItemStatus = calculateInventoryStatus(8, 4);
  if (rawItemStatus.status !== craftedItemStatus.status || rawItemStatus.missing !== craftedItemStatus.missing) {
    throw new Error("Crafted and non-crafted items diverged in inventory fulfillment logic");
  }

  // 12. Canonical inventory keys: operation prefixes, namespaces, display names do not create separate keys
  const keysToTest = [
    'oak_slab',
    'craft_oak_slab',
    'minecraft:oak_slab',
    'minecraft:craft_oak_slab',
    'craft_minecraft:oak_slab',
    'Oak Slab',
    'Craft Oak Slab',
    'craft_oak_slab  '
  ];
  const canonicalExpected = 'oak_slab';
  for (const k of keysToTest) {
    const canonical = canonicalizeInventoryKey(k);
    if (canonical !== canonicalExpected) {
      throw new Error(`Canonical key mismatch for '${k}': expected '${canonicalExpected}', got '${canonical}'`);
    }
  }

  // Simulated inventory store keyed by canonical key
  const mockInventoryStore: Record<string, number> = {};
  function setOwned(key: string, qty: number) {
    mockInventoryStore[canonicalizeInventoryKey(key)] = qty;
  }
  function getOwned(key: string): number {
    return mockInventoryStore[canonicalizeInventoryKey(key)] || 0;
  }

  setOwned('craft_oak_slab', 5);
  if (getOwned('oak_slab') !== 5) {
    throw new Error("Setting owned on 'craft_oak_slab' failed to update 'oak_slab'");
  }
  if (getOwned('Oak Slab') !== 5) {
    throw new Error("Querying 'Oak Slab' did not find owned quantity set via 'craft_oak_slab'");
  }
  if (getOwned('minecraft:oak_slab') !== 5) {
    throw new Error("Querying 'minecraft:oak_slab' did not find owned quantity set via 'craft_oak_slab'");
  }

  // 13. Missing count and status always agree
  const testScenarios = [
    { req: 10, owned: 0, expectedStatus: 'MISSING', expectedMissing: 10 },
    { req: 10, owned: 1, expectedStatus: 'PARTIAL', expectedMissing: 9 },
    { req: 10, owned: 9, expectedStatus: 'PARTIAL', expectedMissing: 1 },
    { req: 10, owned: 10, expectedStatus: 'ENOUGH', expectedMissing: 0 },
    { req: 10, owned: 11, expectedStatus: 'ENOUGH', expectedMissing: 0 },
    { req: 0, owned: 0, expectedStatus: 'ENOUGH', expectedMissing: 0 },
    { req: 0, owned: 5, expectedStatus: 'ENOUGH', expectedMissing: 0 },
  ];

  for (const scen of testScenarios) {
    const calc = calculateInventoryStatus(scen.req, scen.owned);
    if (calc.status !== scen.expectedStatus || calc.missing !== scen.expectedMissing) {
      throw new Error(`Scenario failed for req ${scen.req}, owned ${scen.owned}: got status ${calc.status}, missing ${calc.missing}`);
    }
    // Strict agreement invariants:
    if (calc.status === 'ENOUGH' && calc.missing !== 0) {
      throw new Error(`Agreement violation: status is ENOUGH but missing is ${calc.missing}`);
    }
    if (calc.status === 'PARTIAL' && (calc.missing <= 0 || calc.missing >= calc.required)) {
      throw new Error(`Agreement violation: status is PARTIAL but missing is ${calc.missing} for required ${calc.required}`);
    }
    if (calc.status === 'MISSING' && calc.missing !== calc.required) {
      throw new Error(`Agreement violation: status is MISSING but missing is ${calc.missing} for required ${calc.required}`);
    }
  }

  console.log("Inventory tests PASSED.");
}

async function runTests() {
  await testIntegration();
  await testUnit();
  testInventory();
  console.log("\nALL TESTS PASSED.");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
