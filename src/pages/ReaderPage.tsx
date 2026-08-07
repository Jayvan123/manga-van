import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StatusPanel from '../components/StatusPanel.jsx'
import { useReadingProgress } from '../context/ReadingProgressContext.jsx'
import { useChapterPages, useManga, useMangaFeed } from '../hooks/useMangaQueries.js'
import { compareChapters } from '../api/normalizers.js'
import { chapterLabel } from '../utils/manga.js'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { ReadingProgressValue } from '../types/manga.js'

export default function ReaderPage() {
  const { mangaId: mangaIdParam, chapterId: chapterIdParam } = useParams()
  const mangaId = mangaIdParam || ''
  const chapterId = chapterIdParam || ''
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const manga = useManga(mangaId)
  const requestedLanguage = params.get('lang') || 'en'
  const feed = useMangaFeed(mangaId, requestedLanguage === 'all' ? null : requestedLanguage)
  const pages = useChapterPages(chapterId)
  const { getProgress, markChapterComplete, saveProgress } = useReadingProgress() as ReadingProgressValue
  const [imageFailed, setImageFailed] = useState(false)
  const chapters = useMemo(() => [...(feed.data || [])].sort(compareChapters), [feed.data])
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)
  const chapter = chapters[chapterIndex]
  const previousChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null
  const nextChapter = chapterIndex >= 0 ? chapters[chapterIndex + 1] : null
  const saved = getProgress(mangaId)
  const requestedPage = Number.parseInt(params.get('page') || '', 10)
  const initialPage = saved && saved.chapterId === chapterId ? saved.page : 1
  const pageCount = pages.data?.pages.length || 0
  const page = Math.min(Math.max(requestedPage || initialPage || 1, 1), Math.max(pageCount, 1))

  const goToPage = useCallback((nextPage: number) => {
    const bounded = Math.min(Math.max(nextPage, 1), Math.max(pageCount, 1))
    setImageFailed(false)
    const nextParams = new URLSearchParams(params)
    nextParams.set('page', String(bounded))
    nextParams.set('lang', requestedLanguage)
    setParams(nextParams, { replace: true })
  }, [pageCount, params, requestedLanguage, setParams])

  useEffect(() => {
    if (!manga.data || !chapter || !pageCount) return
    saveProgress({
      mangaId,
      title: manga.data.title,
      coverUrl: manga.data.coverUrl,
      genres: manga.data.tags,
      chapterId,
      chapter: chapter.chapter,
      page,
      pageCount,
    })
    if (page === pageCount) markChapterComplete(mangaId, chapterId)
  }, [chapter, chapterId, manga.data, mangaId, markChapterComplete, page, pageCount, saveProgress])

  useEffect(() => {
    for (const url of pages.data?.pages.slice(page, page + 2) || []) {
      const image = new Image()
      image.src = url
    }
  }, [page, pages.data])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return
      if (event.key === 'ArrowLeft') goToPage(page - 1)
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault()
        goToPage(page + 1)
      }
      if (event.key === 'Home') {
        event.preventDefault()
        goToPage(1)
      }
      if (event.key === 'End') {
        event.preventDefault()
        goToPage(pageCount)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPage, page, pageCount])

  const handleReaderClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('button, a')) return
    const bounds = event.currentTarget.getBoundingClientRect()
    goToPage(event.clientX < bounds.left + bounds.width / 2 ? page - 1 : page + 1)
  }

  if (manga.isLoading || feed.isLoading || pages.isLoading) return <div className="reader-page reader-loading"><div className="reader-spinner" /><p>Preparing your chapter…</p></div>
  if (manga.isError || feed.isError || pages.isError) {
    const failedQuery = [manga, feed, pages].find((query) => query.isError)
    return <div className="reader-page"><StatusPanel error={failedQuery?.error} onRetry={failedQuery?.refetch} /></div>
  }
  if (!chapter || !pageCount || !manga.data || !pages.data) return <div className="reader-page"><StatusPanel message="This chapter has no readable pages." /></div>

  return (
    <main className="reader-page">
      <header className="reader-header">
        <Link to={`/manga/${mangaId}`} aria-label="Back to manga details">←</Link>
        <div><strong>{manga.data.title}</strong><span>{chapterLabel(chapter)}</span></div>
        <span>{page} / {pageCount}</span>
      </header>
      <div className="reader-canvas" onClick={handleReaderClick} role="presentation">
        {!imageFailed ? <img alt={`${chapterLabel(chapter)}, page ${page}`} key={pages.data.pages[page - 1]} onError={() => setImageFailed(true)} src={pages.data.pages[page - 1]} /> : (
          <StatusPanel error={new Error('Image failed')} message="This page image could not be loaded." onRetry={() => setImageFailed(false)} />
        )}
      </div>
      <div className="reader-controls">
        <button disabled={page <= 1} onClick={() => goToPage(page - 1)} type="button">← Previous page</button>
        <span>Page {page} of {pageCount}</span>
        <button disabled={page >= pageCount} onClick={() => goToPage(page + 1)} type="button">Next page →</button>
      </div>
      <nav className="chapter-navigation" aria-label="Chapter navigation">
        {previousChapter ? <button onClick={() => navigate(`/read/${mangaId}/${previousChapter.id}?lang=${encodeURIComponent(requestedLanguage)}&page=1`)} type="button">← {chapterLabel(previousChapter)}</button> : <span />}
        {nextChapter ? <button onClick={() => navigate(`/read/${mangaId}/${nextChapter.id}?lang=${encodeURIComponent(requestedLanguage)}&page=1`)} type="button">{chapterLabel(nextChapter)} →</button> : <span />}
      </nav>
      <p className="reader-help">Keyboard: ← previous · → or Space next · Home first · End last</p>
    </main>
  )
}
