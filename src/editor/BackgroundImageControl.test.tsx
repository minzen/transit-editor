import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BackgroundImageControl } from './BackgroundImageControl'
import { useEditorStore } from '../store/editorStore'

describe('BackgroundImageControl', () => {
    beforeEach(() => {
        useEditorStore.setState({
            backgroundImageUrl: null,
            showBackgroundImage: true,
            backgroundImageX: 0,
            backgroundImageY: 0,
            backgroundImageWidth: 4000,
            backgroundImageHeight: 4000,
            backgroundImageOpacity: 0.3,
        })
    })

    it('renders load image button', () => {
        render(<BackgroundImageControl />)
        expect(screen.getByText('Load Image')).toBeInTheDocument()
    })

    it('does not render hide/show/remove buttons when no background image', () => {
        render(<BackgroundImageControl />)
        expect(screen.queryByText('Hide BG')).not.toBeInTheDocument()
        expect(screen.queryByText('Show BG')).not.toBeInTheDocument()
        expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    })

    it('renders hide button when background is visible', () => {
        useEditorStore.setState({ backgroundImageUrl: 'data:image/png;base64,abc' })
        render(<BackgroundImageControl />)
        expect(screen.getByText('Hide BG')).toBeInTheDocument()
    })

    it('renders show button when background is hidden', () => {
        useEditorStore.setState({
            backgroundImageUrl: 'data:image/png;base64,abc',
            showBackgroundImage: false,
        })
        render(<BackgroundImageControl />)
        expect(screen.getByText('Show BG')).toBeInTheDocument()
    })

    it('toggles background visibility', () => {
        useEditorStore.setState({ backgroundImageUrl: 'data:image/png;base64,abc' })
        render(<BackgroundImageControl />)
        fireEvent.click(screen.getByText('Hide BG'))
        expect(useEditorStore.getState().showBackgroundImage).toBe(false)
    })

    it('removes background image', () => {
        useEditorStore.setState({ backgroundImageUrl: 'data:image/png;base64,abc' })
        render(<BackgroundImageControl />)
        fireEvent.click(screen.getByText('Remove'))
        expect(useEditorStore.getState().backgroundImageUrl).toBeNull()
    })

    it('renders placement sliders when image is loaded', () => {
        useEditorStore.setState({ backgroundImageUrl: 'data:image/png;base64,abc' })
        render(<BackgroundImageControl />)
        expect(screen.getByText('Placement')).toBeInTheDocument()
    })
})
