import { useState } from 'react'
import { TextField, Box, Button, IconButton, Stack, InputAdornment, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { validateLineName, VALIDATION } from '../validation/constants'
import type { Line, LineStyle, TransitMode } from '../model/line'

type Props = {
    colorPalette: string[]
    onSave: (values: { name: string; color: string; code?: string; lineStyle: LineStyle; transitMode: TransitMode }) => void
    onCancel: () => void
    initialLine?: Line
}

const MAX_LINE_CODE_LENGTH = 4
const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'double']
const TRANSIT_MODES: TransitMode[] = ['metro', 'rail', 'tram', 'bus', 'ferry']

function isValidHexColor(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function LineCreator({ colorPalette, onSave, onCancel, initialLine }: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isTablet = useMediaQuery(theme.breakpoints.down('md'))

    const [name, setName] = useState(initialLine?.name ?? '')
    const [color, setColor] = useState(initialLine?.color ?? '#1976d2')
    const [code, setCode] = useState(initialLine?.code ?? '')
    const [lineStyle, setLineStyle] = useState<LineStyle>(initialLine?.lineStyle ?? 'solid')
    const [transitMode, setTransitMode] = useState<TransitMode>(initialLine?.transitMode ?? 'metro')

    const validation = validateLineName(name)
    const isColorValid = isValidHexColor(color)
    const canSave = validation.valid && isColorValid

    const handleSave = () => {
        if (canSave) {
            onSave({
                name: validation.sanitized ?? name,
                color,
                code: code.trim() || undefined,
                lineStyle,
                transitMode,
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
                slotProps={{
                    htmlInput: {
                        maxLength: VALIDATION.MAX_LINE_NAME_LENGTH,
                    },
                }}
                error={!validation.valid && name.length > 0}
                helperText={!validation.valid && name.length > 0 ? validation.error : ''}
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
                        const value = e.target.value.toUpperCase().slice(0, MAX_LINE_CODE_LENGTH)
                        setCode(value)
                    }}
                    placeholder={t('lineCreator.codePlaceholder')}
                    size={isMobile ? 'small' : 'medium'}
                    fullWidth={!isTablet}
                    slotProps={{
                        htmlInput: {
                            maxLength: MAX_LINE_CODE_LENGTH,
                        },
                    }}
                    helperText={t('lineCreator.shortBadgeHint')}
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
