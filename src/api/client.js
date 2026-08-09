import axios from 'axios'

const API_INTERVAL_MS = 260
let nextRequestAt = 0

function wait(ms, signal) {
  if (ms <= 0) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new axios.CanceledError('Request cancelled'))
      },
      { once: true },
    )
  })
}

export const mangaDexClient = axios.create({
  // Keep browser requests same-origin. Vite proxies this path in development,
  // while Vercel forwards it to MangaDex in production.
  baseURL: import.meta.env.VITE_MANGADEX_API_URL || '/api/mangadex',
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

mangaDexClient.interceptors.request.use(async (config) => {
  const now = Date.now()
  const scheduledAt = Math.max(now, nextRequestAt)
  nextRequestAt = scheduledAt + API_INTERVAL_MS
  await wait(scheduledAt - now, config.signal)
  return config
})

export function getRetryAfter(error) {
  const value = error?.response?.headers?.['x-ratelimit-retry-after']
    || error?.response?.headers?.['retry-after']
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : Math.max(0, timestamp - Date.now())
}
