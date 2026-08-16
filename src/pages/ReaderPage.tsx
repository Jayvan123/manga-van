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
  
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)
  const touchStartDistance = useRef<number | null>(null)
  const baseZoom = useRef<number>(100)
  const minSwipeDistance = 50
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mouseIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [imageFailed, setImageFailed] = useState(false)
  const [pagedUseDataSaver, setPagedUseDataSaver] = useState(false)
  const [pagedUseOfficialFallback, setPagedUseOfficialFallback] = useState(false)
  const [scrollDataSaverPages, setScrollDataSaverPages] = useState<Set<number>>(() => new Set())
  const [scrollOfficialFallbackPages, setScrollOfficialFallbackPages] = useState<Set<number>>(() => new Set())
  const [failedScrollPages, setFailedScrollPages] = useState<Set<number>>(() => new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
  const [isChapterPanelOpen, setIsChapterPanelOpen] = useState(false)
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    const requestedMode = params.get('mode')
    if (requestedMode === 'scroll' || requestedMode === 'paged') return requestedMode
    return window.localStorage.getItem(READER_MODE_KEY) === 'paged' ? 'paged' : 'scroll'
  })
  const [zoom, setZoom] = useState<number>(() => {
    const savedZoom = window.localStorage.getItem('mangavan:reader-zoom')
    return savedZoom ? Number.parseInt(savedZoom, 10) : 100
  })

  useEffect(() => {
    window.localStorage.setItem('mangavan:reader-zoom', String(zoom))
  }, [zoom])
  const chapters = useMemo(() => [...(feed.data || [])].sort(compareChapters), [feed.data])
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)
  const chapter = chapters[chapterIndex]
  const nextChapter = chapterIndex >= 0 ? chapters[chapterIndex + 1] : null
  const saved = getProgress(mangaId)
  const requestedPage = Number.parseInt(params.get('page') || '', 10)
  const initialPage = saved && saved.chapterId === chapterId ? saved.page : 1
  const pageCount = pages.data?.pages.length || 0
  const page = Math.min(Math.max(requestedPage || initialPage || 1, 1), Math.max(pageCount, 1))
  const chapterProgress = pageCount ? (page / pageCount) * 100 : 0

  const goToPage = useCallback((nextPage: number) => {
    const bounded = Math.min(Math.max(nextPage, 1), Math.max(pageCount, 1))
    setImageFailed(false)
    setPagedUseDataSaver(false)
    setPagedUseOfficialFallback(false)
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

  const retryPageImage = async (pageNumber: number) => {
    try {
      await pages.refetch()
    } finally {
      if (pageNumber === page) {
        setImageFailed(false)
        setPagedUseDataSaver(false)
        setPagedUseOfficialFallback(false)
      }
      setFailedScrollPages((failed) => {
        const next = new Set(failed)
        next.delete(pageNumber)
        return next
      })
      setScrollDataSaverPages((fallbacks) => {
        const next = new Set(fallbacks)
        next.delete(pageNumber)
        return next
      })
      setScrollOfficialFallbackPages((fallbacks) => {
        const next = new Set(fallbacks)
        next.delete(pageNumber)
        return next
      })
    }
  }

  const getPagedSrc = () => {
    if (!pages.data) return ''
    const hash = pages.data.hash
    const originalUrl = pages.data.pages[page - 1]
    const dataSaverUrl = pages.data.dataSaverPages?.[page - 1] || originalUrl

    if (pagedUseOfficialFallback) {
      if (pagedUseDataSaver) {
        const filename = dataSaverUrl.split('/').pop()
        return `https://uploads.mangadex.org/data-saver/${hash}/${filename}`
      } else {
        const filename = originalUrl.split('/').pop()
        return `https://uploads.mangadex.org/data/${hash}/${filename}`
      }
    }

    return pagedUseDataSaver ? dataSaverUrl : originalUrl
  }

  const getScrollSrc = (pageUrl: string, index: number) => {
    if (!pages.data) return ''
    const pageNumber = index + 1
    const hash = pages.data.hash
    const fallbackUrl = pages.data.dataSaverPages?.[index] || pageUrl

    const useDataSaver = scrollDataSaverPages.has(pageNumber)
    const useOfficial = scrollOfficialFallbackPages.has(pageNumber)

    if (useOfficial) {
      if (useDataSaver) {
        const filename = fallbackUrl.split('/').pop()
        return `https://uploads.mangadex.org/data-saver/${hash}/${filename}`
      } else {
        const filename = pageUrl.split('/').pop()
        return `https://uploads.mangadex.org/data/${hash}/${filename}`
      }
    }

    return useDataSaver ? fallbackUrl : pageUrl
  }

  /** Hides the UI immediately and resets the idle timer so controls reappear after 1.5 s of inactivity. */
  const triggerSmartUIHide = useCallback(() => {
    setIsHeaderHidden(true)
    if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
    scrollIdleTimer.current = setTimeout(() => {
      setIsHeaderHidden(false)
    }, 1500)
  }, [])

  /** Restores the UI immediately (e.g. on mouse move / pointer activity). */
  const triggerSmartUIRestore = useCallback(() => {
    if (mouseIdleTimer.current) clearTimeout(mouseIdleTimer.current)
    mouseIdleTimer.current = setTimeout(() => {
      setIsHeaderHidden(false)
    }, 80)
  }, [])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchEndX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchEndY.current = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      const xDist = e.touches[0].clientX - e.touches[1].clientX
      const yDist = e.touches[0].clientY - e.touches[1].clientY
      touchStartDistance.current = Math.hypot(xDist, yDist)
      baseZoom.current = zoom
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
      // Finger dragging up (content scrolling down) hides the header;
      // dragging down (scrolling back up) brings it straight back.
      const deltaY = (touchStartY.current ?? 0) - e.touches[0].clientY
      if (deltaY > 8) triggerSmartUIHide()
      else if (deltaY < -8) {
        setIsHeaderHidden(false)
        if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
      }
    } else if (e.touches.length === 2 && touchStartDistance.current !== null) {
      // Prevent browser default zoom
      if (e.cancelable) e.preventDefault()
      const xDist = e.touches[0].clientX - e.touches[1].clientX
      const yDist = e.touches[0].clientY - e.touches[1].clientY
      const currentDistance = Math.hypot(xDist, yDist)
      
      const ratio = currentDistance / touchStartDistance.current
      const targetZoom = Math.min(Math.max(Math.round(baseZoom.current * ratio), 50), 200)
      setZoom(targetZoom)
    }
  }

  const handleTouchEnd = () => {
    if (touchStartDistance.current !== null) {
      touchStartDistance.current = null
    } else {
      if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null || touchEndY.current === null) return
      const distanceX = touchStartX.current - touchEndX.current
      const distanceY = touchStartY.current - touchEndY.current
      
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

      if (isHorizontalSwipe && readingMode === 'paged') {
        const isLeftSwipe = distanceX > minSwipeDistance
        const isRightSwipe = distanceX < -minSwipeDistance

        if (isLeftSwipe) {
          if (page < pageCount) {
            goToPage(page + 1)
          } else if (nextChapter) {
            navigate(chapterUrl(nextChapter.id))
          }
        } else if (isRightSwipe) {
          if (page > 1) {
            goToPage(page - 1)
          }
        }
      }
    }
    touchStartX.current = null
    touchEndX.current = null
    touchStartY.current = null
    touchEndY.current = null
  }

  useEffect(() => {
    currentPageRef.current = page
  }, [page])

  useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreen = Boolean(document.fullscreenElement)
      setIsFullscreen(fullscreen)
    }
    document.addEventListener('fullscreenchange', updateFullscreenState)
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState)
  }, [])

  // Smart UI: hide controls while the user is actively scrolling, restore after 1.5 s idle.
  // Works in both scroll mode and paged mode, fullscreen or not.
  useEffect(() => {
    let previousScrollTop = 0
    const handleScroll = () => {
      const currentScrollTop = document.fullscreenElement
        ? readerRef.current?.scrollTop || 0
        : window.scrollY || document.documentElement.scrollTop

      const difference = currentScrollTop - previousScrollTop
      previousScrollTop = currentScrollTop

      // Near the very top → always restore immediately
      if (currentScrollTop < 24) {
        setIsHeaderHidden(false)
        if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
        return
      }

      // Scrolling up → bring the header straight back
      if (difference < -3) {
        setIsHeaderHidden(false)
        if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
        return
      }

      // Scrolling down → hide, then auto-restore after a short idle
      if (difference > 3) {
        setIsHeaderHidden(true)
        if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
        scrollIdleTimer.current = setTimeout(() => setIsHeaderHidden(false), 1500)
      }
    }

    // Desktop: wheel events trigger hide in paged mode (no scroll events there);
    // scrolling back up brings the header straight back.
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 4) triggerSmartUIHide()
      else if (e.deltaY < -4) {
        setIsHeaderHidden(false)
        if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
      }
    }

    // Desktop: mouse move restores the header so users can access controls
    const handleMouseMove = () => triggerSmartUIRestore()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    const reader = readerRef.current
    if (reader) reader.addEventListener('scroll', handleScroll, { passive: true })
    if (reader) reader.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('mousemove', handleMouseMove)
      if (reader) reader.removeEventListener('scroll', handleScroll)
      if (reader) reader.removeEventListener('wheel', handleWheel)
      if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
      if (mouseIdleTimer.current) clearTimeout(mouseIdleTimer.current)
    }
  }, [triggerSmartUIHide, triggerSmartUIRestore])

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

  const chapterCompleteCard = (
    <section aria-label="Chapter complete" className="reader-chapter-complete">
      <span aria-hidden="true" className="reader-chapter-complete__icon">
        <svg viewBox="0 0 20 20"><path d="m4.5 10 3.2 3.2 7.8-7.8" /></svg>
      </span>
      <div className="reader-chapter-complete__copy">
        <span>Chapter complete</span>
        <h2>{nextChapter ? `Continue to ${chapterLabel(nextChapter)}` : 'You’re all caught up'}</h2>
        <p>{nextChapter ? `${chapterLabel(chapter)} finished · ${chapterIndex + 1} of ${chapters.length} chapters read` : 'You reached the latest available chapter for this manga.'}</p>
      </div>
      {nextChapter
        ? <button className="button button--primary" onClick={() => navigate(chapterUrl(nextChapter.id))} type="button">Read next chapter</button>
        : <Link className="button button--secondary" to={`/manga/${mangaId}`}>Back to manga details</Link>}
    </section>
  )

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
            <div aria-label="Zoom controls" className="reader-zoom-controls" role="group">
              <button onClick={() => setZoom(z => Math.max(z - 10, 50))} type="button" aria-label="Zoom out">−</button>
              <span className="reader-zoom-percentage">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(z + 10, 200))} type="button" aria-label="Zoom in">+</button>
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
      </header>
      {/* Progress bar always visible at top, independent of header visibility */}
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
              {chapters.map((chapterItem, index) => {
                const isCurrent = chapterItem.id === chapterId
                const isCompleted = saved?.completedChapterIds?.includes(chapterItem.id)
                return (
                  <button
                    aria-current={isCurrent ? 'page' : undefined}
                    key={chapterItem.id}
                    onClick={() => {
                      setIsChapterPanelOpen(false)
                      navigate(chapterUrl(chapterItem.id))
                    }}
                    type="button"
                    className={isCompleted ? 'is-completed' : ''}
                  >
                    <span className="reader-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="reader-chapter-card__body">
                      <strong>{chapterLabel(chapterItem)}</strong>
                      <span>{chapterItem.title || chapterItem.group || 'MangaDex release'}</span>
                    </span>
                    {isCurrent && <span className="reader-chapter-current">Reading</span>}
                    {!isCurrent && isCompleted && <span className="reader-chapter-done">Done</span>}
                  </button>
                )
              })}
            </nav>
            <p className="reader-chapter-shortcuts">M changes reading mode · F toggles full screen</p>
          </aside>
        </div>
      )}

      {readingMode === 'paged' ? (
        <>
          <div 
            className="reader-canvas reader-canvas--paged" 
            onClick={handleReaderClick} 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="presentation"
          >
            {!imageFailed
              ? <img
                  alt={`${chapterLabel(chapter)}, page ${page}`}
                  key={`${pages.data.pages[page - 1]}:${pagedUseDataSaver ? 'data-saver' : 'original'}:${pagedUseOfficialFallback ? 'official' : 'at-home'}`}
                  style={{ maxWidth: `min(100%, ${1200 * (zoom / 100)}px)` }}
                  onError={() => {
                    if (!pagedUseDataSaver && !pagedUseOfficialFallback) {
                      const fallbackUrl = pages.data?.dataSaverPages?.[page - 1]
                      if (fallbackUrl && fallbackUrl !== pages.data?.pages[page - 1]) {
                        setPagedUseDataSaver(true)
                      } else {
                        setPagedUseOfficialFallback(true)
                      }
                    } else if (pagedUseDataSaver && !pagedUseOfficialFallback) {
                      setPagedUseOfficialFallback(true)
                      setPagedUseDataSaver(false)
                    } else if (!pagedUseDataSaver && pagedUseOfficialFallback) {
                      const fallbackUrl = pages.data?.dataSaverPages?.[page - 1]
                      if (fallbackUrl && fallbackUrl !== pages.data?.pages[page - 1]) {
                        setPagedUseDataSaver(true)
                      } else {
                        setImageFailed(true)
                      }
                    } else {
                      setImageFailed(true)
                    }
                  }}
                  referrerPolicy="no-referrer"
                  src={getPagedSrc()}
                />
              : <StatusPanel error={new Error('Image failed')} message="This page could not be loaded from either MangaDex image source." onRetry={() => void retryPageImage(page)} />}
            
            <button 
              className="reader-nav-btn reader-nav-btn--prev" 
              disabled={page <= 1} 
              onClick={(e) => { e.stopPropagation(); goToPage(page - 1); }} 
              type="button"
              aria-label="Previous page"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 4-6 6 6 6" /></svg>
            </button>
            
            <button 
              className="reader-nav-btn reader-nav-btn--next" 
              disabled={page >= pageCount && !nextChapter}
              onClick={(e) => {
                e.stopPropagation();
                if (page >= pageCount) {
                  if (nextChapter) navigate(chapterUrl(nextChapter.id));
                } else {
                  goToPage(page + 1);
                }
              }} 
              type="button"
              aria-label={page >= pageCount ? "Next chapter" : "Next page"}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4 6 6-6 6" /></svg>
            </button>
          </div>
          {page === pageCount && chapterCompleteCard}
        </>
      ) : (
        <div 
          className="reader-scroll" 
          style={{ width: `min(100%, ${980 * (zoom / 100)}px)` }} 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label={`${chapterLabel(chapter)} pages`}
        >
          {pages.data.pages.map((pageUrl, index) => {
            const pageNumber = index + 1
            const fallbackUrl = pages.data.dataSaverPages?.[index]
            const useDataSaver = scrollDataSaverPages.has(pageNumber)
            return (
              <figure data-reader-page={pageNumber} key={pageUrl}>
                {!failedScrollPages.has(pageNumber)
                  ? <img
                      alt={`${chapterLabel(chapter)}, page ${pageNumber}`}
                      key={`${pageUrl}:${useDataSaver ? 'data-saver' : 'original'}:${scrollOfficialFallbackPages.has(pageNumber) ? 'official' : 'at-home'}`}
                      loading={pageNumber <= 2 ? 'eager' : 'lazy'}
                      onError={() => {
                        const useOfficial = scrollOfficialFallbackPages.has(pageNumber)
                        if (!useDataSaver && !useOfficial) {
                          if (fallbackUrl && fallbackUrl !== pageUrl) {
                            setScrollDataSaverPages((prev) => new Set(prev).add(pageNumber))
                          } else {
                            setScrollOfficialFallbackPages((prev) => new Set(prev).add(pageNumber))
                          }
                        } else if (useDataSaver && !useOfficial) {
                          setScrollOfficialFallbackPages((prev) => new Set(prev).add(pageNumber))
                          setScrollDataSaverPages((prev) => {
                            const next = new Set(prev)
                            next.delete(pageNumber)
                            return next
                          })
                        } else if (!useDataSaver && useOfficial) {
                          if (fallbackUrl && fallbackUrl !== pageUrl) {
                            setScrollDataSaverPages((prev) => new Set(prev).add(pageNumber))
                          } else {
                            setFailedScrollPages((prev) => new Set(prev).add(pageNumber))
                          }
                        } else {
                          setFailedScrollPages((prev) => new Set(prev).add(pageNumber))
                        }
                      }}
                      referrerPolicy="no-referrer"
                      src={getScrollSrc(pageUrl, index)}
                    />
                  : <div className="reader-page-error"><strong>Page {pageNumber} could not load</strong><span>Both MangaDex image sources failed.</span><button onClick={() => void retryPageImage(pageNumber)} type="button">Refresh source and retry</button></div>}
                <figcaption>Page {pageNumber} of {pageCount}</figcaption>
              </figure>
            )
          })}
          {chapterCompleteCard}
        </div>
      )}

    </main>
  )
}
