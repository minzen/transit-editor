import type { EditorTool } from '../store/editorStore'
import type { Line, LineStyle, TransitMode } from '../model/line'

import { LineCreator } from './LineCreator'
import { BackgroundImageControl } from './BackgroundImageControl'
import { GridSizeControl } from './GridSizeControl'
import { LineWidthControl } from './LineWidthControl'
import { HelpDialog } from './HelpDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { ImportErrorDialog } from './ImportErrorDialog'
import { useMapJSON } from './useMapJSON'

import { Button, Box, Divider, Select, MenuItem, IconButton, Tooltip, useMediaQuery, useTheme, Popover, Dialog, FormControl, InputLabel, Menu } from '@mui/material'
import { Undo, Redo, Home, Help, ZoomIn, ZoomOut, FitScreen, MoreVert, DarkMode, LightMode, RestartAlt } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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
    onPrint: () => void
    clear: () => void
    setSelectedLineId: (id: string | null) => void
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
    addLine: (name: string, color: string, code?: string, lineStyle?: LineStyle, transitMode?: TransitMode, lineWidth?: number) => void
    setLineName: (id: string, name: string) => void
    setLineCode: (id: string, code: string) => void
    setLineColor: (id: string, color: string) => void
    setLineStyle: (id: string, lineStyle: LineStyle) => void
    setLineTransitMode: (id: string, transitMode: TransitMode) => void
    setLineLineWidth: (id: string, lineWidth: number | undefined) => void
    deleteLine: (id: string) => void
    setPendingStationId: (id: string | null) => void
    setPointerWorldPosition: (point: { x: number; y: number } | null) => void
    colorPalette: string[]
    zoomIn: () => void
    zoomOut: () => void
    resetViewport: () => void
    autoPlaceLabels: () => void
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
    onPrint,
    clear,
    setSelectedLineId,
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
    addLine,
    setLineName,
    setLineCode,
    setLineColor,
    setLineStyle,
    setLineTransitMode,
    setLineLineWidth,
    deleteLine,
    setPendingStationId,
    setPointerWorldPosition,
    colorPalette,
    zoomIn,
    zoomOut,
    resetViewport,
    autoPlaceLabels,
    shapeColor,
    setShapeColor,
}: Props) {
    const navigate = useNavigate()
    const [helpOpen, setHelpOpen] = useState(false)
    const [deleteLineConfirmOpen, setDeleteLineConfirmOpen] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null)
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
    const [editLineOpen, setEditLineOpen] = useState(false)
    const { t } = useTranslation()
    const language = useEditorStore((s) => s.language)
    const setLanguage = useEditorStore((s) => s.setLanguage)
    const canvasBackgroundColor = useEditorStore((s) => s.canvasBackgroundColor)
    const setCanvasBackgroundColor = useEditorStore((s) => s.setCanvasBackgroundColor)
    const themeMode = useEditorStore((s) => s.themeMode)
    const anarchyMode = useEditorStore((s) => s.anarchyMode)

    // Track line creation to auto-select the new line
    const prevLineCountRef = useRef(Object.keys(lines).length)

    useEffect(() => {
        if (!isCreatingLine && prevLineCountRef.current < Object.keys(lines).length) {
            // Line was just created - select the most recently added line
            const lineIds = Object.keys(lines)
            const newLineId = lineIds[lineIds.length - 1]
            if (newLineId) {
                setSelectedLineId(newLineId)
            }
        }
        prevLineCountRef.current = Object.keys(lines).length
    }, [isCreatingLine, lines, setSelectedLineId])

    const setBackgroundImageUrl = useEditorStore((s) => s.setBackgroundImageUrl)
    const { exportAsJSON, triggerImport } = useMapJSON()
    const [importErrors, setImportErrors] = useState<string[]>([])
    const [importErrorOpen, setImportErrorOpen] = useState(false)
    const [importExportMenuAnchor, setImportExportMenuAnchor] = useState<HTMLElement | null>(null)

    const handleImport = async () => {
        const result = await triggerImport()
        if (!result.success) {
            setImportErrors(result.errors)
            setImportErrorOpen(true)
        }
    }

    const handleClear = () => {
        clear()
        setSelectedLineId(null)
        setBackgroundImageUrl(null)
        setClearConfirmOpen(false)
    }

    return (
        <Box className="editor-toolbar" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, p: 1 }}>
            <Tooltip title={t('toolbar.backToHome')}>
                <IconButton aria-label={t('toolbar.backToHome')} onClick={() => void navigate('/')}>
                    <Home />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.help')}>
                <IconButton aria-label={t('toolbar.help')} onClick={() => setHelpOpen(true)}>
                    <Help />
                </IconButton>
            </Tooltip>

            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

            <Divider orientation="vertical" flexItem />

            <Tooltip title={t('toolbar.zoomIn')}>
                <IconButton aria-label={t('toolbar.zoomIn')} onClick={zoomIn}>
                    <ZoomIn />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.zoomOut')}>
                <IconButton aria-label={t('toolbar.zoomOut')} onClick={zoomOut}>
                    <ZoomOut />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.resetView')}>
                <IconButton aria-label={t('toolbar.resetView')} onClick={resetViewport}>
                    <FitScreen />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {toolKeys.map((tool) => (
                <Button
                    key={tool.id}
                    aria-pressed={activeTool === tool.id}
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
                <IconButton aria-label={t('toolbar.undo')} onClick={undo} disabled={!canUndo}>
                    <Undo />
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.redo')}>
                <IconButton aria-label={t('toolbar.redo')} onClick={redo} disabled={!canRedo}>
                    <Redo />
                </IconButton>
            </Tooltip>

            {isMobile ? (
                <>
                    <Tooltip title={t('toolbar.more')}>
                        <IconButton aria-label={t('toolbar.more')} onClick={(e) => setMoreAnchor(e.currentTarget)}>
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
                            <Button onClick={() => { onPrint(); setMoreAnchor(null) }}>{t('toolbar.print')}</Button>
                            <Button onClick={() => { exportAsJSON(); setMoreAnchor(null) }}>{t('toolbar.exportJSON')}</Button>
                            <Divider />
                            <Button onClick={() => { void handleImport(); setMoreAnchor(null) }}>{t('toolbar.importJSON')}</Button>
                            <Divider />
                            <Button
                                onClick={() => {
                                    setClearConfirmOpen(true)
                                    setMoreAnchor(null)
                                }}
                            >
                                {t('toolbar.clear')}
                            </Button>
                            <Divider />
                            <BackgroundImageControl />
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
                            <Divider />
                            <Button onClick={() => { autoPlaceLabels(); setMoreAnchor(null) }}>
                                {t('toolbar.autoPlaceLabels')}
                            </Button>
                        </Box>
                    </Popover>
                </>
            ) : (
                <>
                    <Divider orientation="vertical" flexItem />

                    <Button onClick={(e) => setImportExportMenuAnchor(e.currentTarget)}>{t('toolbar.importExport')}</Button>
                    <Menu
                        anchorEl={importExportMenuAnchor}
                        open={Boolean(importExportMenuAnchor)}
                        onClose={() => setImportExportMenuAnchor(null)}
                    >
                        <MenuItem onClick={() => { exportAsSVG(); setImportExportMenuAnchor(null) }}>{t('toolbar.exportSVG')}</MenuItem>
                        <MenuItem onClick={() => { exportAsPNG(); setImportExportMenuAnchor(null) }}>{t('toolbar.exportPNG')}</MenuItem>
                        <MenuItem onClick={() => { onPrint(); setImportExportMenuAnchor(null) }}>{t('toolbar.print')}</MenuItem>
                        <MenuItem onClick={() => { exportAsJSON(); setImportExportMenuAnchor(null) }}>{t('toolbar.exportJSON')}</MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { void handleImport(); setImportExportMenuAnchor(null) }}>{t('toolbar.importJSON')}</MenuItem>
                    </Menu>

                    <Divider orientation="vertical" flexItem />

                    <Button
                        onClick={() => setClearConfirmOpen(true)}
                    >
                        {t('toolbar.clear')}
                    </Button>

                    <Button onClick={autoPlaceLabels}>
                        {t('toolbar.autoPlaceLabels')}
                    </Button>

                    <Divider orientation="vertical" flexItem />

                    <BackgroundImageControl />

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

            <Tooltip title={t('toolbar.toggleTheme')}>
                <IconButton
                    aria-label={t('toolbar.toggleTheme')}
                    onClick={() => {
                        const next = useEditorStore.getState().themeMode === 'light' ? 'dark' : 'light'
                        useEditorStore.getState().setThemeMode(next)
                    }}
                >
                    {useEditorStore.getState().themeMode === 'light' ? <DarkMode /> : <LightMode />}
                </IconButton>
            </Tooltip>

            <Tooltip title={t('toolbar.backgroundColor')}>
                <Box
                    sx={{
                        position: 'relative',
                        width: 24,
                        height: 24,
                        overflow: 'hidden',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="color"
                        value={canvasBackgroundColor || (themeMode === 'dark' ? '#1e1e2e' : '#f5f5f5')}
                        onChange={(e) => setCanvasBackgroundColor(e.target.value)}
                        style={{
                            position: 'absolute',
                            top: -4,
                            left: -4,
                            width: 32,
                            height: 32,
                            padding: 0,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    />
                </Box>
            </Tooltip>
            {canvasBackgroundColor && (
                <Tooltip title={t('toolbar.resetBackgroundColor')}>
                    <IconButton size="small" onClick={() => setCanvasBackgroundColor('')}>
                        <RestartAlt fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

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
                        {Object.values(lines)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((line) => (
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
                        <>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setEditLineOpen(true)}
                            >
                                {t('common.edit')}
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => setDeleteLineConfirmOpen(true)}
                            >
                                {t('common.delete')}
                            </Button>
                        </>
                    )}

                    <Dialog
                        open={isCreatingLine}
                        onClose={() => setIsCreatingLine(false)}
                        fullScreen={isMobile}
                        maxWidth="md"
                        fullWidth
                    >
                        <LineCreator
                            colorPalette={colorPalette}
                            anarchyMode={anarchyMode}
                            onSave={(values) => {
                                addLine(values.name, values.color, values.code, values.lineStyle, values.transitMode, values.lineWidth)
                                setIsCreatingLine(false)
                            }}
                            onCancel={() => setIsCreatingLine(false)}
                        />
                    </Dialog>

                    <Dialog
                        open={editLineOpen}
                        onClose={() => setEditLineOpen(false)}
                        fullScreen={isMobile}
                        maxWidth="md"
                        fullWidth
                    >
                        <LineCreator
                            colorPalette={colorPalette}
                            anarchyMode={anarchyMode}
                            initialLine={selectedLineId ? lines[selectedLineId] : undefined}
                            onSave={(values) => {
                                if (selectedLineId) {
                                    setLineName(selectedLineId, values.name)
                                    setLineCode(selectedLineId, values.code ?? '')
                                    setLineColor(selectedLineId, values.color)
                                    setLineStyle(selectedLineId, values.lineStyle)
                                    setLineTransitMode(selectedLineId, values.transitMode)
                                    setLineLineWidth(selectedLineId, values.lineWidth)
                                }
                                setEditLineOpen(false)
                            }}
                            onCancel={() => setEditLineOpen(false)}
                        />
                    </Dialog>
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
            <ConfirmDialog
                open={deleteLineConfirmOpen}
                title={t('toolbar.deleteLine')}
                message={t('toolbar.deleteLineMessage')}
                confirmLabel={t('common.delete')}
                onConfirm={() => {
                    if (selectedLineId) {
                        deleteLine(selectedLineId)
                        setSelectedLineId(null)
                    }
                    setDeleteLineConfirmOpen(false)
                }}
                onCancel={() => setDeleteLineConfirmOpen(false)}
            />
            <ImportErrorDialog
                open={importErrorOpen}
                errors={importErrors}
                onClose={() => setImportErrorOpen(false)}
            />
        </Box>
    )
}
