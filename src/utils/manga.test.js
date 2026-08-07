import { describe, expect, it } from 'vitest'
import { chapterLabel, seededShuffle, truncate } from './manga.js'

describe('manga utilities', () => {
  it('produces a stable daily shuffle without mutating input', () => {
    const items = [1, 2, 3, 4, 5]
    expect(seededShuffle(items, '2026-08-05')).toEqual(seededShuffle(items, '2026-08-05'))
    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  it('formats chapter labels and truncates descriptions', () => {
    expect(chapterLabel({ chapter: '3', title: 'Arrival' })).toBe('Chapter 3: Arrival')
    expect(truncate('abcdef', 4)).toBe('abcd…')
  })
})

