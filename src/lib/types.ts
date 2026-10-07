export interface SchematicMetadata {
  name: string;
  author: string;
  description: string;
  timeCreated: number;
  timeModified: number;
  totalBlocks: number;
  totalVolume: number;
  enclosingSize: {
    x: number;
    y: number;
    z: number;
  };
}

export interface BlockState {
  name: string; // e.g., 'minecraft:oak_log'
  properties?: Record<string, string>; // e.g., { axis: 'y' }
}

export interface RegionData {
  name: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  // A palette maps an ID to a specific block state
  palette: BlockState[];
  // A tally of how many times each palette index appears
  // This avoids storing the full bit-packed array if we only need counts.
  // But wait, what if we need to display a layer-by-layer guide? 
  // For the MVP, we just need materials gathering.
  blockCounts: Record<string, number>; // blockName -> count
}

export interface NormalizedSchematic {
  metadata: SchematicMetadata;
  regions: RegionData[];
  
  // A consolidated summary of all blocks across all regions.
  // Ignores 'minecraft:air' and similar non-gatherable blocks.
  materials: {
    [blockName: string]: {
      count: number;
      // We can enrich this later with crafting data
    }
  };
}
