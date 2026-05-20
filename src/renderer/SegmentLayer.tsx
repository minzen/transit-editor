import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import { offsetPath } from '../geometry/offsetPath'
import { trimPolyline } from '../geometry/trimPolyline'
import { STATION_RADIUS } from './stationConstants'

type Props = {
  segments: Segment[]
  lines: Record<string, Line>
  lineWidth: number
}

export function SegmentLayer({
  segments,
  lines,
  lineWidth,
}: Props) {
  return (
    <>
      {segments.map((segment) => {
        // Trim segment endpoints inward so lines terminate at the station
        // outline (circle radius / capsule short-edge), not at the station centre.
        const trimmed = trimPolyline(segment.points, STATION_RADIUS, STATION_RADIUS)

        // Render the segment once for each line it belongs to
        return segment.lineIds.map((lineId, index) => {
          const line = lines[lineId]
          if (!line) return null

          // Calculate parallel offset distance for this line
          const totalLines = segment.lineIds.length
          // Line spacing is slightly larger than the line width so they sit perfectly adjacent
          const spacing = lineWidth + 1.5
          const offsetDistance = totalLines > 1
            ? (index - (totalLines - 1) / 2) * spacing
            : 0

          // Calculate the actual offset path points using our miter joints algorithm
          const offsetPoints = offsetPath(trimmed, offsetDistance)

          const d = offsetPoints
            .map((p, pIndex) =>
              pIndex === 0
                ? `M ${p.x} ${p.y}`
                : `L ${p.x} ${p.y}`
            )
            .join(' ')

          return (
            <path
              key={`${segment.id}-${lineId}`}
              d={d}
              stroke={line.color}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              fill="none"
            />
          )
        })
      })}
    </>
  )
}
