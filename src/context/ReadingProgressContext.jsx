/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { clearProgressStorage, mergeProgress, readProgress, writeProgress } from '../utils/storage.js'
import { useProfiles } from './ProfileContext.jsx'

const ReadingProgressContext = createContext(null)

export function ReadingProgressProvider({ children }) {
  const { activeProfileId } = useProfiles()
  const [progressByManga, setProgressByManga] = useState(() => readProgress(activeProfileId))
  // Tracks which profile `progressByManga` was loaded for. When the active profile switches,
  // reset the in-memory state from that profile's own storage during render (React's recommended
  // "adjust state when a prop changes" pattern) so profiles sharing this browser never see each
  // other's reading progress, without the cascading-render effect this used to need.
  const [loadedProfileId, setLoadedProfileId] = useState(activeProfileId)
  if (activeProfileId !== loadedProfileId) {
    setLoadedProfileId(activeProfileId)
    setProgressByManga(readProgress(activeProfileId))
  }

  const commit = useCallback((updater) => {
    setProgressByManga((current) => writeProgress(updater(current), activeProfileId))
  }, [activeProfileId])

  const saveProgress = useCallback((entry) => {
    if (!entry?.mangaId) return
    commit((current) => mergeProgress(current, entry))
  }, [commit])

  const markChapterComplete = useCallback((mangaId, chapterId) => {
    commit((current) => {
      const entry = current[mangaId]
      if (!entry) return current
      return mergeProgress(current, {
        ...entry,
        completedChapterIds: [...new Set([...(entry.completedChapterIds || []), chapterId])],
      })
    })
  }, [commit])

  const clearProgress = useCallback(() => {
    clearProgressStorage(activeProfileId)
    setProgressByManga({})
  }, [activeProfileId])

  const getProgress = useCallback((mangaId) => progressByManga[mangaId] || null, [progressByManga])

  const getResumeTarget = useCallback((mangaId, chapters) => {
    if (!chapters?.length) return null
    const entry = progressByManga[mangaId]
    if (!entry?.chapterId) return chapters[0]
    const currentIndex = chapters.findIndex((chapter) => chapter.id === entry.chapterId)
    if (currentIndex < 0) return chapters[0]
    const completed = entry.completedChapterIds?.includes(entry.chapterId)
    return completed ? chapters[currentIndex + 1] || chapters[currentIndex] : chapters[currentIndex]
  }, [progressByManga])

  const recentlyRead = useMemo(() => Object.values(progressByManga)
    .sort((a, b) => (b.lastReadAt || '').localeCompare(a.lastReadAt || ''))
    .slice(0, 5), [progressByManga])

  const value = useMemo(() => ({
    progressByManga,
    recentlyRead,
    getProgress,
    saveProgress,
    markChapterComplete,
    getResumeTarget,
    clearProgress,
  }), [clearProgress, getProgress, getResumeTarget, markChapterComplete, progressByManga, recentlyRead, saveProgress])

  return <ReadingProgressContext.Provider value={value}>{children}</ReadingProgressContext.Provider>
}

export function useReadingProgress() {
  const context = useContext(ReadingProgressContext)
  if (!context) throw new Error('useReadingProgress must be used inside ReadingProgressProvider')
  return context
}
