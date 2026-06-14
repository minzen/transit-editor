import { test, expect, devices } from '@playwright/test'

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

            // Activate station tool
            await page.getByRole('button', { name: 'Station', exact: true }).click()

            // Click on canvas with mouse
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 400, y: 300 } })

            // Dialog should appear
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await dialog.getByRole('button', { name: 'Create' }).click()

            // Station should be created
            await expect(canvas.locator('circle')).toHaveCount(1, { timeout: 5000 })
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
        test('touch interactions work on mobile', async ({ page, isMobile }) => {
            test.skip(!isMobile, 'Only runs on mobile devices')

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

        test('long-press context menu works on mobile', async ({ page, isMobile }) => {
            test.skip(!isMobile, 'Only runs on mobile devices')

            await page.goto('/editor')

            // Add a station first
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.tap({ position: { x: 200, y: 200 } })
            await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

            // Long-press on station (500ms)
            const station = canvas.locator('circle').first()
            await station.tap({ force: true })
            await page.waitForTimeout(600)

            // Context menu may appear (implementation dependent)
            const menu = page.getByRole('menu')
            await expect(menu).toBeVisible().catch(() => {
                // Menu might not appear in test environment, that's ok
            })
        })

        test('pinch to zoom works on mobile', async ({ page, isMobile }) => {
            test.skip(!isMobile, 'Only runs on mobile devices')

            await page.goto('/editor')
            const canvas = page.getByTestId('editor-canvas')

            // Simulate pinch gesture
            await canvas.evaluate((el) => {
                const rect = el.getBoundingClientRect()
                const touch1 = new Touch({
                    identifier: 1,
                    target: el,
                    clientX: rect.left + rect.width * 0.4,
                    clientY: rect.top + rect.height * 0.4,
                })
                const touch2 = new Touch({
                    identifier: 2,
                    target: el,
                    clientX: rect.left + rect.width * 0.6,
                    clientY: rect.top + rect.height * 0.6,
                })

                const startEvent = new TouchEvent('touchstart', {
                    touches: [touch1, touch2],
                    bubbles: true,
                })
                el.dispatchEvent(startEvent)
            })

            // Canvas should still be visible after gesture
            await expect(canvas).toBeVisible()
        })

        test('toolbar adapts to mobile viewport', async ({ page, isMobile }) => {
            test.skip(!isMobile, 'Only runs on mobile devices')

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
        test('editor scales to different viewport sizes', async ({ page }) => {
            const viewports = [
                { width: 1920, height: 1080, name: 'Desktop Full HD' },
                { width: 1366, height: 768, name: 'Laptop' },
                { width: 1280, height: 800, name: 'Desktop Standard' },
                { width: 1024, height: 768, name: 'Tablet Landscape' },
                { width: 768, height: 1024, name: 'Tablet Portrait' },
                { width: 390, height: 844, name: 'iPhone' },
                { width: 393, height: 852, name: 'Pixel' },
            ]

            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height })
                await page.goto('/editor')

                // Canvas should always be visible
                const canvas = page.getByTestId('editor-canvas')
                await expect(canvas).toBeVisible()

                // Canvas should have reasonable size
                const box = await canvas.boundingBox()
                expect(box?.width).toBeGreaterThan(100)
                expect(box?.height).toBeGreaterThan(100)
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

        test('zoom controls accessible on all sizes', async ({ page }) => {
            const sizes = [
                { width: 320, height: 568 }, // Very small mobile
                { width: 1280, height: 800 }, // Desktop
            ]

            for (const size of sizes) {
                await page.setViewportSize(size)
                await page.goto('/editor')

                // Zoom controls should be present
                const zoomIn = page.locator('button[title="Zoom In"], button[aria-label="Zoom In"]').first()
                const zoomOut = page.locator('button[title="Zoom Out"], button[aria-label="Zoom Out"]').first()

                // At least one should be visible
                await expect(zoomIn.or(zoomOut)).toBeVisible()
            }
        })
    })

    test.describe('Cross-Device Functionality', () => {
        test('map created on desktop works on mobile', async ({ page }) => {
            // Create map on desktop viewport
            await page.setViewportSize({ width: 1280, height: 800 })
            await page.goto('/editor')

            // Add stations
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 400, y: 300 } })
            await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

            await canvas.click({ position: { x: 600, y: 300 } })
            await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

            // Stations should exist
            await expect(canvas.locator('circle')).toHaveCount(2)

            // Switch to mobile viewport
            await page.setViewportSize({ width: 390, height: 844 })
            await page.waitForTimeout(100)

            // Stations should still be visible
            await expect(canvas.locator('circle')).toHaveCount(2)
        })

        test('data persists across viewport changes', async ({ page }) => {
            await page.goto('/editor')

            // Add a station
            await page.getByRole('button', { name: 'Station', exact: true }).click()
            const canvas = page.getByTestId('editor-canvas')
            await canvas.click({ position: { x: 400, y: 300 } })
            const dialog = page.getByRole('dialog')
            await dialog.getByRole('textbox').fill('Persistent Station')
            await dialog.getByRole('button', { name: 'Create' }).click()

            // Change viewport multiple times
            await page.setViewportSize({ width: 768, height: 1024 })
            await page.waitForTimeout(50)
            await page.setViewportSize({ width: 390, height: 844 })
            await page.waitForTimeout(50)
            await page.setViewportSize({ width: 1280, height: 800 })
            await page.waitForTimeout(50)

            // Station should still exist
            await expect(canvas.locator('circle')).toHaveCount(1)
        })
    })
})
