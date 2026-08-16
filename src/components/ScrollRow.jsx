import { useEffect, useRef, useState } from 'react'

/** Wraps a horizontally-scrolling row with prev/next buttons instead of a visible scrollbar. */
export default function ScrollRow({ children, className = '', rowClassName = 'manga-row' }) {
  const rowRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  const updateScrollState = () => {
    const row = rowRef.current
    if (!row) return
    setCanScrollLeft(row.scrollLeft > 4)
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 4)
    setHasOverflow(row.scrollWidth > row.clientWidth + 4)
  }

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    updateScrollState()
    row.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(row)
    window.addEventListener('resize', updateScrollState)
    return () => {
      row.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [children])

  const scrollBy = (direction) => {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: direction * row.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <div className={`scroll-row ${className}`.trim()}>
      <div className={rowClassName} ref={rowRef}>{children}</div>
      {hasOverflow && (
        <div className="scroll-row__controls">
          <button
            aria-label="Scroll left"
            className="scroll-row__btn scroll-row__btn--prev"
            disabled={!canScrollLeft}
            onClick={() => scrollBy(-1)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 4-6 6 6 6" /></svg>
          </button>
          <button
            aria-label="Scroll right"
            className="scroll-row__btn scroll-row__btn--next"
            disabled={!canScrollRight}
            onClick={() => scrollBy(1)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4 6 6-6 6" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
