import { QueryClient } from '@tanstack/react-query'
import { getRetryAfter } from './client.js'

function shouldRetry(failureCount, error) {
  const status = error?.response?.status
  if (status && status >= 400 && status < 500 && status !== 429) return false
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: shouldRetry,
      retryDelay: (attempt, error) => getRetryAfter(error) ?? Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
    },
  },
})

