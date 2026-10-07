import * as pako from 'pako';
import * as nbt from 'prismarine-nbt';
import { NormalizedSchematic, RegionData, BlockState, SchematicMetadata } from './types';

function readLongPackedArray(array: DataView, bitsPerItem: number, index: number, tightlyPacked: boolean) {
    const bitMask = (1 << bitsPerItem) - 1;
    const unusedBitsPerLong = tightlyPacked ? 0 : 64 % bitsPerItem;
    const itemsPerLong = Math.floor(64 / bitsPerItem);
    const bitIndex = index * bitsPerItem + Math.floor(index / itemsPerLong) * unusedBitsPerLong;
    const currentLongIndex = Math.floor(bitIndex / 64) * 8;
    const indexInLong = bitIndex % 64;
    
    if (indexInLong < 32) {
        const currentLongLo = array.getUint32(currentLongIndex + 4);
        const currentLongHi = array.getUint32(currentLongIndex);
        return ((currentLongLo >>> indexInLong) | (currentLongHi << (31 - indexInLong) << 1)) & bitMask;
    } else {
        const currentLongHi = array.getUint32(currentLongIndex);
        const nextLongLo = currentLongIndex + 8 < array.byteLength ? array.getUint32(currentLongIndex + 12) : 0;
        return ((currentLongHi >>> (indexInLong - 32)) | (nextLongLo << (63 - indexInLong) << 1)) & bitMask;
    }
}

export async function doParseLitematic(buffer: ArrayBuffer, onProgress?: (status: string) => void): Promise<NormalizedSchematic> {
  // 1. Basic validation
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("File is empty.");
  }
  
  // Magic bytes check for GZIP (1F 8B)
  const magicView = new Uint8Array(buffer, 0, 2);
  if (magicView.length < 2 || magicView[0] !== 0x1f || magicView[1] !== 0x8b) {
    throw new Error("Invalid file format. Ensure it is a valid .litematic file (GZIP format).");
  }

  if (onProgress) onProgress('Decompressing file...');
  const decompressed = pako.inflate(new Uint8Array(buffer));
  
  if (onProgress) onProgress('Parsing NBT data...');
  const nbtResult = await nbt.parse(decompressed.buffer);
  const data = nbt.simplify(nbtResult.parsed);
  
  if (onProgress) onProgress('Analyzing blocks...');

  if (!data || typeof data !== 'object') {
    throw new Error("Invalid Litematic file: Root NBT is malformed");
  }

  if (data.Version == null || data.Metadata == null || data.Regions == null) {
    throw new Error("Invalid Litematic file: Missing required fields");
  }

  const metadata: SchematicMetadata = {
    name: data.Metadata.Name || "Unnamed",
    author: data.Metadata.Author || "Unknown",
    description: data.Metadata.Description || "",
    timeCreated: data.Metadata.TimeCreated || 0,
    timeModified: data.Metadata.TimeModified || 0,
    totalBlocks: data.Metadata.TotalBlocks || 0,
    totalVolume: data.Metadata.TotalVolume || 0,
    enclosingSize: {
      x: data.Metadata.EnclosingSize?.x || 0,
      y: data.Metadata.EnclosingSize?.y || 0,
      z: data.Metadata.EnclosingSize?.z || 0,
    }
  };

  const regions: RegionData[] = [];
  const globalMaterials: Record<string, { count: number }> = {};

  for (const [regionName, regionData] of Object.entries(data.Regions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = regionData as any;
    
    if (!r.Size || !r.Position) {
       throw new Error(`Invalid region data for region: ${regionName}`);
    }

    const size = {
      x: Math.abs(r.Size.x),
      y: Math.abs(r.Size.y),
      z: Math.abs(r.Size.z)
    };
    const volume = size.x * size.y * size.z;
    
    if (!r.BlockStatePalette || !Array.isArray(r.BlockStatePalette)) {
       throw new Error(`Missing BlockStatePalette for region: ${regionName}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const palette: BlockState[] = r.BlockStatePalette.map((p: any) => ({
      name: p.Name,
      properties: p.Properties || {}
    }));

    const blockCounts: Record<string, number> = {};
    
    if (r.BlockStates && r.BlockStates.length > 0) {
      const longArray = r.BlockStates;
      
      // Prevent unreasonable allocation risk
      if (longArray.length > 100000000) {
        throw new Error(`Region ${regionName} is too large to parse safely.`);
      }

      const buffer = new ArrayBuffer(longArray.length * 8);
      const dataView = new DataView(buffer);
      for (let i = 0; i < longArray.length; i++) {
        dataView.setInt32(i * 8, longArray[i][0]);
        dataView.setInt32(i * 8 + 4, longArray[i][1]);
      }

      const bitsPerItem = Math.max(2, Math.ceil(Math.log2(palette.length)));
      const tightlyPacked = true;

      for (let i = 0; i < volume; i++) {
        const paletteIndex = readLongPackedArray(dataView, bitsPerItem, i, tightlyPacked);
        if (paletteIndex >= 0 && paletteIndex < palette.length) {
          const blockName = palette[paletteIndex].name;
          blockCounts[blockName] = (blockCounts[blockName] || 0) + 1;
        } else {
           // Invalid block state index
           // Don't crash, just ignore or map to air if preferred.
        }
      }
    } else {
      // If the region has 0 volume or missing BlockStates
      if (palette.length > 0) {
         blockCounts[palette[0].name] = volume;
      }
    }

    // Merge into global materials
    for (const [blockName, count] of Object.entries(blockCounts)) {
      if (blockName !== "minecraft:air" && blockName !== "minecraft:cave_air" && blockName !== "minecraft:void_air") {
        if (!globalMaterials[blockName]) globalMaterials[blockName] = { count: 0 };
        globalMaterials[blockName].count += count;
      }
    }

    regions.push({
      name: regionName,
      position: { x: r.Position.x, y: r.Position.y, z: r.Position.z },
      size,
      palette,
      blockCounts
    });
  }

  return {
    metadata,
    regions,
    materials: globalMaterials
  };
}

if (typeof self !== 'undefined') {
  self.onmessage = async (e: MessageEvent) => {
    try {
      const buffer = e.data as ArrayBuffer;
      
      // Fake progress parsing states for UI updates
      self.postMessage({ type: 'progress', status: 'Decompressing file...' });
      
      // small timeout to allow UI to update if synchronous inflate blocks
      await new Promise(r => setTimeout(r, 0));

      // Pass the progress callback to doParseLitematic
      const result = await doParseLitematic(buffer, (status: string) => {
        self.postMessage({ type: 'progress', status });
      });
      
      self.postMessage({ type: 'success', data: result });
    } catch (error: unknown) {
      if (error instanceof Error) {
        self.postMessage({ type: 'error', error: error.message });
      } else {
        self.postMessage({ type: 'error', error: String(error) });
      }
    }
  };
}
