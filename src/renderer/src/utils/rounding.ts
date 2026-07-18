/**
 * Price rounding utilities — rounds prices to specific intervals.
 *
 * Used by:
 * - Bulk price update (Feature 2)
 * - Auto price calculation with profit % (Feature 1)
 *
 * Rounding modes:
 *   - ceil: round up to nearest interval
 *   - floor: round down to nearest interval
 *   - nearest: standard rounding to nearest interval
 *   - none: keep exact value
 */

export type RoundingMode = 'ceil' | 'floor' | 'nearest' | 'none'

const ROUNDING_INTERVALS = [100, 500, 1000, 5000, 10000]

/**
 * Round a price to the nearest interval using the specified mode.
 */
export function roundPrice(price: number, interval: number, mode: RoundingMode = 'nearest'): number {
  if (mode === 'none' || interval <= 0) return Math.round(price)
  switch (mode) {
    case 'ceil': return Math.ceil(price / interval) * interval
    case 'floor': return Math.floor(price / interval) * interval
    case 'nearest': return Math.round(price / interval) * interval
    default: return Math.round(price)
  }
}

/**
 * Calculate selling price from purchase price and profit percentage.
 */
export function calculateSellingPrice(purchasePrice: number, profitPercent: number): number {
  return purchasePrice + (purchasePrice * profitPercent / 100)
}

export { ROUNDING_INTERVALS }
