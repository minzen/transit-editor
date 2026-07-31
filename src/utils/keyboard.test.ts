import { describe, it, expect, vi } from 'vitest'
import type { KeyboardEvent } from 'react'
import { onEnterKey } from './keyboard'

function keyEvent(key: string): KeyboardEvent<HTMLInputElement> {
    return { key } as KeyboardEvent<HTMLInputElement>
}

describe('onEnterKey', () => {
    it('invokes the callback when Enter is pressed', () => {
        const cb = vi.fn()
        onEnterKey<HTMLInputElement>(cb)(keyEvent('Enter'))
        expect(cb).toHaveBeenCalledTimes(1)
    })

    it('ignores other keys', () => {
        const cb = vi.fn()
        const handler = onEnterKey<HTMLInputElement>(cb)
        handler(keyEvent('a'))
        handler(keyEvent('Escape'))
        expect(cb).not.toHaveBeenCalled()
    })
})
