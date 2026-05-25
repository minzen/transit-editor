import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorKeyboardShortcuts } from './useEditorKeyboardShortcuts'

describe('useEditorKeyboardShortcuts', () => {
  const defaultProps = {
    selectedStationIds: [],
    selectedShapeId: null,
    onDeleteSelected: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: true,
    canRedo: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns spacePressed state', () => {
    const { result } = renderHook(() => useEditorKeyboardShortcuts(defaultProps))
    expect(result.current.spacePressed).toBe(false)
  })

  it('sets spacePressed to true when Space key is pressed', () => {
    const { result } = renderHook(() => useEditorKeyboardShortcuts(defaultProps))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    })
    
    expect(result.current.spacePressed).toBe(true)
  })

  it('sets spacePressed to false when Space key is released', () => {
    const { result } = renderHook(() => useEditorKeyboardShortcuts(defaultProps))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    })
    expect(result.current.spacePressed).toBe(true)
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))
    })
    expect(result.current.spacePressed).toBe(false)
  })

  it('calls onDeleteSelected when Delete key is pressed with selected stations', () => {
    const props = { ...defaultProps, selectedStationIds: ['station1'] }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Delete' }))
    })
    
    expect(props.onDeleteSelected).toHaveBeenCalled()
  })

  it('calls onDeleteSelected when Backspace key is pressed with selected stations', () => {
    const props = { ...defaultProps, selectedStationIds: ['station1'] }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backspace' }))
    })
    
    expect(props.onDeleteSelected).toHaveBeenCalled()
  })

  it('calls onDeleteSelected when Delete key is pressed with selected shape', () => {
    const props = { ...defaultProps, selectedShapeId: 'shape1' }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Delete' }))
    })
    
    expect(props.onDeleteSelected).toHaveBeenCalled()
  })

  it('does not call onDeleteSelected when Space is held', () => {
    const props = { ...defaultProps, selectedStationIds: ['station1'] }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    })
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Delete' }))
    })
    
    expect(props.onDeleteSelected).not.toHaveBeenCalled()
  })

  it('calls onUndo when Ctrl+Z is pressed and canUndo is true', () => {
    const props = { ...defaultProps, canUndo: true }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true }))
    })
    
    expect(props.onUndo).toHaveBeenCalled()
  })

  it('calls onUndo when Cmd+Z is pressed and canUndo is true', () => {
    const props = { ...defaultProps, canUndo: true }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', metaKey: true }))
    })
    
    expect(props.onUndo).toHaveBeenCalled()
  })

  it('does not call onUndo when Ctrl+Z is pressed and canUndo is false', () => {
    const props = { ...defaultProps, canUndo: false }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true }))
    })
    
    expect(props.onUndo).not.toHaveBeenCalled()
  })

  it('does not call onUndo when Ctrl+Shift+Z is pressed (that is redo)', () => {
    const props = { ...defaultProps, canUndo: true }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true, shiftKey: true }))
    })
    
    expect(props.onUndo).not.toHaveBeenCalled()
  })

  it('calls onRedo when Ctrl+Y is pressed and canRedo is true', () => {
    const props = { ...defaultProps, canRedo: true }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyY', ctrlKey: true }))
    })
    
    expect(props.onRedo).toHaveBeenCalled()
  })

  it('calls onRedo when Cmd+Shift+Z is pressed and canRedo is true', () => {
    const props = { ...defaultProps, canRedo: true }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', metaKey: true, shiftKey: true }))
    })
    
    expect(props.onRedo).toHaveBeenCalled()
  })

  it('does not call onRedo when Ctrl+Y is pressed and canRedo is false', () => {
    const props = { ...defaultProps, canRedo: false }
    renderHook(() => useEditorKeyboardShortcuts(props))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyY', ctrlKey: true }))
    })
    
    expect(props.onRedo).not.toHaveBeenCalled()
  })

  it('does not call onDeleteSelected when no selection exists', () => {
    renderHook(() => useEditorKeyboardShortcuts(defaultProps))
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Delete' }))
    })
    
    expect(defaultProps.onDeleteSelected).not.toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useEditorKeyboardShortcuts(defaultProps))
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow()
  })
})
