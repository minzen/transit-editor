import type { Segment } from '../model/segment'
import type { Line } from '../model/line'

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
        const d = segment.points
          .map((p, index) =>
            index === 0
              ? `M ${p.x} ${p.y}`
              : `L ${p.x} ${p.y}`
          )
          .join(' ')

        // Render the segment once for each line it belongs to
        return segment.lineIds.map((lineId) => {
          const line = lines[lineId]
          if (!line) return null

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
