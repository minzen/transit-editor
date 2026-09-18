import { LABEL_POSITIONS, type Station, type LabelPosition } from '../model/station'
import type { Segment } from '../model/segment'
import type { Point } from '../types/geometry'
import { pointToLineSegmentDistance } from './distance'

/**
 * Approximate width of a label in world units per character at the default font.
 * Used as a coarse heuristic for collision testing.
 */
const APPROX_CHAR_WIDTH = 8
const APPROX_LABEL_HEIGHT = 18
const LABEL_OFFSET = 14

/** Shared SVG anchors keep rendered labels and collision estimates aligned. */
export function labelAttributes(station: Station, position: LabelPosition, offset = LABEL_OFFSET) {
    const left = position === 'left' || position.endsWith('Left')
    const right = position === 'right' || position.endsWith('Right')
    const top = position.startsWith('top')
    const bottom = position.startsWith('bottom')
    return {
        x: station.x + (left ? -offset : right ? offset : 0),
        y: station.y + (top ? -offset : bottom ? offset : 0),
        textAnchor: left ? 'end' as const : right ? 'start' as const : 'middle' as const,
        dominantBaseline: top ? 'auto' as const : bottom ? 'hanging' as const : 'central' as const,
    }
}

type Rect = { x: number; y: number; width: number; height: number }

