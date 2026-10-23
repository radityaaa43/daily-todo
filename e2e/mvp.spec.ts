import { expect, test } from '@playwright/test'
import { add, seed, seedState, stored } from './helpers'

const items = (page: import('@playwright/test').Page) => page.locator('li[data-task-id]')

test.describe('US-1 add', () => {
  test('AC-1.1/1.2/1.4/1.6 add via Enter, trim, focus kept, order', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add task')
    await expect(input).toBeVisible()
    await add(page, ' Buy milk ')
    await add(page, 'Second')
    await expect(items(page)).toHaveCount(2)
    await expect(items(page).first()).toContainText('Buy milk')
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('')
    expect((await stored(page)).tasks[0].text).toBe('Buy milk')
  })
  test('AC-1.2 add button', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Add task').fill('Via button')
    await page.getByRole('button', { name: 'Add task' }).click()
    await expect(items(page)).toHaveCount(1)
  })
  test('AC-1.3 blank rejected', async ({ page }) => {
    await page.goto('/')
    await add(page, '   ')
    await add(page, '')
    await expect(items(page)).toHaveCount(0)
  })
  test('AC-1.5 200 char cap', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add task')
    await input.fill('x'.repeat(250))
    await expect(input).toHaveValue('x'.repeat(200))
  })
})

test.describe('US-2 complete', () => {
  test('AC-2.1/2.2/2.3 toggle moves, progress, restores order', async ({ page }) => {
    await page.goto('/')
    for (const t of ['A', 'B', 'C']) await add(page, t)
    await expect(page.getByText('0 of 3 done')).toBeVisible()
    await page.getByRole('checkbox', { name: 'Mark done: A' }).click()
    await expect(page.getByText('1 of 3 done')).toBeVisible()
    await expect(items(page).last()).toContainText('A')
    await page.getByRole('checkbox', { name: 'Mark not done: A' }).click()
    await expect(items(page).first()).toContainText('A')
  })
  test('AC-2.4 keyboard toggle with Space', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Kbd')
    await page.getByRole('checkbox', { name: 'Mark done: Kbd' }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('checkbox', { name: 'Mark not done: Kbd' })).toBeChecked()
  })
})

test.describe('US-3 delete + undo', () => {
  test('AC-3.1..3.3 delete, Undo restores position and state', async ({ page }) => {
    await page.goto('/')
    for (const t of ['A', 'B', 'C']) await add(page, t)
    await page.getByRole('button', { name: 'Delete task: B' }).click()
    await expect(items(page)).toHaveCount(2)
    await expect(page.getByText('Task deleted')).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(items(page)).toHaveCount(3)
    await expect(items(page).nth(1)).toContainText('B')
  })
  test('AC-3.4 undo expires after 5 s, deletion persists', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Gone')
    await page.getByRole('button', { name: 'Delete task: Gone' }).click()
    await page.mouse.move(0, 0)
    await expect(page.getByText('Task deleted')).toBeHidden({ timeout: 8000 })
    await page.reload()
    await expect(items(page)).toHaveCount(0)
  })
  test('AC-3.4 second delete replaces undo', async ({ page }) => {
    await page.goto('/')
    await add(page, 'A')
    await add(page, 'B')
    await page.getByRole('button', { name: 'Delete task: A' }).click()
    await page.getByRole('button', { name: 'Delete task: B' }).click()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(items(page)).toHaveCount(1)
    await expect(items(page).first()).toContainText('B')
  })
})

