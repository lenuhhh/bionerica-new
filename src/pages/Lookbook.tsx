import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Play, X, ArrowRight, ShoppingBag } from 'lucide-react'
import LazyImage from '@/components/ui/LazyImage'
import { useSEO } from '@/hooks/useSEO'
import { products } from '@/data'

const collections = [
  {
    id: 'spring-2025',
    name: 'Весна 2025',
    subtitle: 'Пробудження',
    description: 'Колекція натхненна першоцвітами Полтавщини. Ніжні тони, легкі тканини, деталізована вишивка.',
    cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=800&fit=crop',
    shots: [
      { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop', product_id: 3 },
      { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop', product_id: 1 },
      { src: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&h=1000&fit=crop', product_id: 8 },
      { src: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&h=1000&fit=crop', product_id: 5 },
      { src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop', product_id: 4 },
      { src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop', product_id: 9 },
    ],
    videoUrl: null,
    season: 'SS25',
  },
  {
    id: 'heritage',
    name: 'Heritage',
    subtitle: 'Спадщина',
    description: 'Обрядові вироби реконструйовані в сучасному прочитанні. Традиція зустрічає сьогодення.',
    cover: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=1200&h=800&fit=crop',
    shots: [
      { src: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=800&h=1000&fit=crop', product_id: 2 },
      { src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop', product_id: 12 },
      { src: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&h=1000&fit=crop', product_id: 10 },
    ],
    videoUrl: null,
    season: 'AW24',
  },
]

export default function Lookbook() {
  const [activeCollection, setActiveCollection] = useState(collections[0])
  const [lightbox, setLightbox] = useState<{ src: string; pid?: number } | null>(null)

  useSEO({
    title: 'Lookbook — Колекції Broiderie',
    description: 'Фотолукбук колекцій Broiderie. Сучасна українська вишивка у контексті fashion-фотографії.',
    url: '/lookbook',
  })

  const lightboxProduct = lightbox?.pid ? products.find(p => p.id === lightbox.pid) : null

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Hero */}
      <div className="dark-section" style={{ position: 'relative', overflow: 'hidden', minHeight: '70vh', display: 'flex', alignItems: 'flex-end' }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url(${activeCollection.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 0.6s', filter: 'brightness(0.45)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,17,13,0.95) 0%, rgba(20,17,13,0.3) 60%, transparent)' }} />

        <div className="page-wrap py-20 relative z-[1]">
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div>
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 10 }}>
                {activeCollection.season} · Lookbook
              </span>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(48px,7vw,88px)', fontWeight: 300, color: 'rgba(245,240,232,0.95)', lineHeight: 1.0, marginBottom: 10 }}>
                {activeCollection.name}
              </h1>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic', color: 'var(--gold-l)' }}>
                {activeCollection.subtitle}
              </p>
            </div>

            {/* Collection switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => setActiveCollection(col)}
                  style={{
                    background: 'none',
                    border: `1px solid ${activeCollection.id === col.id ? 'var(--gold)' : 'rgba(201,169,110,0.25)'}`,
                    color: activeCollection.id === col.id ? 'var(--gold-l)' : 'rgba(245,240,232,0.4)',
                    padding: '8px 20px',
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    cursor: 'none',
                    fontFamily: 'Jost, sans-serif',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  {col.name} <span style={{ opacity: 0.5, fontSize: 10 }}>({col.season})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collection description */}
      <div className="page-wrap" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontStyle: 'italic', color: 'var(--t1)', maxWidth: 520 }}>
            {activeCollection.description}
          </p>
          <Link to="/catalog" className="btn-dark btn-sm">
            <ShoppingBag size={14} /> Купити вироби колекції
          </Link>
        </div>
      </div>

      {/* Photo grid — masonry-style */}
      <div className="page-wrap pb-24">
        <div style={{ columns: '2 280px', columnGap: 16, gap: 16 }}>
          {activeCollection.shots.map((shot, i) => (
            <motion.div
              key={`${activeCollection.id}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.05 }}
              style={{ marginBottom: 16, breakInside: 'avoid', cursor: 'none', position: 'relative' }}
              className="group"
              onClick={() => setLightbox({ src: shot.src, pid: shot.product_id })}
            >
              <img
                src={shot.src}
                alt={`Колекція ${activeCollection.name} — знімок ${i + 1}`}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', display: 'block', transition: 'transform 0.5s ease', transform: 'scale(1)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
              />

              {/* Hover overlay */}
              <div
                className="group-hover:opacity-100 opacity-0 transition-opacity"
                style={{ position: 'absolute', inset: 0, background: 'rgba(26,22,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Переглянути</p>
                  {shot.product_id && (
                    <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--gold-l)', opacity: 0.8 }}>+ деталі виробу</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,5,0.92)', zIndex: 300, backdropFilter: 'blur(8px)' }}
              onClick={() => setLightbox(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              style={{ position: 'fixed', inset: 0, zIndex: 301, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            >
              <div style={{ display: 'flex', gap: 24, maxHeight: '90vh', maxWidth: 1000, width: '100%' }}>
                <img src={lightbox.src} alt="" style={{ maxHeight: '85vh', objectFit: 'contain', maxWidth: lightboxProduct ? '60%' : '100%' }} />

                {lightboxProduct && (
                  <div style={{ width: 280, flexShrink: 0, background: '#1a1612', padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>{lightboxProduct.category}</p>
                      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'rgba(245,240,232,0.93)', marginBottom: 10, lineHeight: 1.2 }}>
                        {lightboxProduct.name_uk}
                      </h3>
                      <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)', lineHeight: 1.7, marginBottom: 20 }}>
                        {lightboxProduct.description}
                      </p>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--gold-l)', marginBottom: 20 }}>
                        {lightboxProduct.price.toLocaleString('uk-UA')} ₴
                      </p>
                    </div>
                    <Link
                      to={`/product/${lightboxProduct.slug}`}
                      className="btn-gold"
                      onClick={() => setLightbox(null)}
                      style={{ justifyContent: 'center', display: 'flex' }}
                    >
                      Переглянути виріб <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setLightbox(null)}
                style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(245,240,232,0.1)', border: '1px solid rgba(245,240,232,0.2)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.7)', cursor: 'none' }}
              >
                <X size={20} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
