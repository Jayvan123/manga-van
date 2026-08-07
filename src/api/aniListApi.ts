import axios from 'axios'

const ANI_LIST_URL = import.meta.env.VITE_ANILIST_API_URL || 'https://graphql.anilist.co'

export interface AniListRecommendation {
  id: number
  title: string
  coverUrl: string
  siteUrl: string
  rating: number
}

export interface AniListExternalLink {
  site: string
  url: string
  type: string
  language: string
}

export interface AniListManga {
  id: number
  title: string
  description: string
  genres: string[]
  averageScore: number | null
  popularity: number | null
  siteUrl: string
  bannerImage: string | null
  recommendations: AniListRecommendation[]
  externalLinks: AniListExternalLink[]
}

interface RawTitle {
  english?: string | null
  romaji?: string | null
  native?: string | null
}

interface RawRecommendationMedia {
  id: number
  type?: string
  isAdult?: boolean
  title?: RawTitle
  coverImage?: { large?: string | null }
  siteUrl?: string | null
}

interface RawAniListMedia {
  id: number
  title?: RawTitle
  description?: string | null
  genres?: string[] | null
  averageScore?: number | null
  popularity?: number | null
  siteUrl?: string | null
  bannerImage?: string | null
  externalLinks?: Array<{
    site?: string | null
    url?: string | null
    type?: string | null
    language?: string | null
    isDisabled?: boolean | null
  }> | null
  recommendations?: {
    nodes?: Array<{ rating?: number | null; mediaRecommendation?: RawRecommendationMedia | null }> | null
  } | null
}

const MEDIA_QUERY = `
  query MangaVAnMedia($id: Int!) {
    Media(id: $id, type: MANGA) {
      id
      title { english romaji native }
      description(asHtml: false)
      genres
      averageScore
      popularity
      siteUrl
      bannerImage
      externalLinks { site url type language isDisabled }
      recommendations(perPage: 8, sort: RATING_DESC) {
        nodes {
          rating
          mediaRecommendation {
            id
            type
            isAdult
            title { english romaji native }
            coverImage { large }
            siteUrl
          }
        }
      }
    }
  }
`

function titleOf(title?: RawTitle) {
  return title?.english || title?.romaji || title?.native || 'Untitled manga'
}

function safeHttpUrl(value?: string | null) {
  if (!value) return ''
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function normalizeAniListMedia(media: RawAniListMedia): AniListManga {
  const recommendations = (media?.recommendations?.nodes || [])
    .filter((node) => node?.mediaRecommendation?.type === 'MANGA' && !node.mediaRecommendation.isAdult)
    .map((node) => ({
      id: node.mediaRecommendation!.id,
      title: titleOf(node.mediaRecommendation!.title),
      coverUrl: node.mediaRecommendation!.coverImage?.large || '/cover-placeholder.svg',
      siteUrl: node.mediaRecommendation!.siteUrl || '',
      rating: node.rating || 0,
    }))
  const externalLinks = (media.externalLinks || [])
    .filter((link) => !link.isDisabled && safeHttpUrl(link.url))
    .map((link) => ({
      site: link.site || 'Official source',
      url: safeHttpUrl(link.url),
      type: link.type || 'INFO',
      language: link.language || '',
    }))

  return {
    id: media.id,
    title: titleOf(media.title),
    description: media.description || '',
    genres: media.genres || [],
    averageScore: media.averageScore ?? null,
    popularity: media.popularity ?? null,
    siteUrl: media.siteUrl || '',
    bannerImage: media.bannerImage || null,
    recommendations,
    externalLinks,
  }
}

export async function getAniListManga(id: number, signal?: AbortSignal) {
  const response = await axios.post(
    ANI_LIST_URL,
    { query: MEDIA_QUERY, variables: { id } },
    { signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
  )

  if (response.data.errors?.length || !response.data.data?.Media) {
    throw new Error(response.data.errors?.[0]?.message || 'AniList metadata is unavailable.')
  }

  return normalizeAniListMedia(response.data.data.Media)
}
