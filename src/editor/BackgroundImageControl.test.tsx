import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BackgroundImageControl } from './BackgroundImageControl'

describe('BackgroundImageControl', () => {
    it('renders load image button', () => {
        render(
            <BackgroundImageControl
                backgroundImage={null}
                showBackground={true}
                setShowBackground={vi.fn()}
                setBackgroundImage={vi.fn()}
            />
        )

        expect(screen.getByText('Load Image')).toBeInTheDocument()
    })

    it('does not render hide/show button when no background image', () => {
        render(
            <BackgroundImageControl
                backgroundImage={null}
                showBackground={true}
                setShowBackground={vi.fn()}
                setBackgroundImage={vi.fn()}
            />
        )

        expect(screen.queryByText('Hide BG')).not.toBeInTheDocument()
        expect(screen.queryByText('Show BG')).not.toBeInTheDocument()
    })

    it('renders hide button when background is visible', () => {
        render(
            <BackgroundImageControl
                backgroundImage="data:image/png;base64,abc"
                showBackground={true}
                setShowBackground={vi.fn()}
                setBackgroundImage={vi.fn()}
            />
        )

        expect(screen.getByText('Hide BG')).toBeInTheDocument()
    })

    it('renders show button when background is hidden', () => {
        render(
            <BackgroundImageControl
                backgroundImage="data:image/png;base64,abc"
                showBackground={false}
                setShowBackground={vi.fn()}
                setBackgroundImage={vi.fn()}
            />
        )

        expect(screen.getByText('Show BG')).toBeInTheDocument()
    })

    it('toggles background visibility', () => {
        const setShowBackground = vi.fn()
        render(
            <BackgroundImageControl
                backgroundImage="data:image/png;base64,abc"
                showBackground={true}
                setShowBackground={setShowBackground}
                setBackgroundImage={vi.fn()}
            />
        )

        fireEvent.click(screen.getByText('Hide BG'))
        expect(setShowBackground).toHaveBeenCalledWith(false)
    })
})
