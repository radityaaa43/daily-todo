import { cn } from '@/lib/utils'
import { MAX_TEXT } from '@/lib/tasks'

export const COUNTER_FROM = 180

interface CharCounterProps {
  id: string
  length: number
  className?: string
}

export function CharCounter({ id, length, className }: CharCounterProps) {
  if (length < COUNTER_FROM) return null
  const atMax = length >= MAX_TEXT
  return (
    <p
      id={id}
      className={cn(
        'text-right text-meta tabular-nums',
        atMax ? 'text-danger' : 'text-muted',
        className,
      )}
    >
      {atMax ? `Max ${MAX_TEXT} characters` : `${length} / ${MAX_TEXT}`}
    </p>
  )
}
