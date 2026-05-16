import { useEffect, useRef, useState } from 'react'
import type {
    Viewport,
} from '../viewport/coordinates'
import { screenToWorld } from '../viewport/coordinates'

import type { EditorTool } from '../store/editorStore'
import { useEditorStore } from '../store/editorStore'
import { snapPointToGrid } from '../geometry/snap'
import { snapPointToOctolinear } from '../geometry/octolinear'

import { GridLayer } from '../renderer/GridLayer'
import { SegmentLayer } from '../renderer/SegmentLayer'

import './EditorCanvas.css'

type Point = {
    x: number
    y: number
}

export function EditorCanvas() {
    const activeTool = useEditorStore((s) => s.activeTool)
    const setActiveTool = useEditorStore((s) => s.setActiveTool)
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const addStation = useEditorStore((s) => s.addStation)
    const moveStation = useEditorStore(
        (s) => s.moveStation
    )

    const [viewport, setViewport] =
        useState<Viewport>({
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
        })

    const [pendingStationId, setPendingStationId] = useState<string | null>(null)

    const [selectedColor, setSelectedColor] = useState('#1976d2')

    const [pointerWorldPosition, setPointerWorldPosition] =
        useState<Point | null>(null)

    const [draggingStationId, setDraggingStationId] =
        useState<string | null>(null)

    const [isPanning, setIsPanning] =
        useState(false)

    const [spacePressed, setSpacePressed] =
        useState(false)

    const [lastPointer, setLastPointer] =
        useState({
            x: 0,
            y: 0,
        })

    const stationDragStartRef = useRef<{
        x: number
        y: number
    } | null>(null)

    const suppressNextClickRef = useRef(false)

    const addSegment = useEditorStore(
        (s) => s.addSegment
    )

    const tools: {
        id: EditorTool
        label: string
    }[] = [
            {
                id: 'select',
                label: 'Select',
            },
            {
                id: 'station',
                label: 'Station',
            },
            {
                id: 'segment',
                label: 'Segment',
            },
        ]

    const pendingStation =
        pendingStationId
            ? stations[pendingStationId]
            : null

    const previewEndPoint =
        pendingStation && pointerWorldPosition
            ? snapPointToOctolinear(
                pendingStation,
                pointerWorldPosition
            )
            : null

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(true)
            }
        }

        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(false)
            }
        }

        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)

        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [])

    return (
        <div className="editor-canvas">
            <div className="editor-toolbar">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        type="button"
                        className={
                            activeTool === tool.id
                                ? 'editor-toolbar-button active'
                                : 'editor-toolbar-button'
                        }
                        onClick={() => {
                            setActiveTool(tool.id)
                            setPendingStationId(null)
                            setPointerWorldPosition(null)
                        }}
                    >
                        {tool.label}
                    </button>
                ))}

                {activeTool === 'segment' && (
                    <>
                        <div className="editor-toolbar-separator" />
                        <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="editor-color-picker"
                        />
                    </>
                )}
            </div>

            <svg
                width="100%"
                height="100%"
                style={{
                    cursor: isPanning
                        ? 'grabbing'
                        : spacePressed
                            ? 'grab'
                            : 'default',
                }}
                onWheel={(event) => {
                    event.preventDefault()

                    const rect =
                        event.currentTarget.getBoundingClientRect()

                    const mouseX =
                        event.clientX - rect.left

                    const mouseY =
                        event.clientY - rect.top

                    const worldBefore =
                        screenToWorld(
                            mouseX,
                            mouseY,
                            viewport
                        )

                    const zoomFactor =
                        event.deltaY > 0 ? 0.9 : 1.1

                    const newZoom =
                        viewport.zoom * zoomFactor

                    const newOffsetX =
                        mouseX -
                        worldBefore.x * newZoom

                    const newOffsetY =
                        mouseY -
                        worldBefore.y * newZoom

                    setViewport({
                        zoom: newZoom,
                        offsetX: newOffsetX,
                        offsetY: newOffsetY,
                    })
                }}
                onPointerDown={(event) => {
                    if (spacePressed) {
                        setIsPanning(true)

                        setLastPointer({
                            x: event.clientX,
                            y: event.clientY,
                        })
                    }
                }}
                onPointerMove={(event) => {
                    if (isPanning) {
                        const dx =
                            event.clientX - lastPointer.x

                        const dy =
                            event.clientY - lastPointer.y

                        setViewport((v) => ({
                            ...v,
                            offsetX: v.offsetX + dx,
                            offsetY: v.offsetY + dy,
                        }))

                        setLastPointer({
                            x: event.clientX,
                            y: event.clientY,
                        })

                        return
                    }

                    const rect =
                        event.currentTarget.getBoundingClientRect()

                    const x =
                        event.clientX - rect.left

                    const y =
                        event.clientY - rect.top

                    const point = screenToWorld(
                        x,
                        y,
                        viewport
                    )

                    setPointerWorldPosition(point)

                    if (!draggingStationId) return

                    if (stationDragStartRef.current) {
                        const dx =
                            event.clientX - stationDragStartRef.current.x

                        const dy =
                            event.clientY - stationDragStartRef.current.y

                        if (Math.hypot(dx, dy) > 3) {
                            suppressNextClickRef.current = true
                        }
                    }

                    const snapped =
                        snapPointToGrid(
                            point.x,
                            point.y,
                            40
                        )

                    moveStation(
                        draggingStationId,
                        snapped.x,
                        snapped.y
                    )
                }}
                onPointerUp={() => {
                    setDraggingStationId(null)
                    stationDragStartRef.current = null
                    setIsPanning(false)
                }}
                onClick={(event) => {
                    if (spacePressed) return
                    if (activeTool !== 'station') return

                    if (suppressNextClickRef.current) {
                        suppressNextClickRef.current = false
                        return
                    }

                    const rect =
                        event.currentTarget.getBoundingClientRect()

                    const x =
                        event.clientX - rect.left

                    const y =
                        event.clientY - rect.top

                    const point = screenToWorld(
                        x,
                        y,
                        viewport
                    )

                    const snapped =
                        snapPointToGrid(
                            point.x,
                            point.y,
                            40
                        )

                    addStation(
                        snapped.x,
                        snapped.y
                    )
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
                    <GridLayer
                        width={4000}
                        height={4000}
                        gridSize={40}
                    />

                    <SegmentLayer
                        segments={Object.values(segments)}
                    />

                    {activeTool === 'segment' &&
                        pendingStation &&
                        previewEndPoint && (
                            <line
                                x1={pendingStation.x}
                                y1={pendingStation.y}
                                x2={previewEndPoint.x}
                                y2={previewEndPoint.y}
                                stroke={selectedColor}
                                strokeWidth={6}
                                strokeLinecap="round"
                                strokeDasharray="12 12"
                                opacity={0.45}
                            />
                        )}

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
                                        r={14}
                                        fill="none"
                                        stroke="#1976d2"
                                        strokeWidth={4}
                                    />
                                )}

                                <circle
                                    cx={s.x}
                                    cy={s.y}
                                    r={8}
                                    fill="#111"
                                    style={{
                                        cursor: 'pointer',
                                    }}

                                    onPointerDown={(event) => {
                                        event.stopPropagation()

                                        if (activeTool === 'segment') {
                                            if (pendingStationId) {
                                                if (pendingStationId !== s.id) {
                                                    addSegment(
                                                        pendingStationId,
                                                        s.id,
                                                        selectedColor
                                                    )
                                                }

                                                setPendingStationId(null)
                                                setPointerWorldPosition(null)
                                            } else {
                                                setPendingStationId(s.id)
                                            }

                                            return
                                        }

                                        if (activeTool !== 'select') {
                                            return
                                        }

                                        setDraggingStationId(s.id)
                                        stationDragStartRef.current = {
                                            x: event.clientX,
                                            y: event.clientY,
                                        }
                                    }}

                                />
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}
