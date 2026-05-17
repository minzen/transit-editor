import { describe, expect, it } from 'vitest'
import {
  createOctolinearPath,
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
