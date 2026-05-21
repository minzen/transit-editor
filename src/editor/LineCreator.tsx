import { useState } from 'react'
import { TextField, Box, Button, IconButton, Stack, InputAdornment } from '@mui/material'
import { validateLineName, VALIDATION } from '../validation/constants'

type Props = {
    newLineName: string
    setNewLineName: (name: string) => void
    newLineColor: string
    setNewLineColor: (color: string) => void
    addLine: (name: string, color: string, code?: string) => void
    setIsCreatingLine: (creating: boolean) => void
    colorPalette: string[]
}

const MAX_LINE_CODE_LENGTH = 4

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
    const validation = validateLineName(newLineName)
    const [newLineCode, setNewLineCode] = useState('')

    const handleCreate = () => {
        if (validation.valid) {
            addLine(
                validation.sanitized ?? newLineName,
                newLineColor,
                newLineCode.trim() || undefined
            )
            setNewLineName('')
            setNewLineColor('#1976d2')
            setNewLineCode('')
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
                placeholder="Line name"
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
                    title={isCustomColor ? 'Custom color' : 'Select custom color'}
                />
            </Stack>
            <TextField
                value={newLineColor}
                onChange={handleHexColorChange}
                placeholder="#RRGGBB"
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
                helperText={newLineColor !== '' && !isValidHexColor(newLineColor) ? 'Invalid hex color (e.g., #ff0000)' : ''}
            />
            <TextField
                value={newLineCode}
                onChange={(e) => setNewLineCode(e.target.value)}
                placeholder="Code (optional, e.g. M1)"
                size="small"
                sx={{ minWidth: 120 }}
                slotProps={{
                    htmlInput: {
                        maxLength: MAX_LINE_CODE_LENGTH,
                    },
                }}
                helperText="Short badge shown on stations"
            />
            <Stack direction="row" spacing={0.5}>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreate}
                    disabled={!validation.valid || newLineColor === '' || !isValidHexColor(newLineColor)}
                >
                    Create
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        setNewLineName('')
                        setNewLineColor('#1976d2')
                        setNewLineCode('')
                        setIsCreatingLine(false)
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </Box>
    )
}
