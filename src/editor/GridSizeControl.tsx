import { Box, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'

type Props = {
    gridCellsWidth: number
    setGridCellsWidth: (width: number) => void
    gridCellsHeight: number
    setGridCellsHeight: (height: number) => void
}

export function GridSizeControl({ gridCellsWidth, setGridCellsWidth, gridCellsHeight, setGridCellsHeight }: Props) {
    const { t } = useTranslation()
    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numValue = Number(value)
        
        // Allow empty value for clearing
        if (value === '') {
            setGridCellsWidth(80) // Reset to default
            return
        }
        
        // Allow typing without strict validation
        if (!isNaN(numValue)) {
            setGridCellsWidth(numValue)
        }
    }

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numValue = Number(value)
        
        // Allow empty value for clearing
        if (value === '') {
            setGridCellsHeight(80) // Reset to default
            return
        }
        
        // Allow typing without strict validation
        if (!isNaN(numValue)) {
            setGridCellsHeight(numValue)
        }
    }

    return (
        <Box className="editor-grid-size-control" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
                label={t('gridSizeControl.width')}
                type="number"
                value={gridCellsWidth}
                onChange={handleWidthChange}
                slotProps={{
                    htmlInput: {
                        min: 1,
                        step: 1,
                    },
                }}
                size="small"
                sx={{ width: 70 }}
            />
            <TextField
                label={t('gridSizeControl.height')}
                type="number"
                value={gridCellsHeight}
                onChange={handleHeightChange}
                slotProps={{
                    htmlInput: {
                        min: 1,
                        step: 1,
                    },
                }}
                size="small"
                sx={{ width: 70 }}
            />
        </Box>
    )
}
