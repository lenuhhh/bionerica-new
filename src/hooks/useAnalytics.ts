/* ═══════════════════════════════════════════════════════════════════════
   Broiderie Analytics — GA4 + Meta Pixel + Hotjar
   Replace IDs with your actual tracking IDs
═══════════════════════════════════════════════════════════════════════ */

const GA_ID    = 'G-XXXXXXXXXX'   // Replace with real GA4 ID
const META_ID  = '000000000000'   // Replace with real Meta Pixel ID
const HJ_ID    = 0               // Replace with Hotjar ID

type EventParams = Record<string, unknown>

/* ── GA4 ─────────────────────────────────────────────────────────────── */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    hj?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function ga(event: string, params?: EventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params)
  }
}

function px(event: string, params?: EventParams) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params)
  }
}

/* ── Initialize (call once in main.tsx) ─────────────────────────────── */
export function initAnalytics() {
  if (typeof window === 'undefined') return

  // GA4
  const gaScript = document.createElement('script')
  gaScript.async = true
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(gaScript)

  window.dataLayer = window.dataLayer || []
  window.gtag = function() { window.dataLayer?.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
    currency: 'UAH',
    country: 'UA',
  })

  // Meta Pixel
  // eslint-disable-next-line
  ;(function(f: Window, b: Document, e: string, v: string, n?: Element, t?: Element, s?: Element) {
    if ((f as unknown as Record<string, unknown>).fbq) return
    const fbq = (f as unknown as Record<string, unknown>).fbq = function() {
      const carrier = fbq as unknown as { callMethod?: (...args: unknown[]) => void; queue?: unknown[] }
      if (typeof carrier.callMethod === 'function') {
        carrier.callMethod(...Array.from(arguments))
      } else {
        ;(carrier.queue || (carrier.queue = [])).push(Array.from(arguments))
      }
    }
    ;(fbq as unknown as Record<string, unknown>).push = fbq
    ;(fbq as unknown as Record<string, unknown>).loaded = !0
    ;(fbq as unknown as Record<string, unknown>).version = '2.0'
    ;(fbq as unknown as Record<string, unknown>).queue = []
    t = b.createElement(e) as Element; (t as HTMLScriptElement).async = !0
    ;(t as HTMLScriptElement).src = v
    s = b.getElementsByTagName(e)[0]
    s?.parentNode?.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  if (window.fbq) {
    window.fbq('init', META_ID)
    window.fbq('track', 'PageView')
  }
}

/* ══════════════════════════════════════════════════════════════════════
   ECOMMERCE EVENTS
═══════════════════════════════════════════════════════════════════════ */

export const analytics = {
  /* Page view */
  pageView: (path: string, title: string) => {
    ga('page_view', { page_path: path, page_title: title })
    px('PageView')
  },

  /* Product viewed */
  viewProduct: (product: { id: number; name: string; price: number; category: string }) => {
    ga('view_item', {
      currency: 'UAH',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price }],
    })
    px('ViewContent', { content_ids: [product.id], content_name: product.name, value: product.price, currency: 'UAH' })
  },

  /* Add to cart */
  addToCart: (product: { id: number; name: string; price: number; category: string }, qty = 1) => {
    ga('add_to_cart', {
      currency: 'UAH',
      value: product.price * qty,
      items: [{ item_id: product.id, item_name: product.name, quantity: qty, price: product.price }],
    })
    px('AddToCart', { content_ids: [product.id], value: product.price * qty, currency: 'UAH' })
  },

  /* Remove from cart */
  removeFromCart: (productId: number, price: number) => {
    ga('remove_from_cart', { currency: 'UAH', value: price, items: [{ item_id: productId, price }] })
  },

  /* Add to wishlist */
  addToWishlist: (product: { id: number; name: string; price: number }) => {
    ga('add_to_wishlist', {
      currency: 'UAH',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price }],
    })
    px('AddToWishlist', { content_ids: [product.id], value: product.price, currency: 'UAH' })
  },

  /* Begin checkout */
  beginCheckout: (total: number, itemCount: number) => {
    ga('begin_checkout', { currency: 'UAH', value: total, num_items: itemCount })
    px('InitiateCheckout', { value: total, currency: 'UAH', num_items: itemCount })
  },

  /* Purchase complete */
  purchase: (orderId: string, total: number, items: { id: number; name: string; price: number; qty: number }[]) => {
    ga('purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'UAH',
      items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
    })
    px('Purchase', {
      value: total,
      currency: 'UAH',
      content_ids: items.map(i => i.id),
      num_items: items.length,
      order_id: orderId,
    })
  },

  /* Search */
  search: (query: string) => {
    ga('search', { search_term: query })
    px('Search', { search_string: query })
  },

  /* Sign up */
  signUp: (method: 'email' | 'google') => {
    ga('sign_up', { method })
    px('CompleteRegistration', { method })
  },

  /* Login */
  login: (method: 'email' | 'google') => {
    ga('login', { method })
  },

  /* Promo code applied */
  promoApplied: (code: string, discount: number) => {
    ga('select_promotion', { promotion_id: code, value: discount })
  },

  /* Push notification subscribed */
  pushSubscribed: () => {
    ga('push_notification_subscribed')
    px('Subscribe')
  },

  /* Share product */
  shareProduct: (productId: number, method: string) => {
    ga('share', { method, content_type: 'product', item_id: productId })
  },

  /* View category */
  viewCategory: (category: string, itemCount: number) => {
    ga('view_item_list', { item_list_id: category, item_list_name: category, item_count: itemCount })
  },
}

/* Hook for page tracking */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    analytics.pageView(location.pathname + location.search, document.title)
  }, [location])
}
