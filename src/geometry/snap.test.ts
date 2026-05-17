import { describe, expect, it } from 'vitest'
import { snapPointToGrid, snapToGrid } from './snap'

describe('snap to grid', () => {
  it('snaps a single value to the nearest grid multiple', () => {
    expect(snapToGrid(45, 40)).toBe(40)
    expect(snapToGrid(65, 40)).toBe(80)
    expect(snapToGrid(80, 40)).toBe(80)
    expect(snapToGrid(0, 40)).toBe(0)
  })

  it('snaps a point to the nearest grid intersection', () => {
    expect(snapPointToGrid(45, 65, 40)).toEqual({ x: 40, y: 80 })
    expect(snapPointToGrid(80, 120, 40)).toEqual({ x: 80, y: 120 })
    expect(snapPointToGrid(0, 0, 40)).toEqual({ x: 0, y: 0 })
  })

  it('handles negative coordinates', () => {
    expect(snapPointToGrid(-45, -65, 40)).toEqual({ x: -40, y: -80 })
  })

  it('snaps correctly with different grid sizes', () => {
    expect(snapPointToGrid(25, 35, 10)).toEqual({ x: 30, y: 40 })
    expect(snapPointToGrid(47, 53, 10)).toEqual({ x: 50, y: 50 })
    expect(snapPointToGrid(15, 25, 5)).toEqual({ x: 15, y: 25 })
  })

  it('snaps to exact grid intersections', () => {
    const gridSize = 20
    expect(snapPointToGrid(40, 60, gridSize)).toEqual({ x: 40, y: 60 })
    expect(snapPointToGrid(100, 200, gridSize)).toEqual({ x: 100, y: 200 })
  })
})
