import { memo } from 'react'
import { Link } from 'react-router-dom'

function MangaCard({ manga, progress, eager = false }) {
  return (
    <article className="manga-card">
      <Link className="manga-card__cover" to={`/manga/${manga.id}`}>
        <img
          alt={`${manga.title} cover`}
          loading={eager ? 'eager' : 'lazy'}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = '/cover-placeholder.svg'
          }}
          src={manga.coverUrl || '/cover-placeholder.svg'}
        />
        {manga.originalLanguage === 'ko' && <span className="manga-card__type">Manhwa</span>}
        {progress && <span className="manga-card__progress">Ch. {progress.chapter || '?'}</span>}
      </Link>
      <div className="manga-card__body">
        <h3><Link to={`/manga/${manga.id}`}>{manga.title}</Link></h3>
        <p>{manga.tags?.slice(0, 2).map((tag) => tag.name).join(' · ') || manga.status || 'Manga'}</p>
      </div>
    </article>
  )
}

export default memo(MangaCard)
