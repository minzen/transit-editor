import { test, expect } from '@playwright/test'

test.describe('Visual regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('landing page structure is correct', async ({ page }) => {
        await page.goto('/')

        await expect(page.getByRole('heading', { name: 'Transit Map Editor' })).toBeVisible()
        await expect(page.getByRole('link', { name: /start editing/i })).toBeVisible()
    })

    test('empty editor has canvas and toolbar', async ({ page }) => {
        await page.goto('/editor')

        await expect(page.getByTestId('editor-canvas')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Station', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Segment', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Shape', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible()
    })

    test('editor with one station renders a circle', async ({ page }) => {
        await page.goto('/editor')

        await page.getByRole('button', { name: 'Station', exact: true }).click()

        const canvas = page.getByTestId('editor-canvas')
        await canvas.click({ position: { x: 400, y: 300 } })

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('textbox').first().fill('Central')
        await dialog.getByRole('button', { name: 'Create' }).click()
        await expect(dialog).toBeHidden()

        await expect(canvas.locator('circle')).toHaveCount(1)
    })
})
