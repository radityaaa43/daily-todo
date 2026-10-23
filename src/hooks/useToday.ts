// TEMPORARY mock of the spec §3.4 `useToday` contract (no ticking).
// Slice 1 owns this file; on merge take its version.
import { useState } from 'react'

import { toDateKey } from '@/lib/date'
import type { DateKey } from '@/lib/tasks'

export function useToday(): { todayKey: DateKey; now: Date } {
  const [now] = useState(() => new Date())
  return { todayKey: toDateKey(now), now }
}
