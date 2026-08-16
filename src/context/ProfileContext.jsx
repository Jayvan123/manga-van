/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_PROFILE_ID } from '../utils/storage.js'

const PROFILES_KEY = 'mangavan:profiles:v1'
const ACTIVE_PROFILE_KEY = 'mangavan:active-profile:v1'
const DEFAULT_PROFILES = [{ id: DEFAULT_PROFILE_ID, name: 'Profile 1' }]

const ProfileContext = createContext(null)

function readProfiles() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILES_KEY) || 'null')
    if (Array.isArray(parsed) && parsed.length && parsed.every((p) => p?.id && p?.name)) return parsed
  } catch {
    // fall through to default
  }
  return DEFAULT_PROFILES
}

function readActiveProfileId(profiles) {
  const stored = window.localStorage.getItem(ACTIVE_PROFILE_KEY)
  return stored && profiles.some((profile) => profile.id === stored) ? stored : profiles[0].id
}

function makeProfileId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Local "who's reading" switcher — no accounts, just isolates reading progress / recently-read
 * history between people (or moods) sharing the same browser. Everything lives in localStorage.
 */
export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(readProfiles)
  const [activeProfileId, setActiveProfileId] = useState(() => readActiveProfileId(readProfiles()))

  useEffect(() => {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  }, [profiles])

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId)
  }, [activeProfileId])

  const switchProfile = useCallback((id) => setActiveProfileId(id), [])

  const addProfile = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = makeProfileId()
    setProfiles((current) => [...current, { id, name: trimmed }])
    setActiveProfileId(id)
  }, [])

  const renameProfile = useCallback((id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setProfiles((current) => current.map((profile) => (profile.id === id ? { ...profile, name: trimmed } : profile)))
  }, [])

  const removeProfile = useCallback((id) => {
    setProfiles((current) => {
      if (current.length <= 1) return current // always keep at least one profile
      const next = current.filter((profile) => profile.id !== id)
      setActiveProfileId((activeId) => (activeId === id ? next[0].id : activeId))
      return next
    })
  }, [])

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0]

  const value = useMemo(() => ({
    profiles,
    activeProfileId: activeProfile.id,
    activeProfile,
    switchProfile,
    addProfile,
    renameProfile,
    removeProfile,
  }), [activeProfile, addProfile, profiles, removeProfile, renameProfile, switchProfile])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfiles() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfiles must be used inside ProfileProvider')
  return context
}
