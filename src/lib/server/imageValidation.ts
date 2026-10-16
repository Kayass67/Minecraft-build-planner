/**
 * Server-side Image Verification & Safety Validation for MineBuild
 * Verifies magic bytes, rejects dangerous formats (SVG/executables),
 * extracts dimensions from binary headers without heavy third-party libraries.
 */

export interface ImageValidationResult {
  valid: boolean;
  format?: "png" | "jpeg" | "webp";
  width?: number;
  height?: number;
  sizeBytes?: number;
  error?: string;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_WIDTH = 320;
const MIN_HEIGHT = 180;
const MAX_DIMENSION = 4096;

/**
 * Validates an image buffer strictly via binary signatures and header parsing.
 */
export function validateImageBuffer(buffer: ArrayBuffer | Uint8Array): ImageValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const sizeBytes = bytes.length;

  if (sizeBytes === 0) {
    return { valid: false, error: "Image file is empty." };
  }

  if (sizeBytes > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Image exceeds maximum permitted size of 5MB (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  // Reject SVG and HTML by checking for text signatures
  const first128 = new TextDecoder("ascii", { fatal: false }).decode(bytes.slice(0, 128)).toLowerCase();
  if (
    first128.includes("<svg") ||
    first128.includes("<?xml") ||
    first128.includes("<!doctype html") ||
    first128.includes("<html") ||
    first128.includes("<script")
  ) {
    return {
      valid: false,
      error: "Vector/SVG and HTML images are not permitted for security reasons. Please upload a PNG, JPEG, or WebP screenshot.",
    };
  }

  // 1. Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    // Verify IHDR chunk at byte 12
    const isIhdr =
      bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52;
    if (!isIhdr) {
      return { valid: false, error: "Malformed PNG header: missing IHDR chunk." };
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16, false); // big-endian
    const height = view.getUint32(20, false);

    return checkDimensions("png", width, height, sizeBytes);
  }

  // 2. Check JPEG signature: FF D8 FF
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    const dims = parseJpegDimensions(bytes);
    if (!dims) {
      return { valid: false, error: "Malformed JPEG image: SOF marker not found." };
    }
    return checkDimensions("jpeg", dims.width, dims.height, sizeBytes);
  }

  // 3. Check WebP signature: RIFF....WEBP
  if (
    bytes.length >= 30 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    const dims = parseWebpDimensions(bytes);
    if (!dims) {
      return { valid: false, error: "Malformed WebP image header." };
    }
    return checkDimensions("webp", dims.width, dims.height, sizeBytes);
  }

  return {
    valid: false,
    error: "Unsupported image format. Only authentic Minecraft screenshots in PNG, JPEG, or WebP format are accepted.",
  };
}

function checkDimensions(
  format: "png" | "jpeg" | "webp",
  width: number,
  height: number,
  sizeBytes: number
): ImageValidationResult {
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return {
      valid: false,
      format,
      width,
      height,
      sizeBytes,
      error: `Image resolution too small (${width}×${height}px). Genuine build screenshots must be at least ${MIN_WIDTH}×${MIN_HEIGHT}px.`,
    };
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      valid: false,
      format,
      width,
      height,
      sizeBytes,
      error: `Image resolution too large (${width}×${height}px). Maximum allowed dimension is ${MAX_DIMENSION}px.`,
    };
  }

  return {
    valid: true,
    format,
    width,
    height,
    sizeBytes,
  };
}

/**
 * Parses JPEG markers to extract width and height from the SOF marker.
 */
function parseJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2; // skip SOI (0xFFD8)
  const len = bytes.length;

  while (offset < len) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    // Standalone markers with no length payload
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2;
      continue;
    }

    if (offset + 4 > len) break;
    const markerLen = (bytes[offset + 2] << 8) | bytes[offset + 3];

    // SOF markers: 0xC0 (baseline), 0xC1 (extended sequential), 0xC2 (progressive)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      if (offset + 9 > len) return null;
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }

    offset += 2 + markerLen;
  }

  return null;
}

/**
 * Parses WebP VP8, VP8L, or VP8X chunks to extract dimensions.
 */
function parseWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // VP8X (Extended WebP)
  if (
    bytes[12] === 0x56 &&
    bytes[13] === 0x50 &&
    bytes[14] === 0x38 &&
    bytes[15] === 0x58 &&
    bytes.length >= 30
  ) {
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return { width, height };
  }

  // VP8 (Lossy WebP)
  if (
    bytes[12] === 0x56 &&
    bytes[13] === 0x50 &&
    bytes[14] === 0x38 &&
    bytes[15] === 0x20 &&
    bytes.length >= 30
  ) {
    // Keyframe start code: 9D 01 2A at byte 23..25
    if (bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      const width = ((bytes[27] & 0x3f) << 8) | bytes[26];
      const height = ((bytes[29] & 0x3f) << 8) | bytes[28];
      return { width, height };
    }
  }

  // VP8L (Lossless WebP)
  if (
    bytes[12] === 0x56 &&
    bytes[13] === 0x50 &&
    bytes[14] === 0x38 &&
    bytes[15] === 0x4c &&
    bytes.length >= 26
  ) {
    if (bytes[20] === 0x2f) {
      const b1 = bytes[21];
      const b2 = bytes[22];
      const b3 = bytes[23];
      const b4 = bytes[24];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      return { width, height };
    }
  }

  return null;
}
