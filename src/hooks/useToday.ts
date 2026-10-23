import { useEffect, useState } from 'react'
import { toDateKey } from '../lib/date'
import type { DateKey } from '../lib/tasks'

export const TICK_MS = 30_000

export function useToday(): { todayKey: DateKey; now: Date } {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Keep the same Date until the day changes, so ticks cause no re-render.
    const check = () => {
      const next = new Date()
      setNow((prev) => (toDateKey(prev) === toDateKey(next) ? prev : next))
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    const id = setInterval(check, TICK_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    check()
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [])

  return { todayKey: toDateKey(now), now }
}
