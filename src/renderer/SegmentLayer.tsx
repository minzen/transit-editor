import type { Segment } from '../model/segment'

type Props = {
  segments: Segment[]
}

export function SegmentLayer({
  segments,
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

        return (
          <path
            key={segment.id}
            d={d}
            stroke={segment.color}
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
          />
        )
      })}
    </>
  )
}
