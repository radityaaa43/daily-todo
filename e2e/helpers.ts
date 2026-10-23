import type { Page } from '@playwright/test'

export const KEY = 'daily-todo:v1'

export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function daysAgo(n: number, from = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return d
}

interface SeedTask {
  text: string
  done?: boolean
  ago?: number // created N days ago
  doneAgo?: number // completed N days ago
}

export function seedState(tasks: SeedTask[], now = new Date()) {
  return {
    version: 1,
    tasks: tasks.map((t, i) => {
      const created = daysAgo(t.ago ?? 0, now)
      const completed = t.done ? daysAgo(t.doneAgo ?? t.ago ?? 0, now) : null
      return {
        id: `seed-${i}`,
        text: t.text,
        done: !!t.done,
        createdAt: created.getTime() + i,
        createdDate: dateKey(created),
        completedAt: completed ? completed.getTime() + i : null,
        completedDate: completed ? dateKey(completed) : null,
      }
    }),
  }
}

/** Seed localStorage once, before the app boots (only if key is absent, so reloads keep state). */
export async function seed(page: Page, state: unknown) {
  await page.addInitScript(
    ([k, v]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v)
    },
    [KEY, JSON.stringify(state)],
  )
}

export async function add(page: Page, text: string) {
  const input = page.getByPlaceholder('Add task')
  await input.fill(text)
  await input.press('Enter')
}

export const stored = (page: Page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY)
