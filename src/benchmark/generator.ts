import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'

/**
 * Generates a synthetic transit map for benchmarking.
 * Creates `stationCount` stations arranged in `lineCount` parallel lines.
 * Each line has ~stationCount/lineCount stations.
 */
export function generateSyntheticMap(
    stationCount: number,
    lineCount: number
): {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
} {
    const stationsPerLine = Math.floor(stationCount / lineCount)
    const stations: Record<string, Station> = {}
    const segments: Record<string, Segment> = {}
    const lines: Record<string, Line> = {}

    const colors = [
        '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7',
        '#f97316', '#ec4899', '#06b6d4', '#84cc16', '#6366f1',
    ]

    let stationId = 0
    let segmentId = 0

    for (let li = 0; li < lineCount; li++) {
        const lineId = `line-${li}`
        const color = colors[li % colors.length]
        lines[lineId] = {
            id: lineId,
            name: `Line ${li + 1}`,
            color,
            code: String.fromCharCode(65 + (li % 26)),
        }

        const baseY = li * 150
        const prevStationIds: string[] = []

        for (let si = 0; si < stationsPerLine; si++) {
            const id = `st-${stationId++}`
            stations[id] = {
                id,
                x: si * 150,
                y: baseY + (si % 2 === 0 ? 0 : 20),
                name: `Station ${stationId}`,
            }
            prevStationIds.push(id)

            if (si > 0) {
                const fromId = prevStationIds[si - 1]
                const segId = `seg-${segmentId++}`
                segments[segId] = {
                    id: segId,
                    fromStationId: fromId,
                    toStationId: id,
                    lineIds: [lineId],
                    points: [
                        { x: stations[fromId].x, y: stations[fromId].y },
                        { x: stations[id].x, y: stations[id].y },
                    ],
                }
            }
        }
    }

    // Add remaining stations if stationCount isn't evenly divisible
    while (stationId < stationCount) {
        const id = `st-${stationId++}`
        stations[id] = {
            id,
            x: (stationId % 20) * 150,
            y: (Math.floor(stationId / 20) % lineCount) * 150 + 75,
            name: `Station ${stationId}`,
        }
    }

    return { stations, segments, lines }
}
