export const STORAGE_KEY = 'mangavan:reading-progress:v1'
// The default profile keeps the original, unsuffixed key so existing single-profile
// users don't lose their history when this profile system is introduced.
export const DEFAULT_PROFILE_ID = 'default'
const MAX_ENTRIES = 100

function keyFor(profileId) {
  return profileId && profileId !== DEFAULT_PROFILE_ID ? `${STORAGE_KEY}:${profileId}` : STORAGE_KEY
}

function isValidEntry(entry) {
  return entry && typeof entry === 'object' && typeof entry.mangaId === 'string'
}

export function readProgress(profileId = DEFAULT_PROFILE_ID, storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(keyFor(profileId)) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, entry]) => isValidEntry(entry)))
  } catch {
    return {}
  }
}

export function writeProgress(progress, profileId = DEFAULT_PROFILE_ID, storage = window.localStorage) {
  const capped = Object.fromEntries(
    Object.entries(progress)
      .sort(([, a], [, b]) => (b.lastReadAt || '').localeCompare(a.lastReadAt || ''))
      .slice(0, MAX_ENTRIES),
  )
  storage.setItem(keyFor(profileId), JSON.stringify(capped))
  return capped
}

export function clearProgressStorage(profileId = DEFAULT_PROFILE_ID, storage = window.localStorage) {
  storage.removeItem(keyFor(profileId))
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

