import { test, expect } from '@playwright/test'
import { addStation, clickCanvas } from './helpers'

test.describe('Keyboard shortcuts', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('Ctrl+Z triggers undo after adding a station', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.5, 0.5, 'Alpha')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('Ctrl+Y triggers redo after undo', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.5, 0.5, 'Beta')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)

        await page.keyboard.press('Control+y')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('Ctrl+Shift+Z triggers redo after undo', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.5, 0.5, 'Gamma')

        const canvas = page.getByTestId('editor-canvas')
        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)

        await page.keyboard.press('Control+Shift+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('Delete key removes a selected station', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.5, 0.5, 'Delta')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        // Switch to Select tool and click the station circle to select it
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        await canvas.locator('circle[fill="#fff"][stroke="#111"]').first().click()
        // Wait for the selection ring (stroke-width=3) to confirm the station is selected
        await expect(canvas.locator('circle[fill="none"][stroke="#1976d2"][stroke-width="3"]')).toBeVisible()

        await page.keyboard.press('Delete')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('Backspace key removes a selected station', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.5, 0.5, 'Epsilon')

        const canvas = page.getByTestId('editor-canvas')
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        await canvas.locator('circle[fill="#fff"][stroke="#111"]').first().click()
        // Wait for the selection ring (stroke-width=3) to confirm the station is selected
        await expect(canvas.locator('circle[fill="none"][stroke="#1976d2"][stroke-width="3"]')).toBeVisible()

        await page.keyboard.press('Backspace')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('Delete key does NOT remove station when an input is focused', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.5, 0.5, 'Zeta')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        // Select the station
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        await canvas.locator('circle[fill="#fff"][stroke="#111"]').first().click()

        // Open the line creator dialog (an input will be focused inside it)
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await page.getByRole('button', { name: '+ Line' }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Press Delete – since an input is focused the shortcut should be swallowed
        await page.keyboard.press('Delete')
        await dialog.getByRole('button', { name: 'Cancel' }).click()
        await expect(dialog).toBeHidden()

        // Station must still be present
        await page.getByRole('button', { name: 'Station', exact: true }).click()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('multiple Ctrl+Z operations undo multiple stations', async ({ page }) => {
        await page.goto('/editor')

        const canvas = page.getByTestId('editor-canvas')

        for (const [relX, name] of [[0.25, 'One'], [0.5, 'Two'], [0.75, 'Three']] as [number, string][]) {
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            await clickCanvas(canvas, relX, 0.5)
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible({ timeout: 15000 })
            await dialog.getByRole('textbox').first().fill(name)
            await dialog.getByRole('button', { name: 'Create' }).click()
            await expect(dialog).toBeHidden({ timeout: 10000 })
        }

        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(3)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(2)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })
})
