import MangaCard from './MangaCard.jsx'
import ScrollRow from './ScrollRow.jsx'
import StatusPanel from './StatusPanel.jsx'

export default function MangaSection({ title, icon = null, query, action, progressByManga = {} }) {
  if (query.isLoading) {
    return <section className="content-section"><SectionHeading title={title} icon={icon} action={action} /><CardSkeletons /></section>
  }
  if (query.isError) {
    return <section className="content-section"><SectionHeading title={title} icon={icon} action={action} /><StatusPanel compact error={query.error} onRetry={query.refetch} /></section>
  }

  const items = query.data?.items || query.data || []
  return (
    <section className="content-section">
      <SectionHeading title={title} icon={icon} action={action} />
      {items.length ? (
        <ScrollRow>
          {items.map((manga, index) => <MangaCard eager={index < 4} key={manga.id} manga={manga} progress={progressByManga[manga.id]} />)}
        </ScrollRow>
      ) : <StatusPanel compact message="Nothing to show here yet." />}
    </section>
  )
}

function SectionHeading({ title, icon, action }) {
  return <div className="section-heading"><h2>{icon && <span aria-hidden="true">{icon}</span>} {title}</h2>{action}</div>
}

function CardSkeletons() {
  return <div className="manga-row" aria-label="Loading manga">{Array.from({ length: 6 }, (_, index) => <div className="manga-card skeleton-card" key={index} />)}</div>
}
