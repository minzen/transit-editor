import { Box, TextField } from '@mui/material'

type Props = {
    gridSize: number
    setGridSize: (size: number) => void
}

export function GridSizeControl({ gridSize, setGridSize }: Props) {
    return (
        <Box className="editor-grid-size-control" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
                label="Grid"
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                slotProps={{
                    htmlInput: {
                        min: 10,
                        max: 100,
                        step: 10,
                    },
                }}
                size="small"
                sx={{ width: 80 }}
            />
        </Box>
    )
}
