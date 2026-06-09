import { test, expect } from '@playwright/test'

test.describe('Dialogs', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    // ---------------------------------------------------------------------------
    // Help dialog
    // ---------------------------------------------------------------------------

    test('help dialog opens and closes', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Help' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('heading', { name: 'Transit Map Editor - User Guide' })).toBeVisible()

        await dialog.getByRole('button', { name: 'Close' }).click()
        await expect(dialog).toBeHidden()
    })

    test('help dialog contains tool descriptions', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Help' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText('Select Tool')).toBeVisible()
        await expect(dialog.getByText('Station Tool')).toBeVisible()
        await expect(dialog.getByText('Segment Tool')).toBeVisible()
        await expect(dialog.getByText('Shape Tool')).toBeVisible()
    })

    // ---------------------------------------------------------------------------
    // Clear confirm dialog
    // ---------------------------------------------------------------------------

    test('Clear button opens a confirmation dialog', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Clear', exact: true }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText('Clear All Data')).toBeVisible()
    })

    test('cancelling the clear dialog leaves existing data intact', async ({ page }) => {
        await page.goto('/editor')

        // Add a station first
        await page.getByRole('button', { name: 'Station', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })
        const stationDialog = page.getByRole('dialog')
        await expect(stationDialog).toBeVisible()
        await stationDialog.getByRole('button', { name: 'Create' }).click()
        await expect(stationDialog).toBeHidden()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        // Open clear dialog and cancel
        await page.getByRole('button', { name: 'Clear', exact: true }).click()
        const confirmDialog = page.getByRole('dialog')
        await expect(confirmDialog).toBeVisible()
        await confirmDialog.getByRole('button', { name: 'Cancel' }).click()
        await expect(confirmDialog).toBeHidden()

        // Station should still be there
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('confirming the clear dialog removes all stations', async ({ page }) => {
        await page.goto('/editor')

        // Add a station first
        await page.getByRole('button', { name: 'Station', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })
        const stationDialog = page.getByRole('dialog')
        await expect(stationDialog).toBeVisible()
        await stationDialog.getByRole('button', { name: 'Create' }).click()
        await expect(stationDialog).toBeHidden()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        // Confirm clear
        await page.getByRole('button', { name: 'Clear', exact: true }).click()
        const confirmDialog = page.getByRole('dialog')
        await expect(confirmDialog).toBeVisible()
        await confirmDialog.getByRole('button', { name: 'Clear' }).last().click()
        await expect(confirmDialog).toBeHidden()

        // Canvas should be empty
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    // ---------------------------------------------------------------------------
    // Station name dialog validation
    // ---------------------------------------------------------------------------

    test('station name dialog shows error for name exceeding max length', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        const longName = 'X'.repeat(51)
        await dialog.getByRole('textbox').first().fill(longName)

        await expect(dialog.getByText(/cannot exceed 50/i)).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled()

        await dialog.getByRole('button', { name: 'Cancel' }).click()
    })

    test('station name dialog Create button is enabled with a valid name', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        await dialog.getByRole('textbox').first().fill('Main Street')
        await expect(dialog.getByRole('button', { name: 'Create' })).toBeEnabled()

        await dialog.getByRole('button', { name: 'Cancel' }).click()
    })

    // ---------------------------------------------------------------------------
    // Line creator dialog validation
    // ---------------------------------------------------------------------------

    test('line creator shows fields for name, style, and mode', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await page.getByRole('button', { name: '+ Line' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Name textbox
        await expect(dialog.getByRole('textbox').first()).toBeVisible()
        // Style and Mode labels
        await expect(dialog.getByText('Style')).toBeVisible()
        await expect(dialog.getByText('Mode')).toBeVisible()

        await dialog.getByRole('button', { name: 'Cancel' }).click()
    })

    test('line name exceeding max length disables Create', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await page.getByRole('button', { name: '+ Line' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        await dialog.getByRole('textbox').first().fill('L'.repeat(51))
        await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled()

        await dialog.getByRole('button', { name: 'Cancel' }).click()
    })
})
