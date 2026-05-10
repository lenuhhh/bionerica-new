import { useState, useEffect, useCallback } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { recordPwaMetric } from '@/lib/pwaMetrics'
import { useAuth } from '@/store'

/* ── VAPID public key from .env (fallback for testing) ── */
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBuyAjqh2bNFMUqwU'

/* ── Utility: convert VAPID key ── */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

/* ── Notification type presets ─────────────────────────────────────── */
export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  url?: string
  tag?: string
  requireInteraction?: boolean
  actions?: { action: string; title: string }[]
  vibrate?: number[]
  data?: Record<string, unknown>
}

export type PushHistoryEntry = {
  id: string
  title: string
  body: string
  url: string
  createdAt: number
}

export type NotifCategory =
  | 'orders'      // order status updates
  | 'promo'       // promotions & sales
  | 'wishlist'    // price drops on wishlisted items
  | 'restock'     // back in stock alerts
  | 'new_arrival' // new collection arrivals
  | 'all'

/* ── Store ─────────────────────────────────────────────────────────── */
interface PushStore {
  permission: NotificationPermission | 'unsupported'
  subscription: PushSubscription | null
  categories: Record<NotifCategory, boolean>
  history: PushHistoryEntry[]
  quietHoursEnabled: boolean
  quietStartHour: number
  quietEndHour: number
  maxPerDay: number
  dailyCounterDate: string
  dailyCounterValue: number
  setPermission: (p: NotificationPermission | 'unsupported') => void
  setSubscription: (s: PushSubscription | null) => void
  toggleCategory: (cat: NotifCategory, val: boolean) => void
  setQuietHoursEnabled: (enabled: boolean) => void
  setQuietHoursRange: (startHour: number, endHour: number) => void
  setMaxPerDay: (max: number) => void
  addHistory: (entry: PushHistoryEntry) => void
  bumpDailyCounter: () => void
}

export const usePushStore = create<PushStore>()(
  persist(
    (set) => ({
      permission: 'default',
      subscription: null,
      categories: {
        orders:      true,
        promo:       true,
        wishlist:    true,
        restock:     true,
        new_arrival: false,
        all:         false,
      },
      history: [],
      quietHoursEnabled: false,
      quietStartHour: 22,
      quietEndHour: 8,
      maxPerDay: 8,
      dailyCounterDate: '',
      dailyCounterValue: 0,
      setPermission:   (permission)   => set({ permission }),
      setSubscription: (subscription) => set({ subscription }),
      toggleCategory:  (cat, val)     => set(s => ({
        categories: { ...s.categories, [cat]: val },
      })),
      setQuietHoursEnabled: enabled => set({ quietHoursEnabled: enabled }),
      setQuietHoursRange: (startHour, endHour) => set({ quietStartHour: startHour, quietEndHour: endHour }),
      setMaxPerDay: (maxPerDay) => set({ maxPerDay: Math.max(1, Math.min(50, maxPerDay)) }),
      addHistory: (entry) => set(state => ({ history: [entry, ...state.history].slice(0, 50) })),
      bumpDailyCounter: () => set(state => {
        const today = new Date().toISOString().slice(0, 10)
        if (state.dailyCounterDate !== today) {
          return { dailyCounterDate: today, dailyCounterValue: 1 }
        }
        return { dailyCounterValue: state.dailyCounterValue + 1 }
      }),
    }),
    { name: 'bionerica-push' }
  )
)

