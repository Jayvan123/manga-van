import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [pathname])

  return (
    <div className="app-shell">
      <Header />
      <main><Outlet /></main>
      <Footer />
    </div>
  )
}
