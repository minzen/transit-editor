import { Box, TextField } from '@mui/material'

type Props = {
    lineWidth: number
    setLineWidth: (width: number) => void
}

export function LineWidthControl({ lineWidth, setLineWidth }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numValue = Number(value)
        
        // Prevent setting to 0, NaN, or values outside valid range
        if (value === '' || isNaN(numValue) || numValue < 1 || numValue > 20) {
            return
        }
        
        setLineWidth(numValue)
    }

    return (
        <Box className="editor-line-width-control" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
                label="Line Width"
                type="number"
                value={lineWidth}
                onChange={handleChange}
                slotProps={{
                    htmlInput: {
                        min: 1,
                        max: 20,
                        step: 1,
                    },
                }}
                size="small"
                sx={{ width: 80 }}
            />
        </Box>
    )
}
