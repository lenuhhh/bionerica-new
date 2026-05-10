import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Star, Camera, Check, ThumbsUp, Filter, ChevronDown } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { FieldErrors, useForm } from 'react-hook-form'
import { useSEO } from '@/hooks/useSEO'
import LazyImage from '@/components/ui/LazyImage'
import { products } from '@/data'
import { useReviews } from '@/hooks/useReviews'
import { useAuth } from '@/store'
import { supabase } from '@/lib/supabase'
import type { Review } from '@/types'
import toast from 'react-hot-toast'

type SortOption = 'newest' | 'highest' | 'lowest' | 'helpful'
type FilterOption = 'all' | '5' | '4' | '3' | 'photo'

type ReviewForm = {
  name: string; email: string; rating: number
  title: string; text: string; product_id: string
}

type AspectKey = 'quality' | 'delivery' | 'service' | 'expectation'

const aspectLabels: Record<AspectKey, string> = {
  quality: 'Якість товару',
  delivery: 'Доставка',
  service: 'Обслуговування',
  expectation: 'Відповідність очікуванням',
}

const issueOptions = [
  'Сподобалась якість',
  'Не підійшов розмір',
  'Колір відрізняється від фото',
  'Довга доставка',
  'Зручне обслуговування',
  'Проблема з пакуванням',
  'Ціна відповідає якості',
  'Хотілося більше фото/опису',
]

function extractErrorMessage(err: unknown) {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [e.message, e.details, e.hint].filter(Boolean)
    if (parts.length) return parts.join(' | ')
    if (e.code) return `Помилка бази даних (${e.code})`
  }
  return 'Невідома помилка публікації'
}

function isProfileForeignKeyError(err: unknown) {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string; details?: string }
  const text = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase()
  return e.code === '23503' && text.includes('user_id') && text.includes('profiles')
}

function isProductFKError(err: unknown) {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string; details?: string }
  const text = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase()
  // insertReviewViaRest throws plain Error with message like "...| 23503", check both code and message string
  return (e.code === '23503' || text.includes('23503')) &&
    (text.includes('product_id') || text.includes('products') || text.includes('reviews_product_id'))
}

function isRlsInsertError(err: unknown) {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  return e.code === '42501' || /row-level security policy/i.test(e.message ?? '')
}

async function insertReviewViaRest(
  review: Record<string, unknown>,
  accessToken: string,
  signal: AbortSignal
) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!baseUrl || !anonKey) {
    throw new Error('Supabase env не налаштовано')
  }

  const res = await fetch(`${baseUrl}/rest/v1/reviews`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify([review]),
    signal,
  })

  const raw = await res.text()
  let parsed: unknown = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }

  if (!res.ok) {
    if (parsed && typeof parsed === 'object') {
      const p = parsed as { message?: string; details?: string; hint?: string; code?: string }
      throw new Error([p.message, p.details, p.hint, p.code].filter(Boolean).join(' | ') || `HTTP ${res.status}`)
    }
    throw new Error(raw || `HTTP ${res.status}`)
  }

  if (Array.isArray(parsed) && parsed[0]) return parsed[0] as Review
  return null
}

