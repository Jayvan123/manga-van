export default function Pagination({ page, total, limit, onChange }) {
  const pageCount = Math.max(1, Math.ceil(total / limit))
  if (pageCount <= 1) return null
  const start = Math.max(1, Math.min(page - 2, pageCount - 4))
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index)

  return (
    <nav className="pagination" aria-label="Manga pages">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} type="button">← Previous</button>
      {pages.map((item) => (
        <button aria-current={item === page ? 'page' : undefined} key={item} onClick={() => onChange(item)} type="button">{item}</button>
      ))}
      <button disabled={page >= pageCount} onClick={() => onChange(page + 1)} type="button">Next →</button>
    </nav>
  )
}

