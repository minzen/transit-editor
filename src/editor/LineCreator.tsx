import { useState } from 'react'
import { TextField, Box, Button, IconButton, Stack, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { validateLineName, VALIDATION } from '../validation/constants'
import type { LineStyle, TransitMode } from '../model/line'

type Props = {
    newLineName: string
    setNewLineName: (name: string) => void
    newLineColor: string
    setNewLineColor: (color: string) => void
    addLine: (name: string, color: string, code?: string, lineStyle?: LineStyle, transitMode?: TransitMode) => void
    setIsCreatingLine: (creating: boolean) => void
    colorPalette: string[]
}

const MAX_LINE_CODE_LENGTH = 4
const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'double']
const TRANSIT_MODES: TransitMode[] = ['metro', 'rail', 'tram', 'bus', 'ferry']

function isValidHexColor(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function LineCreator({
    newLineName,
    setNewLineName,
    newLineColor,
    setNewLineColor,
    addLine,
    setIsCreatingLine,
    colorPalette,
}: Props) {
    const { t } = useTranslation()
    const validation = validateLineName(newLineName)
    const [newLineCode, setNewLineCode] = useState('')
    const [lineStyle, setLineStyle] = useState<LineStyle>('solid')
    const [transitMode, setTransitMode] = useState<TransitMode>('metro')

    const handleCreate = () => {
        if (validation.valid) {
            addLine(
                validation.sanitized ?? newLineName,
                newLineColor,
                newLineCode.trim() || undefined,
                lineStyle,
                transitMode
            )
            setNewLineName('')
            setNewLineColor('#1976d2')
            setNewLineCode('')
            setLineStyle('solid')
            setTransitMode('metro')
            setIsCreatingLine(false)
        }
    }

    const handleHexColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setNewLineColor(value)
    }

    const isCustomColor = !colorPalette.includes(newLineColor)

    return (
        <Box className="editor-line-creator" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}>
            <TextField
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
                placeholder={t('lineCreator.lineNamePlaceholder')}
                size="small"
                sx={{ minWidth: 120 }}
                slotProps={{
                    htmlInput: {
                        maxLength: VALIDATION.MAX_LINE_NAME_LENGTH,
                    },
                }}
                error={!validation.valid && newLineName.length > 0}
                helperText={!validation.valid && newLineName.length > 0 ? validation.error : ''}
            />
            <Stack direction="row" spacing={0.5} className="editor-color-palette">
                {colorPalette.map((color) => (
                    <IconButton
                        key={color}
                        sx={{
                            backgroundColor: color,
                            width: 24,
                            height: 24,
                            border: newLineColor === color ? 2 : 1,
                            borderColor: newLineColor === color ? 'primary.main' : 'grey.300',
                            '&:hover': {
                                backgroundColor: color,
                                opacity: 0.8,
                            },
                        }}
                        onClick={() => setNewLineColor(color)}
                        title={color}
                    />
                ))}
                <IconButton
                    sx={{
                        backgroundColor: newLineColor,
                        width: 24,
                        height: 24,
                        border: isCustomColor ? 2 : 1,
                        borderColor: isCustomColor ? 'primary.main' : 'grey.300',
                        '&:hover': {
                            opacity: 0.8,
                        },
                    }}
                    title={isCustomColor ? t('lineCreator.customColor') : t('lineCreator.selectCustomColor')}
                />
            </Stack>
            <TextField
                value={newLineColor}
                onChange={handleHexColorChange}
                placeholder={t('lineCreator.hexPlaceholder')}
                size="small"
                sx={{ minWidth: 120 }}
                slotProps={{
                    htmlInput: {
                        maxLength: 7,
                    },
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Box
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        backgroundColor: newLineColor,
                                        border: '1px solid #ccc',
                                        borderRadius: 1,
                                    }}
                                />
                            </InputAdornment>
                        ),
                    },
                }}
                error={newLineColor !== '' && !isValidHexColor(newLineColor)}
                helperText={newLineColor !== '' && !isValidHexColor(newLineColor) ? t('lineCreator.invalidHex') : ''}
            />
            <TextField
                value={newLineCode}
                onChange={(e) => setNewLineCode(e.target.value)}
                placeholder={t('lineCreator.codePlaceholder')}
                size="small"
                sx={{ minWidth: 120 }}
                slotProps={{
                    htmlInput: {
                        maxLength: MAX_LINE_CODE_LENGTH,
                    },
                }}
                helperText={t('lineCreator.shortBadgeHint')}
            />
            <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
                    <InputLabel id="line-style-label">{t('lineCreator.style')}</InputLabel>
                    <Select
                        labelId="line-style-label"
                        value={lineStyle}
                        label={t('lineCreator.style')}
                        onChange={(e) => setLineStyle(e.target.value)}
                    >
                        {LINE_STYLES.map((s) => (
                            <MenuItem key={s} value={s}>{t(`lineCreator.lineStyle_${s}`)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
                    <InputLabel id="transit-mode-label">{t('lineCreator.mode')}</InputLabel>
                    <Select
                        labelId="transit-mode-label"
                        value={transitMode}
                        label={t('lineCreator.mode')}
                        onChange={(e) => setTransitMode(e.target.value)}
                    >
                        {TRANSIT_MODES.map((m) => (
                            <MenuItem key={m} value={m}>{t(`lineCreator.transitMode_${m}`)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
            <Stack direction="row" spacing={0.5}>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreate}
                    disabled={!validation.valid || newLineColor === '' || !isValidHexColor(newLineColor)}
                >
                    {t('common.create')}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        setNewLineName('')
                        setNewLineColor('#1976d2')
                        setNewLineCode('')
                        setLineStyle('solid')
                        setTransitMode('metro')
                        setIsCreatingLine(false)
                    }}
                >
                    {t('common.cancel')}
                </Button>
            </Stack>
        </Box>
    )
}
