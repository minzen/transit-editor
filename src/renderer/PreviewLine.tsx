import type { Point } from '../types/geometry'

type Props = {
    fromStation: Point
    toPoint: Point
    lineColor: string
}

export function PreviewLine({ fromStation, toPoint, lineColor }: Props) {
    return (
        <line
            x1={fromStation.x}
            y1={fromStation.y}
            x2={toPoint.x}
            y2={toPoint.y}
            stroke={lineColor}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray="12 12"
            opacity={0.45}
        />
    )
}
