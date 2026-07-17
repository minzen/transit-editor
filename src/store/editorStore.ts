import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DataSlice } from './slices/dataSlice'
import type { ToolSlice } from './slices/toolSlice'
import type { ViewSlice } from './slices/viewSlice'
import type { AccessibilitySlice } from './slices/accessibilitySlice'
import { createDataSlice } from './slices/dataSlice'
import { createToolSlice } from './slices/toolSlice'
import { createViewSlice } from './slices/viewSlice'
import { createAccessibilitySlice } from './slices/accessibilitySlice'
import { MapDocumentSchema } from '../validation/mapSchema'

export type EditorState = DataSlice & ToolSlice & ViewSlice & AccessibilitySlice

type PersistedEditorState = Pick<
    EditorState,
    | 'activeTool'
    | 'stations'
    | 'segments'
    | 'lines'
    | 'shapes'
    | 'lineWidth'
    | 'gridCellSize'
    | 'gridCellsWidth'
    | 'gridCellsHeight'
    | 'showLineCodes'
    | 'language'
    | 'themeMode'
>

export function getValidatedPersistedState(
    persistedState: unknown,
    currentState: EditorState,
): Partial<EditorState> {
    if (!persistedState || typeof persistedState !== 'object') {
        return {}
    }

    const persisted = persistedState as Partial<PersistedEditorState>
    const map = MapDocumentSchema.safeParse({
        version: 1,
        activeTool: persisted.activeTool,
        stations: persisted.stations,
        segments: persisted.segments,
        lines: persisted.lines,
        shapes: persisted.shapes,
        lineWidth: persisted.lineWidth,
        gridCellSize: persisted.gridCellSize,
        gridCellsWidth: persisted.gridCellsWidth,
        gridCellsHeight: persisted.gridCellsHeight,
        showLineCodes: persisted.showLineCodes,
        language: persisted.language,
    })

    if (map.success === false) {
        return {}
    }

    const themeMode = persisted.themeMode === 'dark' || persisted.themeMode === 'light'
        ? persisted.themeMode
        : currentState.themeMode
    const lines = Object.fromEntries(
        Object.entries(map.data.lines).map(([id, line]) => [
            id,
            {
                ...line,
                lineStyle: line.lineStyle ?? 'solid',
                transitMode: line.transitMode ?? 'metro',
            },
        ])
    )

    return {
        activeTool: map.data.activeTool ?? currentState.activeTool,
        stations: map.data.stations,
        segments: map.data.segments,
        lines,
        shapes: map.data.shapes,
        lineWidth: map.data.lineWidth ?? currentState.lineWidth,
        gridCellSize: map.data.gridCellSize ?? currentState.gridCellSize,
        gridCellsWidth: map.data.gridCellsWidth ?? currentState.gridCellsWidth,
        gridCellsHeight: map.data.gridCellsHeight ?? currentState.gridCellsHeight,
        showLineCodes: map.data.showLineCodes ?? currentState.showLineCodes,
        language: map.data.language ?? currentState.language,
        themeMode,
    }
}
export type { EditorTool } from './slices/toolSlice'

export const useEditorStore = create<EditorState>()(
    persist(
        (...a) => ({
            ...createDataSlice(...a),
            ...createToolSlice(...a),
            ...createViewSlice(...a),
            ...createAccessibilitySlice(...a),
        }),
        {
            name: 'transit-editor-storage',
            version: 1,
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
                showLineCodes: state.showLineCodes,
                language: state.language,
                themeMode: state.themeMode,
            }),
            migrate: (persistedState) => persistedState,
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...getValidatedPersistedState(persistedState, currentState),
            }),
        },
    ),
)
