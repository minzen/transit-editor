import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import { createOctolinearPath } from '../geometry/octolinear'

export type EditorTool = 'select' | 'station' | 'segment'

type DataSnapshot = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
}

type EditorState = {
    activeTool: EditorTool
    stations: Record<string, Station>
    segments: Record<string, Segment>

    pastStates: DataSnapshot[]
    futureStates: DataSnapshot[]

    setActiveTool: (tool: EditorTool) => void
    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
    setStationName: (id: string, name: string) => void
    updateSegmentPoint: (segmentId: string, pointIndex: number, x: number, y: number) => void
    addSegment: (fromStationId: string, toStationId: string, color: string) => void
    undo: () => void
    redo: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
    activeTool: 'select',
    stations: {},
    segments: {},
    pastStates: [],
    futureStates: [],

    setActiveTool: (tool) =>
        set({
            activeTool: tool,
        }),

    addStation: (x, y) =>
        set((state) => {
            const id = nanoid()

            const currentSnapshot: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
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
                segments: state.segments,
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

            const currentSnapshot: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
            }

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

            const currentSnapshot: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
            }

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        name,
                    },
                },
                segments: state.segments,
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

            const currentSnapshot: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
            }

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
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    addSegment: (
        fromStationId,
        toStationId,
        color
    ) =>
        set((state) => {
            const from =
                state.stations[fromStationId]

            const to =
                state.stations[toStationId]

            if (!from || !to) {
                return state
            }

            const id = nanoid()
            const points = createOctolinearPath(from, to)

            const currentSnapshot: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
            }

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,

                    [id]: {
                        id,

                        fromStationId,
                        toStationId,

                        color,

                        points,
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    undo: () =>
        set((state) => {
            if (state.pastStates.length === 0) {
                return state
            }

            const currentState: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
            }

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

            const currentState: DataSnapshot = {
                stations: state.stations,
                segments: state.segments,
            }

            const nextState = state.futureStates[0]

            return {
                activeTool: state.activeTool,
                ...nextState,
                pastStates: [...state.pastStates, currentState],
                futureStates: state.futureStates.slice(1),
            }
        }),

}))
