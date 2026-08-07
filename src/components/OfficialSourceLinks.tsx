import type { AniListExternalLink } from '../api/aniListApi.js'

const PRIORITY_SITES = [
  'manga plus', 'viz', 'shonen jump', 'kodansha', 'k manga', 'comikey', 'azuki',
  'omoi', 'globalcomix', 'webtoon', 'tapas', 'tappytoon', 'lezhin', 'bookwalker',
]

function isReadingSource(link: AniListExternalLink) {
  const site = link.site.toLowerCase()
  return link.type === 'STREAMING' || PRIORITY_SITES.some((provider) => site.includes(provider))
}

export default function OfficialSourceLinks({ links }: { links: AniListExternalLink[] }) {
  const sources = links.filter(isReadingSource)
  if (!sources.length) return null

  return (
    <section className="official-sources" aria-labelledby="official-sources-title">
      <div><p className="eyebrow">Publisher and licensed platforms</p><h2 id="official-sources-title">Official reading sources</h2><p>Access, subscriptions, and regional availability are managed by each provider.</p></div>
      <div className="official-sources__links">
        {sources.map((source) => <a href={source.url} key={`${source.site}-${source.url}`} rel="noreferrer" target="_blank">{source.site}{source.language ? ` · ${source.language.toUpperCase()}` : ''} ↗</a>)}
      </div>
    </section>
  )
}
