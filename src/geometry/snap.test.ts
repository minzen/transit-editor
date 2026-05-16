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
})
