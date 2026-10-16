import fs from 'fs';
import { doParseLitematic } from './src/lib/parser.worker';
import { analyzeSchematic } from './src/lib/materials/engine';
import { calculateInventoryStatus, canonicalizeInventoryKey } from './src/lib/materials/inventory';
import { resolveItemId } from './src/lib/materials/recipeIndex';
import {
  RecentBuild,
  generateBuildId,
  saveRecentBuild,
  getRecentBuild,
  listRecentBuilds,
  deleteRecentBuild,
  clearAllRecentBuilds,
  getActiveBuildId,
  setActiveBuildId,
  getActiveBuild,
  updateBuildInventory,
  updateBuildLastOpened,
  isValidRecentBuild,
  MAX_RECENT_BUILDS,
} from './src/lib/storage/buildStorage';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("=== RUNNING RECENT BUILDS & PERSISTENT SESSION TEST SUITE ===");

  // Clean slate
  await clearAllRecentBuilds();
  assert(getActiveBuildId() === null, "Active build ID should be null initially");
  const initialList = await listRecentBuilds();
  assert(initialList.length === 0, "Initial recent builds list should be empty");

  // ── 1. Parse and Analyze Fixture ─────────────────────────────────────────
  console.log("1. Parsing and analyzing DualFullBlockCrafter.litematic...");
  const buffer = fs.readFileSync('./node_modules/litematic-parser/test/DualFullBlockCrafter.litematic');
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const schematic = await doParseLitematic(arrayBuffer);
  const analysis = analyzeSchematic(schematic);

  const filename = "DualFullBlockCrafter.litematic";
  const buildId = generateBuildId(filename, schematic, analysis);
  assert(typeof buildId === 'string' && buildId.startsWith('build_'), "Generated build ID must be valid prefix");

  // Verify ID generation determinism
  const buildId2 = generateBuildId(filename, schematic, analysis);
  assert(buildId === buildId2, "generateBuildId must be deterministic for identical inputs");

  // ── 2. Save Build & Validate Restoration ─────────────────────────────────
  console.log("2. Saving build and verifying complete restoration...");
  const buildA: RecentBuild = {
    id: buildId,
    filename,
    name: schematic.metadata.name || "DualFullBlockCrafter",
    createdAt: Date.now() - 10000,
    lastOpenedAt: Date.now() - 5000,
    minecraftVersion: "1.20.4",
    dimensions: analysis.dimensions,
    regionCount: schematic.regions.length,
    totalSolidBlocks: analysis.totalSolidBlocks,
    schematic,
    analysis,
    inventory: { oak_log: 4, blue_orchid: 2 },
  };

  await saveRecentBuild(buildA);
  setActiveBuildId(buildA.id);

  const restored = await getRecentBuild(buildId);
  assert(restored !== null, "Build must be retrieved successfully");
  assert(restored?.id === buildId, "Restored build ID mismatch");
  assert(restored?.filename === filename, "Restored filename mismatch");
  assert(restored?.dimensions.x === 3 && restored?.dimensions.y === 3 && restored?.dimensions.z === 5, "Dimensions mismatch");
  assert(restored?.totalSolidBlocks === 23, "Total solid blocks mismatch");
  assert(restored?.regionCount === 1, "Region count mismatch");
  assert(restored?.inventory['oak_log'] === 4, "Saved inventory oak_log mismatch");
  assert(restored?.inventory['blue_orchid'] === 2, "Saved inventory blue_orchid mismatch");

  // Verify dashboard data completeness
  assert(restored?.analysis.gatheringPlan.categories['Wood'] !== undefined, "Gathering plan Wood category must exist");
  assert(restored?.analysis.exactBlockCounts['minecraft:crafter'] === 2, "Exact block counts crafter mismatch");
  assert(restored?.schematic.metadata.author === "JaRoMaster", "Schematic author must match fixture");

  // ── 3. Active Build Session ──────────────────────────────────────────────
  console.log("3. Testing active build session persistence...");
  assert(getActiveBuildId() === buildId, "getActiveBuildId must return current active ID");
  const activeBuild = await getActiveBuild();
  assert(activeBuild !== null && activeBuild.id === buildId, "getActiveBuild must return restored build");

  // ── 4. Per-Build Inventory Updates & Calculations ────────────────────────
  console.log("4. Testing per-build inventory persistence and calculations...");
  await updateBuildInventory(buildId, { oak_log: 8, blue_orchid: 2 });
  const updatedBuild = await getRecentBuild(buildId);
  assert(updatedBuild?.inventory['oak_log'] === 8, "Inventory update must persist oak_log = 8");

  // Check inventory calculations with restored values (required oak_log = 8 in DualFullBlockCrafter)
  const calc1 = calculateInventoryStatus(8, updatedBuild?.inventory['oak_log'] || 0);
  assert(calc1.status === 'ENOUGH', "8/8 oak_log must have status ENOUGH");
  assert(calc1.missing === 0, "8/8 oak_log missing should be 0");

  const calc2 = calculateInventoryStatus(4, updatedBuild?.inventory['blue_orchid'] || 0);
  assert(calc2.status === 'PARTIAL', "2/4 blue_orchid must have status PARTIAL");
  assert(calc2.missing === 2, "2/4 blue_orchid missing should be 2");

  // ── 5. Independent Inventory Across Multiple Builds ──────────────────────
  console.log("5. Testing isolation between multiple builds...");
  // Create a second build with mock data
  const mockSchematic2 = {
    metadata: {
      name: "Second Tower",
      author: "BuilderBob",
      description: "",
      timeCreated: 100,
      timeModified: 200,
      totalBlocks: 50,
      totalVolume: 100,
      enclosingSize: { x: 5, y: 10, z: 5 },
    },
    regions: [{
      name: "Main",
      position: { x: 0, y: 0, z: 0 },
      size: { x: 5, y: 10, z: 5 },
      palette: [{ name: "minecraft:stone" }],
      blockCounts: { "minecraft:stone": 50 },
    }],
    materials: {
      "minecraft:stone": { count: 50 },
    },
  };
  const analysis2 = analyzeSchematic(mockSchematic2);
  const buildIdB = generateBuildId("SecondTower.litematic", mockSchematic2, analysis2);

  const buildB: RecentBuild = {
    id: buildIdB,
    filename: "SecondTower.litematic",
    name: "Second Tower",
    createdAt: Date.now() - 5000,
    lastOpenedAt: Date.now(),
    minecraftVersion: "1.20.4",
    dimensions: analysis2.dimensions,
    regionCount: 1,
    totalSolidBlocks: 50,
    schematic: mockSchematic2,
    analysis: analysis2,
    inventory: { stone: 25 },
  };

  await saveRecentBuild(buildB);

  // Switch active to Build B
  setActiveBuildId(buildB.id);
  const activeB = await getActiveBuild();
  assert(activeB?.id === buildB.id, "Active build should now be Build B");
  assert(activeB?.inventory['stone'] === 25, "Build B inventory stone should be 25");

  // Verify Build A inventory was NOT changed by Build B
  const checkBuildA = await getRecentBuild(buildId);
  assert(checkBuildA?.inventory['oak_log'] === 8, "Build A inventory must remain 8");
  assert(checkBuildA?.inventory['stone'] === undefined, "Build A must not have stone from Build B");

  // Reset Build B inventory
  await updateBuildInventory(buildB.id, {});
  const resetB = await getRecentBuild(buildB.id);
  assert(Object.keys(resetB?.inventory || {}).length === 0, "Build B inventory reset must be empty");
  const checkBuildA2 = await getRecentBuild(buildId);
  assert(checkBuildA2?.inventory['oak_log'] === 8, "Build A inventory must still remain 8 after resetting Build B");

  // ── 6. Recent Builds List Ordering & Max Limit ───────────────────────────
  console.log("6. Testing recent builds list order and limits...");
  const recentList = await listRecentBuilds();
  assert(recentList.length === 2, "Should have 2 recent builds");
  // Build B had lastOpenedAt = Date.now(), Build A had older lastOpenedAt
  assert(recentList[0].id === buildB.id, "Build B should be first because it was opened more recently");

  // Update Build A lastOpenedAt
  await updateBuildLastOpened(buildId);
  const recentListUpdated = await listRecentBuilds();
  assert(recentListUpdated[0].id === buildId, "Build A should now be first after updating lastOpened");

  // Test Max Recent Builds Limit
  console.log(`Testing maximum recent builds limit (${MAX_RECENT_BUILDS})...`);
  for (let i = 1; i <= 12; i++) {
    const dummyBuild: RecentBuild = {
      id: `dummy_build_${i}`,
      filename: `dummy_${i}.litematic`,
      name: `Dummy ${i}`,
      createdAt: Date.now(),
      lastOpenedAt: Date.now() + i * 10,
      minecraftVersion: "1.20.4",
      dimensions: { x: 1, y: 1, z: 1 },
      regionCount: 1,
      totalSolidBlocks: 1,
      schematic: mockSchematic2,
      analysis: analysis2,
      inventory: {},
    };
    await saveRecentBuild(dummyBuild);
  }

  const trimmedList = await listRecentBuilds(20);
  assert(trimmedList.length <= MAX_RECENT_BUILDS, `List must not exceed MAX_RECENT_BUILDS (${MAX_RECENT_BUILDS}), got ${trimmedList.length}`);

  // ── 7. Delete and Clear Operations ───────────────────────────────────────
  console.log("7. Testing delete and clear operations...");
  // Clear all
  await clearAllRecentBuilds();
  const emptyList = await listRecentBuilds();
  assert(emptyList.length === 0, "List must be empty after clearAll");
  assert(getActiveBuildId() === null, "Active build ID must be null after clearAll");

  // Re-save Build A, set active, then delete it
  await saveRecentBuild(buildA);
  setActiveBuildId(buildA.id);
  assert(getActiveBuildId() === buildA.id, "Active build set");
  await deleteRecentBuild(buildA.id);
  assert(getActiveBuildId() === null, "Active build pointer must be cleared when active build is deleted");
  const deletedCheck = await getRecentBuild(buildA.id);
  assert(deletedCheck === null, "Deleted build must return null");

  // ── 8. Malformed Record Validation ───────────────────────────────────────
  console.log("8. Testing validation of malformed records...");
  assert(!isValidRecentBuild(null), "null is not valid");
  assert(!isValidRecentBuild({}), "empty object is not valid");
  assert(!isValidRecentBuild({ id: "123", filename: "test.litematic" }), "incomplete object is not valid");
  assert(isValidRecentBuild(buildA), "buildA must be valid");

  // ── 9. Craftable Badge & Recipe Navigation Integration ───────────────────
  console.log("9. Testing recipe navigation and session continuity...");
  // Save buildA again and mark active
  await saveRecentBuild(buildA);
  setActiveBuildId(buildA.id);

  // User clicks Craftable on oak_slab
  const oakSlabItem = resolveItemId('minecraft:oak_slab');
  assert(oakSlabItem !== undefined, "oak_slab must resolve");
  assert(canonicalizeInventoryKey('minecraft:oak_slab') === 'oak_slab', "canonical key matches");

  // User navigates to /recipes?item=minecraft:oak_slab
  // Active build remains in storage untouched
  const preservedActive = await getActiveBuild();
  assert(preservedActive !== null && preservedActive.id === buildA.id, "Active build session must survive recipe navigation");
  assert(preservedActive?.inventory['oak_log'] === 4, "Active build inventory must remain intact");

  console.log("=== ALL RECENT BUILDS & BUILD STORAGE TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