test.describe('US-4 edit', () => {
  test('AC-4.1/4.2 edit via click, Enter saves trimmed', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Old')
    await page.getByRole('button', { name: 'Edit task: Old' }).click()
    const ed = page.getByLabel('Edit task')
    await expect(ed).toBeFocused()
    await ed.fill('  New  ')
    await ed.press('Enter')
    await expect(items(page).first()).toContainText('New')
    expect((await stored(page)).tasks[0].text).toBe('New')
  })
  test('AC-4.2 blur saves', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Old')
    await page.getByRole('button', { name: 'Edit task: Old' }).click()
    await page.getByLabel('Edit task').fill('Blurred')
    await page.getByPlaceholder('Add task').click()
    await expect(items(page).first()).toContainText('Blurred')
  })
  test('AC-4.3 Escape cancels', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Keep')
    await page.getByRole('button', { name: 'Edit task: Keep' }).click()
    await page.getByLabel('Edit task').fill('Nope')
    await page.keyboard.press('Escape')
    await expect(items(page).first()).toContainText('Keep')
  })
  test('AC-4.4 empty edit rejected', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Keep')
    await page.getByRole('button', { name: 'Edit task: Keep' }).click()
    await page.getByLabel('Edit task').fill('   ')
    await page.keyboard.press('Enter')
    await expect(items(page).first()).toContainText('Keep')
  })
  test('AC-4.5 edit capped at 200', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Keep')
    await page.getByRole('button', { name: 'Edit task: Keep' }).click()
    const ed = page.getByLabel('Edit task')
    await ed.fill('y'.repeat(260))
    await expect(ed).toHaveValue('y'.repeat(200))
  })
})

test.describe('US-5 new day', () => {
  test('AC-5.1..5.3 rollover on load', async ({ page }) => {
    await seed(
      page,
      seedState([
        { text: 'old done', done: true, ago: 3 },
        { text: 'three days', ago: 3 },
        { text: 'yesterday open', ago: 1 },
        { text: 'yday done', done: true, ago: 1 },
        { text: 'today done', done: true, ago: 0 },
      ]),
    )
    await page.goto('/')
    await expect(page.getByText('old done')).toHaveCount(0)
    await expect(page.getByText('yday done')).toHaveCount(0)
    await expect(page.getByText('today done')).toBeVisible()
    await expect(page.getByText('from 3 days ago')).toBeVisible()
    await expect(page.getByText('from yesterday')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Mark done: three days/ })).not.toBeChecked()
  })
  test('AC-5.4 open page rolls over within 60 s of midnight', async ({ page }) => {
    const base = new Date()
    base.setHours(23, 59, 0, 0)
    await page.clock.install({ time: base })
    await seed(page, seedState([{ text: 'doneToday', done: true }, { text: 'openToday' }], base))
    await page.goto('/')
    await expect(page.getByText('doneToday')).toBeVisible()
    await page.clock.runFor(61_000)
    await expect(page.getByText('doneToday')).toHaveCount(0)
    await expect(page.getByText('openToday')).toBeVisible()
    await expect(page.getByText('from yesterday')).toBeVisible()
  })
  test('AC-5.5 done task same day stays', async ({ page }) => {
    await page.goto('/')
    await add(page, 'X')
    await page.getByRole('checkbox', { name: 'Mark done: X' }).click()
    await page.reload()
    await expect(page.getByRole('checkbox', { name: 'Mark not done: X' })).toBeChecked()
  })
  test('AC-5.6 header date', async ({ page }) => {
    await page.goto('/')
    const txt = await page.locator('header time').innerText()
    expect(txt).toBe(
      new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date()),
    )
  })
})

