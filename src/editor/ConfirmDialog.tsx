import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useResponsive'

type Props = {
    open: boolean
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}: Props) {
    const isMobile = useIsMobile()
    const { t } = useTranslation()

    return (
        <Dialog open={open} onClose={onCancel} fullScreen={isMobile} maxWidth="xs" fullWidth>
            <DialogTitle>{title ?? t('common.confirm')}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</Button>
                <Button onClick={onConfirm} variant="contained" color="error">
                    {confirmLabel ?? t('common.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
