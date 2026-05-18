import type { Segment } from '../model/segment'

type Props = {
    segments: Segment[]
    onBendPointDragStart: (segmentId: string, pointIndex: number) => void
}

const BEND_POINT_RADIUS = 6

export function BendPointRenderer({ segments, onBendPointDragStart }: Props) {
    return (
        <>
            {segments.map((segment) => {
                if (segment.points.length === 3) {
                    const bendPoint = segment.points[1]
                    return (
                        <circle
                            key={`${segment.id}-bend`}
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
                                onBendPointDragStart(segment.id, 1)
                            }}
                        />
                    )
                }
                return null
            })}
        </>
    )
}
