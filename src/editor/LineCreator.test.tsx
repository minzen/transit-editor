import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LineCreator } from './LineCreator'

describe('LineCreator', () => {
  const defaultProps = {
    newLineName: '',
    setNewLineName: vi.fn(),
    newLineColor: '#1976d2',
    setNewLineColor: vi.fn(),
    addLine: vi.fn(),
    setIsCreatingLine: vi.fn(),
    colorPalette: ['#1976d2', '#ff0000', '#00ff00', '#0000ff'],
  }

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

  it('calls setNewLineName when input changes', () => {
    render(<LineCreator {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Line name')
    fireEvent.change(input, { target: { value: 'Test Line' } })
    
    expect(defaultProps.setNewLineName).toHaveBeenCalledWith('Test Line')
  })

  it('calls setNewLineColor when color button is clicked', () => {
    render(<LineCreator {...defaultProps} />)
    
    const colorButtons = screen.getAllByRole('button')
    // Click first color button (skip Create and Cancel buttons)
    fireEvent.click(colorButtons[0])
    
    expect(defaultProps.setNewLineColor).toHaveBeenCalled()
  })

  it('calls addLine when Create button is clicked with valid name', () => {
    const props = {
      ...defaultProps,
      newLineName: 'Test Line',
    }
    render(<LineCreator {...props} />)
    
    const createButton = screen.getByText('Create')
    fireEvent.click(createButton)
    
    expect(props.addLine).toHaveBeenCalledWith('Test Line', '#1976d2', undefined)
    expect(props.setNewLineName).toHaveBeenCalledWith('')
    expect(props.setIsCreatingLine).toHaveBeenCalledWith(false)
  })

  it('does not call addLine when Create button is clicked with empty name', () => {
    vi.clearAllMocks()
    render(<LineCreator {...defaultProps} />)
    
    const createButton = screen.getByText('Create')
    fireEvent.click(createButton)
    
    expect(defaultProps.addLine).not.toHaveBeenCalled()
  })

  it('calls setIsCreatingLine when Cancel button is clicked', () => {
    render(<LineCreator {...defaultProps} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(defaultProps.setIsCreatingLine).toHaveBeenCalledWith(false)
    expect(defaultProps.setNewLineName).toHaveBeenCalledWith('')
    expect(defaultProps.setNewLineColor).toHaveBeenCalledWith('#1976d2')
  })

  it('renders hex color input field', () => {
    render(<LineCreator {...defaultProps} />)
    
    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    expect(hexInput).toBeInTheDocument()
  })

  it('calls setNewLineColor when hex color input changes', () => {
    render(<LineCreator {...defaultProps} />)
    
    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    fireEvent.change(hexInput, { target: { value: '#ff00ff' } })
    
    expect(defaultProps.setNewLineColor).toHaveBeenCalledWith('#ff00ff')
  })

  it('shows error when hex color is invalid', () => {
    const props = {
      ...defaultProps,
      newLineColor: 'invalid',
    }
    render(<LineCreator {...props} />)
    
    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    expect(hexInput.parentElement).toHaveClass('Mui-error')
  })

  it('shows error message when hex color is invalid', () => {
    const props = {
      ...defaultProps,
      newLineColor: 'invalid',
    }
    render(<LineCreator {...props} />)
    
    expect(screen.getByText('Invalid hex color (e.g., #ff0000)')).toBeInTheDocument()
  })

  it('does not show error when hex color is valid', () => {
    const props = {
      ...defaultProps,
      newLineColor: '#ff00ff',
    }
    render(<LineCreator {...props} />)
    
    const hexInput = screen.getByPlaceholderText('#RRGGBB')
    expect(hexInput.parentElement).not.toHaveClass('Mui-error')
  })

  it('disables Create button when color is empty', () => {
    const props = {
      ...defaultProps,
      newLineName: 'Test Line',
      newLineColor: '',
    }
    render(<LineCreator {...props} />)
    
    const createButton = screen.getByText('Create')
    expect(createButton).toBeDisabled()
  })

  it('disables Create button when color is invalid', () => {
    const props = {
      ...defaultProps,
      newLineName: 'Test Line',
      newLineColor: 'invalid',
    }
    render(<LineCreator {...props} />)
    
    const createButton = screen.getByText('Create')
    expect(createButton).toBeDisabled()
  })
})
