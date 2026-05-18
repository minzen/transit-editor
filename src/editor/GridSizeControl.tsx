import { Box, TextField } from '@mui/material'

type Props = {
    gridSize: number
    setGridSize: (size: number) => void
}

export function GridSizeControl({ gridSize, setGridSize }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numValue = Number(value)
        
        // Allow empty value for clearing
        if (value === '') {
            setGridSize(10) // Reset to default
            return
        }
        
        // Allow typing without strict validation
        if (!isNaN(numValue)) {
            setGridSize(numValue)
        }
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
