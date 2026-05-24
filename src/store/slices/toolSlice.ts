import type { StateCreator } from 'zustand'

export type EditorTool = 'select' | 'station' | 'segment' | 'shape'

export type ToolSlice = {
    activeTool: EditorTool
    setActiveTool: (tool: EditorTool) => void
}

export const createToolSlice: StateCreator<ToolSlice, [], [], ToolSlice> = (set) => ({
    activeTool: 'select',
    setActiveTool: (tool) =>
        set({
            activeTool: tool,
        }),
})
