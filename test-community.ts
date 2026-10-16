import { SEED_BUILDS, queryCommunityBuilds, getBuildBySlug } from "./src/lib/community/seedBuilds";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("=== RUNNING MINEBUILD COMMUNITY & EXPLORE TEST SUITE ===");

// 1. Minimum count verification
console.log(`1. Verifying initial seed listings count... (Found: ${SEED_BUILDS.length})`);
assert(SEED_BUILDS.length >= 20, "Must have at least 20 initial seeded build listings.");

// 2. Uniqueness & Metadata completeness
console.log("2. Validating build slugs and metadata completeness...");
const slugSet = new Set<string>();
const idSet = new Set<string>();

for (const build of SEED_BUILDS) {
  assert(!slugSet.has(build.slug), `Duplicate slug found: ${build.slug}`);
  slugSet.add(build.slug);

  assert(!idSet.has(build.id), `Duplicate ID found: ${build.id}`);
  idSet.add(build.id);

  assert(build.title.length > 2, `Build ${build.id} title too short`);
  assert(build.creatorName.length > 1, `Build ${build.id} creatorName missing`);
  assert(build.description.length > 10, `Build ${build.id} description too short`);
  assert(build.dimensions.x > 0 && build.dimensions.y > 0 && build.dimensions.z > 0, `Build ${build.id} invalid dimensions`);
  assert(build.solidBlockCount > 0, `Build ${build.id} solidBlockCount must be > 0`);
  assert(build.topBlockNames.length > 0, `Build ${build.id} topBlockNames must not be empty`);
  assert(build.keyMaterials.length > 0, `Build ${build.id} keyMaterials must not be empty`);
  assert(Boolean(build.license), `Build ${build.id} license missing`);
  assert(Boolean(build.attributionText), `Build ${build.id} attributionText missing`);
  assert(Boolean(build.dateChecked), `Build ${build.id} dateChecked missing`);
  assert(build.status === "published", `Build ${build.id} must be published`);

  if (build.listingType === "curated_external") {
    assert(Boolean(build.sourceUrl), `External build ${build.id} must have sourceUrl`);
    assert(build.downloadable === false, `External build ${build.id} must not claim direct MineBuild download`);
  }

  if (build.listingType === "minebuild_demo") {
    assert(build.downloadable === true, `Demo build ${build.id} must be downloadable`);
  }
}
console.log("  All 21+ builds verified with complete metadata and license provenance.");

// 3. Search queries
console.log("3. Testing community search filter...");
const searchCrafter = queryCommunityBuilds(SEED_BUILDS, "crafter");
assert(searchCrafter.length >= 1, "Search for 'crafter' should return at least 1 build");
assert(searchCrafter.some((b) => b.slug.includes("crafter")), "Crafter build should be returned");

const searchCreator = queryCommunityBuilds(SEED_BUILDS, "ianxofour");
assert(searchCreator.length >= 1, "Search for creator 'ianxofour' should return iron farm");

const searchNone = queryCommunityBuilds(SEED_BUILDS, "xyznonexistentstring12345");
assert(searchNone.length === 0, "Non-existent search should return empty array");

// 4. Category filtering
console.log("4. Testing category filtering...");
const redstoneBuilds = queryCommunityBuilds(SEED_BUILDS, undefined, "Redstone & Automation");
assert(redstoneBuilds.length >= 2, "Redstone category should return multiple builds");
assert(redstoneBuilds.every((b) => b.category === "Redstone & Automation"), "All returned builds must match category");

const farmBuilds = queryCommunityBuilds(SEED_BUILDS, undefined, "Farms & Generators");
assert(farmBuilds.length >= 5, "Farms category should return multiple builds");

// 5. Sorting
console.log("5. Testing sorting...");
const sortedName = queryCommunityBuilds(SEED_BUILDS, undefined, undefined, "name");
for (let i = 0; i < sortedName.length - 1; i++) {
  assert(sortedName[i].title.localeCompare(sortedName[i + 1].title) <= 0, "Alphabetical sort order violated");
}

const sortedBlocks = queryCommunityBuilds(SEED_BUILDS, undefined, undefined, "blocks");
for (let i = 0; i < sortedBlocks.length - 1; i++) {
  assert(sortedBlocks[i].solidBlockCount >= sortedBlocks[i + 1].solidBlockCount, "Block count descending sort violated");
}

// 6. Slug lookup
console.log("6. Testing slug lookup...");
const found = getBuildBySlug("dual-full-block-auto-crafter");
assert(found !== undefined, "Should find dual-full-block-auto-crafter by slug");
assert(found?.title === "Dual Full-Block Auto Crafter", "Title must match");

const notFound = getBuildBySlug("non-existent-slug");
assert(notFound === undefined, "Should return undefined for unknown slug");