export default function Reviews() {
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { reviews: dbReviews, loading: dbLoading, error: dbError } = useReviews(200)
  const [sort, setSort] = useState<SortOption>('newest')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sortOpen, setSortOpen] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submittedReviews, setSubmittedReviews] = useState<Review[]>([])
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const [aspectRatings, setAspectRatings] = useState<Record<AspectKey, number>>({
    quality: 0,
    delivery: 0,
    service: 0,
    expectation: 0,
  })
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const ratingRef = useRef<HTMLDivElement>(null)
  const { register, handleSubmit, reset, setValue, watch, setFocus, formState: { errors } } = useForm<ReviewForm>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const watchedName = watch('name') || ''
  const watchedEmail = watch('email') || ''
  const watchedProduct = watch('product_id') || ''
  const watchedTitle = watch('title') || ''
  const watchedText = watch('text') || ''

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(item => item !== issue) : [...prev, issue]
    )
  }

  const makeReviewTitle = (rating: number, title: string, issues: string[]) => {
    if (title.trim()) return title.trim()
    if (issues.length > 0) return issues[0]
    if (rating >= 5) return 'Дуже задоволена покупкою'
    if (rating >= 4) return 'Хороший товар'
    if (rating >= 3) return 'Нормальний досвід'
    return 'Є що покращити'
  }

  useSEO({
    title: 'Відгуки клієнтів — Broiderie',
    description: 'Реальні відгуки покупців про вишивку Broiderie. 4.9★ із 5 на основі 347 відгуків.',
    url: '/reviews',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Broiderie — Вишивка ручної роботи',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '347',
        bestRating: '5',
      },
    },
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const displayedReviews = [...submittedReviews, ...dbReviews]

  const sortedFiltered = [...displayedReviews]
    .filter(r => {
      if (filter === 'photo') return r.images && r.images.length > 0
      if (filter !== 'all') return r.rating === Number(filter)
      return true
    })
    .sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating
      if (sort === 'lowest')  return a.rating - b.rating
      if (sort === 'helpful') return b.helpful - a.helpful
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const avgRating = displayedReviews.length
    ? (displayedReviews.reduce((s, r) => s + r.rating, 0) / displayedReviews.length).toFixed(1)
    : '0.0'
  const ratingDist = [5,4,3,2,1].map(star => ({
    star,
    count: displayedReviews.filter(r => r.rating === star).length,
    pct: displayedReviews.length
      ? Math.round(displayedReviews.filter(r => r.rating === star).length / displayedReviews.length * 100)
      : 0,
  }))

  const onSubmitReview = async (d: ReviewForm) => {
    setSubmitAttempted(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    if (!selectedStar) {
      toast.error('Оберіть оцінку', { className: 'hot-toast' })
      setSubmitStatus('error')
      setSubmitMessage('Не все готово для публікації')
      return
    }
    if (!d.product_id) {
      toast.error('Оберіть товар для відгуку', { className: 'hot-toast' })
      setSubmitStatus('error')
      setSubmitMessage('Оберіть товар для відгуку')
      return
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const sessionUser = sessionData.session?.user
    const accessToken = sessionData.session?.access_token
    if (!sessionUser) {
      toast.error('Увійдіть в акаунт, щоб опублікувати відгук', { className: 'hot-toast' })
      setSubmitStatus('error')
      setSubmitMessage('Потрібна активна сесія. Увійдіть в акаунт ще раз.')
      return
    }
    if (!accessToken) {
      toast.error('Сесія недійсна. Увійдіть повторно.', { className: 'hot-toast' })
      setSubmitStatus('error')
      setSubmitMessage('Сесія недійсна. Увійдіть повторно.')
      return
    }

    setSubmitting(true)
    setSubmitStatus('submitting')
    setSubmitMessage('Публікуємо відгук...')
    const aspectSummary = Object.entries(aspectRatings)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `- ${aspectLabels[key as AspectKey]}: ${value}/5`)

    const issuesSummary = selectedIssues.length > 0
      ? `Що відмітив клієнт: ${selectedIssues.join(', ')}.`
      : ''

    const composedText = [
      d.text.trim(),
      aspectSummary.length > 0 ? `\n\nОцінка по пунктах:\n${aspectSummary.join('\n')}` : '',
      issuesSummary ? `\n${issuesSummary}` : '',
    ].filter(Boolean).join('')

    const payload: Record<string, unknown> = {
      product_id: Number(d.product_id),
      user_id: sessionUser.id,
      author: d.name?.trim() || profile?.full_name || sessionUser.email?.split('@')[0] || 'Клієнт',
      rating: selectedStar,
      title: makeReviewTitle(selectedStar, d.title || '', selectedIssues),
      text: composedText,
      approved: false,
      verified_purchase: false,
      images: [],
      helpful: 0,
    }

    const controller = new AbortController()
    const timeoutMs = 15000
    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        controller.abort()
        reject(new Error('Сервер не відповідає. Спробуйте ще раз.'))
      }, timeoutMs)
    })

    try {
      let saved = await Promise.race([
        insertReviewViaRest(payload, accessToken, controller.signal),
        timeoutPromise,
      ])

      if (!saved) {
        // Some legacy auth rows may miss `profiles` record, causing FK failure on user_id.
        // Retry without user_id so authenticated user can still publish.
        const fallbackPayload = { ...payload }
        delete (fallbackPayload as { user_id?: string }).user_id
        saved = await Promise.race([
          insertReviewViaRest(fallbackPayload, accessToken, controller.signal),
          timeoutPromise,
        ])
      }

      if (saved) {
        setSubmittedReviews(prev => [saved as Review, ...prev])
      }

      setSubmitStatus('success')
      setSubmitMessage('Відгук надіслано на модерацію')
      toast.success('Відгук на модерації', { className: 'hot-toast', duration: 3000 })
      reset({ product_id: d.product_id, email: d.email, name: d.name, title: '', text: '' })
      setSubmitAttempted(false)
      setSelectedStar(0)
      setAspectRatings({ quality: 0, delivery: 0, service: 0, expectation: 0 })
      setSelectedIssues([])
    } catch (err) {
      // If product FK failed (product only exists locally, not in DB),
      // upsert the product into Supabase then retry the review with the real DB id
      if (isProductFKError(err)) {
        try {
          const localProduct = products.find(p => p.id === Number(d.product_id))
          let dbProductId: number | null = null

          if (localProduct) {
            const { data: upserted } = await supabase
              .from('products')
              .upsert(
                [{
                  slug: localProduct.slug,
                  name: localProduct.name,
                  name_uk: localProduct.name_uk,
                  price: localProduct.price,
                  category: localProduct.category,
                  description: localProduct.description || null,
                  images: localProduct.images || [],
                  in_stock: localProduct.in_stock ?? true,
                }],
                { onConflict: 'slug' }
              )
              .select('id')
              .maybeSingle()
            dbProductId = (upserted as { id: number } | null)?.id ?? null
          }

          const retryPayload = { ...payload }
          if (dbProductId) {
            retryPayload.product_id = dbProductId
          } else {
            delete (retryPayload as { product_id?: unknown }).product_id
          }

          const saved = await Promise.race([
            insertReviewViaRest(retryPayload, accessToken, controller.signal),
            timeoutPromise,
          ])
          if (saved) setSubmittedReviews(prev => [saved as Review, ...prev])
          setSubmitStatus('success')
          setSubmitMessage('Відгук надіслано на модерацію')
          toast.success('Відгук на модерації', { className: 'hot-toast', duration: 3000 })
          reset({ product_id: d.product_id, email: d.email, name: d.name, title: '', text: '' })
          setSubmitAttempted(false)
          setSelectedStar(0)
          setAspectRatings({ quality: 0, delivery: 0, service: 0, expectation: 0 })
          setSelectedIssues([])
          return
        } catch {
          // fall through to normal error handling
        }
      }
      const rawMessage = extractErrorMessage(err)
      const aborted = controller.signal.aborted || /abort|aborted|не відповідає/i.test(rawMessage)
      const message = aborted
        ? 'Сервер довго не відповідає. Перевірте інтернет і спробуйте ще раз.'
        : isRlsInsertError(err) || isProfileForeignKeyError(err)
          ? 'Немає прав на публікацію відгуку. Увійдіть повторно та підтвердіть email.'
          : rawMessage
      setSubmitStatus('error')
      setSubmitMessage(message)
      toast.error(`Не вдалося опублікувати: ${message}`, { className: 'hot-toast' })
    } finally {
      setSubmitting(false)
    }
  }

  const onInvalidReview = (formErrors: FieldErrors<ReviewForm>) => {
    setSubmitAttempted(true)
    setSubmitStatus('error')
    setSubmitMessage('Не все готово для публікації')

    if (!selectedStar) {
      ratingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const order: Array<keyof ReviewForm> = ['name', 'email', 'product_id', 'text']
    const firstInvalid = order.find(field => Boolean(formErrors[field]))
    if (firstInvalid) {
      setFocus(firstInvalid)
      const fieldEl = document.querySelector(`[name="${firstInvalid}"]`) as HTMLElement | null
      fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    toast.error('Не всі поля заповнені для публікації', { className: 'hot-toast' })
  }

  const sortLabels: Record<SortOption, string> = {
    newest: 'Найновіші', highest: 'Найкраща оцінка',
    lowest: 'Найнижча оцінка', helpful: 'Найкорисніші',
  }

  useEffect(() => {
    if (searchParams.get('write') === '1') {
      setShowForm(true)
    }
    const productFromQuery = searchParams.get('product')
    if (productFromQuery && products.some(p => String(p.id) === productFromQuery)) {
      setValue('product_id', productFromQuery)
    }
  }, [searchParams, setValue])

  useEffect(() => {
    if (user?.email) setValue('email', user.email)
    if (profile?.full_name) setValue('name', profile.full_name)
  }, [user, profile, setValue])

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Parallax Hero */}
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
        <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
        <div className="page-wrap" style={{ padding: '64px 0' }}>
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Відгуки</span>
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px,6vw,76px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.05, marginBottom: 16 }}>
                Що кажуть<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>наші клієнти</em>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.45)', lineHeight: 1.7, maxWidth: 440 }}>
                347 перевірених відгуків від покупців з України та 23 країн світу
              </p>
            </div>

            {/* Rating summary */}
            <div style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', padding: '32px 40px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 72, fontWeight: 300, color: 'var(--gold-l)', lineHeight: 1 }}>{avgRating}</p>
              <div className="flex justify-center gap-1 my-3">
                {[1,2,3,4,5].map(s => <Star key={s} size={18} fill="var(--gold)" stroke="none" />)}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', letterSpacing: 1 }}>із 347 відгуків</p>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ratingDist.map(({ star, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', width: 8 }}>{star}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(201,169,110,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', width: 28 }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div style={{ borderBottom: '1px solid var(--bd)', background: 'var(--b1)' }}>
        <div className="page-wrap py-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {([['all','Всі'], ['5','★ 5'], ['4','★ 4'], ['3','★ 3'], ['photo','З фото']] as [FilterOption, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{
                  padding: '6px 14px', fontSize: 12, letterSpacing: 1, border: '1px solid var(--bd)',
                  background: filter === val ? 'var(--t0)' : 'none',
                  color: filter === val ? 'var(--t-inv)' : 'var(--t2)',
                  cursor: 'none', fontFamily: 'Jost, sans-serif', transition: 'all .2s',
                }}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <button onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2"
                style={{ padding: '7px 14px', border: '1px solid var(--bd)', background: 'none', fontSize: 12, color: 'var(--t1)', cursor: 'none', fontFamily: 'Jost, sans-serif' }}>
                {sortLabels[sort]} <ChevronDown size={13} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh)', zIndex: 50, minWidth: 180 }}>
                  {(Object.keys(sortLabels) as SortOption[]).map(key => (
                    <button key={key} onClick={() => { setSort(key); setSortOpen(false) }}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: sort === key ? 'var(--gold)' : 'var(--t1)', cursor: 'none', fontFamily: 'Jost, sans-serif' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                      {sortLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Write review */}
            <button onClick={() => setShowForm(s => !s)} className="btn-dark btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} /> Залишити відгук
            </button>
          </div>
        </div>
      </div>

      <div className="page-wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">

          {/* Reviews list */}
          <div>
            {dbLoading && (
              <div style={{ padding: '12px 0', color: 'var(--t2)', fontSize: 13 }}>Завантаження відгуків...</div>
            )}
            {dbError && (
              <div style={{ padding: '12px 0', color: 'var(--rose)', fontSize: 13 }}>Не вдалося завантажити відгуки: {dbError}</div>
            )}
            {/* Write review form */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-8">
                  <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', borderTop: '3px solid var(--gold)', padding: 32, marginBottom: 8 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)', marginBottom: 24 }}>Ваш відгук</h3>
                    <form onSubmit={handleSubmit(onSubmitReview, onInvalidReview)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {/* Star rating */}
                      <div ref={ratingRef}>
                        <p className="field-label" style={{ marginBottom: 10 }}>Оцінка *</p>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} type="button"
                              onMouseEnter={() => setHoveredStar(s)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => { setSelectedStar(s); setValue('rating', s) }}
                              style={{ background: 'none', border: 'none', cursor: 'none', padding: 2 }}>
                              <Star size={28} fill={(hoveredStar || selectedStar) >= s ? 'var(--gold)' : 'none'} stroke="var(--gold)" />
                            </button>
                          ))}
                          {selectedStar > 0 && (
                            <span style={{ fontSize: 13, color: 'var(--gold)', alignSelf: 'center', marginLeft: 8 }}>
                              {['','Погано','Задовільно','Нормально','Добре','Відмінно!'][selectedStar]}
                            </span>
                          )}
                        </div>
                        {submitAttempted && !selectedStar && (
                          <p style={{ fontSize: 12, color: 'var(--rose)', marginTop: 8 }}>Поставте оцінку, щоб продовжити</p>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="field-wrap">
                          <label className="field-label">Ім'я *</label>
                          <input
                            className="field-input"
                            placeholder="Оксана"
                            style={errors.name ? { borderBottomColor: 'var(--rose)' } : undefined}
                            {...register('name', { required: 'Вкажіть ім\'я' })}
                          />
                          {errors.name && <p style={{ fontSize: 12, color: 'var(--rose)' }}>{errors.name.message}</p>}
                        </div>
                        <div className="field-wrap">
                          <label className="field-label">Email (не публікується) *</label>
                          <input
                            type="email"
                            className="field-input"
                            placeholder="your@email.com"
                            style={errors.email ? { borderBottomColor: 'var(--rose)' } : undefined}
                            {...register('email', {
                              required: 'Вкажіть email',
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Невірний формат email',
                              },
                            })}
                          />
                          {errors.email && <p style={{ fontSize: 12, color: 'var(--rose)' }}>{errors.email.message}</p>}
                        </div>
                      </div>

                      <div className="field-wrap">
                        <label className="field-label">Товар *</label>
                        <select
                          className="field-input review-product-select"
                          style={{ background: 'transparent', ...(errors.product_id ? { borderBottomColor: 'var(--rose)' } : {}) }}
                          {...register('product_id', { required: 'Оберіть товар для відгуку' })}
                        >
                          <option value="">Оберіть товар для відгуку</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name_uk}</option>)}
                        </select>
                        {errors.product_id && <p style={{ fontSize: 12, color: 'var(--rose)' }}>{errors.product_id.message}</p>}
                      </div>

                      <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                          <p className="field-label" style={{ marginBottom: 10 }}>Оцініть по пунктах</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
                            {(Object.keys(aspectLabels) as AspectKey[]).map((aspect) => (
                              <div key={aspect} style={{ border: '1px solid var(--bd)', background: 'var(--b0)', padding: 12 }}>
                                <p style={{ fontSize: 12, color: 'var(--t0)', marginBottom: 8 }}>{aspectLabels[aspect]}</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setAspectRatings(prev => ({ ...prev, [aspect]: score }))}
                                      style={{
                                        width: 28,
                                        height: 28,
                                        border: '1px solid var(--bd)',
                                        background: aspectRatings[aspect] >= score ? 'var(--gold)' : 'transparent',
                                        color: aspectRatings[aspect] >= score ? '#fff' : 'var(--t2)',
                                        fontSize: 12,
                                        borderRadius: 2,
                                        transform: aspectRatings[aspect] >= score ? 'translateY(-1px)' : 'translateY(0)',
                                        boxShadow: aspectRatings[aspect] >= score ? '0 6px 14px rgba(74,140,63,0.18)' : 'none',
                                        transition: 'all var(--dur-mid) var(--ease-soft)',
                                      }}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="field-label" style={{ marginBottom: 10 }}>Що хочете відзначити</p>
                          <div className="flex gap-2 flex-wrap">
                            {issueOptions.map((issue) => {
                              const active = selectedIssues.includes(issue)
                              return (
                                <button
                                  key={issue}
                                  type="button"
                                  onClick={() => toggleIssue(issue)}
                                  style={{
                                    padding: '8px 12px',
                                    border: '1px solid var(--bd)',
                                    background: active ? 'var(--gold)' : 'transparent',
                                    color: active ? '#1a1612' : 'var(--t2)',
                                    fontSize: 12,
                                    letterSpacing: 0.3,
                                  }}
                                >
                                  {issue}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="field-wrap">
                        <label className="field-label">Заголовок (необов'язково)</label>
                        <input
                          className="field-input"
                          placeholder="Наприклад: чудова якість тканини"
                          {...register('title')}
                        />
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>Якщо не заповнювати, ми сформуємо короткий заголовок автоматично.</p>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Текст відгуку *</label>
                        <textarea
                          rows={5}
                          className="field-input"
                          style={{ resize: 'none', ...(errors.text ? { borderBottomColor: 'var(--rose)' } : {}) }}
                          placeholder="У кількох реченнях розкажіть, що сподобалось або що варто покращити..."
                          {...register('text', {
                            required: 'Додайте текст відгуку',
                            minLength: { value: 10, message: 'Мінімум 10 символів' },
                          })}
                        />
                        {errors.text && <p style={{ fontSize: 12, color: 'var(--rose)' }}>{errors.text.message}</p>}
                      </div>

                      {submitAttempted && (!user || !selectedStar || Object.keys(errors).length > 0) && (
                        <div style={{ border: '1px solid rgba(196,132,122,0.45)', background: 'rgba(196,132,122,0.08)', padding: '10px 12px' }}>
                          <p style={{ fontSize: 12, color: 'var(--rose)' }}>
                            Не все готово для публікації. Заповніть усі обов'язкові поля.
                          </p>
                          {!user && <p style={{ fontSize: 12, color: 'var(--rose)', marginTop: 4 }}>Потрібна авторизація в акаунті.</p>}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button type="submit" disabled={submitting} className="btn-dark flex items-center gap-2" style={{ opacity: submitting ? 0.7 : 1 }}>
                          <Check size={14} /> {submitting ? 'Публікація...' : 'Опублікувати'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Скасувати</button>
                      </div>

                      {!user && (
                        <p style={{ fontSize: 12, color: 'var(--rose)' }}>
                          Увійдіть в акаунт, щоб опублікувати відгук.
                        </p>
                      )}

                      {submitStatus !== 'idle' && (
                        <p style={{
                          fontSize: 12,
                          color:
                            submitStatus === 'success'
                              ? 'var(--sage)'
                              : submitStatus === 'submitting'
                                ? 'var(--gold)'
                                : 'var(--rose)',
                        }}>
                          {submitMessage}
                        </p>
                      )}
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {sortedFiltered.map((review, i) => {
                const product = products.find(p => p.id === review.product_id)
                return (
                  <motion.div key={review.id}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                    style={{ border: '1px solid var(--bd)', background: 'var(--b0)', padding: '28px 32px' }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', color: '#18160e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0 }}>
                          {review.author.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p style={{ fontSize: 14, color: 'var(--t0)', fontWeight: 400 }}>{review.author}</p>
                            {review.verified_purchase && (
                              <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', background: 'rgba(138,158,140,0.15)', color: 'var(--sage)', padding: '2px 7px' }}>
                                ✓ Перевірена покупка
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= review.rating ? 'var(--gold)' : 'none'} stroke={s <= review.rating ? 'var(--gold)' : 'var(--bd2)'} />)}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--t2)' }}>{review.created_at}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product ref */}
                      {product && (
                        <Link to={`/product/${product.slug}`} className="hidden sm:flex items-center gap-2 flex-shrink-0"
                          style={{ border: '1px solid var(--bd)', padding: '6px 10px' }}>
                          <img src={product.images[0]} alt="" style={{ width: 36, height: 48, objectFit: 'cover' }} loading="lazy" />
                          <span style={{ fontSize: 11, color: 'var(--t2)', maxWidth: 100, lineHeight: 1.4 }}>{product.name_uk}</span>
                        </Link>
                      )}
                    </div>

                    {/* Content */}
                    {review.title && <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>{review.title}</h4>}
                    <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.8, marginBottom: 16 }}>{review.text}</p>

                    {/* Photos */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-3 mb-4">
                        {review.images.map((img, ii) => (
                          <button key={ii} onClick={() => setLightboxImg(img)} style={{ background: 'none', border: 'none', cursor: 'none', padding: 0 }}>
                            <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid var(--bd)' }} loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Helpful */}
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 12, color: 'var(--t2)' }}>Корисно?</span>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '1px solid var(--bd)', background: 'none', fontSize: 12, color: 'var(--t1)', cursor: 'none' }}>
                        <ThumbsUp size={13} /> {review.helpful}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block sticky top-24" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Write review CTA */}
            <div style={{ background: '#1a1612', border: '1px solid rgba(201,169,110,0.2)', padding: 28 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(245,240,232,0.93)', marginBottom: 8 }}>Поділіться враженням</p>
              <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', lineHeight: 1.6, marginBottom: 20 }}>Ваш відгук допоможе іншим покупцям зробити правильний вибір</p>
              <button onClick={() => setShowForm(true)} className="btn-gold" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                <Camera size={15} /> Написати відгук
              </button>
            </div>

            {/* Stats */}
            <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 24 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Статистика</p>
              {[
                ['Загалом відгуків', '347'],
                ['Перевірені покупки', '98%'],
                ['Рекомендують', '99.4%'],
                ['Відгуки з фото', '43%'],
                ['Повторні покупці', '67%'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid var(--bd)', fontSize: 13 }}>
                  <span style={{ color: 'var(--t2)' }}>{l}</span>
                  <span style={{ color: 'var(--t0)', fontWeight: 400 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLightboxImg(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none' }}>
              <img src={lightboxImg} alt="" style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
