import { useQuery } from '@tanstack/react-query'
import { isGoogleBooksConfigured, searchEnglishVolumes } from '../api/googleBooksApi.js'

export function useGoogleBooks(title: string, author = '', enabled = true) {
  return useQuery({
    queryKey: ['google-books', 'english-volumes', title, author],
    queryFn: ({ signal }) => searchEnglishVolumes(title, author, signal),
    enabled: enabled && isGoogleBooksConfigured && title.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}
