import { Box, TextField } from '@mui/material'

type Props = {
    gridSize: number
    setGridSize: (size: number) => void
}

export function GridSizeControl({ gridSize, setGridSize }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numValue = Number(value)
        
        // Prevent setting to 0, NaN, or values outside valid range
        if (value === '' || isNaN(numValue) || numValue < 10 || numValue > 100) {
            return
        }
        
        setGridSize(numValue)
    }

    return (
        <Box className="editor-grid-size-control" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
                label="Grid"
                type="number"
                value={gridSize}
                onChange={handleChange}
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
