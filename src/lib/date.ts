import type { DateKey } from './tasks'

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function utcDay(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((utcDay(to) - utcDay(from)) / 86_400_000)
}

export function formatHeaderDate(d: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(d)
}
