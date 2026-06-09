import { test, expect, type Page } from '@playwright/test'

test.describe('Keyboard shortcuts', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    // Helper: create a named station at a canvas position
    async function addStation(page: Page, x: number, y: number, name = '') {
        await page.getByRole('button', { name: 'Station', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x, y } })
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        if (name) await dialog.getByRole('textbox').first().fill(name)
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()
    }

    test('Ctrl+Z triggers undo after adding a station', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 400, 300, 'Alpha')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('Ctrl+Y triggers redo after undo', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 400, 300, 'Beta')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)

        await page.keyboard.press('Control+y')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('Ctrl+Shift+Z triggers redo after undo', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 400, 300, 'Gamma')

        const canvas = page.getByTestId('editor-canvas')
        await page.keyboard.press('Control+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)

        await page.keyboard.press('Control+Shift+z')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('Delete key removes a selected station', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 400, 300, 'Delta')

        const canvas = page.getByTestId('editor-canvas')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        // Switch to Select tool and click the station to select it
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        const stationCircle = canvas.locator('circle[fill="#fff"][stroke="#111"]').first()
        await stationCircle.click()

        await page.keyboard.press('Delete')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('Backspace key removes a selected station', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 400, 300, 'Epsilon')

        const canvas = page.getByTestId('editor-canvas')
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        const stationCircle = canvas.locator('circle[fill="#fff"][stroke="#111"]').first()
        await stationCircle.click()

        await page.keyboard.press('Backspace')
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('Delete key does NOT remove station when an input is focused', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 400, 300, 'Zeta')

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

        await page.getByRole('button', { name: 'Station', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')

        for (const [x, name] of [[300, 'One'], [400, 'Two'], [500, 'Three']] as [number, string][]) {
            await canvas.click({ position: { x, y: 300 } })
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await dialog.getByRole('textbox').first().fill(name)
            await dialog.getByRole('button', { name: 'Create' }).click()
            await expect(dialog).toBeHidden()
            await page.getByRole('button', { name: 'Station', exact: true }).click()
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
