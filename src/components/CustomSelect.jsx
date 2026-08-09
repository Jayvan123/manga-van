import { useEffect, useId, useRef, useState } from 'react'

export default function CustomSelect({ label, onChange, options, value }) {
  const id = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selectedOption = options[selectedIndex]

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    if (!open) return
    document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, id, open])

  const moveActive = (direction) => {
    let nextIndex = activeIndex
    do {
      nextIndex = (nextIndex + direction + options.length) % options.length
    } while (options[nextIndex].disabled && nextIndex !== activeIndex)
    setActiveIndex(nextIndex)
  }

  const choose = (index) => {
    if (options[index].disabled) return
    setActiveIndex(index)
    setOpen(false)
    onChange(options[index].value)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setActiveIndex(selectedIndex)
        setOpen(true)
      } else moveActive(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(options.findIndex((option) => !option.disabled))
    } else if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(options.findLastIndex((option) => !option.disabled))
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault()
      choose(activeIndex)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="filter-field custom-select" ref={rootRef}>
      <span className="filter-field__label" id={`${id}-label`}>{label}</span>
      <button
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label ${id}-value`}
        className="custom-select__trigger"
        onClick={() => {
          if (!open) setActiveIndex(selectedIndex)
          setOpen((isOpen) => !isOpen)
        }}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span id={`${id}-value`}>{selectedOption?.label}</span>
        <svg aria-hidden="true" className="custom-select__chevron" viewBox="0 0 20 20">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div aria-labelledby={`${id}-label`} className="custom-select__menu" id={`${id}-listbox`} role="listbox">
          {options.map((option, index) => (
            <button
              aria-disabled={option.disabled || undefined}
              aria-selected={option.value === value}
              className={`${index === activeIndex ? 'is-active ' : ''}${option.value === value ? 'is-selected' : ''}`}
              id={`${id}-option-${index}`}
              key={option.value}
              onClick={() => choose(index)}
              onMouseEnter={() => !option.disabled && setActiveIndex(index)}
              role="option"
              tabIndex={-1}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value && (
                <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m4.5 10 3.2 3.2 7.8-7.8" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
