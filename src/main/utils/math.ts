/**
 * Iranian Toman rounding utility.
 * Rounds a raw total to the nearest multiple of `roundTo`.
 *
 * - roundTo = 0: no rounding (return raw)
 * - roundTo = 500: rounds up to nearest 500 Tomans
 * - roundTo = 1000: rounds up to nearest 1000 Tomans
 *
 * Uses Math.ceil to always round UP (favorable to the store),
  * which is standard for Iranian sales rounding.
 */
export function roundToNearest(rawTotal: number, roundTo: number): number {
  if (roundTo <= 0 || isNaN(rawTotal)) return Math.max(0, rawTotal)
  return Math.ceil(rawTotal / roundTo) * roundTo
}

/**
 * Calculate net profit for a single line item.
 * netProfit = (salePrice - purchasePrice) * quantity
 */
export function calculateLineProfit(
  salePrice: number,
  purchasePrice: number,
  quantity: number
): number {
  return (salePrice - purchasePrice) * quantity
}

/**
 * Calculate subtotal for a single line item.
 */
export function calculateLineSubtotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity
}
