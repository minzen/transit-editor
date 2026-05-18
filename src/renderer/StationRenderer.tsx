import type { Station } from '../model/station'
import type { EditorTool } from '../store/editorStore'

type Props = {
    stations: Record<string, Station>
    activeTool: EditorTool
    selectedStationId: string | null
    pendingStationId: string | null
    onStationPointerDown: (stationId: string, event: React.PointerEvent<SVGCircleElement>) => void
    onStationDoubleClick: (stationId: string) => void
}

const STATION_RADIUS = 8

export function StationRenderer({
    stations,
    activeTool,
    selectedStationId,
    pendingStationId,
    onStationPointerDown,
    onStationDoubleClick,
}: Props) {
    return (
        <>
            {Object.values(stations).map((s) => {
                const isPendingStation =
                    activeTool === 'segment' &&
                    pendingStationId === s.id

                return (
                    <g key={s.id}>
                        {isPendingStation && (
                            <circle
                                cx={s.x}
                                cy={s.y}
                                r={STATION_RADIUS + 6}
                                fill="none"
                                stroke="#1976d2"
                                strokeWidth={4}
                            />
                        )}

                        <circle
                            cx={s.x}
                            cy={s.y}
                            r={STATION_RADIUS}
                            fill="#111"
                            style={{
                                cursor: 'pointer',
                            }}
                            onPointerDown={(event) => {
                                onStationPointerDown(s.id, event)
                            }}
                            onDoubleClick={(event) => {
                                event.stopPropagation()
                                onStationDoubleClick(s.id)
                            }}
                        />

                        {selectedStationId === s.id && (
                            <circle
                                cx={s.x}
                                cy={s.y}
                                r={STATION_RADIUS + 4}
                                fill="none"
                                stroke="#1976d2"
                                strokeWidth={3}
                            />
                        )}

                        {s.name && (
                            <text
                                x={s.x}
                                y={s.y - 12}
                                textAnchor="middle"
                                fontSize={16}
                                fontWeight="bold"
                                fill="#111"
                                style={{
                                    pointerEvents: 'none',
                                }}
                            >
                                {s.name}
                            </text>
                        )}
                    </g>
                )
            })}
        </>
    )
}
