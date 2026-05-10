import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ensureProfile, supabase } from '@/lib/supabase'
import { useAuth } from '@/store'
import Layout from '@/components/layout/Layout'
import Cursor from '@/components/layout/Cursor'
import { PWAInstallBanner, PWAUpdatePrompt } from '@/components/ui/PWA'
import { ChatWidget } from '@/components/ui'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// ── Route-level code splitting ─────────────────────────────────────────
const Home        = lazy(() => import('@/pages/Home'))
const Catalog     = lazy(() => import('@/pages/Catalog'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const Cart        = lazy(() => import('@/pages/Cart'))
const Checkout    = lazy(() => import('@/pages/Checkout'))
const Auth        = lazy(() => import('@/pages/Auth'))
const Account     = lazy(() => import('@/pages/Account'))
const Wishlist    = lazy(() => import('@/pages/Wishlist'))
const Story       = lazy(() => import('@/pages/Story'))
const Blog        = lazy(() => import('@/pages/Blog'))
const BlogPost    = lazy(() => import('@/pages/BlogPost'))
const Contact     = lazy(() => import('@/pages/Contact'))
const Admin       = lazy(() => import('@/pages/Admin'))
const NotFound    = lazy(() => import('@/pages/NotFound'))
const FAQ         = lazy(() => import('@/pages/FAQ'))
const Partners    = lazy(() => import('@/pages/Partners'))
const Lookbook    = lazy(() => import('@/pages/Lookbook'))
const Privacy     = lazy(() => import('@/pages/Privacy'))
const Terms       = lazy(() => import('@/pages/Terms'))
const Reviews     = lazy(() => import('@/pages/Reviews'))
const GiftCards   = lazy(() => import('@/pages/GiftCards'))
const Care        = lazy(() => import('@/pages/Care'))
const Delivery    = lazy(() => import('@/pages/Delivery'))
const Install     = lazy(() => import('@/pages/Install'))
const Sitemap        = lazy(() => import('@/pages/Sitemap'))
const OrderTracking  = lazy(() => import('@/pages/OrderTracking'))

// ── Page loading skeleton ──────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--b0)',
      // Prevents layout shift — holds space so Navbar/Footer don't jump
      contain: 'strict',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        opacity: 0.45,
        animation: 'fadeIn 0.3s ease forwards',
      }}>
        <div style={{ animation: 'spin 1.8s linear infinite' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" stroke="var(--gold)" strokeWidth="1" />
            <circle cx="20" cy="20" r="10" stroke="var(--gold)" strokeWidth="0.8" strokeDasharray="4 4" />
            <line x1="4"  y1="20" x2="36" y2="20" stroke="var(--gold)" strokeWidth="0.6" />
            <line x1="20" y1="4"  x2="20" y2="36" stroke="var(--gold)" strokeWidth="0.6" />
          </svg>
        </div>
        <span style={{
          fontSize: 9,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: 'var(--t2)',
          fontFamily: 'Jost, sans-serif',
        }}>
          Завантаження
        </span>
      </div>
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error('auth timeout')), ms)
    Promise.resolve(promise)
      .then(v => {
        window.clearTimeout(id)
        resolve(v)
      })
      .catch(err => {
        window.clearTimeout(id)
        reject(err)
      })
  })
}

export default function App() {
  const { setUser, setProfile, setLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    let mounted = true

    const loadProfile = async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      try {
        const { data } = await withTimeout(
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          8000
        )
        if (!mounted) return

        if (data) {
          setProfile(data)
          return
        }

        // Fallback: if trigger-created profile is missing, create one from auth user.
        const ensured = await ensureProfile(user)
        if (!mounted) return
        setProfile(ensured.data ?? null)
      } catch {
        if (!mounted) return
        setProfile(null)
      }
    }

    const bootstrapSession = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 10000)
        const session = data.session
        if (!mounted) return

        setUser(session?.user ?? null)
        setLoading(false)

        if (session?.user) {
          void loadProfile(session.user)
        } else {
          setProfile(null)
        }
      } catch {
        if (!mounted) return
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    void bootstrapSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        void loadProfile(session.user)
      } else {
        setProfile(null)
      }

      // Handle password reset — redirect to the reset form
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth?mode=reset')
      }

      // Do not force navigation on SIGNED_IN; keep user on current page.
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, navigate])

  return (
    <ErrorBoundary>
      <Cursor />
      <PWAInstallBanner />
      <PWAUpdatePrompt />
      {!isAdminRoute && <ChatWidget />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
            <Route path="/"             element={<S><Home /></S>} />
            <Route path="/catalog"      element={<S><Catalog /></S>} />
            <Route path="/product/:slug" element={<S><ProductPage /></S>} />
            <Route path="/cart"         element={<S><Cart /></S>} />
            <Route path="/checkout"     element={<S><Checkout /></S>} />
            <Route path="/auth"         element={<S><Auth /></S>} />
            <Route path="/account"      element={<S><Account /></S>} />
            <Route path="/account/:tab" element={<S><Account /></S>} />
            <Route path="/wishlist"     element={<S><Wishlist /></S>} />
            <Route path="/story"        element={<S><Story /></S>} />
            <Route path="/blog"         element={<S><Blog /></S>} />
            <Route path="/blog/:slug"   element={<S><BlogPost /></S>} />
            <Route path="/contact"      element={<S><Contact /></S>} />
            <Route path="/faq"          element={<S><FAQ /></S>} />
            <Route path="/partners"     element={<S><Partners /></S>} />
            <Route path="/lookbook"     element={<S><Lookbook /></S>} />
            <Route path="/privacy"      element={<S><Privacy /></S>} />
            <Route path="/terms"        element={<S><Terms /></S>} />
            <Route path="/reviews"      element={<S><Reviews /></S>} />
            <Route path="/gift-cards"   element={<S><GiftCards /></S>} />
            <Route path="/delivery"     element={<S><Delivery /></S>} />
            <Route path="/care"         element={<S><Care /></S>} />
            <Route path="/install"      element={<S><Install /></S>} />
            <Route path="/sitemap"      element={<S><Sitemap /></S>} />
            <Route path="/order"        element={<S><OrderTracking /></S>} />
            <Route path="/order/:id"    element={<S><OrderTracking /></S>} />
            <Route path="/admin"        element={<S><Admin /></S>} />
            <Route path="/admin/:tab"   element={<S><Admin /></S>} />
            <Route path="*"             element={<S><NotFound /></S>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  )
}
