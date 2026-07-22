import { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Box,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { validateStationName, VALIDATION } from '../validation/constants'
import { useIsMobile } from '../hooks/useResponsive'
import { onEnterKey } from '../utils/keyboard'

type Props = {
    open: boolean
    onSave: (name: string) => void
    onCancel: () => void
    anarchyMode?: boolean
}

export function StationNameDialog({ open, onSave, onCancel, anarchyMode = false }: Props) {
    const { t } = useTranslation()
    const isMobile = useIsMobile()

    const [name, setName] = useState('')

    const validation = validateStationName(name, anarchyMode)
    const canSave = validation.valid

    const handleSave = () => {
        if (canSave) {
            onSave(validation.sanitized ?? name)
            setName('')
        }
    }

    const handleClose = () => {
        setName('')
        onCancel()
    }

    const handleKeyDown = onEnterKey<HTMLInputElement>(handleSave)

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle>{t('toolbar.addStation')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label={t('toolbar.stationName')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('toolbar.stationNamePlaceholder')}
                        fullWidth
                        autoFocus
                        size={isMobile ? 'small' : 'medium'}
                        slotProps={anarchyMode ? undefined : {
                            htmlInput: { maxLength: VALIDATION.MAX_STATION_NAME_LENGTH },
                        }}
                        error={!validation.valid && name.length > 0}
                        helperText={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{!validation.valid && name.length > 0 ? validation.error : ''}</span>
                                <span>{name.length}{anarchyMode ? ' / ∞' : ` / ${VALIDATION.MAX_STATION_NAME_LENGTH}`}</span>
                            </Box>
                        }
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{t('common.cancel')}</Button>
                <Button onClick={handleSave} variant="contained" disabled={!canSave}>
                    {t('common.create')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
