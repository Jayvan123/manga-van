import { useEffect, useRef, useState } from 'react'
import { useProfiles } from '../context/ProfileContext.jsx'

/** Local "who's reading" switcher — isolates recently-read / reading progress per profile on this browser. */
export default function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile, addProfile, removeProfile } = useProfiles()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setAdding(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      setAdding(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const submitNewProfile = (event) => {
    event.preventDefault()
    addProfile(name)
    setName('')
    setAdding(false)
    setOpen(false)
  }

  return (
    <div className="profile-switcher" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="profile-switcher__trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3.2" /><path d="M3.5 17c.7-3.4 3.6-5.3 6.5-5.3s5.8 1.9 6.5 5.3" /></svg>
        <span>{activeProfile.name}</span>
        <svg aria-hidden="true" className="profile-switcher__chevron" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      {open && (
        <div className="profile-switcher__panel" role="menu">
          <ul className="profile-switcher__list">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <button
                  aria-current={profile.id === activeProfile.id ? 'true' : undefined}
                  className={profile.id === activeProfile.id ? 'is-active' : ''}
                  onClick={() => { switchProfile(profile.id); setOpen(false) }}
                  role="menuitemradio"
                  aria-checked={profile.id === activeProfile.id}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3.2" /><path d="M3.5 17c.7-3.4 3.6-5.3 6.5-5.3s5.8 1.9 6.5 5.3" /></svg>
                  <span>{profile.name}</span>
                  {profile.id === activeProfile.id && <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m4.5 10 3.2 3.2 7.8-7.8" /></svg>}
                </button>
                {profiles.length > 1 && profile.id !== activeProfile.id && (
                  <button
                    aria-label={`Remove ${profile.name}`}
                    className="profile-switcher__remove"
                    onClick={() => removeProfile(profile.id)}
                    type="button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5 5 15" /></svg>
                  </button>
                )}
              </li>
            ))}
          </ul>

          {adding ? (
            <form className="profile-switcher__add-form" onSubmit={submitNewProfile}>
              <input
                maxLength={24}
                onChange={(event) => setName(event.target.value)}
                placeholder="Profile name"
                ref={inputRef}
                value={name}
              />
              <button aria-label="Create profile" disabled={!name.trim()} type="submit">Add</button>
            </form>
          ) : (
            <button className="profile-switcher__add" onClick={() => setAdding(true)} type="button">
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 4.5v11M4.5 10h11" /></svg>
              Add profile
            </button>
          )}
        </div>
      )}
    </div>
  )
}
