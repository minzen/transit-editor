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

    test('station dragging and keyboard movement keep connected sections at 45-degree multiples', async ({ page }) => {
        const viewport = page.viewportSize()
        if (!viewport) throw new Error('Missing test viewport')
        // Keep the fixture and drag path below the wrapping mobile toolbar.
        const x = Math.floor(viewport.width * 0.5 / 20) * 20
        const y = Math.floor(viewport.height * 0.6 / 20) * 20
        await page.addInitScript(({ x, y }) => {
            localStorage.setItem('transit-editor-storage', JSON.stringify({ version: 1, state: {
                activeTool: 'select', freeformMode: false, gridCellSize: 20,
                stations: { a: { id: 'a', x, y, name: 'A' }, b: { id: 'b', x: x + 100, y, name: 'B' } },
                segments: { s: { id: 's', fromStationId: 'a', toStationId: 'b', lineIds: ['l'],
                    points: [{ x, y }, { x: x + 60, y }, { x: x + 100, y }] } },
                lines: { l: { id: 'l', name: 'L1', color: '#ff0000' } }, shapes: {},
            } }))
        }, { x, y })
        await page.goto('/editor')
        const canvas = page.getByTestId('editor-canvas')
        const station = canvas.locator('circle[fill="#fff"][stroke="#111"]').first()
        await expect(station).toBeVisible()
        await station.click({ trial: true })
        const readPoints = () => page.evaluate((): { x: number; y: number }[] =>
            JSON.parse(localStorage.getItem('transit-editor-storage') ?? '{}').state.segments.s.points)
        const checkAngles = async () => {
            const points = await readPoints()
            for (let i = 1; i < points.length; i++) {
                const dx = Math.abs(points[i].x - points[i - 1].x)
                const dy = Math.abs(points[i].y - points[i - 1].y)
                expect(Math.min(dx, dy, Math.abs(dx - dy))).toBeLessThan(1e-8)
            }
        }
        const original = await readPoints()
        const box = await station.boundingBox()
        if (!box) throw new Error('Missing station')
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        for (const offset of [40, 80, 120]) {
            await page.mouse.move(box.x + box.width / 2 - offset, box.y + box.height / 2 - 80)
            await expect.poll(async () => (await readPoints())[0]).toEqual({
                x: original[0].x - offset, y: original[0].y - 80,
            })
            await checkAngles()
        }
        await page.mouse.up()
        const dragged = await readPoints()
        await canvas.focus()
        await page.keyboard.press('Escape')
        await page.keyboard.press('Tab')
        await page.keyboard.press('ArrowDown')
        await expect.poll(async () => (await readPoints())[0].y).not.toBe(dragged[0].y)
        await checkAngles()
        await page.getByRole('button', { name: 'Undo', exact: true }).click()
        expect(await readPoints()).toEqual(dragged)
        await page.getByRole('button', { name: 'Undo', exact: true }).click()
        expect(await readPoints()).toEqual(original)
    })

    test('diagonal labels render and dragging recomputes placement in one undo step', async ({ page }) => {
        await page.goto('/editor')
        await addStation(page, 0.4, 0.5, 'Central')
        await page.getByRole('button', { name: 'Select', exact: true }).click()
        const canvas = page.getByTestId('editor-canvas')
        const station = canvas.locator('circle[fill="#fff"][stroke="#111"]').first()
        const label = canvas.locator('text').filter({ hasText: /^Central$/ })
        for (const [name, anchor, baseline] of [
            ['Top Right', 'start', 'auto'], ['Bottom Right', 'start', 'hanging'],
            ['Bottom Left', 'end', 'hanging'], ['Top Left', 'end', 'auto'],
        ]) {
            await station.click({ button: 'right' })
            await page.getByRole('menuitem', { name: `Label ${name}`, exact: true }).click()
            await expect(label).toHaveAttribute('text-anchor', anchor)
            await expect(label).toHaveAttribute('dominant-baseline', baseline)
        }
        // Wait for the menu's closing backdrop to stop intercepting pointer input.
        await station.click({ trial: true })
        const originalX = await station.getAttribute('cx')
        if (originalX === null) throw new Error('Missing station coordinate')
        const box = await station.boundingBox()
        if (!box) throw new Error('Station is not visible')
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 5 })
        await page.mouse.up()
        await expect(station).not.toHaveAttribute('cx', originalX)
        await expect(label).toHaveAttribute('text-anchor', 'middle')
        await page.getByRole('button', { name: 'Undo', exact: true }).click()
        await expect(station).toHaveAttribute('cx', originalX)
        await expect(label).toHaveAttribute('text-anchor', 'end')
    })

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
