import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import BrowseFilters from '../components/BrowseFilters.jsx'
import MangaCard from '../components/MangaCard.jsx'
import Pagination from '../components/Pagination.jsx'
import StatusPanel from '../components/StatusPanel.jsx'
import { useReadingProgress } from '../context/ReadingProgressContext.jsx'
import { useDebounce } from '../hooks/useDebounce.js'
import { useMangaList, useTags } from '../hooks/useMangaQueries.js'
import type { Manga, ReadingProgressValue } from '../types/manga.js'

interface BrowseChanges {
  query?: string
  selectedTags?: string[]
  contentType?: string
  sort?: string
  page?: number
}

export default function BrowsePage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const debouncedQuery = useDebounce(query, 300)
  const selectedTag = params.get('tag') || ''
  const selectedTags = useMemo(() => selectedTag ? [selectedTag] : [], [selectedTag])
  const requestedContentType = params.get('type') || 'all'
  const contentType = ['all', 'manga', 'manhwa'].includes(requestedContentType) ? requestedContentType : 'all'
  const requestedSort = params.get('sort') || (query ? 'relevance' : 'popularity')
  const sort = requestedSort === 'relevance' && !query ? 'popularity' : requestedSort
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10))
  const { data: tags = [] } = useTags()
  const { progressByManga } = useReadingProgress() as ReadingProgressValue
  const options = useMemo(() => ({ query: debouncedQuery, includedTagIds: selectedTags, contentType, sort, page, limit: 64 }), [contentType, debouncedQuery, page, selectedTags, sort])
  const manga = useMangaList(options)

  const update = (changes: BrowseChanges) => {
    const next = new URLSearchParams(params)
    if ('query' in changes) {
      if (changes.query) next.set('q', changes.query)
      else next.delete('q')
    }
    if ('selectedTags' in changes) {
      if (changes.selectedTags?.length) next.set('tag', changes.selectedTags[0])
      else next.delete('tag')
    }
    if ('contentType' in changes) {
      if (changes.contentType && changes.contentType !== 'all') next.set('type', changes.contentType)
      else next.delete('type')
    }
    if (changes.sort) next.set('sort', changes.sort)
    next.set('page', String(changes.page || 1))
    setParams(next)
  }

  return (
    <div className="container page browse-page">
      <div className="page-heading"><p className="eyebrow">Find your next read</p><h1>{contentType === 'manhwa' ? 'Browse manhwa' : contentType === 'manga' ? 'Browse manga' : 'Browse comics'}</h1><p>Search, filter, and sort English-translated manga and Korean manhwa available on MangaDex.</p></div>
      <BrowseFilters contentType={contentType} onChange={update} query={query} selectedTags={selectedTags} sort={sort} tags={tags} />
      <div className="results-bar"><strong>{manga.data?.apiTotal?.toLocaleString() || '—'} results</strong><span>Up to 10,000 results can be paged per search.</span></div>
      {manga.isLoading && <div className="manga-grid manga-grid--browse">{Array.from({ length: 32 }, (_, index) => <div className="manga-card skeleton-card" key={index} />)}</div>}
      {manga.isError && <StatusPanel error={manga.error} onRetry={manga.refetch} />}
      {manga.data && !manga.data.items.length && <StatusPanel message="Try a different title or genre." />}
      {manga.data && manga.data.items.length > 0 && <><div className="manga-grid manga-grid--browse">{manga.data.items.map((item: Manga) => <MangaCard key={item.id} manga={item} progress={progressByManga[item.id]} />)}</div><Pagination limit={64} onChange={(nextPage: number) => { update({ page: nextPage }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} page={page} total={manga.data.total} /></>}
    </div>
  )
}