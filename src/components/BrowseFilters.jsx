export default function BrowseFilters({ query, sort, selectedTags, tags, onChange }) {
  return (
    <div className="browse-filters">
      <label>
        <span>Title</span>
        <input onChange={(event) => onChange({ query: event.target.value })} placeholder="Search by title" type="search" value={query} />
      </label>
      <label>
        <span>Genre</span>
        <select
          onChange={(event) => onChange({ selectedTags: event.target.value ? [event.target.value] : [] })}
          value={selectedTags[0] || ''}
        >
          <option value="">All genres</option>
          {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select>
      </label>
      <label>
        <span>Sort by</span>
        <select onChange={(event) => onChange({ sort: event.target.value })} value={sort}>
          <option disabled={!query.trim()} value="relevance">Relevance</option>
          <option value="popularity">Popularity</option>
          <option value="latest">Latest upload</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </label>
    </div>
  )
}

