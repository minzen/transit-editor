import { describe, expect, it } from 'vitest'
import { screenToWorld, worldToScreen } from './coordinates'

describe('viewport coordinate transformations', () => {
  it('converts screen coordinates to world coordinates', () => {
    const viewport = { zoom: 2, offsetX: 100, offsetY: 50 }

    const world = screenToWorld(200, 150, viewport)

    expect(world.x).toBe(50)
    expect(world.y).toBe(50)
  })

  it('converts world coordinates to screen coordinates', () => {
    const viewport = { zoom: 2, offsetX: 100, offsetY: 50 }

    const screen = worldToScreen(50, 50, viewport)

    expect(screen.x).toBe(200)
    expect(screen.y).toBe(150)
  })

  it('handles zoom level of 1 with no offset', () => {
    const viewport = { zoom: 1, offsetX: 0, offsetY: 0 }

    expect(screenToWorld(100, 200, viewport)).toEqual({ x: 100, y: 200 })
    expect(worldToScreen(100, 200, viewport)).toEqual({ x: 100, y: 200 })
  })

  it('is reversible: screen -> world -> screen', () => {
    const viewport = { zoom: 1.5, offsetX: 200, offsetY: 100 }
    const screen = { x: 300, y: 400 }

    const world = screenToWorld(screen.x, screen.y, viewport)
    const backToScreen = worldToScreen(world.x, world.y, viewport)

    expect(backToScreen.x).toBeCloseTo(screen.x, 10)
    expect(backToScreen.y).toBeCloseTo(screen.y, 10)
  })
})
