import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { CartItem, Product, UserProfile, Theme } from '@/types'

/* ════════════════════════════════
   CART
════════════════════════════════ */
interface CartStore {
  items: CartItem[]
  isOpen: boolean
  add: (product: Product, qty?: number, opts?: { weight_option?: string }) => void
  remove: (productId: number) => void
  setQty: (productId: number, qty: number) => void
  clear: () => void
  toggle: () => void
  open: () => void
  close: () => void
  total: () => number
  count: () => number
  subtotal: () => number
  savings: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      add: (product, qty = 1, opts) =>
        set(s => {
          const idx = s.items.findIndex(
            i => i.product.id === product.id && i.weight_option === opts?.weight_option
          )
          if (idx >= 0) {
            const items = [...s.items]
            items[idx] = { ...items[idx], qty: items[idx].qty + qty }
            return { items }
          }
          return { items: [...s.items, { product, qty, weight_option: opts?.weight_option }] }
        }),

      remove: (id) => set(s => ({ items: s.items.filter(i => i.product.id !== id) })),

      setQty: (id, qty) => {
        if (qty < 1) return get().remove(id)
        set(s => ({ items: s.items.map(i => i.product.id === id ? { ...i, qty } : i) }))
      },

      clear: () => set({ items: [] }),
      toggle: () => set(s => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      total: () => get().items.reduce((s, i) => s + i.product.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + (i.product.old_price || i.product.price) * i.qty, 0),
      savings: () => {
        const sub = get().subtotal()
        const tot = get().total()
        return sub - tot
      },
    }),
    { name: 'bionerica_cart_v1' }
  )
)

/* ════════════════════════════════
   AUTH
════════════════════════════════ */
interface AuthStore {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  setUser: (u: User | null) => void
  setProfile: (p: UserProfile | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useAuth = create<AuthStore>()((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, profile: null }),
}))

/* ════════════════════════════════
   WISHLIST
════════════════════════════════ */
interface WishlistStore {
  ids: Set<number>
  toggle: (id: number) => void
  has: (id: number) => boolean
  count: () => number
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: new Set<number>(),
      toggle: (id) =>
        set(s => {
          const ids = new Set(s.ids)
          ids.has(id) ? ids.delete(id) : ids.add(id)
          return { ids }
        }),
      has: (id) => get().ids.has(id),
      count: () => get().ids.size,
    }),
    {
      name: 'broiderie_wish_v3',
      // Zustand persist can't serialize Set — convert
      storage: {
        getItem: (k) => {
          const v = localStorage.getItem(k)
          if (!v) return null
          const parsed = JSON.parse(v)
          parsed.state.ids = new Set(parsed.state.ids)
          return parsed
        },
        setItem: (k, v) => {
          const payload = v as unknown as { state: { ids: Set<number> | number[] } }
          const serializable = {
            ...(v as Record<string, unknown>),
            state: {
              ...(payload.state as Record<string, unknown>),
              ids: Array.from(payload.state.ids as Set<number>),
            },
          }
          localStorage.setItem(k, JSON.stringify(serializable))
        },
        removeItem: (k) => localStorage.removeItem(k),
      },
    }
  )
)

/* ════════════════════════════════
   THEME
════════════════════════════════ */
function resolveTheme(_t: Theme): 'light' | 'dark' {
  return 'light'
}
function applyTheme(_r: 'light' | 'dark') {
  const h = document.documentElement
  h.classList.remove('dark')
}

interface ThemeStore {
  theme: Theme
  resolved: 'light' | 'dark'
  set: (t: Theme) => void
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      resolved: resolveTheme('system'),
      set: (theme) => {
        const resolved = resolveTheme(theme)
        applyTheme(resolved)
        set({ theme, resolved })
      },
    }),
    {
      name: 'broiderie-theme',
      onRehydrateStorage: () => (s) => {
        if (!s) return
        const r = resolveTheme(s.theme)
        applyTheme(r); s.resolved = r
      },
    }
  )
)



/* ════════════════════════════════
   UI (search, filters)
════════════════════════════════ */
interface UiStore {
  searchOpen: boolean
  searchQuery: string
  toggleSearch: () => void
  setSearch: (q: string) => void
}

export const useUi = create<UiStore>()((set) => ({
  searchOpen: false,
  searchQuery: '',
  toggleSearch: () => set(s => ({ searchOpen: !s.searchOpen })),
  setSearch: (searchQuery) => set({ searchQuery }),
}))
