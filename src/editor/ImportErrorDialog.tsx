import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useResponsive'

type Props = {
    open: boolean
    errors: string[]
    onClose: () => void
}

export function ImportErrorDialog({ open, errors, onClose }: Props) {
    const isMobile = useIsMobile()
    const { t } = useTranslation()

    return (
        <Dialog open={open} onClose={onClose} fullScreen={isMobile} maxWidth="sm" fullWidth>
            <DialogTitle>{t('importErrorDialog.title')}</DialogTitle>
            <DialogContent>
                <List dense>
                    {errors.map((error, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={error} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.ok')}</Button>
            </DialogActions>
        </Dialog>
    )
}
