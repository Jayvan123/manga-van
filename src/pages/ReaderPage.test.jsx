import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReaderPage from './ReaderPage.tsx'

const saveProgress = vi.fn()
const markChapterComplete = vi.fn()

vi.mock('../context/ReadingProgressContext.jsx', () => ({
  useReadingProgress: () => ({
    getProgress: () => null,
    saveProgress,
    markChapterComplete,
  }),
}))

vi.mock('../hooks/useMangaQueries.js', () => ({
  useManga: () => ({ data: { id: 'm1', title: 'Test Manga', coverUrl: '/cover.jpg', tags: [] }, isLoading: false, isError: false }),
  useMangaFeed: () => ({
    data: [
      { id: 'c1', mangaId: 'm1', volume: '1', chapter: '1', title: '', publishAt: '2025-01-01' },
      { id: 'c2', mangaId: 'm1', volume: '1', chapter: '2', title: '', publishAt: '2025-01-02' },
    ],
    isLoading: false,
    isError: false,
  }),
  useChapterPages: () => ({ data: { pages: ['/1.jpg', '/2.jpg', '/3.jpg'] }, isLoading: false, isError: false }),
}))

describe('ReaderPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('supports keyboard page navigation and boundary shortcuts', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/read/m1/c1?page=1']}>
        <Routes><Route element={<ReaderPage />} path="/read/:mangaId/:chapterId" /></Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    await user.keyboard('{Home}')
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })
})
