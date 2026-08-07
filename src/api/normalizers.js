const FALLBACK_COVER = '/cover-placeholder.svg'

export function localizedValue(values, preferred = 'en') {
  if (!values || typeof values !== 'object') return ''
  return values[preferred] || values['en'] || values['en-us'] || Object.values(values).find(Boolean) || ''
}

export function getRelationship(resource, type) {
  return resource?.relationships?.find((relationship) => relationship.type === type)
}

export function getRelationships(resource, type) {
  return resource?.relationships?.filter((relationship) => relationship.type === type) || []
}

export function buildCoverUrl(mangaId, filename, size = 256) {
  if (!mangaId || !filename) return FALLBACK_COVER
  const suffix = size ? `.${size}.jpg` : ''
  return `https://uploads.mangadex.org/covers/${mangaId}/${filename}${suffix}`
}

function safeExternalUrl(value) {
  if (!value || typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export function normalizeManga(resource) {
  const attributes = resource?.attributes || {}
  const parsedAniListId = Number.parseInt(attributes.links?.al, 10)
  const cover = getRelationship(resource, 'cover_art')
  const authors = getRelationships(resource, 'author').map((item) => item.attributes?.name).filter(Boolean)
  const artists = getRelationships(resource, 'artist').map((item) => item.attributes?.name).filter(Boolean)
  const tags = (attributes.tags || []).map((tag) => ({
    id: tag.id,
    name: localizedValue(tag.attributes?.name),
  })).filter((tag) => tag.name)

  return {
    id: resource.id,
    title: localizedValue(attributes.title) || 'Untitled manga',
    description: localizedValue(attributes.description) || 'No synopsis is available yet.',
    status: attributes.status || 'unknown',
    year: attributes.year || null,
    originalLanguage: attributes.originalLanguage || null,
    lastVolume: attributes.lastVolume || null,
    lastChapter: attributes.lastChapter || null,
    updatedAt: attributes.updatedAt || null,
    aniListId: Number.isNaN(parsedAniListId) ? null : parsedAniListId,
    officialEnglishUrl: safeExternalUrl(attributes.links?.engtl),
    originalSourceUrl: safeExternalUrl(attributes.links?.raw),
    authors: [...new Set(authors)],
    artists: [...new Set(artists)],
    tags,
    coverFilename: cover?.attributes?.fileName || null,
    coverUrl: buildCoverUrl(resource.id, cover?.attributes?.fileName, 256),
    coverUrlLarge: buildCoverUrl(resource.id, cover?.attributes?.fileName, 512),
  }
}

export function normalizeChapter(resource) {
  const attributes = resource?.attributes || {}
  const group = getRelationship(resource, 'scanlation_group')
  const manga = getRelationship(resource, 'manga')
  return {
    id: resource.id,
    mangaId: manga?.id || null,
    volume: attributes.volume || null,
    chapter: attributes.chapter || null,
    title: attributes.title || '',
    translatedLanguage: attributes.translatedLanguage || '',
    pages: attributes.pages || 0,
    publishAt: attributes.publishAt || null,
    readableAt: attributes.readableAt || null,
    group: group?.attributes?.name || 'Unknown group',
  }
}

export function compareChapters(a, b) {
  const volumeA = Number.parseFloat(a.volume)
  const volumeB = Number.parseFloat(b.volume)
  const safeVolumeA = Number.isNaN(volumeA) ? Number.POSITIVE_INFINITY : volumeA
  const safeVolumeB = Number.isNaN(volumeB) ? Number.POSITIVE_INFINITY : volumeB
  if (safeVolumeA !== safeVolumeB) return safeVolumeA - safeVolumeB

  const chapterA = Number.parseFloat(a.chapter)
  const chapterB = Number.parseFloat(b.chapter)
  const safeChapterA = Number.isNaN(chapterA) ? Number.POSITIVE_INFINITY : chapterA
  const safeChapterB = Number.isNaN(chapterB) ? Number.POSITIVE_INFINITY : chapterB
  if (safeChapterA !== safeChapterB) return safeChapterA - safeChapterB
  return (a.publishAt || '').localeCompare(b.publishAt || '')
}

export function groupChaptersByVolume(chapters) {
  return [...chapters].sort(compareChapters).reduce((groups, chapter) => {
    const label = chapter.volume ? `Volume ${chapter.volume}` : 'No volume'
    if (!groups[label]) groups[label] = []
    groups[label].push(chapter)
    return groups
  }, {})
}
