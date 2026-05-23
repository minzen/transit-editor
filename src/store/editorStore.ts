import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Station, LabelPosition } from '../model/station'
import type { Segment } from '../model/segment'
import type { Line, LineStyle, TransitMode } from '../model/line'
import type { Shape } from '../model/shape'
import type { Viewport } from '../viewport/coordinates'
import type { Point } from '../types/geometry'
import { createOctolinearPath } from '../geometry/octolinear'
import { isPointNearPolyline, pointToLineSegmentDistance } from '../geometry/distance'
import { validateLineName, validateStationName } from '../validation/constants'

export type EditorTool = 'select' | 'station' | 'segment' | 'shape'

type DataSnapshot = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
    shapes: Record<string, Shape>
}

const createSnapshot = (state: EditorState): DataSnapshot => ({
    stations: state.stations,
    segments: state.segments,
    lines: state.lines,
    shapes: state.shapes,
})

// Helper function to check if a point is on a segment line
function isPointOnSegment(
    point: Point,
    segment: Segment,
    stations: Record<string, Station>,
    threshold: number = 10
): boolean {
    const fromStation = stations[segment.fromStationId]
    const toStation = stations[segment.toStationId]

    if (!fromStation || !toStation) {
        return false
    }

    return isPointNearPolyline(point, segment.points, threshold)
}

type EditorState = {
    activeTool: EditorTool
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
    shapes: Record<string, Shape>
    viewport: Viewport
    lineWidth: number
    gridCellSize: number
    gridCellsWidth: number
    gridCellsHeight: number

    pastStates: DataSnapshot[]
    futureStates: DataSnapshot[]

    setActiveTool: (tool: EditorTool) => void
    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
    setStationName: (id: string, name: string) => void
    setStationLabelPosition: (id: string, position: LabelPosition) => void
    deleteStation: (id: string) => void
    updateSegmentPoint: (segmentId: string, pointIndex: number, x: number, y: number) => void
    insertBendPoint: (segmentId: string, x: number, y: number) => void
    removeBendPoint: (segmentId: string, pointIndex: number) => void
    addSegment: (fromStationId: string, toStationId: string, lineId: string) => void
    deleteSegment: (id: string) => void
    addLine: (name: string, color: string, code?: string, lineStyle?: LineStyle, transitMode?: TransitMode) => void
    setLineName: (id: string, name: string) => void
    setLineCode: (id: string, code: string) => void
    clear: () => void
    undo: () => void
    redo: () => void
    setViewport: (viewport: Viewport) => void
    zoomIn: (centerX?: number, centerY?: number) => void
    zoomOut: (centerX?: number, centerY?: number) => void
    resetViewport: () => void
    setLineWidth: (width: number) => void
    setGridCellSize: (size: number) => void
    setGridCellsWidth: (width: number) => void
    setGridCellsHeight: (height: number) => void
    addShape: (points: Point[], color: string, name?: string, opacity?: number) => void
    updateShape: (id: string, updates: Partial<Pick<Shape, 'points' | 'color' | 'name' | 'opacity'>>) => void
    deleteShape: (id: string) => void
}

