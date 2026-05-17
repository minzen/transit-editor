import type { EditorTool } from '../store/editorStore'
import type { Line } from '../model/line'

import { LineCreator } from './LineCreator'
import { BackgroundImageControl } from './BackgroundImageControl'
import { GridSizeControl } from './GridSizeControl'
import { HelpDialog } from './HelpDialog'

import { Button, Box, Divider, Select, MenuItem, IconButton, Tooltip } from '@mui/material'
import { Undo, Redo, Home, Help, ZoomIn, ZoomOut, AspectRatio } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

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
    zoomIn: () => void
    zoomOut: () => void
    resetViewport: () => void
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
    zoomIn,
    zoomOut,
    resetViewport,
}: Props) {
    const navigate = useNavigate()
    const [helpOpen, setHelpOpen] = useState(false)

    return (
        <Box className="editor-toolbar" sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
            <Tooltip title="Back to Home">
                <IconButton onClick={() => void navigate('/')}>
                    <Home />
                </IconButton>
            </Tooltip>

            <Tooltip title="Help">
                <IconButton onClick={() => setHelpOpen(true)}>
                    <Help />
                </IconButton>
            </Tooltip>

            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Zoom In">
                <IconButton onClick={zoomIn}>
                    <ZoomIn />
                </IconButton>
            </Tooltip>

            <Tooltip title="Zoom Out">
                <IconButton onClick={zoomOut}>
                    <ZoomOut />
                </IconButton>
            </Tooltip>

            <Tooltip title="Reset View">
                <IconButton onClick={resetViewport}>
                    <AspectRatio />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {tools.map((tool) => (
                <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? 'contained' : 'outlined'}
                    onClick={() => {
                        setActiveTool(tool.id)
                        setPendingStationId(null)
                        setPointerWorldPosition(null)
                    }}
                >
                    {tool.label}
                </Button>
            ))}

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Undo">
                <IconButton onClick={undo} disabled={!canUndo}>
                    <Undo />
                </IconButton>
            </Tooltip>

            <Tooltip title="Redo">
                <IconButton onClick={redo} disabled={!canRedo}>
                    <Redo />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Button onClick={exportAsSVG}>Export SVG</Button>
            <Button onClick={exportAsPNG}>Export PNG</Button>

            <Divider orientation="vertical" flexItem />

            <Button
                onClick={() => {
                    if (window.confirm('Are you sure you want to clear all data?')) {
                        clear()
                        setSelectedLineId(null)
                        setBackgroundImage(null)
                    }
                }}
            >
                Clear
            </Button>

            <Divider orientation="vertical" flexItem />

            <BackgroundImageControl
                backgroundImage={backgroundImage}
                showBackground={showBackground}
                setShowBackground={setShowBackground}
                setBackgroundImage={setBackgroundImage}
            />

            <Divider orientation="vertical" flexItem />

            <GridSizeControl
                gridSize={gridSize}
                setGridSize={setGridSize}
            />

            {activeTool === 'segment' && (
                <>
                    <Divider orientation="vertical" flexItem />
                    <Select
                        value={selectedLineId || ''}
                        onChange={(e) => setSelectedLineId(e.target.value || null)}
                        displayEmpty
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">Select line...</MenuItem>
                        {Object.values(lines).map((line) => (
                            <MenuItem key={line.id} value={line.id}>
                                {line.name}
                            </MenuItem>
                        ))}
                    </Select>
                    <Button onClick={() => setIsCreatingLine(true)}>+ Line</Button>

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
        </Box>
    )
}
