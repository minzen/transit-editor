import { TextField, Box, Button, IconButton, Stack } from '@mui/material'
import { validateLineName, VALIDATION } from '../validation/constants'

type Props = {
    newLineName: string
    setNewLineName: (name: string) => void
    newLineColor: string
    setNewLineColor: (color: string) => void
    addLine: (name: string, color: string) => void
    setIsCreatingLine: (creating: boolean) => void
    colorPalette: string[]
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

    const handleCreate = () => {
        if (validation.valid) {
            addLine(validation.sanitized ?? newLineName, newLineColor)
            setNewLineName('')
            setNewLineColor('#1976d2')
            setIsCreatingLine(false)
        }
    }

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
            </Stack>
            <Stack direction="row" spacing={0.5}>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreate}
                    disabled={!validation.valid}
                >
                    Create
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        setNewLineName('')
                        setNewLineColor('#1976d2')
                        setIsCreatingLine(false)
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </Box>
    )
}
