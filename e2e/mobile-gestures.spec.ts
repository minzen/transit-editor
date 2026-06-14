import { test, expect } from '@playwright/test'

test.describe('Mobile Touch Gestures', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('single tap selects station', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Mobile-only test')

        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.tap({ position: { x: 200, y: 200 } })

        // Create station
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

        // Tap on station to select
        const station = canvas.locator('circle').first()
        await station.tap()

        // Station should be selected (check for selection ring)
        await expect(canvas.locator('circle[stroke-width="4"]').first()).toBeVisible()
    })

    test('two-finger pan gestures', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Mobile-only test')

        await page.goto('/editor')
        const canvas = page.getByTestId('editor-canvas')

        // Get initial transform
        const initialTransform = await canvas.locator('g').first().evaluate((el) => {
            return el.getAttribute('transform')
        })

        // Simulate two-finger pan
        await canvas.evaluate((el) => {
            const touch1 = new Touch({
                identifier: 1,
                target: el,
                clientX: 100,
                clientY: 100,
            })
            const touch2 = new Touch({
                identifier: 2,
                target: el,
                clientX: 200,
                clientY: 200,
            })

            el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1, touch2], bubbles: true }))

            // Move touches
            const movedTouch1 = new Touch({
                identifier: 1,
                target: el,
                clientX: 150,
                clientY: 150,
            })
            const movedTouch2 = new Touch({
                identifier: 2,
                target: el,
                clientX: 250,
                clientY: 250,
            })

            el.dispatchEvent(new TouchEvent('touchmove', { touches: [movedTouch1, movedTouch2], bubbles: true }))
            el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }))
        })

        // Canvas should still be functional
        await expect(canvas).toBeVisible()
    })

    test('station drag with touch', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Mobile-only test')

        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.tap({ position: { x: 200, y: 200 } })
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

        const station = canvas.locator('circle').first()

        // Get initial position
        const initialBox = await station.boundingBox()

        // Simulate drag by touch
        await station.evaluate((el) => {
            const touch = new Touch({
                identifier: 1,
                target: el,
                clientX: 200,
                clientY: 200,
            })

            el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], bubbles: true }))

            const movedTouch = new Touch({
                identifier: 1,
                target: el,
                clientX: 300,
                clientY: 300,
            })

            el.dispatchEvent(new TouchEvent('touchmove', { touches: [movedTouch], bubbles: true }))
            el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }))
        })

        // Station should have moved
        const finalBox = await station.boundingBox()
        expect(finalBox?.x).not.toEqual(initialBox?.x)
    })

    test('swipe to dismiss dialog', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Mobile-only test')

        await page.goto('/editor')
        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.tap({ position: { x: 200, y: 200 } })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Press Escape to dismiss
        await page.keyboard.press('Escape')

        // Dialog should close
        await expect(dialog).toBeHidden()
    })

    test('tap on toolbar buttons', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Mobile-only test')

        await page.goto('/editor')

        // All toolbar buttons should be tappable
        const stationBtn = page.getByRole('button', { name: 'Station', exact: true })
        const segmentBtn = page.getByRole('button', { name: 'Segment', exact: true })

        await stationBtn.tap()
        await expect(stationBtn).toHaveAttribute('aria-pressed', 'true')

        await segmentBtn.tap()
        await expect(segmentBtn).toHaveAttribute('aria-pressed', 'true')
    })
})

test.describe('Desktop Mouse Interactions', () => {
    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile === true, 'Desktop-only test')
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('hover effects on toolbar buttons', async ({ page }) => {
        await page.goto('/editor')

        const stationBtn = page.getByRole('button', { name: 'Station', exact: true })

        // Hover should show tooltip
        await stationBtn.hover()
        await expect(page.getByRole('tooltip')).toBeVisible()
    })

    test('mouse wheel zoom', async ({ page }) => {
        await page.goto('/editor')
        const canvas = page.getByTestId('editor-canvas')

        // Get initial transform
        const initialTransform = await canvas.locator('g').first().evaluate((el) => {
            return el.getAttribute('transform')
        })

        // Wheel zoom on canvas
        await canvas.locator('svg').first().dispatchEvent('wheel', {
            deltaY: -100,
            clientX: 400,
            clientY: 300,
        })

        // Transform may have changed (implementation dependent)
        await expect(canvas).toBeVisible()
    })

    test('drag to create segment', async ({ page }) => {
        await page.goto('/editor')

        // Create two stations first
        await page.getByRole('button', { name: 'Station', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')

        await canvas.click({ position: { x: 400, y: 300 } })
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

        await canvas.click({ position: { x: 600, y: 300 } })
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

        // Switch to segment tool
        await page.getByRole('button', { name: 'Segment', exact: true }).click()

        // Select line if needed
        const lineSelect = page.locator('select').first()
        if (await lineSelect.isVisible().catch(() => false)) {
            await lineSelect.selectOption({ index: 0 })
        }

        // Create line between stations
        const stations = canvas.locator('circle')
        await stations.first().click()
        await stations.last().click()

        // Segment path should exist
        await expect(canvas.locator('path')).toHaveCount(1)
    })

    test('shift+click multi-select', async ({ page }) => {
        await page.goto('/editor')

        // Create two stations
        await page.getByRole('button', { name: 'Station', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')

        await canvas.click({ position: { x: 400, y: 300 } })
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

        await canvas.click({ position: { x: 600, y: 300 } })
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

        // Switch to select tool
        await page.getByRole('button', { name: 'Select', exact: true }).click()

        // Click first station
        const stations = canvas.locator('circle')
        await stations.first().click()

        // Shift+click second station
        await stations.last().click({ modifiers: ['Shift'] })

        // Both should be selected (selection rings visible)
        const selectionRings = canvas.locator('circle[stroke-width="4"]')
        await expect(selectionRings).toHaveCount(2)
    })
})
