export type ListingType = "minebuild_demo" | "curated_external" | "community_hosted";

export type BuildCategory =
  | "Redstone & Automation"
  | "Survival & Starter"
  | "Farms & Generators"
  | "Architecture & Castles"
  | "Nether & End"
  | "Decorative & Botanical";

export interface KeyMaterialRequirement {
  name: string;
  count: number;
}

export interface CommunityBuild {
  id: string;
  slug: string;
  title: string;
  creatorName: string;
  creatorUrl?: string;
  description: string;
  category: BuildCategory;
  tags: string[];
  dimensions: { x: number; y: number; z: number };
  regionCount: number;
  solidBlockCount: number;
  minecraftVersion: string;
  topBlockNames: string[]; // e.g. ["minecraft:crafter", "minecraft:redstone_wire"]
  keyMaterials: KeyMaterialRequirement[];
  listingType: ListingType;
  downloadable: boolean;
  downloadUrl?: string;
  sourceUrl?: string;
  license: string;
  licenseDetails: string;
  attributionText: string;
  dateChecked: string;
  publishedAt: string;
  status: "published" | "pending" | "rejected";
  // Explicit build thumbnail & authentic screenshot data model
  thumbnail?: BuildThumbnailInfo;
  // Isometric preview visual styling (retained for optional technical schematic preview only)
  previewBlocks?: {
    block: string;
    coords: [number, number, number]; // [x, y, z] for lightweight voxel rendering
  }[];
}

export interface BuildImageItem {
  url: string;
  alt: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface BuildThumbnailInfo {
  // Primary image path or verified embed URL
  url?: string;
  // Descriptive alternative text
  alt: string;
  // Where the image originated from
  sourceType: "creator_upload" | "community_verified" | "official_embed" | "none";
  // Original project / channel URL
  sourceProjectUrl?: string;
  // Direct image source URL
  imageSourceUrl?: string;
  // Creator attribution and copyright for the screenshot
  attribution: string;
  // Permission or licensing status
  permissionStatus:
    | "authorized_display"
    | "official_embed_permitted"
    | "permission_pending"
    | "unavailable";
  // Whether this image is verified and authorized for public display on MineBuild
  isAuthorizedForDisplay: boolean;
  // Verification date (YYYY-MM-DD)
  dateVerified?: string;
  // Optional additional screenshots for gallery view on detail page
  additionalImages?: BuildImageItem[];
}

export interface BuildSubmissionInput {
  title: string;
  creatorName: string;
  description: string;
  category: BuildCategory;
  tags: string[];
  sourceUrl?: string;
  allowDownload: boolean;
  rightsConfirmed: boolean;
  screenshotPermissionConfirmed?: boolean;
  screenshotFile?: File;
  minecraftVersion?: string;
  dimensions?: { x: number; y: number; z: number };
  solidBlockCount?: number;
  regionCount?: number;
  topBlockNames?: string[];
  keyMaterials?: KeyMaterialRequirement[];
  fileBufferBase64?: string;
  fileName?: string;
}

export interface BuildFilterOptions {
  searchQuery?: string;
  category?: string;
  sortBy?: "newest" | "name" | "blocks";
}