// 7. Authentic Thumbnail Model & Provenance Verification
console.log("7. Validating authentic thumbnail models across all listings...");
let authorizedCount = 0;
let fallbackCount = 0;

for (const build of SEED_BUILDS) {
  assert(Boolean(build.thumbnail), `Build ${build.id} must define thumbnail metadata`);
  const thumb = build.thumbnail!;

  assert(thumb.alt.length > 5, `Build ${build.id} thumbnail alt text too short`);
  assert(Boolean(thumb.attribution), `Build ${build.id} thumbnail attribution missing`);
  assert(Boolean(thumb.permissionStatus), `Build ${build.id} thumbnail permissionStatus missing`);
  assert(typeof thumb.isAuthorizedForDisplay === "boolean", `Build ${build.id} isAuthorizedForDisplay must be boolean`);

  if (thumb.isAuthorizedForDisplay) {
    authorizedCount++;
    assert(Boolean(thumb.url), `Authorized build ${build.id} must provide thumbnail url`);
    assert(
      thumb.sourceType === "official_embed" ||
      thumb.sourceType === "creator_upload" ||
      thumb.sourceType === "community_verified",
      `Authorized build ${build.id} has invalid sourceType: ${thumb.sourceType}`
    );
  } else {
    fallbackCount++;
    assert(
      thumb.permissionStatus === "permission_pending" ||
      thumb.permissionStatus === "unavailable" ||
      (thumb.permissionStatus as string) === "none",
      `Unauthorized/pending build ${build.id} must have clear status`
    );
  }
}

console.log(`  Thumbnails: ${authorizedCount} authorized genuine previews, ${fallbackCount} honest 'Screenshot unavailable' fallbacks.`);
assert(authorizedCount >= 5, "Expected at least 5 verified authorized external previews");
assert(fallbackCount >= 8, "Expected at least 8 demo/unverified builds to show honest fallbacks");

// 8. Image Binary Safety & Dimension Validation Unit Tests
console.log("8. Testing server-side image validation (validateImageBuffer)...");
import { validateImageBuffer } from "./src/lib/server/imageValidation";

// Helper to construct PNG buffer
function createMockPng(w: number, h: number): Uint8Array {
  const buf = new Uint8Array(33);
  // PNG signature
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  // IHDR length 13
  buf[11] = 13;
  // IHDR type
  buf.set([0x49, 0x48, 0x44, 0x52], 12);
  // Width
  const view = new DataView(buf.buffer);
  view.setUint32(16, w, false);
  view.setUint32(20, h, false);
  return buf;
}

// 8a. Valid PNG (1920x1080)
const validPng = createMockPng(1920, 1080);
const resPng = validateImageBuffer(validPng);
assert(resPng.valid === true, `Valid PNG should pass validation: ${resPng.error}`);
assert(resPng.format === "png", "Format should be png");
assert(resPng.width === 1920 && resPng.height === 1080, "Dimensions should match 1920x1080");

// 8b. Undersized PNG (200x100 < 320x180 min)
const smallPng = createMockPng(200, 100);
const resSmall = validateImageBuffer(smallPng);
assert(resSmall.valid === false, "Small PNG must fail");
assert(Boolean(resSmall.error?.includes("too small")), `Should indicate image too small, got: ${resSmall.error}`);

// 8c. Reject SVG
const svgBytes = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><rect width='400' height='300'/></svg>");
const resSvg = validateImageBuffer(svgBytes);
assert(resSvg.valid === false, "SVG must be rejected");
assert(Boolean(resSvg.error?.includes("Vector/SVG and HTML images are not permitted")), "Must reject SVG for security");

// 8d. Reject HTML
const htmlBytes = new TextEncoder().encode("<!doctype html><html><body><h1>Fake</h1></body></html>");
const resHtml = validateImageBuffer(htmlBytes);
assert(resHtml.valid === false, "HTML must be rejected");

// 8e. Reject oversized image
const oversized = new Uint8Array(5 * 1024 * 1024 + 10);
const resOversized = validateImageBuffer(oversized);
assert(resOversized.valid === false, "Oversized image must be rejected");
assert(Boolean(resOversized.error?.includes("exceeds maximum permitted size")), "Must state 5MB size limit");

// 8f. Reject empty or random binary garbage
const garbage = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
const resGarbage = validateImageBuffer(garbage);
assert(resGarbage.valid === false, "Garbage buffer must be rejected");
assert(Boolean(resGarbage.error?.includes("Unsupported image format")), "Must report unsupported image format");

console.log("  Image validation logic correctly protects against unsafe vectors, HTML, size abuse, and malformed files.");

console.log("=== ALL COMMUNITY & EXPLORE TESTS PASSED SUCCESSFULLY! ===");
