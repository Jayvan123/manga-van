import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { queryClient } from './api/queryClient.js'
import { ProfileProvider } from './context/ProfileContext.jsx'
import { ReadingProgressProvider } from './context/ReadingProgressContext.jsx'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProfileProvider>
          <ReadingProgressProvider>
            <App />
          </ReadingProgressProvider>
        </ProfileProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
