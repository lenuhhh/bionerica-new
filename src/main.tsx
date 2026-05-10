import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { I18nProvider } from '@/lib/i18n'
import './styles/app.css'

// ── Service Worker registration ────────────────────────────────────────
// In development we explicitly unregister SW to avoid stale cached bundles.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      let didRefreshAfterUpdate = false

      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(reg => {
          console.log('[SW] Registered, scope:', reg.scope)

          const activateUpdateImmediately = (worker?: ServiceWorker | null) => {
            if (!worker) return
            worker.postMessage({ type: 'SKIP_WAITING' })
          }

          if (reg.waiting) {
            activateUpdateImmediately(reg.waiting)
          }

          // Check for updates every 15 minutes
          setInterval(() => reg.update(), 15 * 60 * 1000)

          // Also check when app becomes active again
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') reg.update()
          })

          // Auto-apply new version when available
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New version found — applying automatically')
                activateUpdateImmediately(newWorker)
              }
            })
          })

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (didRefreshAfterUpdate) return
            didRefreshAfterUpdate = true
            window.location.reload()
          })
        })
        .catch(err => console.warn('[SW] Registration failed:', err))
      return
    }

    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .then(() => console.log('[SW] Unregistered in development'))
      .catch(err => console.warn('[SW] Unregister failed:', err))
  })
}

// ── Dismiss the HTML preloader after React paints ─────────────────────
// Keep it a bit longer in standalone mode so installed app launch feels like desktop.
const _preloaderStart = performance.now()
const _isStandaloneLaunch =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

function _dismissPreloader() {
  const elapsed = performance.now() - _preloaderStart
  const minDuration = _isStandaloneLaunch ? 2200 : 1900
  const wait = Math.max(0, minDuration - elapsed)
  setTimeout(() => {
    const el = document.getElementById('preloader')
    if (!el) return
    el.classList.add('out')
    setTimeout(() => el.remove(), 800)
  }, wait)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{ className: 'hot-toast', duration: 2500 }}
        />
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
)

// Fire after React's first two animation frames (ensures DOM is painted)
requestAnimationFrame(() => requestAnimationFrame(_dismissPreloader))
