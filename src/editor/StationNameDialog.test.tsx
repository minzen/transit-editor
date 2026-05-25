import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StationNameDialog } from './StationNameDialog'

describe('StationNameDialog', () => {
    const defaultProps = {
        open: true,
        onSave: vi.fn(),
        onCancel: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders dialog when open', () => {
        render(<StationNameDialog {...defaultProps} />)

        expect(screen.getByText('Add Station')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        render(<StationNameDialog {...defaultProps} open={false} />)

        expect(screen.queryByText('Add Station')).not.toBeInTheDocument()
    })

    it('renders text input for station name', () => {
        render(<StationNameDialog {...defaultProps} />)

        const input = screen.getByLabelText('Station Name')
        expect(input).toBeInTheDocument()
    })

    it('calls onSave with name when Create button is clicked with valid name', () => {
        render(<StationNameDialog {...defaultProps} />)

        const input = screen.getByLabelText('Station Name')
        fireEvent.change(input, { target: { value: 'Central Station' } })

        const createButton = screen.getByText('Create')
        fireEvent.click(createButton)

        expect(defaultProps.onSave).toHaveBeenCalledWith('Central Station')
    })

    it('does not call onSave when Create button is clicked with empty name', () => {
        render(<StationNameDialog {...defaultProps} />)

        const createButton = screen.getByText('Create')
        fireEvent.click(createButton)

        expect(defaultProps.onSave).not.toHaveBeenCalled()
    })

    it('calls onCancel when Cancel button is clicked', () => {
        render(<StationNameDialog {...defaultProps} />)

        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)

        expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('calls onCancel when dialog is closed', () => {
        render(<StationNameDialog {...defaultProps} />)

        const backdrop = document.querySelector('.MuiBackdrop-root')
        if (backdrop) {
            fireEvent.click(backdrop)
        }

        expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('disables Create button when name is empty', () => {
        render(<StationNameDialog {...defaultProps} />)

        const createButton = screen.getByText('Create')
        expect(createButton).toBeDisabled()
    })

    it('enables Create button when name is valid', () => {
        render(<StationNameDialog {...defaultProps} />)

        const input = screen.getByLabelText('Station Name')
        fireEvent.change(input, { target: { value: 'Test Station' } })

        const createButton = screen.getByText('Create')
        expect(createButton).not.toBeDisabled()
    })

    it('shows error when name is invalid', () => {
        render(<StationNameDialog {...defaultProps} />)

        const input = screen.getByLabelText('Station Name')
        fireEvent.change(input, { target: { value: 'a'.repeat(51) } })

        expect(screen.getByText(/Station name cannot exceed/)).toBeInTheDocument()
    })
})
