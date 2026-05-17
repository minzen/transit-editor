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
    
    expect(props.addLine).toHaveBeenCalledWith('Test Line', '#1976d2')
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
})
