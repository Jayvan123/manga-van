import { useQuery } from '@tanstack/react-query'
import { mangaDexProvider } from '../providers/mangaDexProvider.js'

export function useMangaList(options, queryOptions = {}) {
  return useQuery({
    queryKey: ['manga', 'list', options],
    queryFn: ({ signal }) => mangaDexProvider.listManga({ ...options, signal }),
    placeholderData: (previous) => previous,
    ...queryOptions,
  })
}

export function useSearchManga(query, enabled = true) {
  return useQuery({
    queryKey: ['manga', 'search', query],
    queryFn: ({ signal }) => mangaDexProvider.searchManga(query, signal),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  })
}

export function useManga(id) {
  return useQuery({
    queryKey: ['manga', 'details', id],
    queryFn: ({ signal }) => mangaDexProvider.getManga(id, signal),
    enabled: Boolean(id),
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * @param {string} id
 * @param {string | null} [language]
 */
export function useMangaFeed(id, language = 'en') {
  return useQuery({
    queryKey: ['manga', 'feed', id, language || 'all'],
    queryFn: ({ signal }) => mangaDexProvider.getMangaFeed(id, language, signal),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
  })
}

export function useChapterPages(id) {
  return useQuery({
    queryKey: ['chapter', 'pages', id],
    queryFn: ({ signal }) => mangaDexProvider.getChapterPages(id, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['manga', 'tags'],
    queryFn: ({ signal }) => mangaDexProvider.getTags(signal),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useTopManga(period = 'week', limit = 10) {
  return useQuery({
    queryKey: ['manga', 'top', period, limit],
    queryFn: ({ signal }) => mangaDexProvider.listTopManga({ period, limit, signal }),
    placeholderData: (previous) => previous,
    staleTime: 5 * 60 * 1000,
  })
}
