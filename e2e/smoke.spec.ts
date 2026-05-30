import { test, expect } from '@playwright/test'

test.describe('Editor smoke tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('landing page renders and navigates to editor', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'Transit Map Editor' })).toBeVisible()
        await page.getByRole('button', { name: /Start Creating/i }).click()
        await expect(page).toHaveURL(/\/editor/)
    })

    test('can add a station via the canvas', async ({ page }) => {
        await page.goto('/editor')

        // Activate the Station tool
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        // Click on the canvas to open the station name dialog
        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })

        // The station name dialog should appear; create with empty name (now allowed)
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Create' }).click()

        await expect(dialog).toBeHidden()

        // A station <circle> should now exist in the SVG canvas (white fill, black border)
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1, { timeout: 5000 })
    })

    test('can add a line via the toolbar', async ({ page }) => {
        await page.goto('/editor')

        // The "+ Line" button is only shown when the Segment tool is active
        await page.getByRole('button', { name: 'Segment', exact: true }).click()

        // Open the LineCreator dialog
        await page.getByRole('button', { name: '+ Line' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('textbox').first().fill('Red Line')
        await dialog.getByRole('button', { name: 'Create' }).click()

        await expect(dialog).toBeHidden()
    })

    test('zoom-in / zoom-out / reset toolbar buttons are clickable', async ({ page }) => {
        await page.goto('/editor')

        // The toolbar uses MUI IconButtons with Tooltip; accessible name comes from title
        await page.locator('button[aria-label="Zoom In"], button[title="Zoom In"]').first().click()
        await page.locator('button[aria-label="Zoom Out"], button[title="Zoom Out"]').first().click()
        await page.locator('button[aria-label="Reset View"], button[title="Reset View"]').first().click()

        // Canvas should still be visible after viewport changes
        await expect(page.getByTestId('editor-canvas')).toBeVisible()
    })

    test('undo button is disabled on a fresh editor', async ({ page }) => {
        await page.goto('/editor')
        const undoBtn = page.getByRole('button', { name: 'Undo' })
        await expect(undoBtn).toBeDisabled()
    })

    test('undo is enabled after adding a station', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()

        await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
    })
})