/* ── Main hook ──────────────────────────────────────────────────────── */
export function usePushNotifications() {
  const {
    permission,
    subscription,
    categories,
    history,
    quietHoursEnabled,
    quietStartHour,
    quietEndHour,
    maxPerDay,
    dailyCounterDate,
    dailyCounterValue,
    setPermission,
    setSubscription,
    toggleCategory,
    setQuietHoursEnabled,
    setQuietHoursRange,
    setMaxPerDay,
    addHistory,
    bumpDailyCounter,
  } = usePushStore()
  const [loading, setLoading]   = useState(false)
  const [swReady, setSwReady]   = useState(false)

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window

  /* Register SW on mount */
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as NotificationPermission)

    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        setSwReady(true)
        return reg.pushManager.getSubscription()
      })
      .then(sub => { if (sub) setSubscription(sub) })
      .catch(() => {})
  }, [isSupported])

  /* Subscribe to push */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !swReady) return false
    setLoading(true)

    try {
      const { user } = useAuth.getState()
      
      const perm = await Notification.requestPermission()
      setPermission(perm as NotificationPermission)
      if (perm === 'granted') recordPwaMetric('push_permission_granted')
      if (perm === 'denied') recordPwaMetric('push_permission_denied')
      if (perm !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      })

      setSubscription(sub)

      // Send subscription to server (only if user is logged in)
      if (user?.id) {
        await fetch('/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ 
            subscription: sub, 
            userId: user.id,
            categories 
          }),
        }).catch(() => {}) // Fail silently — subscription still saved locally
      }

      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, swReady, categories])

  /* Unsubscribe */
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) return
    setLoading(true)
    try {
      await subscription.unsubscribe()
      await fetch('/api/push/unsubscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {})
      setSubscription(null)
    } catch {} finally {
      setLoading(false)
    }
  }, [subscription])

  const isInQuietHours = useCallback(() => {
    if (!quietHoursEnabled) return false
    const now = new Date().getHours()
    if (quietStartHour === quietEndHour) return true
    if (quietStartHour < quietEndHour) {
      return now >= quietStartHour && now < quietEndHour
    }
    return now >= quietStartHour || now < quietEndHour
  }, [quietHoursEnabled, quietStartHour, quietEndHour])

  const isDailyLimited = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (dailyCounterDate !== today) return false
    return dailyCounterValue >= maxPerDay
  }, [dailyCounterDate, dailyCounterValue, maxPerDay])

  const canSendByCategory = useCallback((category?: NotifCategory) => {
    if (!category || category === 'all') return true
    return categories[category]
  }, [categories])

  /* Show local notification (for testing / immediate feedback) */
  const showLocal = useCallback(async (payload: PushPayload, category?: NotifCategory): Promise<void> => {
    if (permission !== 'granted') return
    if (!canSendByCategory(category)) return
    if (isInQuietHours()) return
    if (isDailyLimited()) return

    const reg = await navigator.serviceWorker.ready
    const options: NotificationOptions = {
      body:               payload.body,
      icon:               payload.icon  || '/icon-192.png',
      badge:              payload.badge || '/badge-72.png',
      tag:                payload.tag || 'broiderie',
      data:               { url: payload.url || '/', ...payload.data },
      requireInteraction: payload.requireInteraction || false,
    }
    await reg.showNotification(payload.title, options)

    bumpDailyCounter()
    addHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      createdAt: Date.now(),
    })
    recordPwaMetric('push_notification_shown')
  }, [permission, canSendByCategory, isInQuietHours, isDailyLimited, bumpDailyCounter, addHistory])

  /* Pre-built notification senders */
  const notify = {
    orderConfirmed: (orderId: string) => showLocal({
      title: '✅ Замовлення підтверджено!',
      body:  `Замовлення ${orderId} прийнято. Ми вже починаємо вишивати! 🪡`,
      url:   '/account/orders',
      tag:   'order-confirmed',
      actions: [
        { action: 'view_account', title: '📦 Мої замовлення' },
        { action: 'dismiss',      title: '✕' },
      ],
    }, 'orders'),

    orderShipped: (orderId: string, tracking?: string) => showLocal({
      title: '🚚 Замовлення у дорозі!',
      body:  `Замовлення ${orderId} відправлено${tracking ? `. Трек: ${tracking}` : ''}.`,
      url:   '/account/orders',
      tag:   'order-shipped',
      requireInteraction: true,
      actions: [
        { action: 'view_account', title: '📍 Відстежити' },
        { action: 'dismiss',      title: '✕' },
      ],
    }, 'orders'),

    priceDropped: (productName: string, newPrice: number) => showLocal({
      title: '🏷️ Знижка на ваш улюблений виріб!',
      body:  `«${productName}» — тепер лише ${newPrice.toLocaleString('uk-UA')} ₴`,
      url:   '/wishlist',
      tag:   'price-drop',
      actions: [
        { action: 'view_catalog', title: '🛍️ Купити зараз' },
        { action: 'dismiss',      title: '✕' },
      ],
    }, 'wishlist'),

    newCollection: (name: string) => showLocal({
      title: '✨ Нова колекція в Broiderie!',
      body:  `«${name}» — тільки-но з'явилась у каталозі`,
      url:   '/catalog?sort=newest',
      tag:   'new-collection',
      actions: [
        { action: 'view_catalog', title: '👗 Переглянути' },
        { action: 'dismiss',      title: '✕' },
      ],
    }, 'new_arrival'),

    cartReminder: () => showLocal({
      title: '🧵 Ваш кошик чекає!',
      body:  'У вашому кошику є вироби, які ще шукають господаря.',
      url:   '/cart',
      tag:   'cart-reminder',
      requireInteraction: true,
      actions: [
        { action: 'view_cart',    title: '🛒 До кошика' },
        { action: 'dismiss',      title: '✕ Потім' },
      ],
    }, 'restock'),

    promoCode: (code: string, discount: string) => showLocal({
      title: '🎁 Подарунок від Broiderie!',
      body:  `Промокод ${code} — ${discount} на наступне замовлення. Діє 48 годин!`,
      url:   '/catalog',
      tag:   'promo',
      requireInteraction: true,
      actions: [
        { action: 'view_catalog', title: '🛍️ Використати' },
        { action: 'dismiss',      title: '✕' },
      ],
    }, 'promo'),

    chatMessage: (senderName?: string) => showLocal({
      title: '💬 Нове повідомлення від менеджера',
      body:  `${senderName || 'Менеджер Bionerica'} надіслав відповідь у чаті`,
      url:   '/account',
      tag:   'chat-message',
      requireInteraction: true,
      actions: [
        { action: 'view_account', title: '💬 Відкрити чат' },
        { action: 'dismiss',      title: '✕' },
      ],
    }, 'orders'),
  }

  return {
    isSupported,
    permission,
    subscription,
    categories,
    history,
    quietHoursEnabled,
    quietStartHour,
    quietEndHour,
    maxPerDay,
    loading,
    swReady,
    isSubscribed: !!subscription && permission === 'granted',
    subscribe,
    unsubscribe,
    toggleCategory,
    setQuietHoursEnabled,
    setQuietHoursRange,
    setMaxPerDay,
    showLocal,
    notify,
  }
}
