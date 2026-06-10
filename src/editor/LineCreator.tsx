import { useState } from 'react'
import { TextField, Box, Typography, Button, IconButton, Stack, InputAdornment, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { validateLineName, VALIDATION } from '../validation/constants'
import type { Line, LineStyle, TransitMode } from '../model/line'

type Props = {
    colorPalette: string[]
    onSave: (values: { name: string; color: string; code?: string; lineStyle: LineStyle; transitMode: TransitMode; lineWidth?: number }) => void
    onCancel: () => void
    initialLine?: Line
    anarchyMode?: boolean
}

const MAX_LINE_CODE_LENGTH = 4
const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'double']
const TRANSIT_MODES: TransitMode[] = ['metro', 'rail', 'tram', 'bus', 'ferry']

function isValidHexColor(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function LineCreator({ colorPalette, onSave, onCancel, initialLine, anarchyMode = false }: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isTablet = useMediaQuery(theme.breakpoints.down('md'))

    const [name, setName] = useState(initialLine?.name ?? '')
    const [color, setColor] = useState(initialLine?.color ?? '#1976d2')
    const [code, setCode] = useState(initialLine?.code ?? '')
    const [lineStyle, setLineStyle] = useState<LineStyle>(initialLine?.lineStyle ?? 'solid')
    const [transitMode, setTransitMode] = useState<TransitMode>(initialLine?.transitMode ?? 'metro')
    const [lineWidthInput, setLineWidthInput] = useState<string>(
        initialLine?.lineWidth !== undefined ? String(initialLine.lineWidth) : ''
    )

    const validation = validateLineName(name, anarchyMode)
    const isColorValid = isValidHexColor(color)
    const canSave = validation.valid && isColorValid

    const parsedLineWidth = lineWidthInput === '' ? undefined : Number(lineWidthInput)
    const isLineWidthValid = parsedLineWidth === undefined || (
        Number.isFinite(parsedLineWidth) && parsedLineWidth >= 1 && parsedLineWidth <= 20
    )

    const handleSave = () => {
        if (canSave && isLineWidthValid) {
            onSave({
                name: validation.sanitized ?? name,
                color,
                code: code.trim() || undefined,
                lineStyle,
                transitMode,
                lineWidth: parsedLineWidth,
            })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave()
        }
    }

    const handleHexColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value.length <= 7) {
            setColor(value)
        }
    }

    const isCustomColor = !colorPalette.includes(color)

    return (
        <Box className="editor-line-creator" sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: isMobile ? 1 : 2 }}>
            <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('lineCreator.lineNamePlaceholder')}
                size={isMobile ? 'small' : 'medium'}
                fullWidth
                slotProps={anarchyMode ? undefined : {
                    htmlInput: {
                        maxLength: VALIDATION.MAX_LINE_NAME_LENGTH,
                    },
                }}
                error={!validation.valid && name.length > 0}
                helperText={
                    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{!validation.valid && name.length > 0 ? validation.error : ''}</span>
                        <span>{name.length}{anarchyMode ? '' : ` / ${VALIDATION.MAX_LINE_NAME_LENGTH}`}</span>
                    </Box>
                }
            />
            <Stack direction={isMobile ? 'row' : 'row'} spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                {colorPalette.map((paletteColor) => (
                    <IconButton
                        key={paletteColor}
                        sx={{
                            backgroundColor: paletteColor,
                            width: isMobile ? 28 : 36,
                            height: isMobile ? 28 : 36,
                            border: color === paletteColor ? 3 : 1,
                            borderColor: color === paletteColor ? 'primary.main' : 'grey.300',
                            '&:hover': {
                                backgroundColor: paletteColor,
                                opacity: 0.8,
                            },
                        }}
                        onClick={() => setColor(paletteColor)}
                        aria-label={paletteColor}
                        title={paletteColor}
                    />
                ))}
                <IconButton
                    sx={{
                        backgroundColor: color,
                        width: isMobile ? 28 : 36,
                        height: isMobile ? 28 : 36,
                        border: isCustomColor ? 3 : 1,
                        borderColor: isCustomColor ? 'primary.main' : 'grey.300',
                        '&:hover': {
                            opacity: 0.8,
                        },
                    }}
                    aria-label={isCustomColor ? t('lineCreator.customColor') : t('lineCreator.selectCustomColor')}
                    title={isCustomColor ? t('lineCreator.customColor') : t('lineCreator.selectCustomColor')}
                />
            </Stack>
            <Stack direction={isTablet ? 'column' : 'row'} spacing={2}>
                <TextField
                    value={color}
                    onChange={handleHexColorChange}
                    placeholder={t('lineCreator.hexPlaceholder')}
                    size={isMobile ? 'small' : 'medium'}
                    fullWidth={!isTablet}
                    slotProps={{
                        htmlInput: {
                            maxLength: 7,
                        },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Box
                                        sx={{
                                            width: isMobile ? 20 : 24,
                                            height: isMobile ? 20 : 24,
                                            backgroundColor: isColorValid ? color : '#ccc',
                                            border: '1px solid #ccc',
                                            borderRadius: '50%',
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    error={color !== '' && !isColorValid}
                    helperText={color !== '' && !isColorValid ? t('lineCreator.invalidHex') : ''}
                />
                <TextField
                    value={code}
                    onChange={(e) => {
                        const raw = e.target.value.toUpperCase()
                        setCode(anarchyMode ? raw : raw.slice(0, MAX_LINE_CODE_LENGTH))
                    }}
                    placeholder={t('lineCreator.codePlaceholder')}
                    size={isMobile ? 'small' : 'medium'}
                    fullWidth={!isTablet}
                    slotProps={anarchyMode ? undefined : {
                        htmlInput: {
                            maxLength: MAX_LINE_CODE_LENGTH,
                        },
                    }}
                    helperText={
                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{t('lineCreator.shortBadgeHint')}</span>
                            <Typography component="span" variant="caption">{code.length}{anarchyMode ? '' : ` / ${MAX_LINE_CODE_LENGTH}`}</Typography>
                        </Box>
                    }
                />
            </Stack>
            <Stack direction={isTablet ? 'column' : 'row'} spacing={2}>
                <FormControl size={isMobile ? 'small' : 'medium'} fullWidth={!isTablet}>
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
                <FormControl size={isMobile ? 'small' : 'medium'} fullWidth={!isTablet}>
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
                <TextField
                    value={lineWidthInput}
                    onChange={(e) => setLineWidthInput(e.target.value)}
                    placeholder={t('lineCreator.lineWidthPlaceholder')}
                    label={t('lineCreator.lineWidth')}
                    size={isMobile ? 'small' : 'medium'}
                    type="number"
                    fullWidth={!isTablet}
                    slotProps={{
                        htmlInput: { min: 1, max: 20, step: 1 },
                    }}
                    error={!isLineWidthValid}
                    helperText={!isLineWidthValid ? t('lineCreator.lineWidthError') : t('lineCreator.lineWidthHint')}
                />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button
                    variant="contained"
                    size={isMobile ? 'small' : 'medium'}
                    onClick={handleSave}
                    disabled={!canSave}
                    fullWidth={isMobile}
                >
                    {initialLine ? t('common.save') : t('common.create')}
                </Button>
                <Button
                    variant="outlined"
                    size={isMobile ? 'small' : 'medium'}
                    onClick={onCancel}
                    fullWidth={isMobile}
                >
                    {t('common.cancel')}
                </Button>
            </Stack>
        </Box>
    )
}
