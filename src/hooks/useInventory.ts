import { useState, useCallback } from 'react';
import {
  calculateInventoryStatus,
  canonicalizeInventoryKey,
  InventoryCalculation,
  InventoryStatus,
} from '@/lib/materials/inventory';

export function useInventory(
  initialInventory: Record<string, number> = {},
  onInventoryChange?: (newInventory: Record<string, number>) => void
) {
  const [inventory, setInventory] = useState<Record<string, number>>(initialInventory);
  const [prevInitial, setPrevInitial] = useState(initialInventory);

  // Synchronize state if initialInventory prop changes without unmounting (standard React pattern)
  if (prevInitial !== initialInventory) {
    setPrevInitial(initialInventory);
    setInventory(initialInventory);
  }

  const setItemQuantity = useCallback((itemName: string, quantity: number) => {
    const key = canonicalizeInventoryKey(itemName);
    const validQty = Math.max(0, isNaN(quantity) ? 0 : quantity);
    setInventory((prev) => {
      const next = {
        ...prev,
        [key]: validQty,
      };
      onInventoryChange?.(next);
      return next;
    });
  }, [onInventoryChange]);

  const incrementItem = useCallback((itemName: string, amount: number = 1) => {
    const key = canonicalizeInventoryKey(itemName);
    const delta = isNaN(amount) ? 1 : amount;
    setInventory((prev) => {
      const next = {
        ...prev,
        [key]: Math.max(0, (prev[key] || 0) + delta),
      };
      onInventoryChange?.(next);
      return next;
    });
  }, [onInventoryChange]);

  const decrementItem = useCallback((itemName: string, amount: number = 1) => {
    const key = canonicalizeInventoryKey(itemName);
    const delta = isNaN(amount) ? 1 : amount;
    setInventory((prev) => {
      const next = {
        ...prev,
        [key]: Math.max(0, (prev[key] || 0) - delta),
      };
      onInventoryChange?.(next);
      return next;
    });
  }, [onInventoryChange]);

  const resetItem = useCallback((itemName: string) => {
    const key = canonicalizeInventoryKey(itemName);
    setInventory((prev) => {
      const next = { ...prev };
      delete next[key];
      onInventoryChange?.(next);
      return next;
    });
  }, [onInventoryChange]);

  const resetAll = useCallback(() => {
    setInventory({});
    onInventoryChange?.({});
  }, [onInventoryChange]);

  const getItemQuantity = useCallback(
    (itemName: string): number => {
      const key = canonicalizeInventoryKey(itemName);
      return inventory[key] || 0;
    },
    [inventory]
  );

  const getItemCalculation = useCallback(
    (itemName: string, requiredQuantity: number): InventoryCalculation => {
      const key = canonicalizeInventoryKey(itemName);
      const owned = inventory[key] || 0;
      return calculateInventoryStatus(requiredQuantity, owned);
    },
    [inventory]
  );

  const getMissingQuantity = useCallback(
    (itemName: string, requiredQuantity: number): number => {
      return getItemCalculation(itemName, requiredQuantity).missing;
    },
    [getItemCalculation]
  );

  const getStatus = useCallback(
    (itemName: string, requiredQuantity: number): InventoryStatus => {
      return getItemCalculation(itemName, requiredQuantity).status;
    },
    [getItemCalculation]
  );

  return {
    inventory,
    setItemQuantity,
    incrementItem,
    decrementItem,
    resetItem,
    resetAll,
    getItemQuantity,
    getItemCalculation,
    getMissingQuantity,
    getStatus,
  };
}
