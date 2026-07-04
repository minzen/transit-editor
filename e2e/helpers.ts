import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Click the Clear button, opening the MoreVert overflow menu first if the
 * button is not directly visible (as on mobile viewports).
 */
export async function clickClear(page: Page) {
    const clearBtn = page.getByRole('button', { name: 'Clear', exact: true })
    const isVisible = await clearBtn.isVisible()
    if (!isVisible) {
        // On mobile the Clear button is inside the MoreVert overflow popover
        await page.getByRole('button', { name: 'More', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Clear', exact: true })).toBeVisible({ timeout: 5000 })
    }
    await clearBtn.click()
}

/**
 * Click the editor canvas at a position expressed as fractions of its width/height.
 * relX=0.5, relY=0.5 clicks the centre regardless of viewport size.
 */
export async function clickCanvas(canvas: Locator, relX: number, relY: number) {
    await expect(canvas).toBeVisible({ timeout: 10000 })
    const box = await canvas.boundingBox()
    if (!box) throw new Error('editor-canvas has no bounding box')
    await canvas.click({
        position: {
            x: Math.round(box.width * relX),
            y: Math.round(box.height * relY),
        },
    })
}

/**
 * Create a named station at a canvas-relative position and wait for the dialog to close.
 */
export async function addStation(page: Page, relX: number, relY: number, name = '') {
    await page.getByRole('button', { name: 'Station', exact: true }).click()
    const canvas = page.getByTestId('editor-canvas')
    await clickCanvas(canvas, relX, relY)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15000 })
    if (name) await dialog.getByRole('textbox').first().fill(name)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden({ timeout: 10000 })
}
