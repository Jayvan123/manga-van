import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AniListRecommendations from '../components/AniListRecommendations.js'
import ChapterList from '../components/ChapterList.jsx'
import GoogleBooksSection from '../components/GoogleBooksSection.js'
import MangaCard from '../components/MangaCard.jsx'
import OfficialSourceLinks from '../components/OfficialSourceLinks.js'
import StatusPanel from '../components/StatusPanel.jsx'
import { useReadingProgress } from '../context/ReadingProgressContext.jsx'
import { useAniListManga } from '../hooks/useAniList.js'
import { useGoogleBooks } from '../hooks/useGoogleBooks.js'
import { useManga, useMangaFeed, useSearchManga } from '../hooks/useMangaQueries.js'
import { groupChaptersByVolume } from '../api/normalizers.js'
import { languageName } from '../utils/languages.js'
import type { MangaTag, ReadingProgressValue } from '../types/manga.js'

export default function MangaDetailsPage() {
  const { mangaId: mangaIdParam } = useParams()
  const mangaId = mangaIdParam || ''
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const manga = useManga(mangaId)
  // One complete feed request lets the page expose every language without
  // repeating a large network request whenever the selector changes.
  const feed = useMangaFeed(mangaId, null)
  const aniList = useAniListManga(manga.data?.aniListId)
  const englishChapters = useMemo(() => (feed.data || []).filter((chapter) => chapter.translatedLanguage === 'en'), [feed.data])
  const alternatives = useSearchManga(manga.data?.title || '', feed.isSuccess && englishChapters.length === 0)
  const googleBooks = useGoogleBooks(manga.data?.title || '', manga.data?.authors[0] || '', feed.isSuccess && englishChapters.length === 0)
  const { getProgress, getResumeTarget } = useReadingProgress() as ReadingProgressValue
  const progress = getProgress(mangaId)

  const availableLanguages = useMemo(() => {
    const codes = [...new Set((feed.data || []).map((chapter) => chapter.translatedLanguage).filter(Boolean))]
    return codes.sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : languageName(a).localeCompare(languageName(b))))
  }, [feed.data])

  const visibleChapters = useMemo(() => selectedLanguage === 'all'
    ? feed.data || []
    : (feed.data || []).filter((chapter) => chapter.translatedLanguage === selectedLanguage), [feed.data, selectedLanguage])
  const groups = useMemo(() => groupChaptersByVolume(visibleChapters), [visibleChapters])
  const resumeTarget = getResumeTarget(mangaId, visibleChapters)
  const resumePage = progress && resumeTarget?.id === progress.chapterId ? progress.page || 1 : 1
  const alternateItems = (alternatives.data || []).filter((candidate) => candidate.id !== mangaId).slice(0, 4)

  if (manga.isLoading) return <div className="container page"><div className="details-skeleton" /></div>
  if (manga.isError) return <div className="container page"><StatusPanel error={manga.error} onRetry={manga.refetch} /></div>
  if (!manga.data) return <div className="container page"><StatusPanel message="Manga details are unavailable." /></div>

  const item = manga.data
  const synopsis = item.description === 'No synopsis is available yet.' && aniList.data?.description
    ? aniList.data.description
    : item.description
  const readerLanguage = selectedLanguage === 'all' ? 'all' : selectedLanguage

  return (
    <div className="details-page">
      <div className="details-backdrop" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,.58), #0a0a0a), url(${item.coverUrlLarge})` }} />
      <div className="container page details-content">
        <section className="manga-details">
          <img alt={`${item.title} cover`} className="manga-details__cover" src={item.coverUrlLarge} />
          <div className="manga-details__info">
            <p className="eyebrow">{item.status} {item.year ? `· ${item.year}` : ''}</p>
            <h1>{item.title}</h1>
            <p className="manga-details__credits">{item.authors.length ? `Story by ${item.authors.join(', ')}` : 'Author unknown'}{item.artists.length ? ` · Art by ${item.artists.join(', ')}` : ''}</p>
            <div className="tag-list">{item.tags.map((tag: MangaTag) => <Link key={tag.id} to={`/browse?tag=${tag.id}`}>{tag.name}</Link>)}</div>
            {aniList.data && (
              <div className="anilist-meta" aria-label="AniList metadata">
                {aniList.data.averageScore !== null && <span><strong>{aniList.data.averageScore}%</strong> AniList score</span>}
                {aniList.data.popularity !== null && <span><strong>{aniList.data.popularity.toLocaleString()}</strong> AniList users</span>}
                {aniList.data.siteUrl && <a href={aniList.data.siteUrl} rel="noreferrer" target="_blank">View on AniList ↗</a>}
              </div>
            )}
            <p className="manga-details__description">{synopsis}</p>
            <div className="details-actions">
              {resumeTarget && <Link className="button button--primary button--large" to={`/read/${mangaId}/${resumeTarget.id}?lang=${encodeURIComponent(readerLanguage)}&page=${resumePage}`}>{progress ? 'Continue reading' : 'Start reading'} →</Link>}
              {item.officialEnglishUrl && <a className="button button--secondary button--large" href={item.officialEnglishUrl} rel="noreferrer" target="_blank">Official English release ↗</a>}
              {item.originalSourceUrl && <a className="button button--secondary button--large" href={item.originalSourceUrl} rel="noreferrer" target="_blank">Original publisher ↗</a>}
            </div>
          </div>
        </section>
        {aniList.data && <OfficialSourceLinks links={aniList.data.externalLinks} />}
        {googleBooks.data && <GoogleBooksSection books={googleBooks.data} />}
        {aniList.data && <AniListRecommendations items={aniList.data.recommendations} />}
        <section className="chapters-section">
          <div className="chapter-toolbar">
            <div>
              <p className="eyebrow">MangaDex releases</p>
              <h2>Chapters</h2>
              {availableLanguages.length > 0 && <p className="chapter-languages">Available: {availableLanguages.map(languageName).join(', ')}</p>}
            </div>
            <label>
              <span>Translation language</span>
              <select onChange={(event) => setSelectedLanguage(event.target.value)} value={selectedLanguage}>
                <option value="en">English</option>
                {availableLanguages.filter((code) => code !== 'en').map((code) => (
                  <option key={code} value={code}>{languageName(code)}{code === item.originalLanguage ? ' (original)' : ''}</option>
                ))}
                {availableLanguages.length > 1 && <option value="all">All languages</option>}
              </select>
            </label>
          </div>
          <div className="results-bar"><span>{visibleChapters.length} readable chapters</span></div>
          {feed.isLoading && <div className="chapter-list-skeleton" />}
          {feed.isError && <StatusPanel error={feed.error} onRetry={feed.refetch} />}
          {feed.isSuccess && visibleChapters.length === 0 && (
            <>
              <StatusPanel message={`No readable ${languageName(selectedLanguage)} chapters are hosted on MangaDex for this edition.${availableLanguages.length ? ' Choose another available language above.' : ''}`} />
              {item.officialEnglishUrl && <div className="fallback-link"><a className="button button--primary" href={item.officialEnglishUrl} rel="noreferrer" target="_blank">Read from the official English publisher ↗</a></div>}
            </>
          )}
          {visibleChapters.length > 0 && <ChapterList completedChapterIds={progress?.completedChapterIds} groups={groups} language={readerLanguage} mangaId={mangaId} />}
        </section>
        {feed.isSuccess && englishChapters.length === 0 && (alternatives.isLoading || alternateItems.length > 0) && (
          <section className="alternate-editions">
            <div className="section-heading"><div><p className="eyebrow">MangaDex fallback</p><h2>Possible English editions</h2><p>These are title matches. Open one to confirm it is the same series and edition.</p></div></div>
            {alternatives.isLoading ? <div className="chapter-list-skeleton" /> : <div className="manga-grid manga-grid--alternates">{alternateItems.map((candidate) => <MangaCard key={candidate.id} manga={candidate} progress={null} />)}</div>}
          </section>
        )}
      </div>
    </div>
  )
}
