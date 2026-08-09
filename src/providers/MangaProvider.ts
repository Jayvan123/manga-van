import type { Chapter, Manga, MangaTag } from '../types/manga.js'

export interface MangaListOptions {
  query?: string
  includedTagIds?: string[]
  contentType?: 'all' | 'manga' | 'manhwa'
  sort?: 'relevance' | 'popularity' | 'latest' | 'alphabetical'
  page?: number
  limit?: number
  signal?: AbortSignal
}

export interface MangaListResult {
  items: Manga[]
  total: number
  apiTotal: number
  page: number
  limit: number
}

export interface ChapterPages {
  baseUrl: string
  hash: string
  pages: string[]
  dataSaverPages: string[]
}

export interface MangaProvider {
  listManga(options?: MangaListOptions): Promise<MangaListResult>
  searchManga(title: string, signal?: AbortSignal): Promise<Manga[]>
  getManga(id: string, signal?: AbortSignal): Promise<Manga>
  getMangaFeed(id: string, language?: string | null, signal?: AbortSignal): Promise<Chapter[]>
  getChapterPages(id: string, signal?: AbortSignal): Promise<ChapterPages>
  getTags(signal?: AbortSignal): Promise<MangaTag[]>
}
