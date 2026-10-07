import fs from 'fs';
import { doParseLitematic as parseLitematic } from './src/lib/parser.worker';

async function test() {
  const buffer = fs.readFileSync('./node_modules/litematic-parser/test/DualFullBlockCrafter.litematic');
  try {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const schematic = await parseLitematic(arrayBuffer);
    console.log("Dimensions:", schematic.metadata.enclosingSize);
    console.log("Region count:", schematic.regions.length);
    console.log("Total blocks:", schematic.metadata.totalBlocks);
    
    // Count blocks manually across all regions to verify
    const blockCounts: Record<string, number> = {};
    for (const region of schematic.regions) {
      for (const [block, count] of Object.entries(region.blockCounts)) {
        blockCounts[block] = (blockCounts[block] || 0) + count;
      }
    }
    
    const sortedBlocks = Object.entries(blockCounts).sort((a, b) => b[1] - a[1]);
    console.log("All blocks:");
    sortedBlocks.forEach(([block, count]) => {
      console.log(`  ${block}: ${count}`);
    });
  } catch (error) {
    console.error("Error parsing valid file:", error);
  }

  // Corrupt file
  try {
    const corruptBuffer = fs.readFileSync('./corrupt.litematic');
    const corruptArrayBuffer = corruptBuffer.buffer.slice(corruptBuffer.byteOffset, corruptBuffer.byteOffset + corruptBuffer.byteLength);
    await parseLitematic(corruptArrayBuffer);
    console.log("SUCCESS on corrupt file (EXPECTED FAILURE)");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Corrupt file failed as expected:", error.message);
    } else {
      console.log("Corrupt file failed as expected:", error);
    }
  }

  // Empty file
  try {
    await parseLitematic(new ArrayBuffer(0));
    console.log("SUCCESS on empty file (EXPECTED FAILURE)");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Empty file failed as expected:", error.message);
    } else {
      console.log("Empty file failed as expected:", error);
    }
  }

  // Unsupported file (README.md)
  try {
    const readmeBuffer = fs.readFileSync('./README.md');
    const readmeArrayBuffer = readmeBuffer.buffer.slice(readmeBuffer.byteOffset, readmeBuffer.byteOffset + readmeBuffer.byteLength);
    await parseLitematic(readmeArrayBuffer);
    console.log("SUCCESS on unsupported file (EXPECTED FAILURE)");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Unsupported file failed as expected:", error.message);
    } else {
      console.log("Unsupported file failed as expected:", error);
    }
  }
}

test();
