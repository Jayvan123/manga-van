import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StatusPanel from '../components/StatusPanel.jsx'
import { useReadingProgress } from '../context/ReadingProgressContext.jsx'
import { useChapterPages, useManga, useMangaFeed } from '../hooks/useMangaQueries.js'
import { compareChapters } from '../api/normalizers.js'
import { chapterLabel } from '../utils/manga.js'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { ReadingProgressValue } from '../types/manga.js'

type ReadingMode = 'paged' | 'scroll'

const READER_MODE_KEY = 'mangavan:reader-mode'

export default function ReaderPage() {
  const { mangaId: mangaIdParam, chapterId: chapterIdParam } = useParams()
  const mangaId = mangaIdParam || ''
  const chapterId = chapterIdParam || ''
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const readerRef = useRef<HTMLElement>(null)
  const chapterPanelRef = useRef<HTMLElement>(null)
  const chapterToggleRef = useRef<HTMLButtonElement>(null)
  const currentPageRef = useRef(1)
  const manga = useManga(mangaId)
  const requestedLanguage = params.get('lang') || 'en'
  const feed = useMangaFeed(mangaId, requestedLanguage === 'all' ? null : requestedLanguage)
  const pages = useChapterPages(chapterId)
  const { getProgress, markChapterComplete, saveProgress } = useReadingProgress() as ReadingProgressValue
  const [imageFailed, setImageFailed] = useState(false)
  const [failedScrollPages, setFailedScrollPages] = useState<Set<number>>(() => new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
  const [isChapterPanelOpen, setIsChapterPanelOpen] = useState(false)
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    const requestedMode = params.get('mode')
    if (requestedMode === 'scroll' || requestedMode === 'paged') return requestedMode
    return window.localStorage.getItem(READER_MODE_KEY) === 'scroll' ? 'scroll' : 'paged'
  })
  const chapters = useMemo(() => [...(feed.data || [])].sort(compareChapters), [feed.data])
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)
  const chapter = chapters[chapterIndex]
  const saved = getProgress(mangaId)
  const requestedPage = Number.parseInt(params.get('page') || '', 10)
  const initialPage = saved && saved.chapterId === chapterId ? saved.page : 1
  const pageCount = pages.data?.pages.length || 0
  const page = Math.min(Math.max(requestedPage || initialPage || 1, 1), Math.max(pageCount, 1))
  const chapterProgress = pageCount ? (page / pageCount) * 100 : 0

  const goToPage = useCallback((nextPage: number) => {
    const bounded = Math.min(Math.max(nextPage, 1), Math.max(pageCount, 1))
    setImageFailed(false)
    const nextParams = new URLSearchParams(params)
    nextParams.set('page', String(bounded))
    nextParams.set('lang', requestedLanguage)
    nextParams.set('mode', readingMode)
    setParams(nextParams, { replace: true })
  }, [pageCount, params, readingMode, requestedLanguage, setParams])

  const changeReadingMode = useCallback((mode: ReadingMode) => {
    setReadingMode(mode)
    window.localStorage.setItem(READER_MODE_KEY, mode)
    const nextParams = new URLSearchParams(params)
    nextParams.set('page', String(page))
    nextParams.set('lang', requestedLanguage)
    nextParams.set('mode', mode)
    setParams(nextParams, { replace: true })
  }, [page, params, requestedLanguage, setParams])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await readerRef.current?.requestFullscreen()
    } catch {
      // The browser may reject fullscreen when it is unavailable or not user-initiated.
    }
  }, [])

  const closeChapterPanel = useCallback(() => {
    setIsChapterPanelOpen(false)
    window.requestAnimationFrame(() => chapterToggleRef.current?.focus())
  }, [])

  useEffect(() => {
    currentPageRef.current = page
  }, [page])

  useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreen = Boolean(document.fullscreenElement)
      setIsFullscreen(fullscreen)
      if (!fullscreen) setIsHeaderHidden(false)
    }
    document.addEventListener('fullscreenchange', updateFullscreenState)
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState)
  }, [])

  useEffect(() => {
    if (!isFullscreen) return
    const reader = readerRef.current
    if (!reader) return
    let previousScrollTop = reader.scrollTop
    const handleFullscreenScroll = () => {
      const currentScrollTop = reader.scrollTop
      const difference = currentScrollTop - previousScrollTop
      if (currentScrollTop < 24 || difference < -5) setIsHeaderHidden(false)
      else if (difference > 5 && currentScrollTop > 80) setIsHeaderHidden(true)
      previousScrollTop = currentScrollTop
    }
    reader.addEventListener('scroll', handleFullscreenScroll, { passive: true })
    return () => reader.removeEventListener('scroll', handleFullscreenScroll)
  }, [isFullscreen])

  useEffect(() => {
    if (!isChapterPanelOpen) return
    window.requestAnimationFrame(() => {
      const activeChapter = chapterPanelRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
      activeChapter?.focus({ preventScroll: true })
      activeChapter?.scrollIntoView?.({ block: 'center' })
    })
  }, [chapterId, isChapterPanelOpen])

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
    if (readingMode !== 'paged') return
    for (const url of pages.data?.pages.slice(page, page + 2) || []) {
      const image = new Image()
      image.src = url
    }
  }, [page, pages.data, readingMode])

  useEffect(() => {
    if (readingMode !== 'scroll' || !pages.data || !('IntersectionObserver' in window)) return
    const targets = readerRef.current?.querySelectorAll<HTMLElement>('[data-reader-page]') || []
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      const visiblePage = Number((mostVisible?.target as HTMLElement | undefined)?.dataset.readerPage)
      if (visiblePage && visiblePage !== currentPageRef.current) goToPage(visiblePage)
    }, { rootMargin: '-12% 0px -52%', threshold: [0, .25, .5, .75] })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [goToPage, pages.data, readingMode])

  useEffect(() => {
    if (readingMode !== 'scroll') return
    window.requestAnimationFrame(() => {
      readerRef.current?.querySelector<HTMLElement>(`[data-reader-page="${page}"]`)?.scrollIntoView?.({ block: 'start' })
    })
  // Only reposition when entering scroll mode; observed pages update the URL afterward.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingMode])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isChapterPanelOpen) {
        event.preventDefault()
        closeChapterPanel()
        return
      }
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes((event.target as HTMLElement).tagName)) return
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void toggleFullscreen()
        return
      }
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault()
        changeReadingMode(readingMode === 'paged' ? 'scroll' : 'paged')
        return
      }
      if (readingMode === 'scroll') return
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
  }, [changeReadingMode, closeChapterPanel, goToPage, isChapterPanelOpen, page, pageCount, readingMode, toggleFullscreen])

  const handleReaderClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (readingMode !== 'paged' || (event.target as Element).closest('button, a')) return
    const bounds = event.currentTarget.getBoundingClientRect()
    goToPage(event.clientX < bounds.left + bounds.width / 2 ? page - 1 : page + 1)
  }

  const chapterUrl = (targetChapterId: string) => `/read/${mangaId}/${targetChapterId}?lang=${encodeURIComponent(requestedLanguage)}&page=1&mode=${readingMode}`

  if (manga.isLoading || feed.isLoading || pages.isLoading) return <div className="reader-page reader-loading"><div className="reader-spinner" /><p>Preparing your chapter…</p></div>
  if (manga.isError || feed.isError || pages.isError) {
    const failedQuery = [manga, feed, pages].find((query) => query.isError)
    return <div className="reader-page"><StatusPanel error={failedQuery?.error} onRetry={failedQuery?.refetch} /></div>
  }
  if (!chapter || !pageCount || !manga.data || !pages.data) return <div className="reader-page"><StatusPanel message="This chapter has no readable pages." /></div>

  return (
    <main className={`reader-page reader-page--${readingMode}${isFullscreen ? ' is-fullscreen' : ''}${isHeaderHidden ? ' is-header-hidden' : ''}`} ref={readerRef}>
      <header className="reader-header">
        <div className="reader-header__top">
          <Link className="reader-back" to={`/manga/${mangaId}`} aria-label="Back to manga details">
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 4-6 6 6 6" /></svg>
          </Link>
          <div className="reader-context">
            <span className="reader-context__position">Reading now · Chapter {chapterIndex + 1} of {chapters.length}</span>
            <strong>{manga.data.title}</strong>
            <span>{chapterLabel(chapter)}</span>
          </div>
          <div className="reader-tools">
            <div aria-label="Reading mode" className="reader-mode-switch" role="group">
              <button aria-pressed={readingMode === 'paged'} onClick={() => changeReadingMode('paged')} type="button">Page</button>
              <button aria-pressed={readingMode === 'scroll'} onClick={() => changeReadingMode('scroll')} type="button">Scroll</button>
            </div>
            <button
              aria-controls="reader-chapter-panel"
              aria-expanded={isChapterPanelOpen}
              className="reader-chapters-toggle"
              onClick={() => setIsChapterPanelOpen(true)}
              ref={chapterToggleRef}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M6 5h10M6 10h10M6 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01" /></svg>
              <span>Chapters</span>
            </button>
            <button className="reader-fullscreen" onClick={() => void toggleFullscreen()} type="button">
              <svg aria-hidden="true" viewBox="0 0 20 20">
                {isFullscreen
                  ? <path d="M8 3v5H3m9-5v5h5M8 17v-5H3m9 5v-5h5" />
                  : <path d="M7 3H3v4m10-4h4v4M7 17H3v-4m10 4h4v-4" />}
              </svg>
              <span>{isFullscreen ? 'Exit full screen' : 'Full screen'}</span>
            </button>
            <span aria-label={`Page ${page} of ${pageCount}`} className="reader-page-status">{page} / {pageCount} pages</span>
          </div>
        </div>
        <div
          aria-label={`${Math.round(chapterProgress)}% of chapter read`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(chapterProgress)}
          className="reader-progress"
          role="progressbar"
        >
          <span style={{ width: `${chapterProgress}%` }} />
        </div>
      </header>

      {isChapterPanelOpen && (
        <div className="reader-chapter-overlay">
          <button aria-label="Close chapter list" className="reader-chapter-backdrop" onClick={closeChapterPanel} type="button" />
          <aside aria-label="Chapter list" aria-modal="true" className="reader-chapter-panel" id="reader-chapter-panel" ref={chapterPanelRef} role="dialog">
            <header>
              <div><span>Navigate manga</span><strong>All chapters</strong></div>
              <button aria-label="Close chapter list" onClick={closeChapterPanel} type="button">×</button>
            </header>
            <div className="reader-chapter-summary">
              <span>{manga.data.title}</span>
              <strong>{chapters.length} chapters</strong>
            </div>
            <nav aria-label="All chapters" className="reader-chapter-list">
              {chapters.map((chapterItem, index) => (
                <button
                  aria-current={chapterItem.id === chapterId ? 'page' : undefined}
                  key={chapterItem.id}
                  onClick={() => {
                    setIsChapterPanelOpen(false)
                    navigate(chapterUrl(chapterItem.id))
                  }}
                  type="button"
                >
                  <span className="reader-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="reader-chapter-card__body">
                    <strong>{chapterLabel(chapterItem)}</strong>
                    <span>{chapterItem.title || chapterItem.group || 'MangaDex release'}</span>
                  </span>
                  {chapterItem.id === chapterId && <span className="reader-chapter-current">Reading</span>}
                </button>
              ))}
            </nav>
            <p className="reader-chapter-shortcuts">M changes reading mode · F toggles full screen</p>
          </aside>
        </div>
      )}

      {readingMode === 'paged' ? (
        <div className="reader-canvas reader-canvas--paged" onClick={handleReaderClick} role="presentation">
          {!imageFailed
            ? <img alt={`${chapterLabel(chapter)}, page ${page}`} key={pages.data.pages[page - 1]} onError={() => setImageFailed(true)} src={pages.data.pages[page - 1]} />
            : <StatusPanel error={new Error('Image failed')} message="This page image could not be loaded." onRetry={() => setImageFailed(false)} />}
        </div>
      ) : (
        <div className="reader-scroll" aria-label={`${chapterLabel(chapter)} pages`}>
          {pages.data.pages.map((pageUrl, index) => {
            const pageNumber = index + 1
            return (
              <figure data-reader-page={pageNumber} key={pageUrl}>
                {!failedScrollPages.has(pageNumber)
                  ? <img alt={`${chapterLabel(chapter)}, page ${pageNumber}`} loading={pageNumber <= 2 ? 'eager' : 'lazy'} onError={() => setFailedScrollPages((failed) => new Set(failed).add(pageNumber))} src={pageUrl} />
                  : <div className="reader-page-error"><strong>Page {pageNumber} could not load</strong><button onClick={() => setFailedScrollPages((failed) => { const next = new Set(failed); next.delete(pageNumber); return next })} type="button">Try again</button></div>}
                <figcaption>Page {pageNumber} of {pageCount}</figcaption>
              </figure>
            )
          })}
        </div>
      )}

      {readingMode === 'paged' && (
        <nav aria-label="Page navigation" className="reader-controls">
          <button disabled={page <= 1} onClick={() => goToPage(page - 1)} type="button">Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button disabled={page >= pageCount} onClick={() => goToPage(page + 1)} type="button">Next</button>
        </nav>
      )}

    </main>
  )
}
