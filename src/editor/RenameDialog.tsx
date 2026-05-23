import { useRef } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
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
            maxWidth="xs"
            fullWidth
            scroll="body"
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
