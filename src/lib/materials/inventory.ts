export type InventoryStatus = 'MISSING' | 'PARTIAL' | 'ENOUGH';

export interface InventoryCalculation {
  required: number;
  owned: number;
  missing: number;
  status: InventoryStatus;
}

/**
 * Normalizes an item or material identifier into a canonical inventory key.
 * Strips namespaces ('minecraft:') and operation prefixes ('craft_') so that
 * recipe operations and raw materials share the exact same underlying inventory identity.
 */
export function canonicalizeInventoryKey(rawIdOrName: string): string {
  if (!rawIdOrName) return '';
  let key = rawIdOrName.trim().toLowerCase();
  let prev = '';
  while (prev !== key) {
    prev = key;
    key = key
      .replace(/^minecraft:/, '')
      .replace(/^craft_/, '')
      .replace(/^craft\s+/, '');
  }
  return key.replace(/\s+/g, '_');
}

/**
 * Pure TypeScript function for calculating missing quantity and fulfillment status.
 *
 * Rules:
 * - required = actual required quantity (>= 0)
 * - owned = current inventory quantity (>= 0, default 0)
 * - missing = max(0, required - owned)
 *
 * Status rules:
 * - ENOUGH: owned >= required
 * - PARTIAL: owned > 0 AND owned < required
 * - MISSING: owned <= 0 AND required > 0
 *
 * Special cases:
 * - If required <= 0: status is ENOUGH with missing = 0.
 */
export function calculateInventoryStatus(
  requiredInput: number,
  ownedInput: number = 0
): InventoryCalculation {
  const required = Math.max(0, isNaN(requiredInput) ? 0 : requiredInput);
  const owned = Math.max(0, isNaN(ownedInput) ? 0 : ownedInput);
  const missing = Math.max(0, required - owned);

  let status: InventoryStatus;
  if (required === 0) {
    status = 'ENOUGH';
  } else if (owned >= required) {
    status = 'ENOUGH';
  } else if (owned > 0) {
    status = 'PARTIAL';
  } else {
    status = 'MISSING';
  }

  return {
    required,
    owned,
    missing,
    status,
  };
}
