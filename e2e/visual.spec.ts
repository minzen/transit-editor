import { test, expect } from '@playwright/test'

test.describe('Visual regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('landing page matches snapshot', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'Transit Map Editor' })).toBeVisible()
        await expect(page).toHaveScreenshot('landing-page.png', {
            fullPage: true,
            animations: 'disabled',
        })
    })

    test('empty editor matches snapshot', async ({ page }) => {
        await page.goto('/editor')
        await expect(page.getByTestId('editor-canvas')).toBeVisible()
        await expect(page).toHaveScreenshot('editor-empty.png', {
            animations: 'disabled',
        })
    })

    test('editor with one station matches snapshot', async ({ page }) => {
        await page.goto('/editor')

        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('textbox').first().fill('Central')
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()

        // Move pointer away to avoid hover effects in the snapshot
        await page.mouse.move(0, 0)

        await expect(canvas).toHaveScreenshot('editor-one-station.png', {
            animations: 'disabled',
        })
    })
})
