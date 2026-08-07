import { describe, expect, it } from 'vitest'
import { normalizeAniListMedia } from './aniListApi.js'

describe('AniList metadata normalizer', () => {
  it('normalizes public metadata and excludes adult recommendations', () => {
    const result = normalizeAniListMedia({
      id: 1,
      title: { english: 'Example', romaji: 'Example Romaji' },
      description: 'Synopsis',
      genres: ['Action'],
      averageScore: 82,
      popularity: 1000,
      siteUrl: 'https://anilist.co/manga/1',
      externalLinks: [
        { site: 'MANGA Plus', url: 'https://mangaplus.shueisha.co.jp/title/1', type: 'STREAMING', language: 'en' },
        { site: 'Unsafe', url: 'javascript:alert(1)', type: 'INFO' },
      ],
      recommendations: {
        nodes: [
          { rating: 10, mediaRecommendation: { id: 2, type: 'MANGA', isAdult: false, title: { romaji: 'Safe' }, coverImage: { large: 'safe.jpg' }, siteUrl: 'safe' } },
          { rating: 9, mediaRecommendation: { id: 3, type: 'MANGA', isAdult: true, title: { english: 'Adult' } } },
        ],
      },
    })

    expect(result).toMatchObject({ id: 1, title: 'Example', averageScore: 82 })
    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0]).toMatchObject({ id: 2, title: 'Safe' })
    expect(result.externalLinks).toEqual([{ site: 'MANGA Plus', url: 'https://mangaplus.shueisha.co.jp/title/1', type: 'STREAMING', language: 'en' }])
  })
})
