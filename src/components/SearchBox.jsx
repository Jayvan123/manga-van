import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce.js'
import { useSearchManga } from '../hooks/useMangaQueries.js'

export default function SearchBox() {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedValue = useDebounce(value.trim(), 300)
  const { data = [], isFetching } = useSearchManga(debouncedValue)
  const navigate = useNavigate()

  const submit = (query = value) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setOpen(false)
    navigate(`/browse?q=${encodeURIComponent(trimmed)}&sort=relevance`)
  }

  const handleKeyDown = (event) => {
    if (!open || !data.length) {
      if (event.key === 'Enter') submit()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % data.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? data.length - 1 : index - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex >= 0) navigate(`/manga/${data[activeIndex].id}`)
      else submit()
      setOpen(false)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="search-box" role="search">
      <span className="search-box__icon" aria-hidden="true">⌕</span>
      <input
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-expanded={open && value.length >= 2}
        aria-label="Search manga"
        autoComplete="off"
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setValue(event.target.value)
          setActiveIndex(-1)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search manga..."
        type="search"
        value={value}
      />
      {open && value.trim().length >= 2 && (
        <div className="search-suggestions" id="search-suggestions" role="listbox">
          {isFetching && <div className="search-suggestions__message">Searching…</div>}
          {!isFetching && !data.length && <div className="search-suggestions__message">No manga found</div>}
          {data.map((manga, index) => (
            <button
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'is-active' : ''}
              key={manga.id}
              onMouseDown={() => navigate(`/manga/${manga.id}`)}
              role="option"
              type="button"
            >
              <img alt="" src={manga.coverUrl} />
              <span>{manga.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

