import CustomSelect from './CustomSelect.jsx'

export default function BrowseFilters({ contentType, query, sort, selectedTags, tags, onChange }) {
  const contentTypeOptions = [
    { label: 'Manga & manhwa', value: 'all' },
    { label: 'Manga (Japan)', value: 'manga' },
    { label: 'Manhwa (Korea)', value: 'manhwa' },
  ]
  const genreOptions = [
    { label: 'All genres', value: '' },
    ...tags.map((tag) => ({ label: tag.name, value: tag.id })),
  ]
  const sortOptions = [
    { disabled: !query.trim(), label: 'Relevance', value: 'relevance' },
    { label: 'Popularity', value: 'popularity' },
    { label: 'Latest upload', value: 'latest' },
  ]

  return (
    <div className="browse-filters">
      <label className="filter-field">
        <span className="filter-field__label">Title</span>
        <input onChange={(event) => onChange({ query: event.target.value })} placeholder="Search by title" type="search" value={query} />
      </label>
      <CustomSelect label="Type" onChange={(nextValue) => onChange({ contentType: nextValue })} options={contentTypeOptions} value={contentType} />
      <CustomSelect
        label="Genre"
        onChange={(nextValue) => onChange({ selectedTags: nextValue ? [nextValue] : [] })}
        options={genreOptions}
        value={selectedTags[0] || ''}
      />
      <CustomSelect label="Sort by" onChange={(nextValue) => onChange({ sort: nextValue })} options={sortOptions} value={sort} />
    </div>
  )
}
