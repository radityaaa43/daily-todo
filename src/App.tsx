import { Header } from '@/components/Header'
import { StorageNotice } from '@/components/StorageNotice'
import { useTasks } from '@/hooks/useTasks'
import { useToday } from '@/hooks/useToday'

export default function App() {
  const { todayKey, now } = useToday()
  const { progress, storageStatus } = useTasks(todayKey)

  return (
    <div className="min-h-dvh px-4 pt-6 pb-24 sm:pt-12">
      <div className="mx-auto w-full max-w-[560px] min-w-0">
        <Header now={now} progress={progress} />
        <main className="mt-4 flex flex-col gap-4">
          {storageStatus === 'unavailable' && <StorageNotice />}
        </main>
      </div>
    </div>
  )
}
