import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LandingPage } from './LandingPage'
import { BrowserRouter } from 'react-router-dom'

describe('LandingPage', () => {
  it('renders hero section', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Transit Map Editor')).toBeInTheDocument()
    expect(screen.getByText('Create beautiful, schematic transit maps directly in your browser')).toBeInTheDocument()
  })

  it('renders Start Creating button', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Start Creating')).toBeInTheDocument()
  })

  it('renders features section', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Powerful Features')).toBeInTheDocument()
    expect(screen.getByText('Intuitive Canvas')).toBeInTheDocument()
    expect(screen.getByText('Octolinear Design')).toBeInTheDocument()
    expect(screen.getByText('Multiple Lines')).toBeInTheDocument()
    expect(screen.getByText('Undo/Redo')).toBeInTheDocument()
  })

  it('renders demo section', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('See It In Action')).toBeInTheDocument()
    expect(screen.getByText('Editor Interface')).toBeInTheDocument()
    expect(screen.getByText('Exported Map')).toBeInTheDocument()
  })

  it('renders CTA section', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Ready to Create Your Transit Map?')).toBeInTheDocument()
    expect(screen.getByText('Launch Editor')).toBeInTheDocument()
  })

  it('renders footer', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Built with React, TypeScript, and Material Design')).toBeInTheDocument()
    expect(screen.getByText('© 2026 Transit Map Editor. Open source and free to use.')).toBeInTheDocument()
  })
})
