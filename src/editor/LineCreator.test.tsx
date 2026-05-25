import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LineCreator } from './LineCreator'

describe('LineCreator', () => {
  const defaultProps = {
    colorPalette: ['#1976d2', '#ff0000', '#00ff00', '#0000ff'],
    onSave: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders text input for line name', () => {
    render(<LineCreator {...defaultProps} />)

    const input = screen.getByPlaceholderText('Line name')
    expect(input).toBeInTheDocument()
  })

  it('renders color palette buttons', () => {
    render(<LineCreator {...defaultProps} />)

    const colorButtons = screen.getAllByRole('button')
    // Should have color buttons + Create + Cancel buttons
    expect(colorButtons.length).toBeGreaterThan(2)
  })

  it('calls onSave when Create button is clicked with valid name', () => {
    render(<LineCreator {...defaultProps} />)

    const input = screen.getByPlaceholderText('Line name')
    fireEvent.change(input, { target: { value: 'Test Line' } })

    const createButton = screen.getByText('Create')
    fireEvent.click(createButton)

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      name: 'Test Line',
      color: '#1976d2',
      code: undefined,
      lineStyle: 'solid',
      transitMode: 'metro',
    })
  })

  it('does not call onSave when Create button is clicked with empty name', () => {
    render(<LineCreator {...defaultProps} />)

    const createButton = screen.getByText('Create')
    fireEvent.click(createButton)

    expect(defaultProps.onSave).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel button is clicked', () => {
    render(<LineCreator {...defaultProps} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('renders hex color input field', () => {
    render(<LineCreator {...defaultProps} />)

    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    expect(hexInput).toBeInTheDocument()
  })

  it('shows error when hex color is invalid', () => {
    render(<LineCreator {...defaultProps} />)

    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    fireEvent.change(hexInput, { target: { value: 'invalid' } })

    expect(screen.getByText('Invalid hex color (e.g., #ff0000)')).toBeInTheDocument()
  })

  it('does not show error when hex color is valid', () => {
    render(<LineCreator {...defaultProps} />)

    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    fireEvent.change(hexInput, { target: { value: '#ff00ff' } })

    expect(hexInput.parentElement).not.toHaveClass('Mui-error')
  })

  it('disables Create button when color is empty', () => {
    render(<LineCreator {...defaultProps} />)

    const input = screen.getByPlaceholderText('Line name')
    fireEvent.change(input, { target: { value: 'Test Line' } })

    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    fireEvent.change(hexInput, { target: { value: '' } })

    const createButton = screen.getByText('Create')
    expect(createButton).toBeDisabled()
  })

  it('disables Create button when color is invalid', () => {
    render(<LineCreator {...defaultProps} />)

    const input = screen.getByPlaceholderText('Line name')
    fireEvent.change(input, { target: { value: 'Test Line' } })

    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    fireEvent.change(hexInput, { target: { value: 'invalid' } })

    const createButton = screen.getByText('Create')
    expect(createButton).toBeDisabled()
  })

  it('renders style and mode selects', () => {
    render(<LineCreator {...defaultProps} />)

    expect(screen.getByLabelText('Style')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode')).toBeInTheDocument()
  })

  it('passes selected style and mode to onSave', () => {
    render(<LineCreator {...defaultProps} />)

    const input = screen.getByPlaceholderText('Line name')
    fireEvent.change(input, { target: { value: 'Test Line' } })

    const styleSelect = screen.getByLabelText('Style')
    fireEvent.mouseDown(styleSelect)
    fireEvent.click(screen.getByText('Dashed'))

    const modeSelect = screen.getByLabelText('Mode')
    fireEvent.mouseDown(modeSelect)
    fireEvent.click(screen.getByText('Rail'))

    const createButton = screen.getByText('Create')
    fireEvent.click(createButton)

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      name: 'Test Line',
      color: '#1976d2',
      code: undefined,
      lineStyle: 'dashed',
      transitMode: 'rail',
    })
  })

  it('renders Save button when editing', () => {
    const line = {
      id: 'line1',
      name: 'Existing Line',
      color: '#ff0000',
      code: 'M1',
      lineStyle: 'dashed' as const,
      transitMode: 'rail' as const,
    }
    render(<LineCreator {...defaultProps} initialLine={line} />)

    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Line name')).toHaveValue('Existing Line')
  })

  it('calls onSave with edited values when in edit mode', () => {
    const line = {
      id: 'line1',
      name: 'Existing Line',
      color: '#ff0000',
      code: 'M1',
      lineStyle: 'dashed' as const,
      transitMode: 'rail' as const,
    }
    render(<LineCreator {...defaultProps} initialLine={line} />)

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      name: 'Existing Line',
      color: '#ff0000',
      code: 'M1',
      lineStyle: 'dashed',
      transitMode: 'rail',
    })
  })
})