test.describe('US-6 persistence', () => {
  test('AC-6.1 reload keeps state', async ({ page }) => {
    await page.goto('/')
    await add(page, 'P1')
    await add(page, 'P2')
    await page.getByRole('checkbox', { name: 'Mark done: P1' }).click()
    await page.reload()
    await expect(items(page)).toHaveCount(2)
    await expect(page.getByRole('checkbox', { name: 'Mark not done: P1' })).toBeChecked()
  })
  test('AC-6.1 browser restart (persistent profile)', async ({ playwright, baseURL }) => {
    const dir = test.info().outputPath('profile')
    let ctx = await playwright.chromium.launchPersistentContext(dir, { channel: process.env.E2E_CHANNEL || undefined })
    let p = await ctx.newPage()
    await p.goto(baseURL!)
    await add(p, 'Survives')
    await ctx.close()
    ctx = await playwright.chromium.launchPersistentContext(dir, { channel: process.env.E2E_CHANNEL || undefined })
    p = await ctx.newPage()
    await p.goto(baseURL!)
    await expect(p.getByText('Survives')).toBeVisible()
    await ctx.close()
  })
  test('AC-6.2 offline after first load', async ({ page, context }) => {
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload() // SW now controls the page
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByPlaceholder('Add task')).toBeVisible()
    await add(page, 'Offline task')
    await page.getByRole('checkbox', { name: 'Mark done: Offline task' }).click()
    await expect(page.getByText('1 of 1 done')).toBeVisible()
  })
  test('AC-6.3 storage blocked shows notice, still works', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('denied', 'SecurityError')
        },
      })
    })
    await page.goto('/')
    await expect(
      page.getByText("Your tasks can't be saved on this device and will be lost when you close this tab."),
    ).toBeVisible()
    await add(page, 'Session only')
    await expect(items(page)).toHaveCount(1)
  })
  test('AC-6.4 plain text', async ({ page }) => {
    await page.goto('/')
    await add(page, '<b>hi</b>')
    await expect(items(page).first()).toContainText('<b>hi</b>')
    await expect(page.locator('li b')).toHaveCount(0)
    await page.reload()
    await expect(items(page).first()).toContainText('<b>hi</b>')
  })
})

test.describe('US-7 states', () => {
  test('AC-7.1/7.3 empty', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Nothing planned yet.')).toBeVisible()
    await expect(page.getByText('Add your first task for today.')).toBeVisible()
    await expect(page.getByText(/of \d+ done/)).toHaveCount(0)
  })
  test('AC-7.2 all done above completed', async ({ page }) => {
    await page.goto('/')
    await add(page, 'Z')
    await expect(page.getByText('All done for today.')).toHaveCount(0)
    await page.getByRole('checkbox', { name: 'Mark done: Z' }).click()
    const msg = page.getByText('All done for today.')
    await expect(msg).toBeVisible()
    const mb = (await msg.boundingBox())!
    const ib = (await items(page).first().boundingBox())!
    expect(mb.y).toBeLessThan(ib.y)
  })
})

test.describe('NFR', () => {
  for (const w of [360, 1440]) {
    test(`NFR-2 no horizontal scroll at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 })
      await seed(page, seedState([{ text: 'long '.repeat(40).trim() + 'W'.repeat(60), ago: 2 }, { text: 'b' }]))
      await page.goto('/')
      await page.getByPlaceholder('Add task').fill('z'.repeat(190))
      const sw = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(sw).toBeLessThanOrEqual(w)
    })
  }
  test('NFR-4 no third-party requests', async ({ page, baseURL }) => {
    const hosts = new Set<string>()
    page.on('request', (r) => hosts.add(new URL(r.url()).host))
    await page.goto('/')
    await add(page, 'a')
    await page.waitForLoadState('networkidle')
    expect([...hosts]).toEqual([new URL(baseURL!).host])
  })
  test('NFR-1 100 tasks usable < 1 s after load', async ({ page }) => {
    await seed(page, seedState(Array.from({ length: 100 }, (_, i) => ({ text: `task ${i}`, ago: i % 3 }))))
    await page.goto('/') // first visit (warms cache)
    await page.reload()
    const t0 = Date.now()
    await page.reload()
    await expect(items(page)).toHaveCount(100)
    await page.getByPlaceholder('Add task').fill('x')
    expect(Date.now() - t0).toBeLessThan(1000)
  })
  test('NFR-3 keyboard-only flow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByPlaceholder('Add task')).toBeFocused() // M-1: input autofocused on desktop
    await page.keyboard.type('Kb one')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab') // add button
    await page.keyboard.press('Tab') // checkbox
    await expect(page.getByRole('checkbox', { name: 'Mark done: Kb one' })).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // edit
    await expect(page.getByLabel('Edit task')).toBeFocused()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // delete
    await expect(items(page)).toHaveCount(0)
    await page.keyboard.press('Tab')
  })
})
