import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

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
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
