import { memo, useMemo } from 'react'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import { offsetPath } from '../geometry/offsetPath'
import { trimPolyline } from '../geometry/trimPolyline'
import { buildRoundedPolylinePath } from '../geometry/buildRoundedPath'
import { STATION_RADIUS } from './stationConstants'

const STATION_TRIM_PADDING = 2

function countConnectedLines(stationId: string, segments: Record<string, Segment>): number {
  const connected = new Set<string>()
  for (const segment of Object.values(segments)) {
    if (segment.fromStationId === stationId || segment.toStationId === stationId) {
      segment.lineIds.forEach((id) => connected.add(id))
    }
  }
  return connected.size
}

function getStationAxisAngleDeg(stationId: string, segments: Record<string, Segment>): number {
  let sumSin = 0
  let sumCos = 0
  let count = 0
  for (const segment of Object.values(segments)) {
    if (segment.points.length < 2) continue
    let dx: number, dy: number
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
    sumSin += Math.sin(2 * theta)
    sumCos += Math.cos(2 * theta)
    count++
  }
  if (count === 0) return 0
  const axisAngleRad = Math.atan2(sumSin, sumCos) / 2
  return (axisAngleRad * 180) / Math.PI
}

function getTrimDistance(
  stationId: string,
  segment: Segment,
  isStart: boolean,
  lineWidth: number,
  allSegments: Record<string, Segment>
): number {
  const lineCount = countConnectedLines(stationId, allSegments)
  const isCapsule = lineCount > 1
  if (!isCapsule) {
    return STATION_RADIUS + STATION_TRIM_PADDING
  }

  const segmentAxisDeg = getStationAxisAngleDeg(stationId, allSegments)
  const capsuleAxisRad = ((segmentAxisDeg + 90) * Math.PI) / 180

  const idx = isStart ? 0 : segment.points.length - 1
  const nextIdx = isStart ? 1 : segment.points.length - 2
  const dx = segment.points[nextIdx].x - segment.points[idx].x
  const dy = segment.points[nextIdx].y - segment.points[idx].y
  const approachRad = Math.atan2(dy, dx)

  const angleDiff = Math.abs(
    Math.atan2(Math.sin(approachRad - capsuleAxisRad), Math.cos(approachRad - capsuleAxisRad))
  )
  const isAlongLongAxis = angleDiff < Math.PI / 4 || angleDiff > (3 * Math.PI) / 4

  const spacing = lineWidth + 1.5
  const capsuleLength = (lineCount - 1) * spacing + STATION_RADIUS * 2
  const capsuleWidth = STATION_RADIUS * 2

  if (isAlongLongAxis) {
    return Math.max(capsuleLength, capsuleWidth) / 2 + STATION_TRIM_PADDING
  }
  return capsuleWidth / 2 + STATION_TRIM_PADDING
}

type Props = {
  segments: Segment[]
  lines: Record<string, Line>
  lineWidth: number
  selectedLineId?: string | null
  hoveredSegmentId?: string | null
  onSegmentMouseEnter?: (segmentId: string, event: React.MouseEvent<SVGGElement>) => void
  onSegmentMouseLeave?: (segmentId: string) => void
}

function getStrokeDasharray(style: Line['lineStyle']): string | undefined {
  if (style === 'dashed') return '8 4'
  return undefined
}

function SegmentPath({
  d,
  line,
  lineWidth,
  dimmed,
  highlighted,
}: {
  d: string
  line: Line
  lineWidth: number
  dimmed?: boolean
  highlighted?: boolean
}) {
  const dasharray = getStrokeDasharray(line.lineStyle)
  const opacity = dimmed ? 0.25 : highlighted ? 1 : 1
  const strokeW = highlighted ? lineWidth + 2 : lineWidth

  if (line.lineStyle === 'double') {
    return (
      <>
        <path
          d={d}
          stroke={line.color}
          strokeWidth={strokeW + 3}
          strokeLinecap="round"
          fill="none"
          opacity={dimmed ? 0.1 : 0.35}
        />
        <path
          d={d}
          stroke={line.color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={dasharray}
          opacity={opacity}
        />
      </>
    )
  }

  return (
    <path
      d={d}
      stroke={line.color}
      strokeWidth={strokeW}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={dasharray}
      opacity={opacity}
    />
  )
}

export const SegmentLayer = memo(function SegmentLayer({
  segments,
  lines,
  lineWidth,
  selectedLineId,
  hoveredSegmentId,
  onSegmentMouseEnter,
  onSegmentMouseLeave,
}: Props) {
  const allSegments = useMemo(() => {
    const map: Record<string, Segment> = {}
    for (const s of segments) {
      map[s.id] = s
    }
    return map
  }, [segments])

  return (
    <>
      {segments.map((segment) => {
        const startTrim = getTrimDistance(segment.fromStationId, segment, true, lineWidth, allSegments)
        const endTrim = getTrimDistance(segment.toStationId, segment, false, lineWidth, allSegments)

        const isHovered = hoveredSegmentId === segment.id
        const isDimmed = selectedLineId ? !segment.lineIds.includes(selectedLineId) : false

        // Render the segment once for each line it belongs to
        const paths = segment.lineIds.map((lineId, index) => {
          const line = lines[lineId]
          if (!line) return null

          // Calculate parallel offset distance for this line
          const totalLines = segment.lineIds.length
          // Line spacing is slightly larger than the line width so they sit perfectly adjacent
          const spacing = lineWidth + 1.5
          const offsetDistance = totalLines > 1
            ? (index - (totalLines - 1) / 2) * spacing
            : 0

          // Offset first, then trim: trimming on the offset path ensures each
          // parallel line's endpoints are correctly spaced from the station marker
          // regardless of how far the line has been displaced laterally.
          const offsetPoints = offsetPath(segment.points, offsetDistance)
          const trimmed = trimPolyline(offsetPoints, startTrim, endTrim)

          const d = buildRoundedPolylinePath(trimmed)

          return (
            <SegmentPath
              key={`${segment.id}-${lineId}`}
              d={d}
              line={line}
              lineWidth={lineWidth}
              dimmed={isDimmed}
              highlighted={isHovered}
            />
          )
        })

        return (
          <g
            key={segment.id}
            style={{ pointerEvents: 'all' }}
            onMouseEnter={(event) => onSegmentMouseEnter?.(segment.id, event)}
            onMouseLeave={() => onSegmentMouseLeave?.(segment.id)}
          >
            {paths}
          </g>
        )
      })}
    </>
  )
})
