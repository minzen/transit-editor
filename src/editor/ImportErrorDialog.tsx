import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

type Props = {
    open: boolean
    errors: string[]
    onClose: () => void
}

export function ImportErrorDialog({ open, errors, onClose }: Props) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
