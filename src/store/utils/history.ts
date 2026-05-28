import type { Station } from '../../model/station'
import type { Segment } from '../../model/segment'
import type { Line } from '../../model/line'
import type { Shape } from '../../model/shape'

export type DataSnapshot = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
    shapes: Record<string, Shape>
}

export type DeltaGroup<T> = Record<string, T | null>

export type DataDelta = {
    stations: DeltaGroup<Station>
    segments: DeltaGroup<Segment>
    lines: DeltaGroup<Line>
    shapes: DeltaGroup<Shape>
}

export type HistoryStep = {
    undo: DataDelta
    redo: DataDelta
}

/**
 * Returns true if a delta actually contains any modified, added, or deleted entities.
 */
export function hasChanges(delta: DataDelta): boolean {
    return (
        Object.keys(delta.stations).length > 0 ||
        Object.keys(delta.segments).length > 0 ||
        Object.keys(delta.lines).length > 0 ||
        Object.keys(delta.shapes).length > 0
    )
}

type Entity = Station | Segment | Line | Shape

/**
 * Calculates a delta step to move from a previous state to a next state.
 */
export function createDelta(prev: DataSnapshot, next: DataSnapshot): HistoryStep {
    const step: HistoryStep = {
        undo: { stations: {}, segments: {}, lines: {}, shapes: {} },
        redo: { stations: {}, segments: {}, lines: {}, shapes: {} }
    }

    const keys: (keyof DataSnapshot)[] = ['stations', 'segments', 'lines', 'shapes']

    for (const key of keys) {
        const prevDict = prev[key] as Record<string, Entity>
        const nextDict = next[key] as Record<string, Entity>

        const undoDict = step.undo[key] as Record<string, Entity | null>
        const redoDict = step.redo[key] as Record<string, Entity | null>

        // Find modified or deleted elements
        for (const id in prevDict) {
            const prevVal = prevDict[id]
            const nextVal = nextDict[id]

            if (nextVal === undefined) {
                // Deleted in nextState
                undoDict[id] = prevVal
                redoDict[id] = null
            } else if (prevVal !== nextVal) {
                // Modified in nextState
                undoDict[id] = prevVal
                redoDict[id] = nextVal
            }
        }

        // Find newly added elements
        for (const id in nextDict) {
            if (prevDict[id] === undefined) {
                // Added in nextState
                undoDict[id] = null
                redoDict[id] = nextDict[id]
            }
        }
    }

    return step
}

/**
 * Applies a given delta (either undo or redo) to a state, returning the new state.
 */
export function applyDelta(
    current: DataSnapshot,
    delta: DataDelta
): DataSnapshot {
    const nextState = {
        stations: { ...current.stations },
        segments: { ...current.segments },
        lines: { ...current.lines },
        shapes: { ...current.shapes }
    }

    const keys: (keyof DataSnapshot)[] = ['stations', 'segments', 'lines', 'shapes']

    for (const key of keys) {
        const dict = nextState[key] as Record<string, Entity>
        const deltaDict = delta[key] as Record<string, Entity | null>

        for (const id in deltaDict) {
            const val = deltaDict[id]
            if (val === null) {
                delete dict[id]
            } else {
                dict[id] = val
            }
        }
    }

    return nextState
}
