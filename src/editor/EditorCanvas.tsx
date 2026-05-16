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
    const lines = useEditorStore((s) => s.lines)
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

    const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

    const [isCreatingLine, setIsCreatingLine] = useState(false)
    const [newLineName, setNewLineName] = useState('')
    const [newLineColor, setNewLineColor] = useState('#1976d2')

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
    const [showBackground, setShowBackground] = useState(true)

    const colorPalette = [
        '#e53935',
        '#ef5350',
        '#f44336',
        '#1e88e5',
        '#42a5f5',
        '#2196f3',
        '#43a047',
        '#66bb6a',
        '#4caf50',
        '#fdd835',
        '#ffee58',
        '#ffeb3b',
        '#fb8c00',
        '#ffa726',
        '#ff9800',
        '#8e24aa',
        '#ab47bc',
        '#9c27b0',
        '#d81b60',
        '#ec407a',
        '#e91e63',
        '#00acc1',
        '#26c6da',
        '#00bcd4',
        '#212121',
        '#424242',
        '#616161',
    ]

    const [pointerWorldPosition, setPointerWorldPosition] =
        useState<Point | null>(null)

    const [draggingStationId, setDraggingStationId] =
        useState<string | null>(null)

    const [draggingBendPoint, setDraggingBendPoint] = useState<{
        segmentId: string
        pointIndex: number
    } | null>(null)

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

    const svgRef = useRef<SVGSVGElement>(null)

    const addSegment = useEditorStore(
        (s) => s.addSegment
    )

    const setStationName = useEditorStore(
        (s) => s.setStationName
    )

    const updateSegmentPoint = useEditorStore(
        (s) => s.updateSegmentPoint
    )

    const addLine = useEditorStore((s) => s.addLine)

    const undo = useEditorStore((s) => s.undo)
    const redo = useEditorStore((s) => s.redo)
    const clear = useEditorStore((s) => s.clear)
    const pastStates = useEditorStore((s) => s.pastStates)
    const futureStates = useEditorStore((s) => s.futureStates)

    const exportAsSVG = () => {
        if (!svgRef.current) return

        const svgElement = svgRef.current
        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svgElement)

        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = 'transit-map.svg'
        link.click()

        URL.revokeObjectURL(url)
    }

    const exportAsPDF = () => {
        if (!svgRef.current) return

        const svgElement = svgRef.current
        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svgElement)

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const padding = 40
            const bbox = svgElement.getBoundingClientRect()

            canvas.width = bbox.width + padding * 2
            canvas.height = bbox.height + padding * 2

            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, padding, padding, bbox.width, bbox.height)

                const pdfUrl = canvas.toDataURL('image/png')
                const link = document.createElement('a')
                link.href = pdfUrl
                link.download = 'transit-map.png'
                link.click()
            }

            URL.revokeObjectURL(svgUrl)
        }
        img.src = svgUrl
    }

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

                <div className="editor-toolbar-separator" />

                <button
                    type="button"
                    className="editor-toolbar-button"
                    disabled={pastStates.length === 0}
                    onClick={undo}
                    title="Undo"
                >
                    ↶ Undo
                </button>

                <button
                    type="button"
                    className="editor-toolbar-button"
                    disabled={futureStates.length === 0}
                    onClick={redo}
                    title="Redo"
                >
                    Redo ↷
                </button>

                <div className="editor-toolbar-separator" />

                <button
                    type="button"
                    className="editor-toolbar-button"
                    onClick={exportAsSVG}
                    title="Export as SVG"
                >
                    Export SVG
                </button>

                <button
                    type="button"
                    className="editor-toolbar-button"
                    onClick={exportAsPDF}
                    title="Export as PNG"
                >
                    Export PNG
                </button>

                <div className="editor-toolbar-separator" />

                <button
                    type="button"
                    className="editor-toolbar-button"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to clear all data?')) {
                            clear()
                            setSelectedLineId(null)
                            setBackgroundImage(null)
                        }
                    }}
                    title="Clear all"
                >
                    Clear
                </button>

                <div className="editor-toolbar-separator" />

                <button
                    type="button"
                    className="editor-toolbar-button"
                    onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                                const reader = new FileReader()
                                reader.onload = (event) => {
                                    setBackgroundImage(event.target?.result as string)
                                }
                                reader.readAsDataURL(file)
                            }
                        }
                        input.click()
                    }}
                    title="Load background image"
                >
                    Load Image
                </button>

                {backgroundImage && (
                    <button
                        type="button"
                        className="editor-toolbar-button"
                        onClick={() => setShowBackground(!showBackground)}
                        title={showBackground ? 'Hide background' : 'Show background'}
                    >
                        {showBackground ? 'Hide BG' : 'Show BG'}
                    </button>
                )}

                {activeTool === 'segment' && (
                    <>
                        <div className="editor-toolbar-separator" />
                        <select
                            value={selectedLineId || ''}
                            onChange={(e) => setSelectedLineId(e.target.value || null)}
                            className="editor-line-selector"
                        >
                            <option value="">Select line...</option>
                            {Object.values(lines).map((line) => (
                                <option key={line.id} value={line.id}>
                                    {line.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="editor-toolbar-button"
                            onClick={() => setIsCreatingLine(true)}
                        >
                            + Line
                        </button>

                        {isCreatingLine && (
                            <div className="editor-line-creator">
                                <input
                                    type="text"
                                    value={newLineName}
                                    onChange={(e) => setNewLineName(e.target.value)}
                                    placeholder="Line name"
                                    className="editor-line-name-input"
                                />
                                <div className="editor-color-palette">
                                    {colorPalette.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`editor-color-swatch ${
                                                newLineColor === color ? 'active' : ''
                                            }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setNewLineColor(color)}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    className="editor-toolbar-button"
                                    onClick={() => {
                                        if (newLineName.trim()) {
                                            addLine(newLineName.trim(), newLineColor)
                                            setNewLineName('')
                                            setNewLineColor('#1976d2')
                                            setIsCreatingLine(false)
                                        }
                                    }}
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    className="editor-toolbar-button"
                                    onClick={() => {
                                        setNewLineName('')
                                        setNewLineColor('#1976d2')
                                        setIsCreatingLine(false)
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <svg
                ref={svgRef}
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

                    if (draggingBendPoint) {
                        const segment = segments[draggingBendPoint.segmentId]
                        if (segment) {
                            const fromStation = stations[segment.fromStationId]
                            const toStation = stations[segment.toStationId]

                            let snappedPoint = point

                            if (fromStation && toStation) {
                                const fromSnap = snapPointToOctolinear(fromStation, point)
                                const toSnap = snapPointToOctolinear(toStation, point)

                                const fromDist = Math.hypot(fromSnap.x - point.x, fromSnap.y - point.y)
                                const toDist = Math.hypot(toSnap.x - point.x, toSnap.y - point.y)

                                snappedPoint = fromDist < toDist ? fromSnap : toSnap
                            }

                            updateSegmentPoint(
                                draggingBendPoint.segmentId,
                                draggingBendPoint.pointIndex,
                                snappedPoint.x,
                                snappedPoint.y
                            )
                        }
                        return
                    }

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
                    setDraggingBendPoint(null)
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
                    {backgroundImage && showBackground && (
                        <image
                            href={backgroundImage}
                            x={-2000}
                            y={-2000}
                            width={4000}
                            height={4000}
                            opacity={0.3}
                            style={{
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    <GridLayer
                        width={4000}
                        height={4000}
                        gridSize={40}
                    />

                    <SegmentLayer
                        segments={Object.values(segments)}
                    />

                    {activeTool === 'select' &&
                        Object.values(segments).map((segment) => {
                            if (segment.points.length === 3) {
                                const bendPoint = segment.points[1]
                                return (
                                    <circle
                                        key={`${segment.id}-bend`}
                                        cx={bendPoint.x}
                                        cy={bendPoint.y}
                                        r={6}
                                        fill="#1976d2"
                                        stroke="#fff"
                                        strokeWidth={2}
                                        style={{
                                            cursor: 'grab',
                                        }}
                                        onPointerDown={(event) => {
                                            event.stopPropagation()
                                            setDraggingBendPoint({
                                                segmentId: segment.id,
                                                pointIndex: 1,
                                            })
                                        }}
                                    />
                                )
                            }
                            return null
                        })}

                    {activeTool === 'segment' &&
                        pendingStation &&
                        previewEndPoint &&
                        selectedLineId && (
                            <line
                                x1={pendingStation.x}
                                y1={pendingStation.y}
                                x2={previewEndPoint.x}
                                y2={previewEndPoint.y}
                                stroke={lines[selectedLineId]?.color || '#1976d2'}
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
                                                    if (selectedLineId) {
                                                        addSegment(
                                                            pendingStationId,
                                                            s.id,
                                                            selectedLineId
                                                        )
                                                    }
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

                                    onDoubleClick={(event) => {
                                        event.stopPropagation()

                                        if (activeTool !== 'select') {
                                            return
                                        }

                                        const newName = window.prompt(
                                            'Station name:',
                                            s.name || ''
                                        )

                                        if (newName !== null) {
                                            setStationName(s.id, newName)
                                        }
                                    }}

                                />

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
                </g>
            </svg>
        </div>
    )
}
