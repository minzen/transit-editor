import { memo } from 'react'
import type { Shape } from '../model/shape'

type Props = {
    shapes: Record<string, Shape>
}

export const ShapeLayer = memo(function ShapeLayer({ shapes }: Props) {
    return (
        <>
            {Object.values(shapes).map((shape) => {
                const points = shape.points
                    .map((p) => `${p.x},${p.y}`)
                    .join(' ')

                return (
                    <polygon
                        key={shape.id}
                        points={points}
                        fill={shape.color}
                        fillOpacity={shape.opacity ?? 0.5}
                        stroke={shape.color}
                        strokeWidth={1}
                        strokeOpacity={0.8}
                        style={{ pointerEvents: 'none' }}
                    />
                )
            })}
        </>
    )
})
