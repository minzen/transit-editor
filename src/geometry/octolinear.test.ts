import { describe, expect, it } from 'vitest'
import {
  createOctolinearPath,
  createSmartOctolinearPath,
  isOctolinear,
  snapPointToOctolinear,
  findLineIntersection,
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

describe('findLineIntersection', () => {
  it('finds intersection of perpendicular lines', () => {
    const intersection = findLineIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: -5 },
      { x: 5, y: 5 }
    )

    expect(intersection).not.toBeNull()
    expect(intersection?.x).toBeCloseTo(5)
    expect(intersection?.y).toBeCloseTo(0)
  })

  it('finds intersection of diagonal lines', () => {
    const intersection = findLineIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 }
    )

    expect(intersection).not.toBeNull()
    expect(intersection?.x).toBeCloseTo(5)
    expect(intersection?.y).toBeCloseTo(5)
  })

  it('returns null for parallel lines', () => {
    const intersection = findLineIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 5 },
      { x: 10, y: 5 }
    )

    expect(intersection).toBeNull()
  })

  it('returns null for nearly parallel lines', () => {
    const intersection = findLineIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 0.00001 },
      { x: 10, y: 0.00001 }
    )

    expect(intersection).toBeNull()
  })

  it('finds intersection at origin', () => {
    const intersection = findLineIntersection(
      { x: -10, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: -10 },
      { x: 0, y: 10 }
    )

    expect(intersection).not.toBeNull()
    expect(intersection?.x).toBeCloseTo(0)
    expect(intersection?.y).toBeCloseTo(0)
  })
})

describe('createSmartOctolinearPath', () => {
  it('returns a direct path for octolinear endpoints', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 100, y: 100 }
    expect(createSmartOctolinearPath(from, to)).toEqual([from, to])
  })

  it('with no obstacles returns same as createOctolinearPath', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 120, y: 80 }
    expect(createSmartOctolinearPath(from, to)).toEqual(
      createOctolinearPath(from, to)
    )
  })

  it('picks V-shape when horizontal leg would hit an obstacle', () => {
    // from (0,0) to (100,80) is NOT octolinear.
    // Default HV path goes (0,0)->(100,0)->(100,80).
    // Place an obstacle at (50, 0) right on the horizontal leg.
    const obstacles = [{ x: 50, y: 0 }]
    const path = createSmartOctolinearPath({ x: 0, y: 0 }, { x: 100, y: 80 }, obstacles)
    // The V-shape goes (0,0)->(0,80)->(100,80) — avoid the obstacle.
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 80 },
      { x: 100, y: 80 },
    ])
  })

  it('picks HV when vertical leg would hit an obstacle', () => {
    // from (0,0) to (100,80). Default V-shape goes (0,0)->(0,80)->(100,80).
    // Place obstacle at (0, 40) on the vertical leg.
    const obstacles = [{ x: 0, y: 40 }]
    const path = createSmartOctolinearPath({ x: 0, y: 0 }, { x: 100, y: 80 }, obstacles)
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 80 },
    ])
  })

  it('prefers shorter path when both orientations have equal collisions', () => {
    // from (0,0) to (100,80). Place obstacle far away so both have 0 collisions.
    // HV length = 100 + 80 = 180; VH length = 80 + 100 = 180 (same).
    // HV wins by tie-break.
    const obstacles = [{ x: 500, y: 500 }]
    const path = createSmartOctolinearPath({ x: 0, y: 0 }, { x: 100, y: 80 }, obstacles)
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 80 },
    ])
  })
})
