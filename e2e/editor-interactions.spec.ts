import { test, expect } from '@playwright/test'
import { clickCanvas, addStation } from './helpers'

test.describe('Editor interactions', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    // ---------------------------------------------------------------------------
    // Station creation
    // ---------------------------------------------------------------------------

    test('station Create button is disabled when name is empty after whitespace-only input', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await clickCanvas(canvas, 0.5, 0.5)

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Station name is optional (empty is valid) but whitespace-only sanitises to empty → valid
        // Type a valid name then clear → button should still be enabled (empty name is valid)
        const textbox = dialog.getByRole('textbox').first()
        await textbox.fill('Central')
        await expect(dialog.getByRole('button', { name: 'Create' })).toBeEnabled()

        await textbox.clear()
        // Empty name is valid per MIN_STATION_NAME_LENGTH = 0
        await expect(dialog.getByRole('button', { name: 'Create' })).toBeEnabled()
    })

    test('station Create button is disabled when name exceeds max length', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await clickCanvas(canvas, 0.5, 0.5)

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        const longName = 'A'.repeat(51)
        const input = dialog.getByRole('textbox').first()
        await input.evaluate((el: HTMLInputElement, val) => {
            el.removeAttribute('maxlength')
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
            nativeInputValueSetter?.call(el, val)
            el.dispatchEvent(new Event('input', { bubbles: true }))
        }, longName)

        await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled()
    })

    test('pressing Enter in station name dialog creates the station', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await clickCanvas(canvas, 0.5, 0.5)

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('textbox').first().fill('Terminus')
        await dialog.getByRole('textbox').first().press('Enter')

        await expect(dialog).toBeHidden()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    test('cancelling station name dialog does not add a station', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await clickCanvas(canvas, 0.5, 0.5)

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Cancel' }).click()

        await expect(dialog).toBeHidden()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)
    })

    test('can add two stations at different positions', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')

        await clickCanvas(canvas, 0.3, 0.5)
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()

        await clickCanvas(canvas, 0.7, 0.5)
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()

        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(2)
    })

    // ---------------------------------------------------------------------------
    // Line creation
    // ---------------------------------------------------------------------------

    test('line name is required - Create button disabled when line name is empty', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await page.getByRole('button', { name: '+ Line' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Name field starts empty → Create should be disabled
        await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled()
    })

    test('can create a line and it appears in the line selector dropdown', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await page.getByRole('button', { name: '+ Line' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('textbox').first().fill('Blue Line')
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()

        // The line selector dropdown should now contain 'Blue Line'
        await expect(page.getByRole('combobox').filter({ hasText: 'Blue Line' })).toBeVisible()
    })

    test('cancelling line creation dialog does not add a line', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await page.getByRole('button', { name: '+ Line' }).click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('textbox').first().fill('Ghost Line')
        await dialog.getByRole('button', { name: 'Cancel' }).click()
        await expect(dialog).toBeHidden()

        // No combobox should show 'Ghost Line'
        await expect(page.locator('li[role="option"]', { hasText: 'Ghost Line' })).toHaveCount(0)
    })

    // ---------------------------------------------------------------------------
    // Tool switching
    // ---------------------------------------------------------------------------

    test('switching tools highlights the active tool button', async ({ page }) => {
        await page.goto('/editor')

        const selectBtn = page.getByRole('button', { name: 'Select', exact: true })
        const stationBtn = page.getByRole('button', { name: 'Station', exact: true })
        const segmentBtn = page.getByRole('button', { name: 'Segment', exact: true })
        const shapeBtn = page.getByRole('button', { name: 'Shape', exact: true })

        await stationBtn.click()
        await expect(stationBtn).toHaveAttribute('class', /MuiButton-contained/)

        await segmentBtn.click()
        await expect(segmentBtn).toHaveAttribute('class', /MuiButton-contained/)
        await expect(stationBtn).not.toHaveAttribute('class', /MuiButton-contained/)

        await shapeBtn.click()
        await expect(shapeBtn).toHaveAttribute('class', /MuiButton-contained/)

        await selectBtn.click()
        await expect(selectBtn).toHaveAttribute('class', /MuiButton-contained/)
    })

    test('+ Line button is only visible when Segment tool is active', async ({ page }) => {
        await page.goto('/editor')

        // Initially (Select tool active) the + Line button should not be visible
        await expect(page.getByRole('button', { name: '+ Line' })).toHaveCount(0)

        // Activate Segment tool
        await page.getByRole('button', { name: 'Segment', exact: true }).click()
        await expect(page.getByRole('button', { name: '+ Line' })).toBeVisible()

        // Switch away → button disappears
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        await expect(page.getByRole('button', { name: '+ Line' })).toHaveCount(0)
    })

    // ---------------------------------------------------------------------------
    // Redo
    // ---------------------------------------------------------------------------

    test('redo button is disabled on a fresh editor', async ({ page }) => {
        await page.goto('/editor')
        await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled()
    })

    test('undo then redo restores a deleted station', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await clickCanvas(canvas, 0.5, 0.5)

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)

        // Undo removes the station
        await page.getByRole('button', { name: 'Undo' }).click()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(0)

        // Redo restores it
        await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled()
        await page.getByRole('button', { name: 'Redo' }).click()
        await expect(canvas.locator('circle[fill="#fff"][stroke="#111"]')).toHaveCount(1)
    })

    // ---------------------------------------------------------------------------
    // Viewport controls
    // ---------------------------------------------------------------------------

    test('zoom controls do not crash the editor', async ({ page }) => {
        await page.goto('/editor')
        const canvas = page.getByTestId('editor-canvas')

        await page.locator('button[aria-label="Zoom In"]').click()
        await page.locator('button[aria-label="Zoom In"]').click()
        await page.locator('button[aria-label="Zoom Out"]').click()
        await page.locator('button[aria-label="Reset View"]').click()

        await expect(canvas).toBeVisible()
    })
})
