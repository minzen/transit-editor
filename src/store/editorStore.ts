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

export type EditorState = DataSlice & ToolSlice & ViewSlice & AccessibilitySlice
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
            migrate: (persistedState, version) => {
                // Handle cleared localStorage (null/undefined persistedState)
                if (!persistedState) {
                    return {
                        activeTool: 'select',
                        stations: {},
                        segments: {},
                        lines: {},
                        shapes: {},
                        lineWidth: 10,
                        gridCellSize: 50,
                        gridCellsWidth: 80,
                        gridCellsHeight: 80,
                        showLineCodes: true,
                        language: 'en',
                        themeMode: 'light',
                    }
                }
                if (version === 0) {
                    // Unversioned storage: ensure all newer fields have sensible defaults
                    const state = persistedState as Partial<EditorState>
                    const migratedLines = state.lines
                        ? Object.fromEntries(
                            Object.entries(state.lines).map(([id, line]) => [
                                id,
                                {
                                    ...line,
                                    lineStyle: line.lineStyle ?? 'solid',
                                    transitMode: line.transitMode ?? 'metro',
                                },
                            ])
                        )
                        : {}
                    return {
                        ...state,
                        activeTool: state.activeTool ?? 'select',
                        stations: state.stations ?? {},
                        segments: state.segments ?? {},
                        lines: migratedLines,
                        shapes: state.shapes ?? {},
                        lineWidth: typeof state.lineWidth === 'number' ? state.lineWidth : 10,
                        gridCellSize: typeof state.gridCellSize === 'number' ? state.gridCellSize : 50,
                        gridCellsWidth: typeof state.gridCellsWidth === 'number' ? state.gridCellsWidth : 80,
                        gridCellsHeight: typeof state.gridCellsHeight === 'number' ? state.gridCellsHeight : 80,
                        showLineCodes: state.showLineCodes ?? true,
                        language: state.language ?? 'en',
                        themeMode: state.themeMode ?? 'light',
                    }
                }
                return persistedState
            },
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
