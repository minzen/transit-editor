import type { EditorTool } from '../store/editorStore'
import type { Line, LineStyle, TransitMode } from '../model/line'

import { LineCreator } from './LineCreator'
import { BackgroundImageControl } from './BackgroundImageControl'
import { GridSizeControl } from './GridSizeControl'
import { LineWidthControl } from './LineWidthControl'
import { HelpDialog } from './HelpDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { RenameDialog } from './RenameDialog'

import { Button, Box, Divider, Select, MenuItem, IconButton, Tooltip, useMediaQuery, useTheme, Popover, Dialog, FormControl, InputLabel } from '@mui/material'
import { Undo, Redo, Home, Help, ZoomIn, ZoomOut, FitScreen, MoreVert } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n.ts'
import { useEditorStore } from '../store/editorStore'

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
    gridCellsWidth: number
    setGridCellsWidth: (width: number) => void
    gridCellsHeight: number
    setGridCellsHeight: (height: number) => void
    lineWidth: number
    setLineWidth: (width: number) => void
    showLineCodes: boolean
    setShowLineCodes: (show: boolean) => void
    selectedLineId: string | null
    lines: Record<string, Line>
    isCreatingLine: boolean
    setIsCreatingLine: (creating: boolean) => void
    newLineName: string
    setNewLineName: (name: string) => void
    newLineColor: string
    setNewLineColor: (color: string) => void
    addLine: (name: string, color: string, code?: string, lineStyle?: LineStyle, transitMode?: TransitMode) => void
    setLineName: (id: string, name: string) => void
    setPendingStationId: (id: string | null) => void
    setPointerWorldPosition: (point: { x: number; y: number } | null) => void
    colorPalette: string[]
    zoomIn: () => void
    zoomOut: () => void
    resetViewport: () => void
    shapeColor?: string
    setShapeColor?: (color: string) => void
}

const toolKeys: { id: EditorTool; key: string }[] = [
    { id: 'select', key: 'toolbar.select' },
    { id: 'station', key: 'toolbar.station' },
    { id: 'segment', key: 'toolbar.segment' },
    { id: 'shape', key: 'toolbar.shape' },
]

