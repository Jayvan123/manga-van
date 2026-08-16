import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusPanel from './StatusPanel.jsx'
import { useTopManga } from '../hooks/useMangaQueries.js'

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

/** AniList/HiAnime-style "Top 10" rail: a period switcher above a numbered ranking list. */
export default function TopTenPanel() {
  const [period, setPeriod] = useState('today')
  const query = useTopManga(period, 10)
  const items = query.data || []

  return (
    <aside aria-label="Top 10 manga" className="top-ten">
      <div className="top-ten__head">
        <h2>Top 10</h2>
        <div aria-label="Ranking period" className="top-ten__tabs" role="group">
          {PERIODS.map((option) => (
            <button
              aria-pressed={period === option.value}
              key={option.value}
              onClick={() => setPeriod(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading && (
        <ol className="top-ten__list">
          {Array.from({ length: 10 }, (_, index) => (
            <li className="top-ten-row top-ten-row--skeleton" key={index}>
              <span className="top-ten-row__rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="top-ten-row__thumb" />
              <span className="top-ten-row__body">
                <span className="top-ten-row__line" />
                <span className="top-ten-row__line top-ten-row__line--short" />
              </span>
            </li>
          ))}
        </ol>
      )}

      {!query.isLoading && query.isError && <StatusPanel compact error={query.error} message="Couldn't load the Top 10." onRetry={query.refetch} />}

      {!query.isLoading && !query.isError && !items.length && <StatusPanel compact message="Nothing trending for this period yet." />}

      {!query.isLoading && !query.isError && items.length > 0 && (
        <ol className="top-ten__list">
          {items.map((manga, index) => (
            <li className={`top-ten-row${index < 3 ? ' is-top3' : ''}`} key={manga.id}>
              <span className="top-ten-row__rank">{String(index + 1).padStart(2, '0')}</span>
              <Link className="top-ten-row__link" to={`/manga/${manga.id}`}>
                <img
                  alt=""
                  className="top-ten-row__thumb"
                  loading="lazy"
                  onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/cover-placeholder.svg' }}
                  src={manga.coverUrl || '/cover-placeholder.svg'}
                />
                <span className="top-ten-row__body">
                  <strong>{manga.title}</strong>
                  <span>{manga.tags?.slice(0, 2).map((tag) => tag.name).join(' · ') || manga.status || 'Manga'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
