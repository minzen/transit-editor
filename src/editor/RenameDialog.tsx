import { useRef } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

type Props = {
    open: boolean
    title?: string
    initialValue?: string
    placeholder?: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: (value: string) => void
    onCancel: () => void
}

export function RenameDialog({
    open,
    title,
    initialValue = '',
    placeholder,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const { t } = useTranslation()

    const handleConfirm = () => {
        onConfirm(inputRef.current?.value ?? '')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleConfirm()
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            scroll="body"
            key={open ? initialValue : ''}
        >
            <DialogTitle>{title ?? t('common.rename')}</DialogTitle>
            <DialogContent>
                <TextField
                    inputRef={inputRef}
                    defaultValue={initialValue}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder ?? t('common.rename')}
                    fullWidth
                    autoFocus
                    margin="dense"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</Button>
                <Button onClick={handleConfirm} variant="contained">
                    {confirmLabel ?? t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
