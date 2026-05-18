import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LineWidthControl } from './LineWidthControl'

describe('LineWidthControl', () => {
  it('renders with initial value', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    expect(input).toHaveValue(10)
  })

  it('updates line width with valid value', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '15' } })
    
    expect(setLineWidth).toHaveBeenCalledWith(15)
  })

  it('does not update line width when value is empty', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '' } })
    
    expect(setLineWidth).not.toHaveBeenCalled()
  })

  it('does not update line width when value is 0', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '0' } })
    
    expect(setLineWidth).not.toHaveBeenCalled()
  })

  it('does not update line width when value is less than 1', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '0' } })
    
    expect(setLineWidth).not.toHaveBeenCalled()
  })

  it('does not update line width when value is greater than 20', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '25' } })
    
    expect(setLineWidth).not.toHaveBeenCalled()
  })

  it('does not update line width when value is NaN', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: 'abc' } })
    
    expect(setLineWidth).not.toHaveBeenCalled()
  })

  it('updates line width when value is exactly 1 (minimum)', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '1' } })
    
    expect(setLineWidth).toHaveBeenCalledWith(1)
  })

  it('updates line width when value is exactly 20 (maximum)', () => {
    const setLineWidth = vi.fn()
    render(<LineWidthControl lineWidth={10} setLineWidth={setLineWidth} />)
    
    const input = screen.getByLabelText('Line Width')
    fireEvent.change(input, { target: { value: '20' } })
    
    expect(setLineWidth).toHaveBeenCalledWith(20)
  })
})
