import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelpDialog } from './HelpDialog'

describe('HelpDialog', () => {
  it('renders dialog when open is true', () => {
    render(<HelpDialog open={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Transit Map Editor - User Guide')).toBeInTheDocument()
  })

  it('does not render dialog when open is false', () => {
    render(<HelpDialog open={false} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Transit Map Editor - User Guide')).not.toBeInTheDocument()
  })

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn()
    render(<HelpDialog open={true} onClose={onClose} />)
    
    const closeButton = screen.getByText('Close')
    closeButton.click()
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('displays all help sections', () => {
    render(<HelpDialog open={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('Creating Lines')).toBeInTheDocument()
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByText('Background Image')).toBeInTheDocument()
    expect(screen.getByText('Grid Size')).toBeInTheDocument()
    expect(screen.getByText('Tips')).toBeInTheDocument()
  })
})
