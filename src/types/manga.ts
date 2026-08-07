export interface MangaTag {
  id: string
  name: string
}

export interface Manga {
  id: string
  title: string
  description: string
  status: string
  year: number | null
  aniListId?: number | null
  originalLanguage?: string | null
  officialEnglishUrl?: string | null
  originalSourceUrl?: string | null
  authors: string[]
  artists: string[]
  tags: MangaTag[]
  coverUrl: string
  coverUrlLarge: string
}

export interface Chapter {
  id: string
  mangaId: string | null
  volume: string | null
  chapter: string | null
  title: string
  translatedLanguage: string
  pages: number
  publishAt: string | null
  group: string
}

export interface ProgressEntry {
  mangaId: string
  title: string
  coverUrl: string
  genres: MangaTag[]
  chapterId: string
  chapter: string | null
  page: number
  pageCount: number
  lastReadAt?: string
  completedChapterIds?: string[]
}

export interface ReadingProgressValue {
  progressByManga: Record<string, ProgressEntry>
  recentlyRead: ProgressEntry[]
  getProgress: (mangaId: string) => ProgressEntry | null
  saveProgress: (entry: Partial<ProgressEntry> & { mangaId: string }) => void
  markChapterComplete: (mangaId: string, chapterId: string) => void
  getResumeTarget: (mangaId: string, chapters: Chapter[]) => Chapter | null
  clearProgress: () => void
}
