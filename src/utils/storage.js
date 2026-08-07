export const STORAGE_KEY = 'mangavan:reading-progress:v1'
const MAX_ENTRIES = 100

function isValidEntry(entry) {
  return entry && typeof entry === 'object' && typeof entry.mangaId === 'string'
}

export function readProgress(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, entry]) => isValidEntry(entry)))
  } catch {
    return {}
  }
}

export function writeProgress(progress, storage = window.localStorage) {
  const capped = Object.fromEntries(
    Object.entries(progress)
      .sort(([, a], [, b]) => (b.lastReadAt || '').localeCompare(a.lastReadAt || ''))
      .slice(0, MAX_ENTRIES),
  )
  storage.setItem(STORAGE_KEY, JSON.stringify(capped))
  return capped
}

export function mergeProgress(current, entry) {
  const previous = current[entry.mangaId] || {}
  return {
    ...current,
    [entry.mangaId]: {
      ...previous,
      ...entry,
      completedChapterIds: entry.completedChapterIds || previous.completedChapterIds || [],
      lastReadAt: entry.lastReadAt || new Date().toISOString(),
    },
  }
}

