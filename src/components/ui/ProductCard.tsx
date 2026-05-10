import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Heart, Eye, Star, Zap, Lock } from 'lucide-react'
import { useCart, useWishlist } from '@/store'
import LazyImage from './LazyImage'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  product: Product
  index?: number
  view?: 'grid' | 'list'
}

/* ── Gold particle burst on add-to-cart ─────────────────────────── */
interface Particle { id: number; x: number; y: number; tx: number }

const noImagePlaceholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760' viewBox='0 0 600 760'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#2a261f'/>
          <stop offset='100%' stop-color='#1b1813'/>
        </linearGradient>
      </defs>
      <rect width='600' height='760' fill='url(#g)'/>
      <rect x='36' y='36' width='528' height='688' fill='none' stroke='#c9a96e' stroke-opacity='0.35' stroke-width='2'/>
      <text x='300' y='350' text-anchor='middle' fill='#e8d5a3' font-size='38' font-family='Jost, Arial, sans-serif' opacity='0.95'>Товар не в наявності</text>
      <text x='300' y='400' text-anchor='middle' fill='#b8b0a0' font-size='22' font-family='Jost, Arial, sans-serif' opacity='0.85'>Фото відсутнє</text>
    </svg>`
  )

function ParticleBurst({ particles }: { particles: Particle[] }) {
  if (!particles.length) return null
  return (
    <>
      {particles.map(p => (
        <span
          key={p.id}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--gold)',
            pointerEvents: 'none',
            zIndex: 9999,
            // CSS var for translateX direction
            '--tx': `${p.tx}px`,
            animation: 'particle-up 0.6s cubic-bezier(0.2,0,0.8,1) forwards',
          } as React.CSSProperties}
        />
      ))}
    </>
  )
}

export default function ProductCard({ product, index = 0, view = 'grid' }: Props) {
  const navigate = useNavigate()
  const { add } = useCart()
  const { toggle, has } = useWishlist()
  const [adding, setAdding]     = useState(false)
  const [wished, setWished]     = useState(has(product.id))
  const [heartAnim, setHeartAnim] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const particleId = useRef(0)

  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null
  const stockLow = (product.stock_count ?? 99) <= 3 && product.in_stock

  /* ── Add to cart + particle burst ── */
  const handleAdd = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!product.in_stock || adding) return

    setAdding(true)
    add(product)

    // Spawn particles at button position
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
        id: ++particleId.current,
        x: cx + (Math.random() - 0.5) * 24,
        y: cy,
        tx: (Math.random() - 0.5) * 60,
      }))
      setParticles(p => [...p, ...newParticles])
      setTimeout(() => setParticles(p => p.filter(x => !newParticles.find(n => n.id === x.id))), 700)
    }

    toast.success(`«${product.name_uk}» додано до кошика`, {
      icon: '🧵', className: 'hot-toast', duration: 2000,
    })
    setTimeout(() => setAdding(false), 1500)
  }, [product, adding, add])

  /* ── Wishlist + heart burst ── */
  const handleWish = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const isWished = has(product.id)
    toggle(product.id)
    setWished(!isWished)
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 500)
    if (!isWished) {
      toast('Додано до списку бажань ❤️', { className: 'hot-toast', duration: 1500 })
    }
  }, [product.id, toggle, has])

  /* ── LIST VIEW ─────────────────────────────────────────────── */
  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2), ease: 'easeOut' }}
        className="card-lift"
      >
        <Link
          to={`/product/${product.slug}`}
          className="flex gap-6 p-4 group"
          style={{ border: '1px solid var(--bd)', background: 'var(--b0)' }}
        >
          <div className="relative flex-shrink-0 w-32 overflow-hidden">
            <LazyImage src={product.images?.[0] || noImagePlaceholder} alt={product.name_uk} aspectRatio="aspect-[3/4]" className="w-32" />
            {!product.in_stock && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(245,240,232,0.75)' }}>
                <span className="badge badge-sold">Немає</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <div className="flex gap-2 mb-2 stagger-children">
                {product.is_new       && <span className="badge badge-new badge-animated">New</span>}
                {product.is_bestseller && <span className="badge badge-hot badge-animated">Хіт</span>}
                {product.is_limited   && <span className="badge badge-sale badge-animated">Лімітед</span>}
              </div>
              <p className="label-xs mb-1">{product.category}</p>
              <h3 className="font-display text-xl mb-1 link-underline" style={{ color: 'var(--t0)' }}>
                {product.name_uk}
              </h3>
              {product.subtitle && (
                <p className="label-xs" style={{ color: 'var(--t2)', letterSpacing: 2 }}>{product.subtitle}</p>
              )}
              <p className="mt-2 text-sm" style={{ color: 'var(--t1)', lineHeight: 1.6, WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                {product.description}
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleWish}
                  className="btn-icon glow-on-hover"
                  style={{ width: 38, height: 38 }}
                >
                  <Heart
                    size={15}
                    fill={has(product.id) ? 'currentColor' : 'none'}
                    style={{ color: has(product.id) ? 'var(--rose)' : undefined }}
                    className={heartAnim ? 'heart-burst' : ''}
                  />
                </motion.button>
                <motion.button
                  ref={btnRef}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAdd}
                  disabled={!product.in_stock || adding}
                  className="btn-dark btn-sm"
                  style={{ padding: '0 20px', height: 38 }}
                >
                  {adding ? '✓' : <><ShoppingBag size={14} className={adding ? 'basket-shake' : ''} /> Купити</>}
                </motion.button>
              </div>
            </div>
          </div>
        </Link>
        <ParticleBurst particles={particles} />
      </motion.div>
    )
  }

  /* ── GRID VIEW ─────────────────────────────────────────────── */
  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2), ease: 'easeOut' }}
      >
        <div className="block">

          {/* ── Image area ─────────────────────────────────── */}
          <Link
            to={`/product/${product.slug}`}
            className="relative overflow-hidden product-card-media block"
            style={{ background: 'var(--b1)', isolation: 'isolate' }}
          >
            {/* Primary image — scale on group hover via CSS */}
            <div style={{ transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)', transformOrigin: 'center' }}
              className="img-zoom-inner">
              <LazyImage
                src={product.images?.[0] || noImagePlaceholder}
                alt={product.name_uk}
                aspectRatio="aspect-[3/4]"
                priority={index < 4}
              />
            </div>

            {/* Out of stock overlay */}
            {!product.in_stock && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(245,240,232,0.82)', backdropFilter: 'blur(2px)', zIndex: 4 }}
              >
                <div className="text-center">
                  <Lock size={22} style={{ color: 'var(--t2)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--t2)' }}>
                    Немає в наявності
                  </p>
                </div>
              </motion.div>
            )}

            {/* Low stock badge */}
            {stockLow && (
              <div className="absolute bottom-3 left-3" style={{ zIndex: 5 }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1.5 px-2.5 py-1"
                  style={{ background: '#1a1612', color: 'var(--gold-l)' }}
                >
                  <Zap size={11} />
                  <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>
                    Залишилось {product.stock_count}
                  </span>
                </motion.div>
              </div>
            )}

            {/* Top badges — staggered pop-in */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.is_new && (
                <motion.span
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.06 + 0.2, type: 'spring', stiffness: 400 }}
                  className="badge badge-new"
                >New</motion.span>
              )}
              {product.is_bestseller && (
                <motion.span
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.06 + 0.28, type: 'spring', stiffness: 400 }}
                  className="badge badge-hot"
                >Хіт</motion.span>
              )}
              {product.is_limited && (
                <motion.span
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.06 + 0.36, type: 'spring', stiffness: 400 }}
                  className="badge badge-sale"
                >Лімітед</motion.span>
              )}
              {discount && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.06 + 0.3, type: 'spring', stiffness: 500 }}
                  className="badge badge-sale"
                >−{discount}%</motion.span>
              )}
            </div>

            {/* ── Action buttons — slide from right, stable ref ── */}
            <div
              className="absolute top-3 right-3 flex flex-col gap-2 actions-slide"
              style={{
                zIndex: 6,
              }}
            >
              {/* Wishlist */}
              <button
                onClick={handleWish}
                aria-label={has(product.id) ? 'Видалити з бажань' : 'Додати до бажань'}
                style={{
                  width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${has(product.id) ? 'var(--rose)' : 'rgba(201,169,110,0.35)'}`,
                  background: has(product.id) ? 'var(--rose)' : 'rgba(22,18,14,0.75)',
                  color: has(product.id) ? '#fff' : 'rgba(245,240,232,0.95)',
                  cursor: 'none',
                  transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!has(product.id)) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--rose)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--rose)'
                    ;(e.currentTarget as HTMLElement).style.color = '#fff'
                  }
                  ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  if (!has(product.id)) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(22,18,14,0.75)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.35)'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.95)'
                  }
                  ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
              >
                <Heart
                  size={15}
                  fill={has(product.id) ? '#fff' : 'none'}
                  stroke={has(product.id) ? '#fff' : 'rgba(245,240,232,0.95)'}
                  strokeWidth={2}
                />
              </button>

              {/* Quick view */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/product/${product.slug}`)
                }}
                aria-label="Переглянути товар"
                style={{
                  width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(201,169,110,0.35)',
                  background: 'rgba(22,18,14,0.75)',
                  color: 'rgba(245,240,232,0.95)',
                  textDecoration: 'none',
                  cursor: 'none',
                  transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                  flexShrink: 0,
                  transitionDelay: '0.04s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'var(--gold)'
                  el.style.borderColor = 'var(--gold)'
                  el.style.color = '#18160e'
                  el.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(22,18,14,0.75)'
                  el.style.borderColor = 'rgba(201,169,110,0.35)'
                  el.style.color = 'rgba(245,240,232,0.95)'
                  el.style.transform = 'scale(1)'
                }}
              >
                <Eye size={15} stroke="currentColor" strokeWidth={2} />
              </button>
            </div>


            {/* Add to cart — slides up from bottom, stable ref */}
            <div
              className="cart-slide"
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                zIndex: 6,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.button
                  ref={btnRef}
                  key={adding ? 'added' : 'add'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  disabled={!product.in_stock}
                  className="w-full flex items-center justify-center gap-2 py-3"
                  style={{
                    background: adding ? 'var(--sage)' : '#1a1612',
                    color: adding ? 'white' : 'var(--gold-l)',
                    border: 'none',
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    fontFamily: 'Jost, sans-serif',
                    cursor: product.in_stock ? 'none' : 'not-allowed',
                    opacity: !product.in_stock ? 0.5 : 1,
                    transition: 'background 0.25s',
                  }}
                >
                  {adding ? (
                    <>
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >✓</motion.span>
                      Додано!
                    </>
                  ) : (
                    <><ShoppingBag size={14} /> Додати до кошика</>
                  )}
                </motion.button>
              </AnimatePresence>
            </div>
          </Link>

          {/* ── Info block ─────────────────────────────────── */}
          <div className="pt-4 pb-2 product-card-info">
            {/* Technique label */}
            <p className="label-xs mb-1.5 product-technique">{product.category}</p>

            {/* Name with underline animation */}
            <h3
              className="font-display mb-1 product-title"
              style={{
                fontSize: 'clamp(17px,1.6vw,20px)',
                fontWeight: 300,
                color: 'var(--t0)',
                lineHeight: 1.2,
              }}
            >
              {product.name_uk}
            </h3>

            {/* Subtitle */}
            {product.subtitle && (
              <p className="product-subtitle" style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--t2)', marginBottom: 10 }}>
                {product.subtitle}
              </p>
            )}

            {/* Origin */}
            {product.origin && (
              <span className="product-origin" style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', display: 'block', marginBottom: 10 }}>
                📍 {product.origin}
              </span>
            )}

            {/* Price row */}
            <div className="flex items-center justify-between product-price-row">

              {/* Small wishlist icon at price row */}
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={handleWish}
                className="product-price-wish"
                style={{
                  background: 'none', border: 'none', cursor: 'none',
                  color: has(product.id) ? 'var(--rose)' : 'var(--bd2)',
                  display: 'flex',
                  transition: 'color 0.25s',
                }}
              >
                <Heart
                  size={16}
                  fill={has(product.id) ? 'currentColor' : 'none'}
                  style={{ transition: 'transform 0.3s', transform: heartAnim ? 'scale(1.5)' : 'scale(1)' }}
                />
              </motion.button>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-1.5 mt-2.5 product-rating-row">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i} size={11}
                    fill={i < Math.round(product.rating) ? 'var(--gold)' : 'none'}
                    stroke={i < Math.round(product.rating) ? 'var(--gold)' : 'var(--bd2)'}
                  />
                ))}
              </div>
              <span className="product-rating-text" style={{ fontSize: 11, color: 'var(--t2)' }}>
                {product.rating} ({product.review_count})
              </span>
            </div>

            {/* Material tags */}
            <div className="flex flex-wrap gap-1.5 mt-3 product-tags-row">
              {[product.unit, ...product.tags.slice(0, 2)].filter(Boolean).map(tag => (
                <span key={tag} className="product-tag" style={{
                  fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                  padding: '3px 8px', border: '1px solid var(--bd)', color: 'var(--t2)',
                  transition: 'border-color 0.2s, color 0.2s',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Particle burst rendered at document level via portal-like fixed pos */}
      <ParticleBurst particles={particles} />
    </>
  )
}
