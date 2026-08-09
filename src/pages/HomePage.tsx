import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MangaCard from '../components/MangaCard.jsx'
import MangaSection from '../components/MangaSection.jsx'
import Pagination from '../components/Pagination.jsx'
import StatusPanel from '../components/StatusPanel.jsx'
import { useMangaList, useTags } from '../hooks/useMangaQueries.js'
import { useReadingProgress } from '../context/ReadingProgressContext.jsx'
import { seededShuffle } from '../utils/manga.js'
import type { Manga, MangaTag, ProgressEntry, ReadingProgressValue } from '../types/manga.js'

const CATEGORIES = [
  { name: 'Action' },
  { name: 'Horror' },
  { name: 'Romance' },
  { name: 'Drama' },
]

interface CategorySectionProps {
  category: { name: string }
  tags: MangaTag[]
  progressByManga: Record<string, ProgressEntry>
}

function CategorySection({ category, tags, progressByManga }: CategorySectionProps) {
  const tag = tags.find((item) => item.name.toLowerCase() === category.name.toLowerCase())
  const query = useMangaList(
    { includedTagIds: tag ? [tag.id] : [], sort: 'popularity', limit: 12 },
    { enabled: Boolean(tag) },
  )
  return <MangaSection action={<Link to={`/browse?tag=${tag?.id || ''}`}>View all</Link>} progressByManga={progressByManga} query={{ ...query, isLoading: !tag || query.isLoading }} title={category.name} />
}

export default function HomePage() {
  const [allPage, setAllPage] = useState(1)
  const { data: tags = [] } = useTags()
  const { progressByManga, recentlyRead } = useReadingProgress() as ReadingProgressValue
  const latest = useMangaList({ sort: 'latest', limit: 12 })
  const manhwa = useMangaList({ contentType: 'manhwa', sort: 'popularity', limit: 12 })
  const allManga = useMangaList({ sort: 'popularity', page: allPage, limit: 18 })

  const favoriteTagIds = useMemo(() => [...new Set(recentlyRead.flatMap((entry) => entry.genres || []).map((tag) => tag.id).filter(Boolean))].slice(0, 1), [recentlyRead])
  const recommendations = useMangaList({ includedTagIds: favoriteTagIds, sort: 'popularity', limit: 18 })
  const dailyRecommendations = useMemo(() => {
    if (!recommendations.data) return recommendations.data
    const day = new Date().toISOString().slice(0, 10)
    return { ...recommendations.data, items: seededShuffle(recommendations.data.items, `${day}:${favoriteTagIds.join()}`).slice(0, 12) }
  }, [favoriteTagIds, recommendations.data])
  const featuredManga = dailyRecommendations?.items?.[0] || latest.data?.items?.[0] || allManga.data?.items?.[0]

  const recentManga = recentlyRead.map((entry) => ({
    id: entry.mangaId,
    title: entry.title,
    coverUrl: entry.coverUrl,
    tags: entry.genres || [],
  }))

  return (
    <>
      <section className="hero-banner">
        {featuredManga?.coverUrlLarge && (
          <div
            aria-hidden="true"
            className="hero-banner__art"
            style={{ backgroundImage: `url(${featuredManga.coverUrlLarge})` }}
          />
        )}
        <div className="container hero-banner__content">
          <p className="eyebrow">Read freely. Remember locally.</p>
          <h1>Your next obsession<br />is one chapter away.</h1>
          <p>Discover manga and Korean manhwa, track your place without an account, and read anywhere.</p>
          <div className="hero-banner__actions">
            <Link className="button button--primary" to="/browse">Explore all</Link>
            <Link className="button button--ghost" to="/browse?type=manhwa">Browse manhwa</Link>
            <a className="button button--ghost" href="#latest">Latest updates ↓</a>
          </div>
        </div>
      </section>

      <div className="container home-content">
        {recentManga.length > 0 && (
          <section className="content-section">
            <div className="section-heading"><h2>Recently read</h2></div>
            <div className="manga-row">{recentManga.map((manga) => <MangaCard key={manga.id} manga={manga} progress={progressByManga[manga.id]} />)}</div>
          </section>
        )}

        <MangaSection progressByManga={progressByManga} query={{ ...recommendations, data: dailyRecommendations }} title="For You" action={<Link to="/browse?sort=popularity">More picks</Link>} />
        <div id="latest"><MangaSection progressByManga={progressByManga} query={latest} title="Latest Updates" action={<Link to="/browse?sort=latest">View all</Link>} /></div>
        <MangaSection progressByManga={progressByManga} query={manhwa} title="Popular Manhwa" action={<Link to="/browse?type=manhwa&sort=popularity">View all manhwa</Link>} />
        {CATEGORIES.map((category) => <CategorySection category={category} key={category.name} progressByManga={progressByManga} tags={tags} />)}

        <section className="content-section">
          <div className="section-heading"><div><h2>All Titles</h2><p>Browse manga and manhwa from the MangaDex catalog</p></div><Link to="/browse">Advanced filters</Link></div>
          {allManga.isLoading && <div className="manga-grid">{Array.from({ length: 12 }, (_, index) => <div className="manga-card skeleton-card" key={index} />)}</div>}
          {allManga.isError && <StatusPanel error={allManga.error} onRetry={allManga.refetch} />}
          {allManga.data && <><div className="manga-grid">{allManga.data.items.map((manga: Manga) => <MangaCard key={manga.id} manga={manga} progress={progressByManga[manga.id]} />)}</div><Pagination limit={18} onChange={(page: number) => { setAllPage(page); document.querySelector('.content-section:last-child')?.scrollIntoView({ behavior: 'smooth' }) }} page={allPage} total={allManga.data.total} /></>}
        </section>
      </div>
    </>
  )
}
