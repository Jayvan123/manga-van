import {
  getChapterPages,
  getManga,
  getMangaFeed,
  getTags,
  listManga,
  listTopManga,
  searchManga,
} from '../api/mangaApi.js'
import type { MangaProvider } from './MangaProvider.js'

// The application reads against this contract rather than MangaDex functions
// directly, making provider ownership explicit and future adapters possible.
export const mangaDexProvider: MangaProvider = {
  listManga,
  searchManga,
  getManga,
  getMangaFeed,
  getChapterPages,
  getTags,
  listTopManga,
}
