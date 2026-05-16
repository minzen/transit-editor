import { describe, expect, it } from 'vitest'
import {
  createOctolinearPath,
  isOctolinear,
  snapPointToOctolinear,
} from './octolinear'

describe('octolinear geometry', () => {
  it('snaps a target point to the nearest 45 degree direction', () => {
    const snapped = snapPointToOctolinear(
      { x: 0, y: 0 },
      { x: 100, y: 30 }
    )

    expect(snapped.x).toBeCloseTo(Math.hypot(100, 30))
    expect(snapped.y).toBeCloseTo(0)
  })

  it('detects horizontal, vertical, and diagonal directions as octolinear', () => {
    expect(isOctolinear({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe(true)
    expect(isOctolinear({ x: 0, y: 0 }, { x: 0, y: 100 })).toBe(true)
    expect(isOctolinear({ x: 0, y: 0 }, { x: 100, y: 100 })).toBe(true)
  })

  it('creates a direct path for octolinear station pairs', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 100, y: 100 }

    expect(createOctolinearPath(from, to)).toEqual([from, to])
  })

  it('creates an L-shaped path for non-octolinear station pairs', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 120, y: 80 }

    expect(createOctolinearPath(from, to)).toEqual([
      from,
      { x: 120, y: 0 },
      to,
    ])
  })
})