function rotatedRectAABB(
    cx: number,
    cy: number,
    w: number,
    h: number,
    angleDeg: number
): Rect {
    const rad = (angleDeg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const hw = w / 2
    const hh = h / 2

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const corners = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
    ]

    for (const c of corners) {
        const x = cx + c.x * cos - c.y * sin
        const y = cy + c.x * sin + c.y * cos
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Returns an axis-aligned bounding rect for a station's label given a candidate
 * position. World coordinates; box is approximate but sufficient for collision
 * scoring. Accounts for label rotation if present.
 */
export function labelBox(station: Station, position: LabelPosition): Rect {
    const text = station.name ?? ''
    const width = Math.max(APPROX_CHAR_WIDTH * text.length, APPROX_CHAR_WIDTH)
    const height = APPROX_LABEL_HEIGHT

    const anchor = labelAttributes(station, position)
    const centerX = anchor.x + (anchor.textAnchor === 'end' ? -width / 2 : anchor.textAnchor === 'start' ? width / 2 : 0)
    const centerY = anchor.y + (anchor.dominantBaseline === 'auto' ? -height / 2 : anchor.dominantBaseline === 'hanging' ? height / 2 : 0)

    const rotation = station.labelRotation ?? 0
    if (rotation === 0) {
        return {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
        }
    }

    // SVG rotates around the text anchor, not the box center.
    const radians = rotation * Math.PI / 180
    const dx = centerX - anchor.x
    const dy = centerY - anchor.y
    return rotatedRectAABB(
        anchor.x + dx * Math.cos(radians) - dy * Math.sin(radians),
        anchor.y + dx * Math.sin(radians) + dy * Math.cos(radians),
        width, height, rotation,
    )
}

function rectsOverlap(a: Rect, b: Rect): boolean {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    )
}

function pointInRect(p: Point, r: Rect): boolean {
    return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

/**
 * Returns true if two finite line segments (a1-a2, b1-b2) intersect.
 */
function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
    const d1 = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)
    const d2 = (b2.x - b1.x) * (a2.y - b1.y) - (b2.y - b1.y) * (a2.x - b1.x)
    const d3 = (a2.x - a1.x) * (b1.y - a1.y) - (a2.y - a1.y) * (b1.x - a1.x)
    const d4 = (a2.x - a1.x) * (b2.y - a1.y) - (a2.y - a1.y) * (b2.x - a1.x)
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

/**
 * Approximate distance from a rectangle to a line segment. Returns 0 if the
 * segment intersects (or has an endpoint inside) the rectangle.
 */
function rectToSegmentDistance(r: Rect, a: Point, b: Point): number {
    if (pointInRect(a, r) || pointInRect(b, r)) return 0

    const corners: Point[] = [
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        { x: r.x, y: r.y + r.height },
    ]

    // Detect segment crossing any of the four rectangle edges
    for (let i = 0; i < 4; i++) {
        const c1 = corners[i]
        const c2 = corners[(i + 1) % 4]
        if (segmentsIntersect(a, b, c1, c2)) return 0
    }

    let minDist = Infinity
    for (const c of corners) {
        const d = pointToLineSegmentDistance(c, a, b)
        if (d < minDist) minDist = d
    }
    return minDist
}

/**
 * Score a candidate label position for `station`. Lower is better.
 * Penalizes overlap with other stations' labels (in their current position),
 * the station body, and segments running near the candidate box.
 */
export function scoreLabelPosition(
    station: Station,
    position: LabelPosition,
    otherStations: Station[],
    segments: Segment[],
    placed: Record<string, LabelPosition>
): number {
    const box = labelBox(station, position)
    let score = 0

    // Stable tie-break keeps cardinal positions preferred when equally clear.
    score += LABEL_POSITIONS.indexOf(position) * 0.1

    // Penalize overlap with other station bodies
    for (const other of otherStations) {
        const otherBox: Rect = {
            x: other.x - 10,
            y: other.y - 10,
            width: 20,
            height: 20,
        }
        if (rectsOverlap(box, otherBox)) score += 50

        // Penalize overlap with neighbouring labels using their *placed* position
        // (or top as default if not yet placed).
        const otherLabelPos = placed[other.id] ?? other.labelPosition ?? 'top'
        if (other.name) {
            const otherLabelBox = labelBox(other, otherLabelPos)
            if (rectsOverlap(box, otherLabelBox)) score += 100
        }
    }

    // Penalize proximity to segment polylines
    for (const segment of segments) {
        for (let i = 0; i < segment.points.length - 1; i++) {
            const d = rectToSegmentDistance(box, segment.points[i], segment.points[i + 1])
            if (d === 0) {
                score += 30
            } else if (d < 4) {
                score += 10
            }
        }
    }

    // Penalize bottom position when station has connected segments,
    // because line-code badges are shifted downward and need extra clearance.
    const hasConnectedSegments = segments.some(
        (seg) => seg.fromStationId === station.id || seg.toStationId === station.id
    )
    if (position === 'bottom' && hasConnectedSegments) {
        score += 15
    }

    return score
}

/**
 * Greedy auto-placer. Iterates stations in a stable order and chooses the
 * lowest-scoring position for each, taking already-placed labels into account.
 *
 * Stations without a name are skipped (no label to place). Returns a map from
 * station id to its chosen label position.
 */
export function chooseBestLabelPositions(
    stations: Record<string, Station>,
    segments: Record<string, Segment>,
    affectedIds?: ReadonlySet<string>,
): Record<string, LabelPosition> {
    const stationList = Object.values(stations)
        .filter((s) => s.name && s.name.trim().length > 0)
        // Stable order: by id for deterministic output
        .sort((a, b) => a.id.localeCompare(b.id))

    const segmentList = Object.values(segments)
    const placed: Record<string, LabelPosition> = {}

    for (const station of stationList) {
        if (affectedIds && !affectedIds.has(station.id)) continue
        const others = Object.values(stations).filter((s) => s.id !== station.id)
        let bestPosition: LabelPosition = 'top'
        let bestScore = Infinity
        for (const pos of LABEL_POSITIONS) {
            const score = scoreLabelPosition(station, pos, others, segmentList, placed)
            if (score < bestScore) {
                bestScore = score
                bestPosition = pos
            }
        }
        placed[station.id] = bestPosition
    }

    return placed
}


function stationEnvelope(station: Station): Rect {
    const boxes = LABEL_POSITIONS.map((position) => labelBox(station, position))
    const x = Math.min(station.x - 10, ...boxes.map((box) => box.x))
    const y = Math.min(station.y - 10, ...boxes.map((box) => box.y))
    return {
        x, y,
        width: Math.max(station.x + 10, ...boxes.map((box) => box.x + box.width)) - x,
        height: Math.max(station.y + 10, ...boxes.map((box) => box.y + box.height)) - y,
    }
}

/** Re-score only labels near old/new station positions or changed route edges. */
export function placeLabelsAfterMovement(
    beforeStations: Record<string, Station>,
    stations: Record<string, Station>,
    beforeSegments: Record<string, Segment>,
    segments: Record<string, Segment>,
): Record<string, Station> {
    const regions: Rect[] = []
    const affected = new Set<string>()
    for (const station of Object.values(stations)) {
        const old = beforeStations[station.id]
        if (old && (old.x !== station.x || old.y !== station.y)) {
            affected.add(station.id)
            regions.push(stationEnvelope(old), stationEnvelope(station))
        }
    }
    if (!affected.size) return stations
    for (const segment of Object.values(segments)) {
        const old = beforeSegments[segment.id]
        if (segment === old) continue
        for (const route of [old, segment]) {
            if (!route) continue
            for (let i = 1; i < route.points.length; i++) {
                const a = route.points[i - 1]
                const b = route.points[i]
                regions.push({
                    x: Math.min(a.x, b.x) - 4, y: Math.min(a.y, b.y) - 4,
                    width: Math.abs(a.x - b.x) + 8, height: Math.abs(a.y - b.y) + 8,
                })
            }
        }
    }
    for (const station of Object.values(stations)) {
        const envelope = stationEnvelope(station)
        if (regions.some((region) => rectsOverlap(envelope, region))) affected.add(station.id)
    }
    const positions = chooseBestLabelPositions(stations, segments, affected)
    const result = { ...stations }
    for (const [id, position] of Object.entries(positions)) {
        if ((stations[id].labelPosition ?? 'top') !== position) {
            result[id] = { ...stations[id], labelPosition: position }
        }
    }
    return result
}
