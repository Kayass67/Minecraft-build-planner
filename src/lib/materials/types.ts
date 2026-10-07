export interface MaterialAnalysis {
  dimensions: { x: number; y: number; z: number };
  totalSolidBlocks: number;
  exactBlockCounts: Record<string, number>;
  unrecognizedBlocks: Record<string, number>;

  baseMaterials: Record<string, number>; // Raw materials needed to be gathered
  craftedItems: Record<string, number>; // Items that are required but are crafted
  processingOperations: Record<string, number>; // Operations required (e.g. number of craft actions)

  gatheringPlan: GatheringPlan;
}

export type GatheringCategory =
  | 'Mining'
  | 'Wood'
  | 'Farming'
  | 'Mob/Organic'
  | 'Nether'
  | 'End'
  | 'Processing'
  | 'Other';

export interface GatheringPlan {
  categories: Record<GatheringCategory, Record<string, number>>;
}