const TRANSIT_MODE_LABEL: Record<TransitMode, string> = {
    metro: 'M',
    rail: 'R',
    tram: 'T',
    bus: 'B',
    ferry: 'F',
}

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
    gridCellsWidth,
    setGridCellsWidth,
    gridCellsHeight,
    setGridCellsHeight,
    lineWidth,
    setLineWidth,
    showLineCodes,
    setShowLineCodes,
    selectedLineId,
    lines,
    isCreatingLine,
    setIsCreatingLine,
    newLineName,
    setNewLineName,
    newLineColor,
    setNewLineColor,
    addLine,
    setLineName,
    setPendingStationId,
    setPointerWorldPosition,
    colorPalette,
    zoomIn,
    zoomOut,
    resetViewport,
    shapeColor,
    setShapeColor,
}: Props) {
    const navigate = useNavigate()
    const [helpOpen, setHelpOpen] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null)
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
    const [renameLineOpen, setRenameLineOpen] = useState(false)
    const { t } = useTranslation()
    const language = useEditorStore((s) => s.language)
    const setLanguage = useEditorStore((s) => s.setLanguage)

    const handleClear = () => {
        clear()
        setSelectedLineId(null)
        setBackgroundImage(null)
        setClearConfirmOpen(false)
    }

    return (
        <Box className="editor-toolbar" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, p: 1 }}>
            <Tooltip title={t('toolbar.backToHome')}>
                <IconButton onClick={() => void navigate('/')}>
                    <Home />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.help')}>
                <IconButton onClick={() => setHelpOpen(true)}>
                    <Help />
                </IconButton>
            </Tooltip>

            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

            <Divider orientation="vertical" flexItem />

            <Tooltip title={t('toolbar.zoomIn')}>
                <IconButton onClick={zoomIn}>
                    <ZoomIn />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.zoomOut')}>
                <IconButton onClick={zoomOut}>
                    <ZoomOut />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.resetView')}>
                <IconButton onClick={resetViewport}>
                    <FitScreen />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {toolKeys.map((tool) => (
                <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? 'contained' : 'outlined'}
                    onClick={() => {
                        setActiveTool(tool.id)
                        setPendingStationId(null)
                        setPointerWorldPosition(null)
                    }}
                >
                    {t(tool.key)}
                </Button>
            ))}

            {activeTool === 'shape' && shapeColor && setShapeColor && (
                <>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {colorPalette.slice(0, 10).map((c) => (
                            <Box
                                key={c}
                                onClick={() => setShapeColor(c)}
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: c,
                                    cursor: 'pointer',
                                    border:
                                        c === shapeColor
                                            ? '2px solid #000'
                                            : '2px solid transparent',
                                }}
                            />
                        ))}
                    </Box>
                </>
            )}

            <Divider orientation="vertical" flexItem />

            <Tooltip title={t('toolbar.undo')}>
                <IconButton onClick={undo} disabled={!canUndo}>
                    <Undo />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.redo')}>
                <IconButton onClick={redo} disabled={!canRedo}>
                    <Redo />
                </IconButton>
            </Tooltip>

            {isMobile ? (
                <>
                    <Tooltip title={t('toolbar.more')}>
                        <IconButton onClick={(e) => setMoreAnchor(e.currentTarget)}>
                            <MoreVert />
                        </IconButton>
                    </Tooltip>
                    <Popover
                        open={Boolean(moreAnchor)}
                        anchorEl={moreAnchor}
                        onClose={() => setMoreAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
                            <Button onClick={() => { exportAsSVG(); setMoreAnchor(null) }}>{t('toolbar.exportSVG')}</Button>
                            <Button onClick={() => { exportAsPNG(); setMoreAnchor(null) }}>{t('toolbar.exportPNG')}</Button>
                            <Button
                                onClick={() => {
                                    setClearConfirmOpen(true)
                                    setMoreAnchor(null)
                                }}
                            >
                                {t('toolbar.clear')}
                            </Button>
                            <Divider />
                            <BackgroundImageControl
                                backgroundImage={backgroundImage}
                                showBackground={showBackground}
                                setShowBackground={setShowBackground}
                                setBackgroundImage={setBackgroundImage}
                            />
                            <Divider />
                            <GridSizeControl
                                gridCellsWidth={gridCellsWidth}
                                setGridCellsWidth={setGridCellsWidth}
                                gridCellsHeight={gridCellsHeight}
                                setGridCellsHeight={setGridCellsHeight}
                            />
                            <LineWidthControl
                                lineWidth={lineWidth}
                                setLineWidth={setLineWidth}
                            />
                            <Button
                                variant={showLineCodes ? 'contained' : 'outlined'}
                                onClick={() => setShowLineCodes(!showLineCodes)}
                            >
                                {showLineCodes ? t('toolbar.hideLineCodes') : t('toolbar.showLineCodes')}
                            </Button>
                        </Box>
                    </Popover>
                </>
            ) : (
                <>
                    <Divider orientation="vertical" flexItem />

                    <Button onClick={exportAsSVG}>{t('toolbar.exportSVG')}</Button>
                    <Button onClick={exportAsPNG}>{t('toolbar.exportPNG')}</Button>

                    <Divider orientation="vertical" flexItem />

                    <Button
                        onClick={() => setClearConfirmOpen(true)}
                    >
                        {t('toolbar.clear')}
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
                        gridCellsWidth={gridCellsWidth}
                        setGridCellsWidth={setGridCellsWidth}
                        gridCellsHeight={gridCellsHeight}
                        setGridCellsHeight={setGridCellsHeight}
                    />

                    <LineWidthControl
                        lineWidth={lineWidth}
                        setLineWidth={setLineWidth}
                    />

                    <Tooltip title={showLineCodes ? t('toolbar.hideLineCodes') : t('toolbar.showLineCodes')}>
                        <Button
                            variant={showLineCodes ? 'contained' : 'outlined'}
                            onClick={() => setShowLineCodes(!showLineCodes)}
                            sx={{ minWidth: 40, px: 1 }}
                        >
                            {t('toolbar.codes')}
                        </Button>
                    </Tooltip>
                </>
            )}

            <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel id="language-select-label" sx={{ fontSize: '0.75rem' }}>Lang</InputLabel>
                <Select
                    labelId="language-select-label"
                    value={language}
                    onChange={(e) => {
                        const lang = e.target.value
                        setLanguage(lang)
                        void i18n.changeLanguage(lang)
                    }}
                    label="Lang"
                    sx={{ fontSize: '0.75rem' }}
                >
                    <MenuItem value="en">EN</MenuItem>
                    <MenuItem value="de">DE</MenuItem>
                </Select>
            </FormControl>

            {activeTool === 'segment' && (
                <>
                    <Divider orientation="vertical" flexItem />
                    <Select
                        value={selectedLineId ?? ''}
                        onChange={(e) => setSelectedLineId(e.target.value || null)}
                        displayEmpty
                        renderValue={(value) => {
                            if (!value) return t('toolbar.selectLine')
                            const line = lines[value]
                            if (!line) return t('toolbar.selectLine')
                            return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: line.color,
                                            border: '1px solid rgba(0,0,0,0.2)',
                                        }}
                                    />
                                    <span>{line.name}</span>
                                </Box>
                            )
                        }}
                        sx={{ minWidth: isMobile ? 80 : 140 }}
                    >
                        <MenuItem value="">{t('toolbar.selectLine')}</MenuItem>
                        {Object.values(lines).map((line) => (
                            <MenuItem key={line.id} value={line.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: line.color,
                                            border: '1px solid rgba(0,0,0,0.2)',
                                        }}
                                    />
                                    <span>{line.name}</span>
                                    <Box
                                        component="span"
                                        sx={{
                                            ml: 'auto',
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            px: 0.5,
                                            py: 0.25,
                                            borderRadius: 0.5,
                                            backgroundColor: 'action.selected',
                                            color: 'text.secondary',
                                        }}
                                    >
                                        {TRANSIT_MODE_LABEL[line.transitMode ?? 'metro']}
                                    </Box>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                    <Button onClick={() => setIsCreatingLine(true)}>{t('toolbar.addLine')}</Button>
                    {selectedLineId && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setRenameLineOpen(true)}
                        >
                            {t('common.rename')}
                        </Button>
                    )}

                    <Dialog
                        open={isCreatingLine}
                        onClose={() => setIsCreatingLine(false)}
                        fullScreen={isMobile}
                    >
                        <LineCreator
                            newLineName={newLineName}
                            setNewLineName={setNewLineName}
                            newLineColor={newLineColor}
                            setNewLineColor={setNewLineColor}
                            addLine={addLine}
                            setIsCreatingLine={setIsCreatingLine}
                            colorPalette={colorPalette}
                        />
                    </Dialog>

                    <RenameDialog
                        open={renameLineOpen}
                        title={t('toolbar.renameLine')}
                        initialValue={selectedLineId ? lines[selectedLineId]?.name : ''}
                        placeholder={t('toolbar.lineNamePlaceholder')}
                        confirmLabel={t('common.save')}
                        onConfirm={(name) => {
                            if (selectedLineId) {
                                setLineName(selectedLineId, name)
                            }
                            setRenameLineOpen(false)
                        }}
                        onCancel={() => setRenameLineOpen(false)}
                    />
                </>
            )}
            <ConfirmDialog
                open={clearConfirmOpen}
                title={t('toolbar.clearAllData')}
                message={t('toolbar.clearAllDataMessage')}
                confirmLabel={t('toolbar.clear')}
                onConfirm={handleClear}
                onCancel={() => setClearConfirmOpen(false)}
            />
        </Box>
    )
}
