import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/auth/AuthContext'
import faviconIcoUrl from '../logos/favicon/favicon.ico'
import favicon32Url from '../logos/favicon/favicon-32x32.png'
import appleTouchIconUrl from '../logos/logo/apple-touch-icon.png'

function ensureHeadLink(rel: string, href: string, type?: string, sizes?: string) {
  const selector = `link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`
  let link = document.head.querySelector(selector) as HTMLLinkElement | null

  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    if (sizes) {
      link.sizes = sizes
    }
    if (type) {
      link.type = type
    }
    document.head.appendChild(link)
  }

  link.href = href
}

ensureHeadLink('icon', faviconIcoUrl, 'image/x-icon')
ensureHeadLink('icon', favicon32Url, 'image/png', '32x32')
ensureHeadLink('apple-touch-icon', appleTouchIconUrl, 'image/png', '180x180')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
