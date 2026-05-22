import { useRef } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    useMediaQuery,
    useTheme,
} from '@mui/material'

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
    title = 'Rename',
    initialValue = '',
    placeholder = 'Name',
    confirmLabel = 'Save',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}: Props) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const inputRef = useRef<HTMLInputElement>(null)

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
            fullScreen={isMobile}
            maxWidth="xs"
            fullWidth
            key={open ? initialValue : ''}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <TextField
                    inputRef={inputRef}
                    defaultValue={initialValue}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    fullWidth
                    autoFocus
                    margin="dense"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{cancelLabel}</Button>
                <Button onClick={handleConfirm} variant="contained">
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
