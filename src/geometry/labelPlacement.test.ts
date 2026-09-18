import { describe, expect, it } from 'vitest'
import { chooseBestLabelPositions, labelBox, placeLabelsAfterMovement } from './labelPlacement'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'

describe('labelBox', () => {
    it('places top label above the station', () => {
        const s: Station = { id: 'a', x: 100, y: 100, name: 'Foo' }
        const box = labelBox(s, 'top')
        expect(box.y + box.height).toBeLessThan(100)
        expect(box.x).toBeLessThan(100)
        expect(box.x + box.width).toBeGreaterThan(100)
    })

    it('places right label to the right of the station', () => {
        const s: Station = { id: 'a', x: 100, y: 100, name: 'Foo' }
        const box = labelBox(s, 'right')
        expect(box.x).toBeGreaterThan(100)
    })

    it('returns AABB with swapped dimensions for 90° rotated top label', () => {
        const s: Station = { id: 'a', x: 100, y: 100, name: 'Foo', labelRotation: 90 }
        const rotated = labelBox(s, 'top')
        const unrotated = labelBox({ ...s, labelRotation: 0 }, 'top')
        // At 90°, width ≈ original height and height ≈ original width
        expect(rotated.width).toBeCloseTo(unrotated.height, 0)
        expect(rotated.height).toBeCloseTo(unrotated.width, 0)
    })

    it('returns larger AABB for 45° rotated left label', () => {
        const s: Station = { id: 'a', x: 100, y: 100, name: 'Foo', labelRotation: 45 }
        const rotated = labelBox(s, 'left')
        const unrotated = labelBox({ ...s, labelRotation: 0 }, 'left')
        expect(rotated.width).toBeGreaterThan(unrotated.width)
        expect(rotated.height).toBeGreaterThan(unrotated.height)
    })
})

describe('chooseBestLabelPositions', () => {
    it('returns top by default for an isolated station', () => {
        const stations: Record<string, Station> = {
            a: { id: 'a', x: 0, y: 0, name: 'Solo' },
        }
        const placed = chooseBestLabelPositions(stations, {})
        expect(placed.a).toBe('top')
    })

    it('skips stations without a name', () => {
        const stations: Record<string, Station> = {
            a: { id: 'a', x: 0, y: 0 },
            b: { id: 'b', x: 100, y: 0, name: '' },
        }
        const placed = chooseBestLabelPositions(stations, {})
        expect(placed.a).toBeUndefined()
        expect(placed.b).toBeUndefined()
    })

    it('chooses opposing positions when two stations are stacked vertically', () => {
        // Two stations very close vertically: their default top labels collide,
        // so the lower station should be pushed away from top.
        const stations: Record<string, Station> = {
            a: { id: 'a', x: 0, y: 0, name: 'Alpha' },
            b: { id: 'b', x: 0, y: 20, name: 'Beta' },
        }
        const placed = chooseBestLabelPositions(stations, {})
        // 'a' is processed first and gets top. 'b' should not also get top.
        expect(placed.a).toBe('top')
        expect(placed.b).not.toBe('top')
    })

    it('avoids placing a label on top of a horizontal segment passing nearby', () => {
        const stations: Record<string, Station> = {
            a: { id: 'a', x: 0, y: 0, name: 'Alpha' },
        }
        // Segment running horizontally just above the station, where the top
        // label would land.
        const segments: Record<string, Segment> = {
            s: {
                id: 's',
                fromStationId: 'x',
                toStationId: 'y',
                lineIds: [],
                points: [
                    { x: -50, y: -20 },
                    { x: 50, y: -20 },
                ],
            },
        }
        const placed = chooseBestLabelPositions(stations, segments)
        expect(placed.a).not.toBe('top')
    })

    it('is deterministic for a given input', () => {
        const stations: Record<string, Station> = {
            b: { id: 'b', x: 50, y: 0, name: 'Beta' },
            a: { id: 'a', x: 0, y: 0, name: 'Alpha' },
            c: { id: 'c', x: 100, y: 0, name: 'Gamma' },
        }
        const first = chooseBestLabelPositions(stations, {})
        const second = chooseBestLabelPositions(stations, {})
        expect(first).toEqual(second)
    })
})


describe('eight-position and incremental placement', () => {
    it.each(['topRight', 'bottomRight', 'bottomLeft', 'topLeft'] as const)('places %s in its quadrant', (position) => {
        const box = labelBox({ id: 's', x: 100, y: 100, name: 'Test' }, position)
        if (position.endsWith('Right')) expect(box.x).toBeGreaterThan(100)
        else expect(box.x + box.width).toBeLessThan(100)
        if (position.startsWith('top')) expect(box.y + box.height).toBeLessThan(100)
        else expect(box.y).toBeGreaterThan(100)
    })

    it('chooses a diagonal when unnamed station bodies block the cardinal positions', () => {
        const stations: Record<string, Station> = {
            a: { id: 'a', x: 0, y: 0, name: 'A' },
            n: { id: 'n', x: 0, y: -23 }, s: { id: 's', x: 0, y: 23 },
            e: { id: 'e', x: 18, y: 0 }, w: { id: 'w', x: -18, y: 0 },
        }
        expect(chooseBestLabelPositions(stations, {}).a).toBe('topRight')
    })

    it('updates old and new neighborhoods while preserving distant stations', () => {
        const before: Record<string, Station> = {
            moving: { id: 'moving', x: 0, y: -23 },
            old: { id: 'old', x: 0, y: 0, name: 'Old', labelPosition: 'right' },
            next: { id: 'next', x: 500, y: 0, name: 'Next' },
            far: { id: 'far', x: 2000, y: 2000, name: 'Far', labelPosition: 'left' },
        }
        const after = { ...before, moving: { ...before.moving, x: 500 } }
        const result = placeLabelsAfterMovement(before, after, {}, {})
        expect(result.old.labelPosition).toBe('top')
        expect(result.next.labelPosition).not.toBe('top')
        expect(result.far).toBe(before.far)
    })

    it('includes labels near changed edges even far from moved endpoints', () => {
        const before: Record<string, Station> = {
            moving: { id: 'moving', x: 0, y: 0 },
            other: { id: 'other', x: 1000, y: 0 },
            middle: { id: 'middle', x: 500, y: 20, name: 'Middle', labelPosition: 'right' },
        }
        const oldSegment: Segment = { id: 's', fromStationId: 'moving', toStationId: 'other', lineIds: [], points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] }
        const newSegment = { ...oldSegment, points: [{ x: 0, y: 1000 }, { x: 1000, y: 0 }] }
        const result = placeLabelsAfterMovement(before, { ...before, moving: { ...before.moving, y: 1000 } }, { s: oldSegment }, { s: newSegment })
        expect(result.middle.labelPosition).toBe('top')
    })
})
