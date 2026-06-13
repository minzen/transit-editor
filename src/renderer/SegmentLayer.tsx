import { memo } from 'react'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import { offsetPath } from '../geometry/offsetPath'
import { buildRoundedPolylinePath } from '../geometry/buildRoundedPath'

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
      strokeLinecap="butt"
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
  return (
    <>
      {segments.map((segment) => {
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

          const offsetPoints = offsetPath(segment.points, offsetDistance)
          const d = buildRoundedPolylinePath(offsetPoints)
          const effectiveWidth = line.lineWidth ?? lineWidth

          return (
            <SegmentPath
              key={`${segment.id}-${lineId}`}
              d={d}
              line={line}
              lineWidth={effectiveWidth}
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
