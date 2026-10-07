import fs from 'fs';
import { doParseLitematic } from './src/lib/parser.worker';
import { analyzeSchematic } from './src/lib/materials/engine';
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

  // Test: Multi-output recipe (crafting a button from 1 planks creates 1 button, but wait, slabs create 6 from 3)
  // Let's use oak_slab (id: 126). 3 planks -> 6 slabs.
  const slabMock = createMockSchematic({
    "minecraft:oak_slab": { count: 7 }
  });
  const slabAnalysis = analyzeSchematic(slabMock);
  // 7 slabs requires 2 craft operations. 2 * 3 planks = 6 planks.
  // 6 planks requires 2 craft operations (each gives 4). 2 * 1 log = 2 logs.
  if (slabAnalysis.processingOperations['craft_oak_slab'] !== 2) {
    throw new Error(`Expected 2 slab crafts, got ${slabAnalysis.processingOperations['craft_oak_slab']}`);
  }
  if (slabAnalysis.baseMaterials['oak_log'] !== 2) {
    throw new Error(`Expected 2 logs, got ${slabAnalysis.baseMaterials['oak_log']}`);
  }

  console.log("Unit tests PASSED.");
}

async function runTests() {
  await testIntegration();
  await testUnit();
  console.log("\nALL TESTS PASSED.");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
