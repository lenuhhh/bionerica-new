import { useState, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, ShoppingBag, Heart,
  Star, Truck, Shield, MapPin, Plus, Minus,
  Package, Leaf, Camera
} from 'lucide-react'
import { useCart, useWishlist } from '@/store'
import { products as allProducts, reviews as allReviews } from '@/data'
import ProductCard from '@/components/ui/ProductCard'
import LazyImage from '@/components/ui/LazyImage'
import SocialShare from '@/components/ui/SocialShare'
import { Breadcrumb, StarRating } from '@/components/ui'
import { useSEO, productSchema, breadcrumbSchema } from '@/hooks/useSEO'
import toast from 'react-hot-toast'

type Tab = 'description' | 'benefits' | 'storage' | 'origin' | 'reviews'

export default function ProductPage() {
  const { slug } = useParams()
  const product = allProducts.find(p => p.slug === slug)
  if (!product) return <Navigate to="/catalog" />

  const { add } = useCart()
  const { toggle, has } = useWishlist()
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [selectedWeight, setSelectedWeight] = useState(product.weight_options?.[0] || '')
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [adding, setAdding] = useState(false)
  const [zoom, setZoom] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const wished = has(product.id)
  const productReviews = allReviews.filter(r => r.product_id === product.id)
  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : null
  const weightOptions = product.weight_options || []
  const hasGalleryNavigation = new Set(product.images).size > 1
  const attributes: Array<[string, string]> = [
    ['Одиниця продажу', product.unit],
    ['Мінімальне замовлення', String(product.min_order)],
  ]
  if (product.harvest_date) attributes.push(['Дата збору', product.harvest_date])
  if (product.shelf_life) attributes.push(['Термін зберігання', product.shelf_life])
  if (product.origin) attributes.push(['Регіон', product.origin])

  useSEO({
    title: product.name_uk,
    description: product.description,
    keywords: [product.name_uk, product.category, product.origin || '', ...(product.season || [])].join(', '),
    image: product.images[0],
    url: `/product/${product.slug}`,
    type: 'product',
    schema: {
      ...productSchema({
        name: product.name_uk,
        description: product.description,
        price: product.price,
        images: product.images,
        rating: product.rating,
        reviewCount: product.review_count,
        inStock: product.in_stock,
        slug: product.slug,
      }),
      '@graph': [
        breadcrumbSchema([
          { label: 'Головна', to: '/' },
          { label: 'Каталог', to: '/catalog' },
          { label: product.name_uk },
        ]),
      ],
    },
  })

  const handleAdd = async () => {
    if (!product.in_stock) return
    if (weightOptions.length > 0 && !selectedWeight) {
      toast.error('Будь ласка, оберіть вагу', { className: 'hot-toast' })
      return
    }
    setAdding(true)
    for (let i = 0; i < qty; i++) add(product, 1, { weight_option: selectedWeight })
    toast.success(`«${product.name_uk}» додано до кошика`, { className: 'hot-toast' })
    setTimeout(() => setAdding(false), 1500)
  }


  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Опис'        },
    { id: 'benefits',    label: 'Користь'     },
    { id: 'storage',     label: 'Зберігання'  },
    { id: 'origin',      label: 'Походження'  },
    { id: 'reviews',     label: `Відгуки (${product.review_count})` },
  ]

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="page-wrap py-5" style={{ borderBottom: '1px solid var(--bd)' }}>
        <Breadcrumb items={[
          { label: 'Головна', to: '/' },
          { label: 'Каталог', to: '/catalog' },
          { label: product.name_uk },
        ]} />
      </div>

      <div className="page-wrap py-12">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 mb-24">

          {/* ── Gallery ── */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <div
              ref={galleryRef}
              className="relative overflow-hidden"
              style={{ background: 'var(--b1)', cursor: zoom ? 'zoom-out' : 'zoom-in' }}
              onClick={() => setZoom(z => !z)}
            >
              <AnimatePresence mode="wait">
                <motion.div key={imgIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LazyImage
                    src={product.images[imgIdx]}
                    alt={product.name_uk}
                    aspectRatio="aspect-[3/4]"
                    priority={true}
                    className={`transition-transform duration-500 ${zoom ? 'scale-[1.5]' : 'scale-100'}`}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows */}
              {hasGalleryNavigation && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + product.images.length) % product.images.length) }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(245,240,232,0.95)',
                      border: '1px solid var(--bd2)',
                      color: 'var(--t0)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % product.images.length) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(245,240,232,0.95)',
                      border: '1px solid var(--bd2)',
                      color: 'var(--t0)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    }}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                {product.is_new      && <span className="badge badge-new">New</span>}
                {product.is_limited  && <span className="badge badge-sale">Лімітед</span>}
                {discount            && <span className="badge badge-sale">−{discount}%</span>}
              </div>

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1"
                style={{ background: 'rgba(245,240,232,0.85)', fontSize: 10, letterSpacing: 1, color: 'var(--t2)' }}
                onClick={e => e.stopPropagation()}>
                <Camera size={12} /> {zoom ? 'Зменшити' : 'Збільшити'}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className="flex-shrink-0 overflow-hidden transition-all"
                  style={{
                    width: 80, border: `1px solid ${i === imgIdx ? 'var(--gold)' : 'var(--bd)'}`,
                    padding: 0, background: 'none',
                  }}>
                  <LazyImage src={img} alt={`${product.name_uk} ${i + 1}`} aspectRatio="aspect-[3/4]" className="w-20" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Product info ── */}
          <div>
            {/* Category + origin */}
            <div className="flex items-center gap-3 mb-4">
              <span className="label-xs">{product.category}</span>
              {product.origin && (
                <>
                  <span style={{ color: 'var(--bd)' }}>·</span>
                  <span className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--t2)' }}>
                    <MapPin size={11} /> {product.origin}
                  </span>
                </>
              )}
            </div>

            <h1 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 'clamp(30px,4vw,48px)', fontWeight: 700, color: 'var(--t0)', lineHeight: 1.1, marginBottom: 6 }}>
              {product.name_uk}
            </h1>
            {product.subtitle && (
              <p className="label-xs mb-5" style={{ color: 'var(--t2)' }}>{product.subtitle}</p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-4 mb-7">
              <StarRating rating={product.rating} count={product.review_count} size={16} />
              <button onClick={() => setActiveTab('reviews')} className="text-[12px] hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--t2)', background: 'none', border: 'none', letterSpacing: 1 }}>
                Читати відгуки
              </button>
            </div>



            {/* Short description */}
            <p style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--t1)', marginBottom: 24 }}>
              {product.description}
            </p>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-7 py-3 px-4" style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
              {product.in_stock ? (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--sage)' }} />
                  <span style={{ fontSize: 12, color: 'var(--sage)', letterSpacing: 1 }}>
                    {product.stock_count && product.stock_count <= 5 ? `Залишилось лише ${product.stock_count} шт.` : 'В наявності'}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--rose)' }} />
                  <span style={{ fontSize: 12, color: 'var(--rose)', letterSpacing: 1 }}>Немає в наявності</span>
                </>
              )}
            </div>

            {/* Weight options */}
            {weightOptions.length > 0 && (
              <div className="mb-7">
                <div className="flex justify-between items-center mb-3">
                  <p className="label-xs">Вага: <span style={{ color: 'var(--t0)', letterSpacing: 1 }}>{selectedWeight || 'не обрано'}</span></p>
                  <span style={{ fontSize: 11, color: 'var(--t2)', letterSpacing: 1 }}>{product.unit}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {weightOptions.map(option => (
                    <button key={option} onClick={() => setSelectedWeight(option)}
                      className="transition-all"
                      style={{
                        minWidth: 80, height: 42, paddingInline: 12, border: `1px solid ${selectedWeight === option ? 'var(--t0)' : 'var(--bd)'}`,
                        background: selectedWeight === option ? 'var(--t0)' : 'none',
                        color: selectedWeight === option ? 'var(--t-inv)' : 'var(--t1)',
                        fontSize: 13,
                      }}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to cart */}
            <div className="flex gap-3 mb-8">
              <div className="flex items-center" style={{ border: '1px solid var(--bd)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-12 h-14 flex items-center justify-center hover:bg-[var(--b1)] transition-colors"
                  style={{ background: 'none', border: 'none', color: 'var(--t0)' }}>
                  <Minus size={15} />
                </button>
                <span style={{ width: 48, textAlign: 'center', fontSize: 15, color: 'var(--t0)', borderLeft: '1px solid var(--bd)', borderRight: '1px solid var(--bd)', lineHeight: '56px' }}>
                  {qty}
                </span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-12 h-14 flex items-center justify-center hover:bg-[var(--b1)] transition-colors"
                  style={{ background: 'none', border: 'none', color: 'var(--t0)' }}>
                  <Plus size={15} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={!product.in_stock || adding}
                className="flex-1 flex items-center justify-center gap-3 h-14 text-[11px] tracking-[2px] uppercase transition-all"
                style={{
                  background: adding ? 'var(--gold-l)' : 'var(--b-inv)',
                  color: adding ? 'white' : 'var(--t-inv)',
                  border: 'none',
                  opacity: !product.in_stock ? 0.5 : 1,
                  fontFamily: 'Jost, sans-serif',
                }}>
                <ShoppingBag size={17} />
                {adding ? 'Додано!' : 'Додати до кошика'}
              </motion.button>

              <button onClick={() => { toggle(product.id); toast(wished ? 'Видалено зі списку' : 'Додано до бажань', { className: 'hot-toast' }) }}
                className="w-14 h-14 flex items-center justify-center transition-all"
                style={{ border: `1px solid ${wished ? 'var(--berry)' : 'var(--bd)'}`, background: wished ? 'var(--berry)' : 'none', color: wished ? 'white' : 'var(--t0)' }}>
                <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
              </button>

              <SocialShare
                compact
                title={product.name_uk}
                description={product.description}
                image={product.images[0]}
                url={`https://bionerica.ua/product/${product.slug}`}
                price={product.price}
              />
            </div>

            {/* Perks */}
            <div className="flex flex-col gap-3 py-6" style={{ borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)' }}>
              {[
                [Truck,   'Доставка в день збору або наступного дня (Нова Пошта, курʼєр)'],
                [Shield,  'Контроль якості на кожному етапі вирощування'],
                [Leaf,    product.is_organic ? 'Органічне вирощування без пестицидів' : 'Натуральне вирощування'],
                [Package, `Походження: ${product.origin || 'Україна'} · Термін: ${product.shelf_life || 'залежить від партії'}`],
              ].map(([Icon, text], i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.5 }}>{text as string}</span>
                </div>
              ))}
            </div>

            {/* Attributes */}
            <div className="mt-6 flex flex-col gap-2">
              {attributes.map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--bd)', fontSize: 13 }}>
                  <span style={{ color: 'var(--t2)', letterSpacing: 1 }}>{k as string}</span>
                  <span style={{ color: 'var(--t0)' }}>{v as string}</span>
                </div>
              ))}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 px-3 py-2" style={{ border: '1px solid var(--bd)', fontSize: 11, color: 'var(--t2)' }}>
                <Leaf size={13} style={{ color: 'var(--gold)' }} /> Свіжий збір
              </div>
              {product.is_seasonal && (
                <div className="flex items-center gap-2 px-3 py-2" style={{ border: '1px solid var(--bd)', fontSize: 11, color: 'var(--t2)' }}>
                  🌤️ Сезонний продукт
                </div>
              )}
              {product.is_organic && (
                <div className="flex items-center gap-2 px-3 py-2" style={{ border: '1px solid var(--bd)', fontSize: 11, color: 'var(--t2)' }}>
                  ✅ Органічно
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2" style={{ border: '1px solid var(--bd)', fontSize: 11, color: 'var(--t2)' }}>
                🇺🇦 Made in Ukraine
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs: description, benefits, storage, origin, reviews ── */}
        <div className="mb-24">
          <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--bd)', marginBottom: 40 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? 'var(--gold)' : 'transparent'}`,
                  padding: '14px 24px', marginBottom: -1, whiteSpace: 'nowrap',
                  fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                  color: activeTab === t.id ? 'var(--t0)' : 'var(--t2)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ maxWidth: 780 }}
            >
              {activeTab === 'description' && (
                <div style={{ fontSize: 15, lineHeight: 2, color: 'var(--t1)' }}>
                  {product.description_long?.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: 20 }}>{para}</p>
                  )) || <p>{product.description}</p>}
                </div>
              )}

              {activeTab === 'benefits' && product.benefits && (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 24, lineHeight: 1.7 }}>
                    Основні переваги цього продукту для здоров'я:
                  </p>
                  <div className="flex flex-col gap-4">
                    {product.benefits.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4" style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                        <span style={{ width: 28, height: 28, background: 'var(--gold)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <p style={{ fontSize: 14, color: 'var(--t0)', lineHeight: 1.6 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'storage' && product.storage && (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 24, lineHeight: 1.7 }}>
                    Рекомендації щодо зберігання, щоб продукт залишався свіжим довше:
                  </p>
                  <div className="flex flex-col gap-4">
                    {product.storage.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4" style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                        <span style={{ width: 28, height: 28, background: 'var(--gold)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <p style={{ fontSize: 14, color: 'var(--t0)', lineHeight: 1.6 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'origin' && (
                <div>
                  <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--t1)', marginBottom: 24 }}>
                    {product.origin || 'Україна'}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ['🌱', 'Власне господарство', 'Вирощуємо на власних фермерських ділянках'],
                      ['☀️', 'Сезонний збір', 'Продукти збираються в піковий період стиглості'],
                      ['🚚', 'Швидка логістика', 'Доставляємо в день збору або наступного ранку'],
                      ['✅', 'Контроль якості', 'Кожну партію перевіряємо перед відправкою'],
                    ].map(([icon, title, desc]) => (
                      <div key={title as string} className="p-5" style={{ border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                        <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{icon}</span>
                        <p style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--t0)', marginBottom: 4 }}>{title as string}</p>
                        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{desc as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {/* Summary */}
                  <div className="flex items-center gap-8 mb-8 pb-8" style={{ borderBottom: '1px solid var(--bd)' }}>
                    <div className="text-center">
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, color: 'var(--t0)', lineHeight: 1 }}>{product.rating}</p>
                      <div className="flex justify-center gap-0.5 my-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={16} fill={i < Math.round(product.rating) ? 'var(--gold)' : 'none'} stroke="var(--gold)" />
                        ))}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--t2)' }}>{product.review_count} відгуків</p>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const pct = star >= 4 ? (star === 5 ? 78 : 18) : (star === 3 ? 4 : 0)
                        return (
                          <div key={star} className="flex items-center gap-3 mb-2">
                            <span style={{ fontSize: 12, color: 'var(--t2)', width: 12 }}>{star}</span>
                            <Star size={11} fill="var(--gold)" stroke="var(--gold)" />
                            <div className="flex-1 h-1.5" style={{ background: 'var(--b2)' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', transition: 'width 1s' }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--t2)', width: 28 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Reviews list */}
                  {productReviews.length > 0 ? (
                    <div className="flex flex-col gap-8">
                      {productReviews.map(r => (
                        <div key={r.id} className="pb-8" style={{ borderBottom: '1px solid var(--bd)' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--gold)', color: 'var(--b-inv)', fontSize: 14 }}>
                              {r.author.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p style={{ fontSize: 14, color: 'var(--t0)' }}>{r.author}</p>
                                {r.verified_purchase && <span className="badge badge-status-ok">Перевірена покупка</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} fill={i < r.rating ? 'var(--gold)' : 'none'} stroke="var(--gold)" />)}
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--t2)' }}>{r.created_at}</span>
                              </div>
                            </div>
                          </div>
                          {r.title && <p style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--t0)', marginBottom: 8 }}>{r.title}</p>}
                          <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.75 }}>{r.text}</p>
                          {r.images && r.images.length > 0 && (
                            <div className="flex gap-3 mt-4">
                              {r.images.map((img, i) => (
                                <LazyImage key={i} src={img} alt="" aspectRatio="aspect-square" className="w-20" />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-4">
                            <span style={{ fontSize: 12, color: 'var(--t2)' }}>Корисно?</span>
                            <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: '1px solid var(--bd)', padding: '4px 12px' }}>
                              Так ({r.helpful})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t0)', marginBottom: 8 }}>Будьте першим!</p>
                      <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 20 }}>Поки немає відгуків — залиште свій після покупки</p>
                      <Link to="/account/orders" className="btn-outline btn-sm">Залишити відгук</Link>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="pt-16" style={{ borderTop: '1px solid var(--bd)' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: 'var(--t0)', marginBottom: 40 }}>
              Вам також може сподобатись
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
