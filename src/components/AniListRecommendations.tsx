import { Link } from 'react-router-dom'
import type { AniListRecommendation } from '../api/aniListApi.js'

export default function AniListRecommendations({ items }: { items: AniListRecommendation[] }) {
  if (!items.length) return null

  return (
    <section className="anilist-recommendations" aria-labelledby="anilist-recommendations-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Metadata by AniList</p>
          <h2 id="anilist-recommendations-title">You may also like</h2>
          <p>Open a MangaVAn search to check whether English chapters are available on MangaDex.</p>
        </div>
      </div>
      <div className="anilist-recommendations__row">
        {items.map((item) => (
          <article className="anilist-card" key={item.id}>
            <Link to={`/browse?q=${encodeURIComponent(item.title)}&sort=relevance`}>
              <img alt="" loading="lazy" src={item.coverUrl} />
              <strong>{item.title}</strong>
              <span>Search MangaVAn</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
