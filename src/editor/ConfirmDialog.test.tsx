import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
    const defaultProps = {
        open: true,
        title: 'Delete?',
        message: 'Are you sure?',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
    }

    it('renders title and message when open', () => {
        render(<ConfirmDialog {...defaultProps} />)

        expect(screen.getByText('Delete?')).toBeInTheDocument()
        expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        render(<ConfirmDialog {...defaultProps} open={false} />)

        expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
    })

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn()
        render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

        fireEvent.click(screen.getByText('Cancel'))
        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('calls onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn()
        render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

        fireEvent.click(screen.getByText('Delete'))
        expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('uses default labels when not provided', () => {
        render(
            <ConfirmDialog
                open={true}
                message="Test message"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(screen.getByText('Confirm')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
})
