/**
 * Price rounding utility tests + Bug fix verification.
 */
import { describe, it, expect } from 'vitest'
import { roundPrice, calculateSellingPrice } from '../src/renderer/src/utils/rounding'

describe('roundPrice', () => {
  it('rounds to nearest 1000', () => {
    expect(roundPrice(12345, 1000, 'nearest')).toBe(12000)
    expect(roundPrice(12600, 1000, 'nearest')).toBe(13000)
  })

  it('ceil rounds up', () => {
    expect(roundPrice(12001, 1000, 'ceil')).toBe(13000)
    expect(roundPrice(12000, 1000, 'ceil')).toBe(12000)
  })

  it('floor rounds down', () => {
    expect(roundPrice(12999, 1000, 'floor')).toBe(12000)
    expect(roundPrice(12000, 1000, 'floor')).toBe(12000)
  })

  it('none keeps exact value', () => {
    expect(roundPrice(12345, 1000, 'none')).toBe(12345)
  })

  it('rounds to 500 intervals', () => {
    expect(roundPrice(12200, 500, 'nearest')).toBe(12000)
    expect(roundPrice(12400, 500, 'nearest')).toBe(12500)
  })

  it('handles negative prices', () => {
    expect(roundPrice(-12345, 1000, 'nearest')).toBe(-12000)
  })
})

describe('calculateSellingPrice', () => {
  it('calculates 10% profit on 1000', () => {
    expect(calculateSellingPrice(1000, 10)).toBe(1100)
  })

  it('calculates 50% profit on 200', () => {
    expect(calculateSellingPrice(200, 50)).toBe(300)
  })

  it('zero profit returns purchase price', () => {
    expect(calculateSellingPrice(500, 0)).toBe(500)
  })

  it('handles zero purchase price', () => {
    expect(calculateSellingPrice(0, 10)).toBe(0)
  })
})
