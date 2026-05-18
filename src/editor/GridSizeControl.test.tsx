import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GridSizeControl } from './GridSizeControl'

describe('GridSizeControl', () => {
  it('renders with initial value', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    expect(input).toHaveValue(40)
  })

  it('updates grid size with valid value', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '50' } })
    
    expect(setGridSize).toHaveBeenCalledWith(50)
  })

  it('resets grid size to default when value is empty', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '' } })
    
    expect(setGridSize).toHaveBeenCalledWith(10)
  })

  it('updates grid size when value is 0', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '0' } })
    
    expect(setGridSize).toHaveBeenCalledWith(0)
  })

  it('updates grid size when value is less than 10', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '5' } })
    
    expect(setGridSize).toHaveBeenCalledWith(5)
  })

  it('updates grid size when value is greater than 100', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '150' } })
    
    expect(setGridSize).toHaveBeenCalledWith(150)
  })

  it('resets grid size to default when value is NaN (number input behavior)', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: 'abc' } })
    
    expect(setGridSize).toHaveBeenCalledWith(10)
  })

  it('updates grid size when value is exactly 10 (minimum)', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '10' } })
    
    expect(setGridSize).toHaveBeenCalledWith(10)
  })

  it('updates grid size when value is exactly 100 (maximum)', () => {
    const setGridSize = vi.fn()
    render(<GridSizeControl gridSize={40} setGridSize={setGridSize} />)
    
    const input = screen.getByLabelText('Grid')
    fireEvent.change(input, { target: { value: '100' } })
    
    expect(setGridSize).toHaveBeenCalledWith(100)
  })
})
