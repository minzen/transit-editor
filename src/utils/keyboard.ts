import type { KeyboardEvent } from 'react'

/**
 * Build a keydown handler that invokes `callback` when the Enter key is pressed.
 * Useful for submitting text inputs on Enter.
 */
export function onEnterKey<T extends Element>(
    callback: () => void
): (event: KeyboardEvent<T>) => void {
    return (event) => {
        if (event.key === 'Enter') {
            callback()
        }
    }
}
