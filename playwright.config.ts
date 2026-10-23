import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 4180)

// Production build + preview: the service worker (offline) needs it.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: process.env.E2E_CHANNEL || undefined,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
