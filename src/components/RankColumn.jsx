import { Link } from 'react-router-dom'
import StatusPanel from './StatusPanel.jsx'

/** One AniList-style "Top Airing"-esque column: a title, a vertical ranked list, and a "View More" link. */
export default function RankColumn({ title, items, isLoading, error, onRetry, viewAllHref }) {
  return (
    <div className="rank-column">
      <h2 className="rank-column__title">{title}</h2>

      {isLoading && (
        <div className="rank-column__list">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="rank-row rank-row--skeleton" key={index}>
              <div className="rank-row__thumb" />
              <div className="rank-row__body">
                <span className="rank-row__line" />
                <span className="rank-row__line rank-row__line--short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && <StatusPanel compact error={error} message="Couldn't load this list." onRetry={onRetry} />}

      {!isLoading && !error && (
        <div className="rank-column__list">
          {items.map((manga) => (
            <Link className="rank-row" key={manga.id} to={`/manga/${manga.id}`}>
              <img
                alt=""
                className="rank-row__thumb"
                loading="lazy"
                onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/cover-placeholder.svg' }}
                src={manga.coverUrl || '/cover-placeholder.svg'}
              />
              <div className="rank-row__body">
                <strong>{manga.title}</strong>
                <span>{manga.tags?.slice(0, 2).map((tag) => tag.name).join(' · ') || manga.status || 'Manga'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link className="rank-column__more" to={viewAllHref}>
        View More
        <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4 6 6-6 6" /></svg>
      </Link>
    </div>
  )
}
