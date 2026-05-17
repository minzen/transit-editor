import type { EditorTool } from '../store/editorStore'
import type { Line } from '../model/line'

import { LineCreator } from './LineCreator'
import { BackgroundImageControl } from './BackgroundImageControl'
import { GridSizeControl } from './GridSizeControl'

type Props = {
    activeTool: EditorTool
    setActiveTool: (tool: EditorTool) => void
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    exportAsSVG: () => void
    exportAsPNG: () => void
    clear: () => void
    setSelectedLineId: (id: string | null) => void
    setBackgroundImage: (image: string | null) => void
    backgroundImage: string | null
    showBackground: boolean
    setShowBackground: (show: boolean) => void
    gridSize: number
    setGridSize: (size: number) => void
    selectedLineId: string | null
    lines: Record<string, Line>
    isCreatingLine: boolean
    setIsCreatingLine: (creating: boolean) => void
    newLineName: string
    setNewLineName: (name: string) => void
    newLineColor: string
    setNewLineColor: (color: string) => void
    addLine: (name: string, color: string) => void
    setPendingStationId: (id: string | null) => void
    setPointerWorldPosition: (point: { x: number; y: number } | null) => void
    colorPalette: string[]
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

export function EditorToolbar({
    activeTool,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    exportAsSVG,
    exportAsPNG,
    clear,
    setSelectedLineId,
    setBackgroundImage,
    backgroundImage,
    showBackground,
    setShowBackground,
    gridSize,
    setGridSize,
    selectedLineId,
    lines,
    isCreatingLine,
    setIsCreatingLine,
    newLineName,
    setNewLineName,
    newLineColor,
    setNewLineColor,
    addLine,
    setPendingStationId,
    setPointerWorldPosition,
    colorPalette,
}: Props) {
    return (
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
                disabled={!canUndo}
                onClick={undo}
                title="Undo"
            >
                ↶ Undo
            </button>

            <button
                type="button"
                className="editor-toolbar-button"
                disabled={!canRedo}
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
                onClick={exportAsPNG}
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

            <BackgroundImageControl
                backgroundImage={backgroundImage}
                showBackground={showBackground}
                setShowBackground={setShowBackground}
                setBackgroundImage={setBackgroundImage}
            />

            <div className="editor-toolbar-separator" />

            <GridSizeControl
                gridSize={gridSize}
                setGridSize={setGridSize}
            />

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
                        <LineCreator
                            newLineName={newLineName}
                            setNewLineName={setNewLineName}
                            newLineColor={newLineColor}
                            setNewLineColor={setNewLineColor}
                            addLine={addLine}
                            setIsCreatingLine={setIsCreatingLine}
                            colorPalette={colorPalette}
                        />
                    )}
                </>
            )}
        </div>
    )
}
