import { memo } from 'react'
import { Link } from 'react-router-dom'
import { languageName } from '../utils/languages.js'
import { chapterLabel, formatDate } from '../utils/manga.js'

function ChapterRow({ chapter, mangaId, completed, language }) {
  const readerLanguage = language === 'all' ? 'all' : chapter.translatedLanguage || language || 'en'
  return (
    <li className="chapter-row">
      <Link to={`/read/${mangaId}/${chapter.id}?lang=${encodeURIComponent(readerLanguage)}`}>
        <span className="chapter-row__title">{completed && <span aria-label="Read">✓ </span>}{chapterLabel(chapter)}</span>
        <span className="chapter-row__meta">{languageName(chapter.translatedLanguage)} · {chapter.group} · {formatDate(chapter.publishAt)}</span>
      </Link>
    </li>
  )
}

const MemoChapterRow = memo(ChapterRow)

/**
 * @param {{ groups: Record<string, any[]>, mangaId: string, completedChapterIds?: string[], language?: string }} props
 */
export default function ChapterList({ groups, mangaId, completedChapterIds = [], language = 'en' }) {
  return (
    <div className="chapter-groups">
      {Object.entries(groups).map(([volume, chapters]) => (
        <section className="chapter-group" key={volume}>
          <h3>{volume}<span>{chapters.length} chapters</span></h3>
          <ol>{chapters.map((chapter) => <MemoChapterRow chapter={chapter} completed={completedChapterIds.includes(chapter.id)} key={chapter.id} language={language} mangaId={mangaId} />)}</ol>
        </section>
      ))}
    </div>
  )
}
