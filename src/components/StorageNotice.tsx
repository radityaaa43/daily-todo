export function StorageNotice() {
  return (
    <p
      role="status"
      className="rounded-md border border-[color-mix(in_srgb,var(--notice-text)_25%,transparent)] bg-notice-bg px-4 py-3 text-notice text-notice-text"
    >
      {
        "Your tasks can't be saved on this device and will be lost when you close this tab."
      }
    </p>
  )
}
