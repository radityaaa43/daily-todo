import { formatHeaderDate, toDateKey } from '@/lib/date'

interface HeaderProps {
  now: Date
  progress: { done: number; total: number }
  locale?: string
}

export function Header({ now, progress, locale }: HeaderProps) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1">
      <h1 className="col-start-1 row-start-1 text-title text-text">Today</h1>
      <p className="col-start-1 row-start-2 text-subtitle text-muted">
        <time dateTime={toDateKey(now)}>{formatHeaderDate(now, locale)}</time>
      </p>
      {progress.total > 0 && (
        <p className="col-start-2 row-start-2 text-meta whitespace-nowrap text-muted tabular-nums sm:row-start-1">
          {progress.done} of {progress.total} done
        </p>
      )}
    </header>
  )
}
