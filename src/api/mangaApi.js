import { mangaDexClient } from './client.js'
import { buildCoverUrl, normalizeChapter, normalizeManga } from './normalizers.js'

const CONTENT_RATINGS = ['safe', 'suggestive']
const ORIGINAL_LANGUAGE_BY_TYPE = {
  manga: ['ja'],
  manhwa: ['ko'],
}
const SORT_MAP = {
  relevance: 'relevance',
  popularity: 'followedCount',
  latest: 'latestUploadedChapter',
}

export function listParams({ query = '', includedTagIds = [], contentType = 'all', sort = 'popularity', page = 1, limit = 20 } = {}) {
  const orderKey = query && sort === 'relevance' ? 'relevance' : SORT_MAP[sort] || 'followedCount'
  return {
    limit,
    offset: Math.max(0, page - 1) * limit,
    title: query || undefined,
    'includedTags[]': includedTagIds.length ? includedTagIds : undefined,
    includedTagsMode: includedTagIds.length ? 'AND' : undefined,
    'originalLanguage[]': ORIGINAL_LANGUAGE_BY_TYPE[contentType],
    'availableTranslatedLanguage[]': ['en'],
    'contentRating[]': CONTENT_RATINGS,
    'includes[]': ['cover_art', 'author', 'artist'],
    [`order[${orderKey}]`]: orderKey === 'title' ? 'asc' : 'desc',
    hasAvailableChapters: 'true',
  }
}

export async function listManga(options = {}) {
  const { signal } = options
  const response = await mangaDexClient.get('/manga', { params: listParams(options), signal })
  return {
    items: (response.data.data || []).map(normalizeManga),
    total: Math.min(response.data.total || 0, 10000),
    apiTotal: response.data.total || 0,
    page: options.page || 1,
    limit: options.limit || 20,
  }
}

export async function searchManga(title, signal) {
  if (!title?.trim()) return []
  const result = await listManga({ query: title.trim(), sort: 'relevance', page: 1, limit: 6, signal })
  return result.items
}

export async function getManga(id, signal) {
  const response = await mangaDexClient.get(`/manga/${id}`, {
    params: { 'includes[]': ['cover_art', 'author', 'artist'] },
    signal,
  })
  return normalizeManga(response.data.data)
}

export async function getMangaFeed(id, language = 'en', signal) {
  const chapters = []
  const limit = 500
  let offset = 0
  let total = 1

  while (offset < total && offset < 10000) {
    const response = await mangaDexClient.get(`/manga/${id}/feed`, {
      params: {
        limit,
        offset,
        'translatedLanguage[]': language ? [language] : undefined,
        'includes[]': ['scanlation_group'],
        'order[volume]': 'asc',
        'order[chapter]': 'asc',
        includeFutureUpdates: 0,
        includeEmptyPages: 0,
      },
      signal,
    })
    const batch = response.data.data || []
    chapters.push(...batch.map(normalizeChapter))
    total = response.data.total || chapters.length
    offset += batch.length
    if (!batch.length) break
  }
  return chapters
}

export async function getChapterPages(chapterId, signal) {
  const response = await mangaDexClient.get(`/at-home/server/${chapterId}`, { signal })
  const { baseUrl, chapter } = response.data
  return {
    baseUrl,
    hash: chapter.hash,
    pages: (chapter.data || []).map((filename) => `${baseUrl}/data/${chapter.hash}/${filename}`),
    dataSaverPages: (chapter.dataSaver || []).map(
      (filename) => `${baseUrl}/data-saver/${chapter.hash}/${filename}`,
    ),
  }
}

export async function getTags(signal) {
  const response = await mangaDexClient.get('/manga/tag', { signal })
  return (response.data.data || []).map((tag) => ({
    id: tag.id,
    name: tag.attributes?.name?.en || Object.values(tag.attributes?.name || {})[0] || 'Unknown',
  })).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getCovers(mangaIds, signal) {
  if (!mangaIds?.length) return new Map()
  const response = await mangaDexClient.get('/cover', {
    params: { limit: 100, 'manga[]': mangaIds.slice(0, 100), 'order[volume]': 'desc' },
    signal,
  })
  const covers = new Map()
  for (const cover of response.data.data || []) {
    const mangaId = cover.relationships?.find((item) => item.type === 'manga')?.id
    if (mangaId && !covers.has(mangaId)) {
      covers.set(mangaId, buildCoverUrl(mangaId, cover.attributes?.fileName, 256))
    }
  }
  return covers
}
