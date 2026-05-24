import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RenameDialog } from './RenameDialog'

describe('RenameDialog', () => {
    const defaultProps = {
        open: true,
        title: 'Rename Station',
        initialValue: 'Old Name',
        placeholder: 'Station name',
        confirmLabel: 'Save',
        cancelLabel: 'Cancel',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
    }

    it('renders title and input when open', () => {
        render(<RenameDialog {...defaultProps} />)

        expect(screen.getByText('Rename Station')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        render(<RenameDialog {...defaultProps} open={false} />)

        expect(screen.queryByText('Rename Station')).not.toBeInTheDocument()
    })

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn()
        render(<RenameDialog {...defaultProps} onCancel={onCancel} />)

        fireEvent.click(screen.getByText('Cancel'))
        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('calls onConfirm with current input value when save is clicked', () => {
        const onConfirm = vi.fn()
        render(<RenameDialog {...defaultProps} onConfirm={onConfirm} />)

        const input = screen.getByDisplayValue('Old Name')
        fireEvent.change(input, { target: { value: 'New Name' } })
        fireEvent.click(screen.getByText('Save'))
        expect(onConfirm).toHaveBeenCalledWith('New Name')
    })

    it('calls onConfirm with empty string when input is cleared', () => {
        const onConfirm = vi.fn()
        render(<RenameDialog {...defaultProps} onConfirm={onConfirm} />)

        const input = screen.getByDisplayValue('Old Name')
        fireEvent.change(input, { target: { value: '' } })
        fireEvent.click(screen.getByText('Save'))
        expect(onConfirm).toHaveBeenCalledWith('')
    })

    it('calls onConfirm when Enter is pressed', () => {
        const onConfirm = vi.fn()
        render(<RenameDialog {...defaultProps} onConfirm={onConfirm} />)

        const input = screen.getByDisplayValue('Old Name')
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('calls onCancel when Escape is pressed', () => {
        const onCancel = vi.fn()
        render(<RenameDialog {...defaultProps} onCancel={onCancel} />)

        const input = screen.getByDisplayValue('Old Name')
        fireEvent.keyDown(input, { key: 'Escape' })
        expect(onCancel).toHaveBeenCalledOnce()
    })
})
