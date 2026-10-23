// TEMPORARY: subset of the spec §3.1 contract so slice 2 can build before slice 1 (data layer) merges.
// Slice 1 owns this file; on merge take its version.
import type { DateKey } from './tasks'

export function toDateKey(d: Date): DateKey {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function formatHeaderDate(d: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(d)
}
