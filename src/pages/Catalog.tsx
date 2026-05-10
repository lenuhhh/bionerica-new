// Catalog.tsx
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { SlidersHorizontal, LayoutGrid, List, X, ChevronDown, Loader } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import { SectionTitle, Breadcrumb } from '@/components/ui'
import { categories } from '@/data'
import { useProducts } from '@/hooks/useProducts'
import { useSEO } from '@/hooks/useSEO'

const PAGE_SIZE = 8

function CategoryPillIcon({ id, active }: { id: string; active: boolean }) {
  const color = active ? '#fff' : 'var(--gold)'
  const common = {
    width: 14, height: 14, viewBox: '0 0 24 24',
    fill: 'none', stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (id === 'all') return (
    <svg {...common}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
  if (id === 'berries') return (
    <svg {...common}>
      <circle cx="12" cy="13" r="5" />
      <path d="M12 8c0-3 3-5 3-5s-1 3 0 5" />
      <path d="M12 8c0-3-3-5-3-5s1 3 0 5" />
    </svg>
  )
  if (id === 'fruits') return (
    <svg {...common}>
      <path d="M8 16c0-4 2-7 4-8 2 1 4 4 4 8a4 4 0 0 1-8 0Z" />
      <path d="M12 8c0-2 1.5-4 3-4" />
    </svg>
  )
  if (id === 'vegetables') return (
    <svg {...common}>
      <path d="M12 20V10" />
      <path d="M12 10c0-4 3-7 3-7s0 3-1.5 5.5" />
      <path d="M12 10c0-4-3-7-3-7s0 3 1.5 5.5" />
      <path d="M8 14c-2-1-3-3-3-3s2 0 4 2" />
      <path d="M16 14c2-1 3-3 3-3s-2 0-4 2" />
    </svg>
  )
  if (id === 'greens') return (
    <svg {...common}>
      <path d="M12 20V8" />
      <path d="M12 8C12 4 16 3 16 3s-1 4-4 5" />
      <path d="M12 12C12 8 8 7 8 7s1 4 4 5" />
    </svg>
  )
  if (id === 'plants') return (
    <svg {...common}>
      <path d="M12 20v-6" />
      <path d="M8 17c0-4 2-7 4-8 2 1 4 4 4 8" />
      <path d="M9 20h6" />
    </svg>
  )
  if (id === 'baskets') return (
    <svg {...common}>
      <path d="M5 10h14l-1.5 8H6.5Z" />
      <path d="M3 10h18" />
      <path d="M9 10 11 5" />
      <path d="M15 10 13 5" />
    </svg>
  )
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="5" />
    </svg>
  )
}

export default function Catalog() {
  const [sp, setSp] = useSearchParams()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loaderRef = useRef<HTMLDivElement>(null)

  useSEO({
    title: 'Каталог — свіжі ягоди, фрукти та овочі',
    description: 'Замовляйте свіжі ягоди, фрукти, овочі, зелень та розсаду прямо з ферми. Органічне вирощування, доставка в день збору.',
    keywords: 'купити полуницю, свіжі ягоди, овочі з ферми, органічна розсада, Bionerica',
    url: '/catalog',
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const cat    = sp.get('cat') || 'all'
  const q      = sp.get('q')  || ''
  const sort   = sp.get('sort') || 'default'
  const filter = sp.get('filter') || ''
  const maxPr  = Number(sp.get('maxPrice')) || 10000

  const setP = (k: string, v: string) => {
    const p = new URLSearchParams(sp)
    !v || v === 'all' || v === 'default' ? p.delete(k) : p.set(k, v)
    setSp(p)
  }

  // ── Data from Supabase (falls back to mock if not connected) ──
  const { products: allFetched, loading: dataLoading } = useProducts({
    category: cat,
    search: q || undefined,
    sort: sort !== 'default' ? sort : undefined,
    filter: filter || undefined,
    maxPrice: maxPr < 10000 ? maxPr : undefined,
  })

  const filtered = allFetched

  const sortOpts = [
    { id: 'default',    label: 'За замовчуванням' },
    { id: 'price-asc',  label: 'Ціна: від меншої' },
    { id: 'price-desc', label: 'Ціна: від більшої' },
    { id: 'rating',     label: 'За рейтингом' },
    { id: 'newest',     label: 'Новинки' },
  ]

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [cat, q, sort, filter, maxPr])

  // IntersectionObserver — loads next batch when sentinel enters viewport
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount(v => Math.min(v + PAGE_SIZE, filtered.length))
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleCount, filtered.length])

  const visibleProducts = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Parallax Hero */}
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
        <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="page-wrap py-20">
            <div className="flex items-center gap-3 mb-5">
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Каталог Bionerica</span>
            </div>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(44px,6vw,80px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.05 }}>
                {cat === 'all' ? 'Усі продукти' : categories.find(c => c.id === cat)?.label_uk || 'Каталог'}
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)', marginBottom: 8 }}>{filtered.length} позицій</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="page-wrap py-10 pb-24">
        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(c => (
            <button key={c.id} onClick={() => setP('cat', c.id)}
              className="transition-all"
              style={{
                padding: '8px 18px',
                border: cat === c.id ? '1px solid var(--gold)' : '1px solid var(--bd)',
                background: cat === c.id ? 'rgba(74,140,63,0.12)' : 'none',
                color: cat === c.id ? 'var(--t0)' : 'var(--t2)',
                fontWeight: 400,
                boxShadow: cat === c.id ? '0 1px 0 rgba(255,255,255,0.45) inset, 0 0 0 1px rgba(74,140,63,0.16) inset' : 'none',
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}>
              <CategoryPillIcon id={c.id} active={cat === c.id} />
              {c.label_uk}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={() => setFiltersOpen(o => !o)}
              className="flex items-center gap-2 transition-all"
              style={{
                padding: '9px 18px',
                border: filtersOpen ? '1px solid var(--gold)' : '1px solid var(--bd)',
                background: filtersOpen ? 'rgba(74,140,63,0.14)' : 'none',
                color: filtersOpen ? 'var(--gold)' : 'var(--t0)',
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
              <SlidersHorizontal size={14} /> Фільтри
            </button>
            {q && (
              <div className="flex items-center gap-2 px-3 py-2" style={{ border: '1px solid var(--bd)', fontSize: 12 }}>
                «{q}»
                <button onClick={() => setP('q', '')} style={{ background: 'none', border: 'none', color: 'var(--t2)', display: 'flex' }}><X size={12} /></button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex" style={{ border: '1px solid var(--bd)' }}>
              <button onClick={() => setView('grid')} className="flex items-center justify-center w-9 h-9 transition-all"
                style={{
                  background: view === 'grid' ? 'rgba(74,140,63,0.14)' : 'none',
                  color: view === 'grid' ? 'var(--gold)' : 'var(--t2)',
                  border: 'none',
                }}>
                <LayoutGrid size={15} />
              </button>
              <button onClick={() => setView('list')} className="flex items-center justify-center w-9 h-9 transition-all"
                style={{
                  background: view === 'list' ? 'rgba(74,140,63,0.14)' : 'none',
                  color: view === 'list' ? 'var(--gold)' : 'var(--t2)',
                  border: 'none',
                  borderLeft: '1px solid var(--bd)',
                }}>
                <List size={15} />
              </button>
            </div>
            {/* Sort */}
            <div className="relative">
              <button onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2"
                style={{ padding: '9px 16px', border: '1px solid var(--bd)', background: 'none', fontSize: 11, letterSpacing: 1, color: 'var(--t0)', textTransform: 'uppercase' }}>
                {sortOpts.find(s => s.id === sort)?.label} <ChevronDown size={13} />
              </button>
              {sortOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 z-50 w-52"
                  style={{ background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh)' }}>
                  {sortOpts.map(s => (
                    <button key={s.id} onClick={() => { setP('sort', s.id); setSortOpen(false) }}
                      className="block w-full px-5 py-3 text-left text-[13px] transition-all"
                      style={{ background: 'none', border: 'none', color: sort === s.id ? 'var(--gold)' : 'var(--t1)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-8 p-6 mb-8 overflow-hidden"
            style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
            <div>
              <h4 className="label-xs mb-4">Макс. ціна: {maxPr.toLocaleString()} ₴</h4>
              <input type="range" min={500} max={10000} step={200} value={maxPr}
                onChange={e => setP('maxPrice', e.target.value)}
                className="w-full" style={{ accentColor: 'var(--gold)' }} />
              <div className="flex justify-between mt-2" style={{ fontSize: 11, color: 'var(--t2)' }}>
                <span>500 ₴</span><span>10 000 ₴</span>
              </div>
            </div>
            <div>
              <h4 className="label-xs mb-4">Наявність</h4>
              <label className="flex items-center gap-3" style={{ fontSize: 13, color: 'var(--t1)', cursor: 'none' }}>
                <input type="checkbox" style={{ accentColor: 'var(--gold)' }} /> В наявності
              </label>
            </div>
            <div>
              <h4 className="label-xs mb-4">Колекція</h4>
              {[['new', 'Новинки'], ['bestseller', 'Хіти'], ['limited', 'Лімітед']].map(([v, l]) => (
                <label key={v} className="flex items-center gap-3 mb-2" style={{ fontSize: 13, color: 'var(--t1)', cursor: 'none' }}>
                  <input type="checkbox" checked={filter === v} onChange={() => setP('filter', filter === v ? '' : v)} style={{ accentColor: 'var(--gold)' }} /> {l}
                </label>
              ))}
            </div>
            <div>
              <h4 className="label-xs mb-4">Матеріал</h4>
              {['Льон', 'Бавовна', 'Шовк', 'Вовна'].map(m => (
                <label key={m} className="flex items-center gap-3 mb-2" style={{ fontSize: 13, color: 'var(--t1)', cursor: 'none' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--gold)' }} /> {m}
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products — infinite scroll */}
        {dataLoading ? (
          /* Skeleton grid while loading */
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="img-skeleton aspect-[3/4] w-full" />
                <div style={{ paddingTop: 14 }}>
                  <div className="img-skeleton" style={{ height: 10, width: '40%', marginBottom: 8, borderRadius: 4 }} />
                  <div className="img-skeleton" style={{ height: 16, width: '80%', marginBottom: 6, borderRadius: 4 }} />
                  <div className="img-skeleton" style={{ height: 18, width: '55%', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-28 text-center">
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: 'var(--t0)', marginBottom: 12 }}>Нічого не знайдено 🌿</p>
            <p style={{ fontSize: 14, color: 'var(--t2)' }}>Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {visibleProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i % PAGE_SIZE} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i % PAGE_SIZE} view="list" />)}
          </div>
        )}

        {/* Infinite scroll sentinel + loader */}
        <div ref={loaderRef} style={{ height: 1, marginTop: 40 }} />
        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', gap: 10, alignItems: 'center' }}>
            <Loader size={18} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, letterSpacing: 2, color: 'var(--t2)', textTransform: 'uppercase' }}>
              Завантаження...
            </span>
          </div>
        )}
        {!hasMore && filtered.length > PAGE_SIZE && (
          <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: 2, color: 'var(--t2)', padding: '32px 0', textTransform: 'uppercase' }}>
            ✦ Всі {filtered.length} виробів завантажено ✦
          </p>
        )}
      </div>
    </div>
  )
}
