import { describe, expect, it } from 'vitest'
import { isPointInsideStation } from './stationUtils'

describe('isPointInsideStation', () => {
    it('returns false when no stations exist', () => {
        const result = isPointInsideStation(0, 0, {})
        expect(result).toBe(false)
    })

    it('returns false when point is far from all stations', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
            '2': { id: '2', x: 100, y: 100 },
        }
        const result = isPointInsideStation(50, 50, stations)
        expect(result).toBe(false)
    })

    it('returns true when point is inside a station', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
        }
        const result = isPointInsideStation(0, 0, stations)
        expect(result).toBe(true)
    })

    it('returns true when point is near a station (within 2 * STATION_RADIUS)', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
        }
        const result = isPointInsideStation(10, 10, stations) // Distance ~14.14, which is < 16 (2 * 8)
        expect(result).toBe(true)
    })

    it('returns false when point is just outside station radius', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
        }
        const result = isPointInsideStation(20, 20, stations) // Distance ~28.28, which is > 16
        expect(result).toBe(false)
    })

    it('excludes specified station from check', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
            '2': { id: '2', x: 100, y: 100 },
        }
        const result = isPointInsideStation(0, 0, stations, '1')
        expect(result).toBe(false)
    })

    it('checks other stations when one is excluded', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
            '2': { id: '2', x: 10, y: 10 },
        }
        const result = isPointInsideStation(10, 10, stations, '1')
        expect(result).toBe(true)
    })

    it('handles multiple stations correctly', () => {
        const stations = {
            '1': { id: '1', x: 0, y: 0 },
            '2': { id: '2', x: 50, y: 50 },
            '3': { id: '3', x: 100, y: 100 },
        }
        expect(isPointInsideStation(0, 0, stations)).toBe(true)
        expect(isPointInsideStation(50, 50, stations)).toBe(true)
        expect(isPointInsideStation(100, 100, stations)).toBe(true)
        expect(isPointInsideStation(25, 25, stations)).toBe(false)
    })
})
