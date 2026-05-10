/* ═══════════════════════════════════════════════════════════════
   Analytics — GA4 + Meta Pixel + custom events
   All events follow standard ecommerce schema
═══════════════════════════════════════════════════════════════ */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

/* ── Config ── Replace with real IDs ─────────────────────────── */
const GA4_ID    = import.meta.env.VITE_GA4_ID    || 'G-XXXXXXXXXX'
const META_PIXEL = import.meta.env.VITE_META_PIXEL || 'XXXXXXXXXXXXXXX'

/* ── Init GA4 ────────────────────────────────────────────────── */
export function initAnalytics() {
  if (typeof window === 'undefined') return

  // GA4
  if (GA4_ID && !GA4_ID.includes('X')) {
    const s = document.createElement('script')
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
    s.async = true
    document.head.appendChild(s)

    window.dataLayer = window.dataLayer || []
    window.gtag = function() { window.dataLayer?.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', GA4_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true,
    })
  }

  // Meta Pixel
  if (META_PIXEL && !META_PIXEL.includes('X')) {
    ;(function(f: Window, b, e, v: string) {
      const n = (f as any).fbq
      if (n) return
      const fbq: any = (f as any).fbq = function() {
        fbq.callMethod ? fbq.callMethod(...arguments) : fbq.queue.push(arguments)
      }
      if (!(f as any)._fbq) (f as any)._fbq = fbq
      fbq.push = fbq
      fbq.loaded = !0
      fbq.version = '2.0'
      fbq.queue = []
      const t = b.createElement(e as 'script')
      t.async = !0
      t.src = v
      const s = b.getElementsByTagName(e)[0]
      s.parentNode?.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    window.fbq?.('init', META_PIXEL)
    window.fbq?.('track', 'PageView')
  }
}

/* ── Track page view ─────────────────────────────────────────── */
export function trackPageView(path: string, title: string) {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path:     path,
      page_title:    title,
      page_location: window.location.href,
    })
  }
  if (window.fbq) window.fbq('track', 'PageView')
}

/* ── Ecommerce events ────────────────────────────────────────── */
export function trackViewItem(product: {
  id: number; name: string; price: number; category: string
}) {
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'UAH',
      value: product.price,
      items: [{
        item_id:       String(product.id),
        item_name:     product.name,
        item_category: product.category,
        price:         product.price,
        quantity:      1,
      }],
    })
  }
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids:  [String(product.id)],
      content_name: product.name,
      value:        product.price,
      currency:     'UAH',
    })
  }
}

export function trackAddToCart(product: {
  id: number; name: string; price: number; category: string
}, qty = 1) {
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'UAH',
      value: product.price * qty,
      items: [{
        item_id:       String(product.id),
        item_name:     product.name,
        item_category: product.category,
        price:         product.price,
        quantity:      qty,
      }],
    })
  }
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [String(product.id)],
      value:       product.price * qty,
      currency:    'UAH',
    })
  }
}

export function trackAddToWishlist(productId: number, name: string, price: number) {
  if (window.gtag) {
    window.gtag('event', 'add_to_wishlist', {
      currency: 'UAH',
      value: price,
      items: [{ item_id: String(productId), item_name: name, price }],
    })
  }
  if (window.fbq) window.fbq('track', 'AddToWishlist', { content_ids: [String(productId)], value: price, currency: 'UAH' })
}

export function trackBeginCheckout(total: number, itemCount: number) {
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'UAH',
      value: total,
      num_items: itemCount,
    })
  }
  if (window.fbq) window.fbq('track', 'InitiateCheckout', { value: total, currency: 'UAH', num_items: itemCount })
}

export function trackPurchase(orderId: string, total: number, items: { id: number; name: string; price: number; qty: number }[]) {
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value:          total,
      currency:       'UAH',
      items: items.map(i => ({
        item_id:   String(i.id),
        item_name: i.name,
        price:     i.price,
        quantity:  i.qty,
      })),
    })
  }
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value:       total,
      currency:    'UAH',
      content_ids: items.map(i => String(i.id)),
      num_items:   items.reduce((s, i) => s + i.qty, 0),
    })
  }
}

export function trackSearch(query: string, resultsCount: number) {
  if (window.gtag) window.gtag('event', 'search', { search_term: query, result_count: resultsCount })
  if (window.fbq) window.fbq('track', 'Search', { search_string: query })
}

export function trackSignUp(method: 'email' | 'google') {
  if (window.gtag) window.gtag('event', 'sign_up', { method })
  if (window.fbq) window.fbq('track', 'CompleteRegistration', { method })
}

export function trackShare(method: string, contentType: string, itemId: string) {
  if (window.gtag) window.gtag('event', 'share', { method, content_type: contentType, item_id: itemId })
}

/* ── Custom events ───────────────────────────────────────────── */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (window.gtag) window.gtag('event', name, params)
}
