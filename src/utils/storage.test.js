import { describe, expect, it } from 'vitest'
import { mergeProgress, readProgress, STORAGE_KEY, writeProgress } from './storage.js'

describe('reading progress storage', () => {
  it('returns an empty object for malformed data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken')
    expect(readProgress()).toEqual({})
  })

  it('merges a progress entry and preserves completed chapters', () => {
    const current = { m1: { mangaId: 'm1', completedChapterIds: ['c1'] } }
    const result = mergeProgress(current, { mangaId: 'm1', chapterId: 'c2', page: 3 })
    expect(result.m1.completedChapterIds).toEqual(['c1'])
    expect(result.m1).toMatchObject({ chapterId: 'c2', page: 3 })
  })

  it('writes and reads valid entries', () => {
    writeProgress({ m1: { mangaId: 'm1', title: 'Manga', lastReadAt: '2025-01-01' } })
    expect(readProgress().m1.title).toBe('Manga')
  })
})

