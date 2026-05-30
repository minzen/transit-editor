import { useRef, memo } from 'react'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import type { EditorTool } from '../store/editorStore'
import { STATION_RADIUS } from './stationConstants'
import type { ServiceIcon } from '../model/station'

const SERVICE_ICON_MAP: Record<ServiceIcon, string> = {
    accessibility: '♿',
    ferry: '⛴',
    rail: '🚂',
    airport: '✈',
    toilet: '🚻',
}

type Props = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines?: Record<string, Line>
    lineWidth: number
    activeTool: EditorTool
    selectedStationIds: string[]
    pendingStationId: string | null
    selectedLineId?: string | null
    showLineCodes?: boolean
    onStationPointerDown: (stationId: string, event: React.PointerEvent<SVGElement>) => void
    onStationDoubleClick: (stationId: string) => void
    onStationLongPress?: (stationId: string) => void
    showSelection?: boolean
}

const BADGE_RADIUS = 9
const BADGE_SPACING = BADGE_RADIUS * 2 + 4

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

export const StationRenderer = memo(function StationRenderer({
    stations,
    segments,
    lines,
    lineWidth,
    activeTool,
    selectedStationIds,
    pendingStationId,
    selectedLineId,
    showLineCodes = true,
    onStationPointerDown,
    onStationDoubleClick,
    onStationLongPress,
    showSelection = true,
}: Props) {
    // Helper: get the unique line ids connected to a station, in stable order.
    const getConnectedLineIds = (stationId: string): string[] => {
        const connected = new Set<string>()
        for (const segment of Object.values(segments)) {
            if (segment.fromStationId === stationId || segment.toStationId === stationId) {
                segment.lineIds.forEach((lineId) => connected.add(lineId))
            }
        }
        return Array.from(connected)
    }

    const countConnectedLines = (stationId: string): number =>
        getConnectedLineIds(stationId).length

    const longPressRef = useRef<{ stationId: string; timer: number; startX: number; startY: number } | null>(null)

    const LONG_PRESS_THRESHOLD_MS = 500
    const LONG_PRESS_MOVE_THRESHOLD_PX = 10

    const startLongPress = (stationId: string, clientX: number, clientY: number) => {
        longPressRef.current = {
            stationId,
            timer: window.setTimeout(() => {
                longPressRef.current = null
                onStationLongPress?.(stationId)
            }, LONG_PRESS_THRESHOLD_MS),
            startX: clientX,
            startY: clientY,
        }
    }

    const cancelLongPress = (clientX?: number, clientY?: number) => {
        if (!longPressRef.current) return
        if (
            clientX !== undefined &&
            clientY !== undefined &&
            Math.hypot(clientX - longPressRef.current.startX, clientY - longPressRef.current.startY) <=
                LONG_PRESS_MOVE_THRESHOLD_PX
        ) {
            return
        }
        window.clearTimeout(longPressRef.current.timer)
        longPressRef.current = null
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

                const labelPos = s.labelPosition ?? 'top'
                const labelAttrs = (() => {
                    switch (labelPos) {
                        case 'top':
                            return { x: s.x, y: s.y - labelOffset, textAnchor: 'middle' as const, dominantBaseline: 'auto' as const }
                        case 'bottom':
                            return { x: s.x, y: s.y + labelOffset, textAnchor: 'middle' as const, dominantBaseline: 'hanging' as const }
                        case 'left':
                            return { x: s.x - labelOffset, y: s.y, textAnchor: 'end' as const, dominantBaseline: 'central' as const }
                        case 'right':
                            return { x: s.x + labelOffset, y: s.y, textAnchor: 'start' as const, dominantBaseline: 'central' as const }
                        default:
                            return { x: s.x, y: s.y - labelOffset, textAnchor: 'middle' as const, dominantBaseline: 'auto' as const }
                    }
                })()

                const isDimmed = selectedLineId ? !getConnectedLineIds(s.id).includes(selectedLineId) : false

                return (
                    <g key={s.id} opacity={isDimmed ? 0.25 : 1}>
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
                                    startLongPress(s.id, event.clientX, event.clientY)
                                    onStationPointerDown(s.id, event)
                                }}
                                onPointerUp={() => cancelLongPress()}
                                onPointerMove={(event) => cancelLongPress(event.clientX, event.clientY)}
                                onPointerLeave={() => cancelLongPress()}
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
                                    startLongPress(s.id, event.clientX, event.clientY)
                                    onStationPointerDown(s.id, event)
                                }}
                                onPointerUp={() => cancelLongPress()}
                                onPointerMove={(event) => cancelLongPress(event.clientX, event.clientY)}
                                onPointerLeave={() => cancelLongPress()}
                                onDoubleClick={(event) => {
                                    event.stopPropagation()
                                    onStationDoubleClick(s.id)
                                }}
                            />
                        )}

                        {showSelection && selectedStationIds.includes(s.id) && renderRing(4, 3, 'selected')}

                        {s.name && (
                            <text
                                x={labelAttrs.x}
                                y={labelAttrs.y}
                                textAnchor={labelAttrs.textAnchor}
                                dominantBaseline={labelAttrs.dominantBaseline}
                                fontSize={16}
                                fontWeight="bold"
                                fill="#111"
                                style={{
                                    pointerEvents: 'none',
                                }}
                                transform={s.labelRotation ? `rotate(${s.labelRotation} ${labelAttrs.x} ${labelAttrs.y})` : undefined}
                            >
                                {s.name}
                                {s.services && s.services.length > 0 && (
                                    <>
                                        {' • '}
                                        {s.services.map((service, i) => (
                                            <tspan key={`service-${s.id}-${service}`}>
                                                {i > 0 && ' '}
                                                {SERVICE_ICON_MAP[service]}
                                            </tspan>
                                        ))}
                                    </>
                                )}
                            </text>
                        )}

                        {/* Fare zone badge: small circle above the station */}
                        {s.fareZone !== undefined && (
                            <g style={{ pointerEvents: 'none' }}>
                                <circle
                                    cx={s.x}
                                    cy={s.y - (isCapsule ? capsuleWidth / 2 : STATION_RADIUS) - 10}
                                    r={7}
                                    fill="#666"
                                    stroke="#fff"
                                    strokeWidth={1}
                                />
                                <text
                                    x={s.x}
                                    y={s.y - (isCapsule ? capsuleWidth / 2 : STATION_RADIUS) - 10}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={9}
                                    fontWeight="bold"
                                    fill="#fff"
                                >
                                    {s.fareZone}
                                </text>
                            </g>
                        )}

                        {/* Line code bullets: small coloured circles below the station */}
                        {showLineCodes && lines && (() => {
                            const codedLines = getConnectedLineIds(s.id)
                                .map((id) => lines[id])
                                .filter((line): line is Line => Boolean(line?.code))
                            if (codedLines.length === 0) return null
                            const totalWidth = (codedLines.length - 1) * BADGE_SPACING
                            const badgeY = s.y + labelOffset + BADGE_RADIUS
                            return codedLines.map((line, i) => {
                                const cx = s.x - totalWidth / 2 + i * BADGE_SPACING
                                return (
                                    <g
                                        key={`badge-${s.id}-${line.id}`}
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        <circle
                                            cx={cx}
                                            cy={badgeY}
                                            r={BADGE_RADIUS}
                                            fill={line.color}
                                            stroke="#fff"
                                            strokeWidth={1.5}
                                        />
                                        <text
                                            x={cx}
                                            y={badgeY}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={10}
                                            fontWeight="bold"
                                            fill="#fff"
                                        >
                                            {line.code}
                                        </text>
                                    </g>
                                )
                            })
                        })()}
                    </g>
                )
            })}
        </>
    )
})
