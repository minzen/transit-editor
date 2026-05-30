import type { Station, LabelPosition } from '../model/station'
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

const POSITIONS: readonly LabelPosition[] = ['top', 'right', 'bottom', 'left']

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

    let anchorX: number
    let anchorY: number
    let centerX: number
    let centerY: number

    switch (position) {
        case 'top':
            anchorX = station.x
            anchorY = station.y - LABEL_OFFSET
            centerX = anchorX
            centerY = anchorY - height / 2
            break
        case 'bottom':
            anchorX = station.x
            anchorY = station.y + LABEL_OFFSET
            centerX = anchorX
            centerY = anchorY + height / 2
            break
        case 'left':
            anchorX = station.x - LABEL_OFFSET
            anchorY = station.y
            centerX = anchorX - width / 2
            centerY = anchorY
            break
        case 'right':
            anchorX = station.x + LABEL_OFFSET
            anchorY = station.y
            centerX = anchorX + width / 2
            centerY = anchorY
            break
    }

    const rotation = station.labelRotation ?? 0
    if (rotation === 0) {
        return {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
        }
    }

    return rotatedRectAABB(centerX, centerY, width, height, rotation)
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

    // Slight bias: prefer top, then right, then bottom, then left
    const positionBias: Record<LabelPosition, number> = {
        top: 0,
        right: 1,
        bottom: 2,
        left: 3,
    }
    score += positionBias[position] * 0.1

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
    segments: Record<string, Segment>
): Record<string, LabelPosition> {
    const stationList = Object.values(stations)
        .filter((s) => s.name && s.name.trim().length > 0)
        // Stable order: by id for deterministic output
        .sort((a, b) => a.id.localeCompare(b.id))

    const segmentList = Object.values(segments)
    const placed: Record<string, LabelPosition> = {}

    for (const station of stationList) {
        const others = stationList.filter((s) => s.id !== station.id)
        let bestPosition: LabelPosition = 'top'
        let bestScore = Infinity
        for (const pos of POSITIONS) {
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
