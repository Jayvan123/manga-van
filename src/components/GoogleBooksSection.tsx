import { useState } from 'react'
import GoogleBooksPreview from './GoogleBooksPreview.js'
import type { GoogleBookVolume } from '../api/googleBooksApi.js'

export default function GoogleBooksSection({ books }: { books: GoogleBookVolume[] }) {
  const [previewBook, setPreviewBook] = useState<GoogleBookVolume | null>(null)
  if (!books.length) return null

  return (
    <section className="google-books" aria-labelledby="google-books-title">
      <div className="section-heading"><div><p className="eyebrow">Official English editions</p><h2 id="google-books-title">Google Books</h2><p>Previews and purchase availability depend on the publisher and your region.</p></div></div>
      <div className="google-books__row">
        {books.map((book) => (
          <article className="google-book" key={book.id}>
            <img alt={`${book.title} cover`} loading="lazy" src={book.imageUrl} />
            <div><strong>{book.title}</strong><span>{[book.publisher, book.publishedDate].filter(Boolean).join(' · ') || 'English edition'}</span></div>
            <div className="google-book__actions">
              {book.embeddable && book.viewability !== 'NO_PAGES' && <button onClick={() => setPreviewBook(book)} type="button">Preview</button>}
              {(book.buyUrl || book.infoUrl) && <a href={book.buyUrl || book.infoUrl} rel="noreferrer" target="_blank">{book.buyUrl ? 'Buy' : 'Details'} ↗</a>}
            </div>
          </article>
        ))}
      </div>
      {previewBook && <GoogleBooksPreview book={previewBook} onClose={() => setPreviewBook(null)} />}
    </section>
  )
}
