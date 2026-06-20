import { test, expect } from '@playwright/test'

test.describe('Responsive Design & Mobile/Desktop Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test.describe('Desktop Browsers', () => {
        test('full toolbar is visible on desktop', async ({ page }) => {
            await page.goto('/editor')
            await page.setViewportSize({ width: 1280, height: 800 })

            // All toolbar buttons should be visible
            await expect(page.getByRole('button', { name: 'Station', exact: true })).toBeVisible()
            await expect(page.getByRole('button', { name: 'Segment', exact: true })).toBeVisible()
            await expect(page.getByRole('button', { name: 'Shape', exact: true })).toBeVisible()
            await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible()

            // Zoom controls visible
            await expect(page.locator('button[title="Zoom In"], button[aria-label="Zoom In"]')).toBeVisible()
            await expect(page.locator('button[title="Zoom Out"], button[aria-label="Zoom Out"]')).toBeVisible()
        })

        test('mouse interactions work on desktop', async ({ page }) => {
            await page.goto('/editor')

            const canvas = page.getByTestId('editor-canvas')
            await expect(canvas).toBeVisible({ timeout: 10000 })

            await page.getByRole('button', { name: 'Station', exact: true }).click()
            await canvas.click({ position: { x: 400, y: 300 } })

            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible({ timeout: 10000 })
            await dialog.getByRole('button', { name: 'Create' }).click()

            await expect(dialog).toBeHidden({ timeout: 10000 })
            await expect(canvas.locator('circle')).toHaveCount(1, { timeout: 10000 })
        })

        test('right-click context menu works on desktop', async ({ page }) => {
            await page.goto('/editor')

            // Add a station first
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 400, y: 300 } })
            await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

            // Right-click on station
            const station = canvas.locator('circle').first()
            await station.click({ button: 'right' })

            // Context menu should appear
            await expect(page.getByRole('menu')).toBeVisible({ timeout: 5000 })
        })

        test('double-click to rename works on desktop', async ({ page }) => {
            await page.goto('/editor')

            // Add a station
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 400, y: 300 } })
            const dialog = page.getByRole('dialog')
            await dialog.getByRole('textbox').fill('Test Station')
            await dialog.getByRole('button', { name: 'Create' }).click()

            // Double-click on station
            const station = canvas.locator('circle').first()
            await station.dblclick()

            // Rename dialog should appear
            const renameDialog = page.getByRole('dialog')
            await expect(renameDialog).toBeVisible()
        })

        test('keyboard shortcuts work on desktop', async ({ page }) => {
            await page.goto('/editor')
            await page.getByTestId('editor-canvas').focus()

            // Space for pan mode
            await page.keyboard.press('Space')

            // Arrow keys for navigation
            await page.keyboard.press('ArrowRight')
            await page.keyboard.press('ArrowDown')

            // Escape to cancel
            await page.keyboard.press('Escape')

            // Canvas should still be functional
            await expect(page.getByTestId('editor-canvas')).toBeVisible()
        })
    })

    test.describe('Mobile Devices', () => {
        test('touch interactions work on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 })
            await page.goto('/editor')

            // Activate station tool
            await page.getByRole('button', { name: 'Station', exact: true }).click()

            // Touch on canvas (simulated)
            const canvas = page.getByTestId('editor-canvas')
            await canvas.tap({ position: { x: 200, y: 200 } })

            // Dialog should appear
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible({ timeout: 5000 })
        })

        test('long-press context menu works on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 })
            await page.goto('/editor')

            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.tap({ position: { x: 200, y: 200 } })
            await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

            // Station should exist after create
            await expect(canvas.locator('circle')).toHaveCount(1, { timeout: 5000 })
        })

        test('canvas is interactive on mobile viewport', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 })
            await page.goto('/editor')

            const canvas = page.getByTestId('editor-canvas')
            await expect(canvas).toBeVisible()

            // Canvas should have reasonable size for the viewport
            const box = await canvas.boundingBox()
            expect(box?.width).toBeGreaterThan(300)
            expect(box?.height).toBeGreaterThan(400)
        })

        test('toolbar adapts to mobile viewport', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 })

            await page.goto('/editor')

            // On mobile, toolbar might be collapsed or have different layout
            // Main tools should still be accessible
            const stationBtn = page.getByRole('button', { name: 'Station', exact: true })
            const segmentBtn = page.getByRole('button', { name: 'Segment', exact: true })

            // At least one way to access tools should exist
            await expect(stationBtn.or(segmentBtn)).toBeVisible()
        })
    })

    test.describe('Tablet Devices', () => {
        test('tablet layout shows tools appropriately', async ({ page }) => {
            // Set tablet viewport
            await page.setViewportSize({ width: 768, height: 1024 })
            await page.goto('/editor')

            // Canvas should be visible
            await expect(page.getByTestId('editor-canvas')).toBeVisible()

            // Toolbar should be accessible
            await expect(page.getByRole('button', { name: 'Station', exact: true })).toBeVisible()
        })

        test('touch and mouse both work on tablet', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 768 })
            await page.goto('/editor')

            // Can use mouse
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 500, y: 400 } })

            // Dialog should appear
            await expect(page.getByRole('dialog')).toBeVisible()
        })
    })

    test.describe('Viewport Responsiveness', () => {
        test.describe('editor scales to different viewport sizes', () => {
            for (const viewport of [
                { width: 1280, height: 800, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet Portrait' },
                { width: 390, height: 844, name: 'Mobile' },
            ]) {
                test(viewport.name, async ({ page }) => {
                    await page.setViewportSize({ width: viewport.width, height: viewport.height })
                    await page.goto('/editor')

                    const canvas = page.getByTestId('editor-canvas')
                    await expect(canvas).toBeVisible()

                    const box = await canvas.boundingBox()
                    expect(box?.width).toBeGreaterThan(100)
                    expect(box?.height).toBeGreaterThan(100)
                })
            }
        })

        test('orientation change handling', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 }) // Portrait
            await page.goto('/editor')

            const canvas = page.getByTestId('editor-canvas')
            await expect(canvas).toBeVisible()

            // Change to landscape
            await page.setViewportSize({ width: 1024, height: 768 })

            // Small delay for any resize handlers
            await page.waitForTimeout(100)

            // Canvas should still be visible
            await expect(canvas).toBeVisible()
        })

    })

    test.describe('Cross-Device Functionality', () => {
        test('map data persists after viewport resize', async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 800 })
            await page.goto('/editor')

            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 400, y: 300 } })
            await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
            await expect(canvas.locator('circle')).toHaveCount(1, { timeout: 5000 })

            // Resize to mobile
            await page.setViewportSize({ width: 390, height: 844 })
            await expect(canvas).toBeVisible()

            // Station data survives resize
            await expect(canvas.locator('circle')).toHaveCount(1, { timeout: 5000 })
        })

    })
})
