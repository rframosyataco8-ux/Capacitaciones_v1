import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import App from './App'
import './index.css'

// Apply theme before paint to avoid flash
try {
  const t = localStorage.getItem('romex-theme')
  if (t === 'dark' || t === 'light') {
    document.documentElement.setAttribute('data-theme', t)
  }
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
