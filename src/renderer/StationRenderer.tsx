import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import type { EditorTool } from '../store/editorStore'

type Props = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lineWidth: number
    activeTool: EditorTool
    selectedStationId: string | null
    pendingStationId: string | null
    onStationPointerDown: (stationId: string, event: React.PointerEvent<SVGElement>) => void
    onStationDoubleClick: (stationId: string) => void
}

const STATION_RADIUS = 8

/**
 * Calculate the average axis angle (in degrees) of all segments connected to a station.
 * Uses double-angle averaging so that opposite directions are treated as the same axis.
 * Returns 0 if no segments are connected.
 */
function getStationAxisAngleDeg(
    stationId: string,
    segments: Record<string, Segment>
): number {
    let sumSin = 0
    let sumCos = 0
    let count = 0

    for (const segment of Object.values(segments)) {
        if (segment.points.length < 2) continue

        let dx: number
        let dy: number
        if (segment.fromStationId === stationId) {
            dx = segment.points[1].x - segment.points[0].x
            dy = segment.points[1].y - segment.points[0].y
        } else if (segment.toStationId === stationId) {
            const last = segment.points.length - 1
            dx = segment.points[last - 1].x - segment.points[last].x
            dy = segment.points[last - 1].y - segment.points[last].y
        } else {
            continue
        }

        const len = Math.hypot(dx, dy)
        if (len === 0) continue

        const theta = Math.atan2(dy / len, dx / len)
        // Double angle so opposite directions add constructively (axis, not vector)
        sumSin += Math.sin(2 * theta)
        sumCos += Math.cos(2 * theta)
        count++
    }

    if (count === 0) return 0

    const axisAngleRad = Math.atan2(sumSin, sumCos) / 2
    return (axisAngleRad * 180) / Math.PI
}

export function StationRenderer({
    stations,
    segments,
    lineWidth,
    activeTool,
    selectedStationId,
    pendingStationId,
    onStationPointerDown,
    onStationDoubleClick,
}: Props) {
    // Helper: count unique lines connected to a station
    const countConnectedLines = (stationId: string): number => {
        const connectedLineIds = new Set<string>()
        for (const segment of Object.values(segments)) {
            if (segment.fromStationId === stationId || segment.toStationId === stationId) {
                segment.lineIds.forEach((lineId) => connectedLineIds.add(lineId))
            }
        }
        return connectedLineIds.size
    }

    return (
        <>
            {Object.values(stations).map((s) => {
                const isPendingStation =
                    activeTool === 'segment' &&
                    pendingStationId === s.id

                const lineCount = countConnectedLines(s.id)
                const isCapsule = lineCount > 1

                // Capsule geometry. Capsule's long axis is perpendicular to segment axis.
                const spacing = lineWidth + 1.5
                const capsuleLength = (lineCount - 1) * spacing + STATION_RADIUS * 2
                const capsuleWidth = STATION_RADIUS * 2
                const segmentAxisDeg = isCapsule ? getStationAxisAngleDeg(s.id, segments) : 0
                // Rotate rect 90° away from segment axis so it spans across the parallel lines
                const capsuleRotationDeg = segmentAxisDeg + 90

                const renderRing = (extraRadius: number, strokeWidth: number, key: string) => {
                    if (isCapsule) {
                        const w = capsuleLength + extraRadius * 2
                        const h = capsuleWidth + extraRadius * 2
                        const r = (capsuleWidth + extraRadius * 2) / 2
                        return (
                            <rect
                                key={key}
                                x={s.x - w / 2}
                                y={s.y - h / 2}
                                width={w}
                                height={h}
                                rx={r}
                                ry={r}
                                fill="none"
                                stroke="#1976d2"
                                strokeWidth={strokeWidth}
                                transform={`rotate(${capsuleRotationDeg} ${s.x} ${s.y})`}
                            />
                        )
                    }
                    return (
                        <circle
                            key={key}
                            cx={s.x}
                            cy={s.y}
                            r={STATION_RADIUS + extraRadius}
                            fill="none"
                            stroke="#1976d2"
                            strokeWidth={strokeWidth}
                        />
                    )
                }

                const labelOffset = isCapsule
                    ? Math.max(capsuleLength, capsuleWidth) / 2 + 6
                    : STATION_RADIUS + 6

                return (
                    <g key={s.id}>
                        {isPendingStation && renderRing(6, 4, 'pending')}

                        {isCapsule ? (
                            <rect
                                x={s.x - capsuleLength / 2}
                                y={s.y - capsuleWidth / 2}
                                width={capsuleLength}
                                height={capsuleWidth}
                                rx={capsuleWidth / 2}
                                ry={capsuleWidth / 2}
                                fill="#111"
                                style={{ cursor: 'pointer' }}
                                transform={`rotate(${capsuleRotationDeg} ${s.x} ${s.y})`}
                                onPointerDown={(event) => {
                                    onStationPointerDown(s.id, event)
                                }}
                                onDoubleClick={(event) => {
                                    event.stopPropagation()
                                    onStationDoubleClick(s.id)
                                }}
                            />
                        ) : (
                            <circle
                                cx={s.x}
                                cy={s.y}
                                r={STATION_RADIUS}
                                fill="#111"
                                style={{ cursor: 'pointer' }}
                                onPointerDown={(event) => {
                                    onStationPointerDown(s.id, event)
                                }}
                                onDoubleClick={(event) => {
                                    event.stopPropagation()
                                    onStationDoubleClick(s.id)
                                }}
                            />
                        )}

                        {selectedStationId === s.id && renderRing(4, 3, 'selected')}

                        {s.name && (
                            <text
                                x={s.x}
                                y={s.y - labelOffset}
                                textAnchor="middle"
                                fontSize={16}
                                fontWeight="bold"
                                fill="#111"
                                style={{
                                    pointerEvents: 'none',
                                }}
                            >
                                {s.name}
                            </text>
                        )}
                    </g>
                )
            })}
        </>
    )
}
