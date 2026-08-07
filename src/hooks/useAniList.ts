import { useQuery } from '@tanstack/react-query'
import { getAniListManga } from '../api/aniListApi.js'

export function useAniListManga(aniListId?: number | null) {
  return useQuery({
    queryKey: ['anilist', 'manga', aniListId],
    queryFn: ({ signal }) => getAniListManga(aniListId as number, signal),
    enabled: Number.isInteger(aniListId) && Number(aniListId) > 0,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })
}
