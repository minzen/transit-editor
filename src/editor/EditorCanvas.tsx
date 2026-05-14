import { useState } from 'react'
import { screenToWorld } from '../viewport/coordinates'
import { useEditorStore } from '../store/editorStore'
import './EditorCanvas.css'

type Viewport = {
    zoom: number
    offsetX: number
    offsetY: number
}

export function EditorCanvas() {
    const [viewport] = useState<Viewport>({
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
    })

    const stations = useEditorStore((s) => s.stations)
    const addStation = useEditorStore((s) => s.addStation)
    const [draggingStationId, setDraggingStationId] = useState<string | null>(null)
    const moveStation = useEditorStore((s) => s.moveStation
    )
    return (
        <div className="editor-canvas">
            <svg
                width="100%"
                height="100%"
                onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()

                    const x = event.clientX - rect.left
                    const y = event.clientY - rect.top

                    const point = screenToWorld(x, y, viewport)

                    addStation(point.x, point.y)
                    console.log('world point:', point)
                }}

                onPointerMove={(event) => {

                    if (!draggingStationId) return
                    const rect =
                        event.currentTarget.getBoundingClientRect()
                    const x = event.clientX - rect.left
                    const y = event.clientY - rect.top
                    const point = screenToWorld(x, y, viewport)

                    moveStation(
                        draggingStationId,
                        point.x,
                        point.y
                    )
                }}
                onPointerUp={() => {
                    setDraggingStationId(null)
                }}
            >
                <rect
                    width="100%"
                    height="100%"
                    fill="#f5f5f5"
                />

                <g
                    transform={`
            translate(${viewport.offsetX} ${viewport.offsetY})
            scale(${viewport.zoom})
          `}
                >
                    {Object.values(stations).map((s) => (

                        <circle
                            key={s.id}
                            cx={s.x}
                            cy={s.y}
                            r={8}
                            fill="#111"
                            style={{
                                cursor: 'pointer',
                            }}

                            onPointerDown={(event) => {
                                event.stopPropagation()
                                setDraggingStationId(s.id)
                            }}
                        />

                    ))}
                </g>
            </svg>
        </div>
    )
}