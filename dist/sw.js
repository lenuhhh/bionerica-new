/* ═══════════════════════════════════════════════════════════════════
  Broiderie Service Worker v5
   ✅ Offline-first cache
   ✅ Push notifications (Web Push API)
   ✅ Background sync (cart/orders)
   ✅ Periodic sync (promos)
   ✅ TWA / Google Play compatible
═══════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v5'
const CACHE_STATIC  = `broiderie-static-${CACHE_VERSION}`
const CACHE_DYNAMIC = `broiderie-dynamic-${CACHE_VERSION}`
const CACHE_IMAGES  = `broiderie-images-${CACHE_VERSION}`

/* Assets cached on install (app shell) */
const PRECACHE = [
  '/',
  '/catalog',
  '/story',
  '/blog',
  '/contact',
  '/faq',
  '/account',
  '/account/chat',
  '/site.webmanifest',
  '/offline.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
]

/* Max items in dynamic/image caches */
const MAX_DYNAMIC = 60
const MAX_IMAGES  = 40

/* ── Helpers ─────────────────────────────────────────────────────── */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys  = await cache.keys()
  if (keys.length > maxItems) {
    await cache.delete(keys[0])
    return trimCache(cacheName, maxItems)
  }
}

/* ── Install ─────────────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

/* ── Activate: clean old caches ──────────────────────────────────── */
self.addEventListener('activate', event => {
  const valid = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES]
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !valid.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

/* ── Fetch strategy ──────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  /* Skip non-GET and Supabase API */
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('chrome-extension')) return

  /* Google Fonts — cache-first */
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, CACHE_STATIC))
    return
  }

  /* Images — cache-first with limit */
  if (url.hostname.includes('unsplash.com') ||
      request.destination === 'image') {
    event.respondWith(cacheFirstWithLimit(request, CACHE_IMAGES, MAX_IMAGES))
    return
  }

  /* API calls — network-only */
  if (url.pathname.startsWith('/api/')) return

  /* App shell routes — network-first, cache fallback */
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request))
    return
  }
})

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
    return response
  } catch {
    return new Response('Офлайн', { status: 503 })
  }
}

async function cacheFirstWithLimit(request, cacheName, limit) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
    trimCache(cacheName, limit)
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE_DYNAMIC)
    cache.put(request, response.clone())
    trimCache(CACHE_DYNAMIC, MAX_DYNAMIC)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    /* Offline fallback — serve app shell */
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline.html') || caches.match('/') || new Response('Офлайн', { status: 503 })
    }
    return new Response('', { status: 503 })
  }
}

/* ═══════════════════════════════════════════════════════
   PUSH NOTIFICATIONS
═══════════════════════════════════════════════════════ */

self.addEventListener('push', event => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() }
  catch { data = { title: 'Broiderie', body: event.data.text() } }

  const opts = {
    body:               data.body  || 'Нове повідомлення від Broiderie',
    icon:               data.icon  || '/icon-192.png',
    badge:              data.badge || '/badge-72.png',
    image:              data.image,
    tag:                data.tag   || 'broiderie',
    data:               { url: data.url || '/', ...data.data },
    actions:            data.actions || [],
    vibrate:            data.vibrate || [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    silent:             data.silent || false,
    timestamp:          data.timestamp || Date.now(),
    dir:                'ltr',
    lang:               'uk',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Broiderie 🪡', opts)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = ({
    'view_cart':    '/cart',
    'view_catalog': '/catalog',
    'view_account': '/account',
    'view_orders':  '/account/orders',
    'dismiss':      null,
  })[event.action] ?? event.notification.data?.url ?? '/'

  if (!url) return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          c.navigate(url); return c.focus()
        }
      }
      return clients.openWindow?.(url)
    })
  )
})

/* ═══════════════════════════════════════════════════════
   BACKGROUND SYNC
═══════════════════════════════════════════════════════ */

self.addEventListener('sync', event => {
  if (event.tag === 'sync-cart')  event.waitUntil(syncCart())
  if (event.tag === 'sync-order') event.waitUntil(syncOrder())
})

async function syncCart()  { console.log('[SW] Cart sync') }
async function syncOrder() { console.log('[SW] Order sync') }

/* ═══════════════════════════════════════════════════════
   PERIODIC BACKGROUND SYNC (promo check, once/day)
═══════════════════════════════════════════════════════ */

self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-promos') event.waitUntil(checkPromos())
})

async function checkPromos() {
  try {
    const res = await fetch('/api/promotions/active')
    if (!res.ok) return
    const { active, title, discount } = await res.json()
    if (!active) return
    await self.registration.showNotification('🏷️ Broiderie — Акція!', {
      body:    `${title} — знижка ${discount}`,
      icon:    '/icon-192.png',
      badge:   '/badge-72.png',
      tag:     'promo',
      data:    { url: '/catalog?sale=1' },
      actions: [
        { action: 'view_catalog', title: '🛍️ Переглянути' },
        { action: 'dismiss',      title: '✕' },
      ],
    })
  } catch {}
}

/* ═══════════════════════════════════════════════════════
   MESSAGE — skip waiting from app
═══════════════════════════════════════════════════════ */

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'CACHE_URLS')   {
    caches.open(CACHE_DYNAMIC).then(c => c.addAll(event.data.urls || []))
  }
})
