import type { Facility, Product } from '@/types/domain'

/** A quantity at or below the product's threshold counts as low stock. */
export function isLowStock(quantity: number, threshold: number): boolean {
  return quantity <= threshold
}

/**
 * Apply a completed delivery to a destination facility's inventory: the
 * delivered product quantity is added to what the terminal already holds.
 * Returns a new inventory record (does not mutate the input).
 */
export function applyDelivery(
  inventory: Record<string, number>,
  productId: string,
  quantity: number,
): Record<string, number> {
  return { ...inventory, [productId]: (inventory[productId] ?? 0) + quantity }
}

export type StockLevel = 'low' | 'ok' | 'unknown'

/** Classify a facility's stock level for a product, for color coding. */
export function stockLevel(
  facility: Facility,
  product: Product,
): { quantity: number; level: StockLevel } {
  const quantity = facility.inventory[product.id]
  if (quantity === undefined) return { quantity: 0, level: 'unknown' }
  return {
    quantity,
    level: isLowStock(quantity, product.lowStockThreshold) ? 'low' : 'ok',
  }
}
