import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReadingProgressProvider, useReadingProgress } from './ReadingProgressContext.jsx'
import { ProfileProvider } from './ProfileContext.jsx'
import { STORAGE_KEY } from '../utils/storage.js'

describe('ReadingProgressProvider', () => {
  it('saves, completes, and resolves the next unread chapter', () => {
    const wrapper = ({ children }) => <ProfileProvider><ReadingProgressProvider>{children}</ReadingProgressProvider></ProfileProvider>
    const { result } = renderHook(() => useReadingProgress(), { wrapper })
    const chapters = [{ id: 'c1' }, { id: 'c2' }]

    act(() => result.current.saveProgress({ mangaId: 'm1', chapterId: 'c1', page: 4, title: 'Test' }))
    expect(result.current.getResumeTarget('m1', chapters).id).toBe('c1')

    act(() => result.current.markChapterComplete('m1', 'c1'))
    expect(result.current.getResumeTarget('m1', chapters).id).toBe('c2')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).m1.completedChapterIds).toContain('c1')
  })
})

