import { memo } from 'react'
import type { Segment } from '../model/segment'

type Props = {
    segments: Segment[]
    onBendPointDragStart: (segmentId: string, pointIndex: number) => void
    onBendPointDoubleClick?: (segmentId: string, pointIndex: number) => void
}

const BEND_POINT_RADIUS = 6

export const BendPointRenderer = memo(function BendPointRenderer({
    segments,
    onBendPointDragStart,
    onBendPointDoubleClick,
}: Props) {
    return (
        <>
            {segments.flatMap((segment) => {
                // Render every interior vertex (skip the first and last, which
                // are anchored to the segment's stations).
                return segment.points.slice(1, -1).map((bendPoint, idx) => {
                    const i = idx + 1
                    return (
                        <circle
                            key={`${segment.id}-bend-${i}`}
                            cx={bendPoint.x}
                            cy={bendPoint.y}
                            r={BEND_POINT_RADIUS}
                            fill="#1976d2"
                            stroke="#fff"
                            strokeWidth={2}
                            style={{
                                cursor: 'grab',
                            }}
                            onPointerDown={(event) => {
                                event.stopPropagation()
                                onBendPointDragStart(segment.id, i)
                            }}
                            onDoubleClick={(event) => {
                                event.stopPropagation()
                                onBendPointDoubleClick?.(segment.id, i)
                            }}
                        />
                    )
                })
            })}
        </>
    )
})
