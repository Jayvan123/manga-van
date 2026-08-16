import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/** Compact "Recently Read" trigger + dropdown, replacing a full-width row so it doesn't compete with Latest Updates / For You. */
export default function RecentlyReadMenu({ items, progressByManga }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  if (!items.length) return null

  return (
    <div className="recently-read-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="recently-read-menu__trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 5.5v5l3.2 1.9M17.5 10a7.5 7.5 0 1 1-2.2-5.3" /><path d="M17.5 3.5v3.8h-3.8" /></svg>
        Recently Read
        <span className="recently-read-menu__count">{items.length}</span>
        <svg aria-hidden="true" className="recently-read-menu__chevron" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      {open && (
        <div className="recently-read-menu__panel" role="menu">
          {items.map((manga) => {
            const progress = progressByManga[manga.id]
            return (
              <Link className="recently-read-menu__item" key={manga.id} onClick={() => setOpen(false)} role="menuitem" to={`/manga/${manga.id}`}>
                <img
                  alt=""
                  onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/cover-placeholder.svg' }}
                  src={manga.coverUrl || '/cover-placeholder.svg'}
                />
                <span className="recently-read-menu__item-body">
                  <strong>{manga.title}</strong>
                  <span>{progress?.chapter ? `Ch. ${progress.chapter}` : 'View details'}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
