import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReaderPage from './ReaderPage.tsx'

const saveProgress = vi.fn()
const markChapterComplete = vi.fn()
const refetchPages = vi.fn(() => Promise.resolve())

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
  useChapterPages: () => ({
    data: { pages: ['/1.jpg', '/2.jpg', '/3.jpg'], dataSaverPages: ['/ds1.jpg', '/ds2.jpg', '/ds3.jpg'] },
    isLoading: false,
    isError: false,
    refetch: refetchPages,
  }),
}))

describe('ReaderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('supports keyboard page navigation and boundary shortcuts', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/read/m1/c1?page=1']}>
        <Routes><Route element={<ReaderPage />} path="/read/:mangaId/:chapterId" /></Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Reading now · Chapter 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    await user.keyboard('{Home}')
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('switches between page and scroll reading modes', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/read/m1/c1?page=1']}>
        <Routes><Route element={<ReaderPage />} path="/read/:mangaId/:chapterId" /></Routes>
      </MemoryRouter>,
    )

    const pageMode = screen.getByRole('button', { name: 'Page' })
    const scrollMode = screen.getByRole('button', { name: 'Scroll' })
    expect(pageMode).toHaveAttribute('aria-pressed', 'true')

    await user.click(scrollMode)

    expect(scrollMode).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(window.localStorage.getItem('mangavan:reader-mode')).toBe('scroll')
  })

  it('opens a chapter drawer and removes the old chapter footer navigation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/read/m1/c1?page=1']}>
        <Routes><Route element={<ReaderPage />} path="/read/:mangaId/:chapterId" /></Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Next chapter' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chapters' }))

    const drawer = screen.getByRole('dialog', { name: 'Chapter list' })
    expect(drawer).toBeInTheDocument()
    await waitFor(() => expect(drawer.querySelector('[aria-current="page"]')).toHaveFocus())

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Chapter list' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Chapters' })).toHaveFocus())
  })

  it('falls back to data-saver pages and refreshes failed MangaDex sources', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/read/m1/c1?page=1']}>
        <Routes><Route element={<ReaderPage />} path="/read/:mangaId/:chapterId" /></Routes>
      </MemoryRouter>,
    )

    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img')).toHaveAttribute('src', '/ds1.jpg')

    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('This page could not be loaded from either MangaDex image source.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetchPages).toHaveBeenCalledOnce()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/1.jpg')
  })
})
