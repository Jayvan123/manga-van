import { describe, expect, it } from 'vitest'
import { normalizeGoogleBook } from './googleBooksApi.js'

describe('Google Books normalizer', () => {
  it('normalizes official edition, preview, and purchase fields', () => {
    const book = normalizeGoogleBook({
      id: 'volume-1',
      volumeInfo: {
        title: 'Example, Vol. 1',
        authors: ['Author'],
        publisher: 'Publisher',
        language: 'en',
        imageLinks: { thumbnail: 'http://books.google.com/cover.jpg' },
        previewLink: 'https://books.google.com/preview',
        industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780000000000' }],
      },
      accessInfo: { embeddable: true, viewability: 'PARTIAL' },
      saleInfo: { buyLink: 'https://books.google.com/buy' },
    })

    expect(book).toMatchObject({
      id: 'volume-1',
      title: 'Example, Vol. 1',
      isbn: '9780000000000',
      embeddable: true,
      viewability: 'PARTIAL',
    })
    expect(book.imageUrl).toBe('https://books.google.com/cover.jpg')
  })
})