export const useEditorStore = create<EditorState>()(
    persist(
        (set) => ({
    activeTool: 'select',
    stations: {},
    segments: {},
    lines: {},
    shapes: {},
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
    lineWidth: 10,
    gridCellSize: 50,
    gridCellsWidth: 80,
    gridCellsHeight: 80,
    pastStates: [],
    futureStates: [],

    setActiveTool: (tool) =>
        set({
            activeTool: tool,
        }),

    addStation: (x, y) =>
        set((state) => {
            const id = nanoid()
            const currentSnapshot = createSnapshot(state)

            // Check if the new station is on any existing segment
            const pointOnSegment = { x, y }
            const segmentToSplit = Object.values(state.segments).find(
                (segment) => isPointOnSegment(pointOnSegment, segment, state.stations)
            )

            let newSegments = state.segments

            if (segmentToSplit) {
                // Split the segment into two segments
                // With multiple line support, we need to split for each line
                const lineIds = segmentToSplit.lineIds
                const validLines = lineIds.map(lineId => state.lines[lineId]).filter(line => line !== undefined)
                
                if (validLines.length === 0) {
                    // If no valid lines exist, just add the station without splitting
                    return {
                        stations: {
                            ...state.stations,
                            [id]: { id, x, y },
                        },
                        segments: state.segments,
                        lines: state.lines,
                        pastStates: [...state.pastStates, currentSnapshot],
                        futureStates: [],
                    }
                }

                const fromStation = state.stations[segmentToSplit.fromStationId]
                const toStation = state.stations[segmentToSplit.toStationId]

                if (!fromStation || !toStation) {
                    // If stations don't exist, just add the station without splitting
                    return {
                        stations: {
                            ...state.stations,
                            [id]: { id, x, y },
                        },
                        segments: state.segments,
                        lines: state.lines,
                        pastStates: [...state.pastStates, currentSnapshot],
                        futureStates: [],
                    }
                }

                const newStation = { id, x, y }
                const path1 = createOctolinearPath(fromStation, newStation)
                const path2 = createOctolinearPath(newStation, toStation)

                // Remove the old segment and add two new ones for each line
                const { [segmentToSplit.id]: _removedSegment, ...remainingSegments } = state.segments
                
                // Create new segments for each line
                const newSegmentsEntries: Record<string, Segment>[] = lineIds.flatMap((lineId) => {
                    const segment1Id = nanoid()
                    const segment2Id = nanoid()
                    return [
                        {
                            [segment1Id]: {
                                id: segment1Id,
                                fromStationId: segmentToSplit.fromStationId,
                                toStationId: id,
                                lineIds: [lineId],
                                points: path1,
                            },
                        },
                        {
                            [segment2Id]: {
                                id: segment2Id,
                                fromStationId: id,
                                toStationId: segmentToSplit.toStationId,
                                lineIds: [lineId],
                                points: path2,
                            },
                        },
                    ]
                })
                
                newSegments = newSegmentsEntries.reduce(
                    (acc, entry) => ({ ...acc, ...entry }),
                    remainingSegments
                )
            }

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        id,
                        x,
                        y,
                    },
                },
                segments: newSegments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    moveStation: (id, x, y) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            const segments = Object.fromEntries(
                Object.entries(state.segments).map(
                    ([segmentId, segment]) => {
                        if (
                            segment.fromStationId !== id &&
                            segment.toStationId !== id
                        ) {
                            return [segmentId, segment]
                        }

                        const points = [...segment.points]

                        if (segment.fromStationId === id) {
                            points[0] = { x, y }
                        }

                        if (segment.toStationId === id) {
                            points[points.length - 1] = { x, y }
                        }

                        return [
                            segmentId,
                            {
                                ...segment,
                                points,
                            },
                        ]
                    }
                )
            )

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        x,
                        y,
                    },
                },
                segments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    setStationName: (id, name) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const validation = validateStationName(name)
            if (!validation.valid) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        name: validation.sanitized ?? name,
                    },
                },
                segments: state.segments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    setStationLabelPosition: (id, position) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        labelPosition: position,
                    },
                },
                segments: state.segments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    deleteStation: (id) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            // Remove station and all connected segments
            const { [id]: _removedStation, ...remainingStations } = state.stations
            const remainingSegments = Object.fromEntries(
                Object.entries(state.segments).filter(
                    ([_, segment]) =>
                        segment.fromStationId !== id && segment.toStationId !== id
                )
            )

            return {
                stations: remainingStations,
                segments: remainingSegments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    updateSegmentPoint: (segmentId, pointIndex, x, y) =>
        set((state) => {
            const segment = state.segments[segmentId]

            if (!segment) {
                return state
            }

            if (pointIndex < 0 || pointIndex >= segment.points.length) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            const newPoints = [...segment.points]
            newPoints[pointIndex] = { x, y }

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    insertBendPoint: (segmentId, x, y) =>
        set((state) => {
            const segment = state.segments[segmentId]
            if (!segment) {
                return state
            }

            // Find the polyline edge (i, i+1) closest to the click point.
            // Insert the new bend point at index (i + 1) so it becomes part of
            // that edge.
            const click = { x, y }
            let bestEdgeIndex = 0
            let bestDistance = Infinity
            for (let i = 0; i < segment.points.length - 1; i++) {
                const d = pointToLineSegmentDistance(
                    click,
                    segment.points[i],
                    segment.points[i + 1]
                )
                if (d < bestDistance) {
                    bestDistance = d
                    bestEdgeIndex = i
                }
            }

            const insertAt = bestEdgeIndex + 1
            const newPoints = [
                ...segment.points.slice(0, insertAt),
                { x, y },
                ...segment.points.slice(insertAt),
            ]

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    removeBendPoint: (segmentId, pointIndex) =>
        set((state) => {
            const segment = state.segments[segmentId]
            if (!segment) {
                return state
            }

            // Refuse to remove the endpoints (they are anchored to stations).
            if (pointIndex <= 0 || pointIndex >= segment.points.length - 1) {
                return state
            }

            const newPoints = [
                ...segment.points.slice(0, pointIndex),
                ...segment.points.slice(pointIndex + 1),
            ]

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    addSegment: (
        fromStationId,
        toStationId,
        lineId
    ) =>
        set((state) => {
            const from =
                state.stations[fromStationId]

            const to =
                state.stations[toStationId]

            const line = state.lines[lineId]

            if (!from || !to || !line) {
                return state
            }

            const id = nanoid()
            const points = createOctolinearPath(from, to)

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,

                    [id]: {
                        id,

                        fromStationId,
                        toStationId,

                        lineIds: [lineId],

                        points,
                    },
                },
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    deleteSegment: (id) =>
        set((state) => {
            const segment = state.segments[id]

            if (!segment) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            const { [id]: _removedSegment, ...remainingSegments } = state.segments

            return {
                stations: state.stations,
                segments: remainingSegments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    undo: () =>
        set((state) => {
            if (state.pastStates.length === 0) {
                return state
            }

            const currentState = createSnapshot(state)

            const previousState = state.pastStates[state.pastStates.length - 1]

            return {
                activeTool: state.activeTool,
                ...previousState,
                pastStates: state.pastStates.slice(0, -1),
                futureStates: [currentState, ...state.futureStates],
            }
        }),

    redo: () =>
        set((state) => {
            if (state.futureStates.length === 0) {
                return state
            }

            const currentState = createSnapshot(state)

            const nextState = state.futureStates[0]

            return {
                activeTool: state.activeTool,
                ...nextState,
                pastStates: [...state.pastStates, currentState],
                futureStates: state.futureStates.slice(1),
            }
        }),

    addLine: (name, color, code, lineStyle, transitMode) =>
        set((state) => {
            const id = nanoid()

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: state.segments,
                lines: {
                    ...state.lines,
                    [id]: {
                        id,
                        name,
                        color,
                        code: code && code.length > 0 ? code : undefined,
                        lineStyle: lineStyle ?? 'solid',
                        transitMode: transitMode ?? 'metro',
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    setLineCode: (id, code) =>
        set((state) => {
            const line = state.lines[id]
            if (!line) {
                return state
            }

            const trimmed = code.trim().slice(0, 4)
            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: state.segments,
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        code: trimmed.length > 0 ? trimmed : undefined,
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    setLineName: (id, name) =>
        set((state) => {
            const line = state.lines[id]

            if (!line) {
                return state
            }

            const validation = validateLineName(name)
            if (!validation.valid) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: state.segments,
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        name: validation.sanitized ?? name,
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    clear: () =>
        set(() => ({
            stations: {},
            segments: {},
            lines: {},
            shapes: {},
            pastStates: [],
            futureStates: [],
        })),

    setViewport: (viewport) =>
        set({ viewport }),

    zoomIn: (centerX?: number, centerY?: number) =>
        set((state) => {
            const oldZoom = state.viewport.zoom
            const newZoom = Math.min(10, oldZoom * 1.15)
            const zoomRatio = newZoom / oldZoom

            // If center coordinates are provided, adjust offsets to zoom around that point
            if (centerX !== undefined && centerY !== undefined) {
                return {
                    viewport: {
                        zoom: newZoom,
                        offsetX: centerX - (centerX - state.viewport.offsetX) * zoomRatio,
                        offsetY: centerY - (centerY - state.viewport.offsetY) * zoomRatio,
                    },
                }
            }

            // Otherwise just change zoom (legacy behavior)
            return {
                viewport: {
                    ...state.viewport,
                    zoom: newZoom,
                },
            }
        }),

    zoomOut: (centerX?: number, centerY?: number) =>
        set((state) => {
            const oldZoom = state.viewport.zoom
            const newZoom = Math.max(0.1, oldZoom / 1.15)
            const zoomRatio = newZoom / oldZoom

            // If center coordinates are provided, adjust offsets to zoom around that point
            if (centerX !== undefined && centerY !== undefined) {
                return {
                    viewport: {
                        zoom: newZoom,
                        offsetX: centerX - (centerX - state.viewport.offsetX) * zoomRatio,
                        offsetY: centerY - (centerY - state.viewport.offsetY) * zoomRatio,
                    },
                }
            }

            // Otherwise just change zoom (legacy behavior)
            return {
                viewport: {
                    ...state.viewport,
                    zoom: newZoom,
                },
            }
        }),

    resetViewport: () =>
        set(() => ({
            viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
        })),

    setLineWidth: (width) =>
        set({ lineWidth: width }),

    setGridCellSize: (size) =>
        set(() => ({
            gridCellSize: Math.max(10, Math.min(1000, size)),
        })),

    setGridCellsWidth: (width) =>
        set(() => ({
            gridCellsWidth: Math.max(10, Math.min(1000, width)),
        })),

    setGridCellsHeight: (height) =>
        set(() => ({
            gridCellsHeight: Math.max(10, Math.min(1000, height)),
        })),

    addShape: (points, color, name, opacity) =>
        set((state) => {
            const id = nanoid()
            const currentSnapshot = createSnapshot(state)
            return {
                shapes: {
                    ...state.shapes,
                    [id]: {
                        id,
                        points,
                        color,
                        name: name && name.length > 0 ? name : undefined,
                        opacity: opacity ?? 0.5,
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    updateShape: (id, updates) =>
        set((state) => {
            const shape = state.shapes[id]
            if (!shape) return state
            const currentSnapshot = createSnapshot(state)
            return {
                shapes: {
                    ...state.shapes,
                    [id]: { ...shape, ...updates },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    deleteShape: (id) =>
        set((state) => {
            if (!state.shapes[id]) return state
            const currentSnapshot = createSnapshot(state)
            const { [id]: _removed, ...remainingShapes } = state.shapes
            return {
                shapes: remainingShapes,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

}),
        {
            name: 'transit-editor-storage',
            partialize: (state) => ({
                activeTool: state.activeTool,
                stations: state.stations,
                segments: state.segments,
                lines: state.lines,
                shapes: state.shapes,
                lineWidth: state.lineWidth,
                gridCellSize: state.gridCellSize,
                gridCellsWidth: state.gridCellsWidth,
                gridCellsHeight: state.gridCellsHeight,
            }),
            merge: (persistedState, currentState) => {
                // Validate persisted grid values to prevent corrupted localStorage values
                // from breaking grid snapping
                const persisted = (persistedState ?? {}) as Partial<EditorState>
                const clampGrid = (value: unknown, fallback: number): number => {
                    const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback
                    return Math.max(10, Math.min(1000, num))
                }
                return {
                    ...currentState,
                    ...persisted,
                    gridCellSize: clampGrid(persisted.gridCellSize, currentState.gridCellSize),
                    gridCellsWidth: clampGrid(persisted.gridCellsWidth, currentState.gridCellsWidth),
                    gridCellsHeight: clampGrid(persisted.gridCellsHeight, currentState.gridCellsHeight),
                }
            },
        },
    ),
)
