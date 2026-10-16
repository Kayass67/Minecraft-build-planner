import fs from 'fs';
import path from 'path';
import { doParseLitematic } from './src/lib/parser.worker';
import { analyzeSchematic } from './src/lib/materials/engine';

async function main() {
  const buffer = fs.readFileSync('./node_modules/litematic-parser/test/DualFullBlockCrafter.litematic');
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const schematic = await doParseLitematic(arrayBuffer);
  console.log('Schematic materials:', schematic.materials);
  const analysis = analyzeSchematic(schematic);
  console.log('Base materials:', analysis.baseMaterials);
  console.log('Crafted items:', analysis.craftedItems);
  console.log('Processing operations:', analysis.processingOperations);
  console.log('Gathering plan categories:');
  for (const [cat, items] of Object.entries(analysis.gatheringPlan.categories)) {
    console.log(`-- ${cat}:`, Object.keys(items));
  }
}
main().catch(console.error);
