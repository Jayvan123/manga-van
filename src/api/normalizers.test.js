import { describe, expect, it } from 'vitest'
import { buildCoverUrl, compareChapters, groupChaptersByVolume, localizedValue, normalizeManga } from './normalizers.js'

describe('MangaDex normalizers', () => {
  it('falls back to another localized value', () => {
    expect(localizedValue({ ja: '日本語', en: 'English' })).toBe('English')
    expect(localizedValue({ ja: '日本語' })).toBe('日本語')
  })

  it('builds a cover URL using the manga id', () => {
    expect(buildCoverUrl('manga-id', 'cover.jpg', 512)).toBe('https://uploads.mangadex.org/covers/manga-id/cover.jpg.512.jpg')
  })

  it('normalizes relationships and metadata', () => {
    const manga = normalizeManga({
      id: 'm1',
      attributes: { title: { en: 'Test' }, description: { en: 'Synopsis' }, tags: [], links: { al: '12345', engtl: 'https://publisher.example/read' } },
      relationships: [
        { type: 'cover_art', attributes: { fileName: 'a.jpg' } },
        { type: 'author', attributes: { name: 'Writer' } },
      ],
    })
    expect(manga).toMatchObject({ id: 'm1', title: 'Test', authors: ['Writer'], aniListId: 12345, officialEnglishUrl: 'https://publisher.example/read' })
    expect(manga.coverUrl).toContain('/m1/a.jpg.256.jpg')
  })

  it('sorts and groups chapters by volume', () => {
    const chapters = [
      { id: 'b', volume: '2', chapter: '1', publishAt: '2024-01-01' },
      { id: 'a', volume: '1', chapter: '10', publishAt: '2024-01-01' },
      { id: 'c', volume: '1', chapter: '2', publishAt: '2024-01-01' },
    ]
    expect([...chapters].sort(compareChapters).map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(Object.keys(groupChaptersByVolume(chapters))).toEqual(['Volume 1', 'Volume 2'])
  })
})
