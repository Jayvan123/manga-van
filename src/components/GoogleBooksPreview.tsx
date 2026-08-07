import { useEffect, useRef, useState } from 'react'
import type { GoogleBookVolume } from '../api/googleBooksApi.js'

interface GoogleViewer {
  load: (volumeId: string, notFound?: () => void) => void
}

interface GoogleBooksNamespace {
  load: (options?: { language?: string }) => void
  setOnLoadCallback: (callback: () => void) => void
  DefaultViewer: new (element: HTMLElement) => GoogleViewer
}

declare global {
  interface Window {
    google?: { books?: GoogleBooksNamespace }
  }
}

let loaderPromise: Promise<GoogleBooksNamespace> | null = null

function loadViewerApi() {
  if (loaderPromise) return loaderPromise
  loaderPromise = new Promise((resolve, reject) => {
    const initialize = () => {
      if (!window.google?.books) {
        reject(new Error('Google Books preview could not be initialized.'))
        return
      }
      window.google.books.load({ language: 'en' })
      window.google.books.setOnLoadCallback(() => resolve(window.google!.books!))
    }

    if (window.google?.books) {
      initialize()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-books-viewer]')
    if (existing) {
      existing.addEventListener('load', initialize, { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Books preview script failed to load.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://www.google.com/books/jsapi.js'
    script.async = true
    script.dataset.googleBooksViewer = 'true'
    script.addEventListener('load', initialize, { once: true })
    script.addEventListener('error', () => reject(new Error('Google Books preview script failed to load.')), { once: true })
    document.head.appendChild(script)
  })
  return loaderPromise
}

export default function GoogleBooksPreview({ book, onClose }: { book: GoogleBookVolume; onClose: () => void }) {
  const viewerElement = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    loadViewerApi().then((books) => {
      if (!active || !viewerElement.current) return
      const viewer = new books.DefaultViewer(viewerElement.current)
      viewer.load(book.id, () => active && setError('This preview is not available in your region.'))
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Preview unavailable.')
    })
    return () => { active = false }
  }, [book.id])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="book-preview" role="dialog" aria-label={`Preview ${book.title}`} aria-modal="true">
      <button className="book-preview__backdrop" onClick={onClose} type="button" aria-label="Close preview" />
      <div className="book-preview__panel">
        <header><div><span>Google Books preview</span><strong>{book.title}</strong></div><button onClick={onClose} type="button" aria-label="Close preview">×</button></header>
        {error ? <div className="book-preview__error"><p>{error}</p><a className="button button--primary" href={book.previewUrl || book.infoUrl} rel="noreferrer" target="_blank">Open on Google Books ↗</a></div> : <div className="book-preview__viewer" ref={viewerElement} />}
      </div>
    </div>
  )
}
