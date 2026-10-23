import { Check } from 'lucide-react'

export function AllDoneMessage() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 p-4 text-message text-success"
    >
      <Check className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      All done for today.
    </div>
  )
}
