import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MangaCard from '../components/MangaCard.jsx'
import MangaSection from '../components/MangaSection.jsx'
import Pagination from '../components/Pagination.jsx'
import RankColumn from '../components/RankColumn.jsx'
import RecentlyReadMenu from '../components/RecentlyReadMenu.jsx'
import StatusPanel from '../components/StatusPanel.jsx'
import TopTenPanel from '../components/TopTenPanel.jsx'
import SparklesText from '../components/ui/SparklesText.jsx'
import { useMangaList, useTags } from '../hooks/useMangaQueries.js'
import { useReadingProgress } from '../context/ReadingProgressContext.jsx'
import { seededShuffle } from '../utils/manga.js'
import type { Manga, MangaTag, ReadingProgressValue } from '../types/manga.js'

const CATEGORIES = [
  { name: 'Action' },
  { name: 'Horror' },
  { name: 'Romance' },
  { name: 'Drama' },
]

interface CategoryColumnProps {
  category: { name: string }
  tags: MangaTag[]
}

function CategoryColumn({ category, tags }: CategoryColumnProps) {
  const tag = tags.find((item) => item.name.toLowerCase() === category.name.toLowerCase())
  const query = useMangaList(
    { includedTagIds: tag ? [tag.id] : [], sort: 'popularity', limit: 6 },
    { enabled: Boolean(tag) },
  )
  return (
    <RankColumn
      error={query.isError ? query.error : null}
      isLoading={!tag || query.isLoading}
      items={query.data?.items || []}
      onRetry={query.refetch}
      title={category.name}
      viewAllHref={`/browse?tag=${tag?.id || ''}`}
    />
  )
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
  const featuredCoverUrls = useMemo(() => {
    const list = dailyRecommendations?.items || latest.data?.items || allManga.data?.items || []
    const urls = list
      .map((m) => m.coverUrlLarge)
      .filter((url): url is string => Boolean(url))
    return [...new Set(urls)].slice(0, 10)
  }, [dailyRecommendations, latest.data, allManga.data])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (featuredCoverUrls.length <= 1) return
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % featuredCoverUrls.length)
    }, 1500)
    return () => clearInterval(timer)
  }, [featuredCoverUrls])

  const recentManga = recentlyRead.map((entry) => ({
    id: entry.mangaId,
    title: entry.title,
    coverUrl: entry.coverUrl,
    tags: entry.genres || [],
  }))

  return (
    <>
      <section className="hero-banner">
        {featuredCoverUrls.map((url, idx) => (
          <img
            key={url}
            alt=""
            aria-hidden="true"
            className="hero-banner__art"
            referrerPolicy="no-referrer"
            src={url}
            style={{
              opacity: idx === currentImageIndex ? 0.64 : 0,
              transform: `scale(1.015) translate3d(${idx === currentImageIndex ? '0' : '20px'}, 0, 0)`,
              transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
              pointerEvents: idx === currentImageIndex ? 'auto' : 'none',
            }}
          />
        ))}
        <div className="container hero-banner__content">
          <p className="eyebrow">Read freely. Remember locally.</p>
          <h1><SparklesText sparklesCount={14}>Your next obsession<br />is one chapter away.</SparklesText></h1>
          <p>Discover manga and Korean manhwa, track your place without an account, and read anywhere.</p>
          <div className="hero-banner__actions">
            <Link className="button button--primary" to="/browse">Explore all</Link>
            <a className="button button--ghost" href="#latest">Latest updates ↓</a>
          </div>
        </div>
      </section>

      <div className="container home-content">
        {recentManga.length > 0 && (
          <div className="home-content__utility">
            <RecentlyReadMenu items={recentManga} progressByManga={progressByManga} />
          </div>
        )}

        <div id="latest"><MangaSection progressByManga={progressByManga} query={latest} title="Latest Updates" action={<Link to="/browse?sort=latest">View all</Link>} /></div>
        <MangaSection progressByManga={progressByManga} query={{ ...recommendations, data: dailyRecommendations }} title="For You" action={<Link to="/browse?sort=popularity">More picks</Link>} />
        {/* <MangaSection progressByManga={progressByManga} query={manhwa} title="Popular Manhwa" action={<Link to="/browse?type=manhwa&sort=popularity">View all manhwa</Link>} /> */}
        <section className="content-section">
          <div className="rank-columns">
            {CATEGORIES.map((category) => <CategoryColumn category={category} key={category.name} tags={tags} />)}
          </div>
        </section>

        <section className="content-section">
          <div className="all-titles-layout">
            <div className="all-titles-main">
              <div className="section-heading"><div><h2>All Titles</h2><p>Browse manga and manhwa from the MangaDex catalog</p></div><Link to="/browse">Advanced filters</Link></div>
              {allManga.isLoading && <div className="manga-grid">{Array.from({ length: 12 }, (_, index) => <div className="manga-card skeleton-card" key={index} />)}</div>}
              {allManga.isError && <StatusPanel error={allManga.error} onRetry={allManga.refetch} />}
              {allManga.data && <><div className="manga-grid">{allManga.data.items.map((manga: Manga) => <MangaCard key={manga.id} manga={manga} progress={progressByManga[manga.id]} />)}</div><Pagination limit={18} onChange={(page: number) => { setAllPage(page); document.querySelector('.content-section:last-child')?.scrollIntoView({ behavior: 'smooth' }) }} page={allPage} total={allManga.data.total} /></>}
            </div>
            <TopTenPanel />
          </div>
        </section>
      </div>
    </>
  )
}
