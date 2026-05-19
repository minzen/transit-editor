import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GridSizeControl } from './GridSizeControl'

describe('GridSizeControl', () => {
  it('renders with initial values', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const widthInput = screen.getByLabelText('Width')
    const heightInput = screen.getByLabelText('Height')
    expect(widthInput).toHaveValue(40)
    expect(heightInput).toHaveValue(30)
  })

  it('updates grid width with valid value', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const widthInput = screen.getByLabelText('Width')
    fireEvent.change(widthInput, { target: { value: '50' } })
    
    expect(setGridCellsWidth).toHaveBeenCalledWith(50)
  })

  it('updates grid height with valid value', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const heightInput = screen.getByLabelText('Height')
    fireEvent.change(heightInput, { target: { value: '50' } })
    
    expect(setGridCellsHeight).toHaveBeenCalledWith(50)
  })

  it('resets grid width to default when value is empty', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const widthInput = screen.getByLabelText('Width')
    fireEvent.change(widthInput, { target: { value: '' } })
    
    expect(setGridCellsWidth).toHaveBeenCalledWith(40)
  })

  it('resets grid height to default when value is empty', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const heightInput = screen.getByLabelText('Height')
    fireEvent.change(heightInput, { target: { value: '' } })
    
    expect(setGridCellsHeight).toHaveBeenCalledWith(40)
  })

  it('updates grid width when value is 0', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const widthInput = screen.getByLabelText('Width')
    fireEvent.change(widthInput, { target: { value: '0' } })
    
    expect(setGridCellsWidth).toHaveBeenCalledWith(0)
  })

  it('updates grid height when value is 0', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const heightInput = screen.getByLabelText('Height')
    fireEvent.change(heightInput, { target: { value: '0' } })
    
    expect(setGridCellsHeight).toHaveBeenCalledWith(0)
  })

  it('resets grid width to default when value is NaN (number input behavior)', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const widthInput = screen.getByLabelText('Width')
    fireEvent.change(widthInput, { target: { value: 'abc' } })
    
    expect(setGridCellsWidth).toHaveBeenCalledWith(40)
  })

  it('resets grid height to default when value is NaN (number input behavior)', () => {
    const setGridCellsWidth = vi.fn()
    const setGridCellsHeight = vi.fn()
    render(<GridSizeControl gridCellsWidth={40} setGridCellsWidth={setGridCellsWidth} gridCellsHeight={30} setGridCellsHeight={setGridCellsHeight} />)
    
    const heightInput = screen.getByLabelText('Height')
    fireEvent.change(heightInput, { target: { value: 'abc' } })
    
    expect(setGridCellsHeight).toHaveBeenCalledWith(40)
  })
})
