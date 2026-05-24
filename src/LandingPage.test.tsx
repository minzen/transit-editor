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

  it('renders early development notice', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Early dev version')).toBeInTheDocument()
    expect(screen.getByText('Early development version')).toBeInTheDocument()
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
