import type { Station } from '../model/station'

const STATION_RADIUS = 8

/**
 * Check if a point is inside any existing station
 * @param x - X coordinate of the point to check
 * @param y - Y coordinate of the point to check
 * @param stations - Record of all stations
 * @param excludeStationId - Optional station ID to exclude from the check (useful when moving a station)
 * @returns true if the point is inside any station, false otherwise
 */
export function isPointInsideStation(
    x: number,
    y: number,
    stations: Record<string, Station>,
    excludeStationId?: string
): boolean {
    for (const station of Object.values(stations)) {
        if (excludeStationId && station.id === excludeStationId) {
            continue
        }
        const dx = x - station.x
        const dy = y - station.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < STATION_RADIUS * 2) {
            return true
        }
    }
    return false
}

export { STATION_RADIUS }
