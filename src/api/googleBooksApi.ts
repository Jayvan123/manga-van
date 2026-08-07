import axios from 'axios'

const GOOGLE_BOOKS_URL = import.meta.env.VITE_GOOGLE_BOOKS_API_URL || 'https://www.googleapis.com/books/v1'
const GOOGLE_BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

export const isGoogleBooksConfigured = Boolean(GOOGLE_BOOKS_KEY)

export interface GoogleBookVolume {
  id: string
  title: string
  subtitle: string
  authors: string[]
  publisher: string
  publishedDate: string
  imageUrl: string
  previewUrl: string
  infoUrl: string
  buyUrl: string
  webReaderUrl: string
  viewability: string
  embeddable: boolean
  isbn: string
}

interface RawGoogleVolume {
  id?: string
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    language?: string
    previewLink?: string
    infoLink?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>
  }
  saleInfo?: { buyLink?: string }
  accessInfo?: { viewability?: string; embeddable?: boolean; webReaderLink?: string }
}

function secureImageUrl(value?: string) {
  return value?.replace(/^http:/, 'https:') || '/cover-placeholder.svg'
}

export function normalizeGoogleBook(volume: RawGoogleVolume): GoogleBookVolume {
  const info = volume.volumeInfo || {}
  const isbn = info.industryIdentifiers?.find((identifier) => identifier.type === 'ISBN_13')?.identifier
    || info.industryIdentifiers?.find((identifier) => identifier.type === 'ISBN_10')?.identifier
    || ''

  return {
    id: volume.id || '',
    title: info.title || 'Untitled volume',
    subtitle: info.subtitle || '',
    authors: info.authors || [],
    publisher: info.publisher || '',
    publishedDate: info.publishedDate || '',
    imageUrl: secureImageUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
    previewUrl: info.previewLink || '',
    infoUrl: info.infoLink || '',
    buyUrl: volume.saleInfo?.buyLink || '',
    webReaderUrl: volume.accessInfo?.webReaderLink || '',
    viewability: volume.accessInfo?.viewability || 'NO_PAGES',
    embeddable: Boolean(volume.accessInfo?.embeddable),
    isbn,
  }
}

export async function searchEnglishVolumes(title: string, author = '', signal?: AbortSignal) {
  if (!isGoogleBooksConfigured || !title.trim()) return []
  const query = [`intitle:${title.trim()}`, author ? `inauthor:${author.trim()}` : ''].filter(Boolean).join(' ')
  const response = await axios.get(`${GOOGLE_BOOKS_URL}/volumes`, {
    params: {
      q: query,
      key: GOOGLE_BOOKS_KEY,
      langRestrict: 'en',
      printType: 'books',
      orderBy: 'relevance',
      maxResults: 8,
    },
    signal,
  })

  return (response.data.items || [])
    .map(normalizeGoogleBook)
    .filter((volume: GoogleBookVolume) => volume.id && (volume.previewUrl || volume.infoUrl || volume.buyUrl))
}
