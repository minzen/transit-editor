import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import type { Viewport } from '../viewport/coordinates'
import { createOctolinearPath } from '../geometry/octolinear'
import { validateLineName, validateStationName } from '../validation/constants'

export type EditorTool = 'select' | 'station' | 'segment'

type DataSnapshot = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
}

const createSnapshot = (state: EditorState): DataSnapshot => ({
    stations: state.stations,
    segments: state.segments,
    lines: state.lines,
})

type EditorState = {
    activeTool: EditorTool
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
    viewport: Viewport

    pastStates: DataSnapshot[]
    futureStates: DataSnapshot[]

    setActiveTool: (tool: EditorTool) => void
    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
    setStationName: (id: string, name: string) => void
    deleteStation: (id: string) => void
    updateSegmentPoint: (segmentId: string, pointIndex: number, x: number, y: number) => void
    addSegment: (fromStationId: string, toStationId: string, lineId: string) => void
    deleteSegment: (id: string) => void
    addLine: (name: string, color: string) => void
    setLineName: (id: string, name: string) => void
    clear: () => void
    undo: () => void
    redo: () => void
    setViewport: (viewport: Viewport) => void
    zoomIn: () => void
    zoomOut: () => void
    resetViewport: () => void
}

export const useEditorStore = create<EditorState>()(
    persist(
        (set) => ({
    activeTool: 'select',
    stations: {},
    segments: {},
    lines: {},
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
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

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        id,
                        x,
                        y,
                    },
                },
                segments: state.segments,
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

                        lineId,
                        color: line.color,

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

    addLine: (name, color) =>
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
            pastStates: [],
            futureStates: [],
        })),

    setViewport: (viewport) =>
        set({ viewport }),

    zoomIn: () =>
        set((state) => ({
            viewport: {
                ...state.viewport,
                zoom: Math.min(10, state.viewport.zoom * 1.15),
            },
        })),

    zoomOut: () =>
        set((state) => ({
            viewport: {
                ...state.viewport,
                zoom: Math.max(0.1, state.viewport.zoom / 1.15),
            },
        })),

    resetViewport: () =>
        set(() => ({
            viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
        })),

}),
        {
            name: 'transit-editor-storage',
            partialize: (state) => ({
                activeTool: state.activeTool,
                stations: state.stations,
                segments: state.segments,
                lines: state.lines,
            }),
        },
    ),
)
