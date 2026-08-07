import { Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Layout from './components/Layout.jsx'
import BrowsePage from './pages/BrowsePage.tsx'
import HomePage from './pages/HomePage.tsx'
import MangaDetailsPage from './pages/MangaDetailsPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ReaderPage from './pages/ReaderPage.tsx'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<HomePage />} index />
          <Route element={<BrowsePage />} path="browse" />
          <Route element={<MangaDetailsPage />} path="manga/:mangaId" />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
        <Route element={<ReaderPage />} path="read/:mangaId/:chapterId" />
      </Routes>
    </ErrorBoundary>
  )
}
