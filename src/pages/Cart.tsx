// Cart.tsx
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/store'
import LazyImage from '@/components/ui/LazyImage'
import { Breadcrumb } from '@/components/ui'
import ProductCard from '@/components/ui/ProductCard'
import { products } from '@/data'

export default function Cart() {
  const { items, remove, setQty, total, count, savings, clear } = useCart()
  const t = total(), c = count(), s = savings()
  const delivery = t >= 2000 ? 0 : 150
  const recommended = products.filter(p => !items.some(i => i.product.id === p.id)).slice(0, 4)

  if (c === 0) return (
    <div className="section" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div className="orn-bg w-32 h-32 rounded-full flex items-center justify-center opacity-30">
        <ShoppingBag size={44} style={{ color: 'var(--gold)' }} />
      </div>
      <div className="text-center">
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: 'var(--t0)', marginBottom: 12 }}>Кошик порожній</h2>
        <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 32 }}>Додайте вироби наших майстринь</p>
        <Link to="/catalog" className="btn-dark">До каталогу <ArrowRight size={16} /></Link>
      </div>
    </div>
  )

  return (
    <div>
      <div className="section-sm" style={{ background: 'var(--b1)', borderBottom: '1px solid var(--bd)' }}>
        <div className="page-wrap">
          <Breadcrumb items={[{ label: 'Головна', to: '/' }, { label: 'Кошик' }]} />
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: 'var(--t0)', marginTop: 12 }}>
            Кошик <span style={{ fontSize: '0.5em', color: 'var(--t2)' }}>({c} товар)</span>
          </h1>
        </div>
      </div>

      <div className="page-wrap py-12 pb-24">
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">
          <div>
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_44px] gap-4 pb-3 mb-3" style={{ borderBottom: '1px solid var(--bd)', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--t2)' }}>
              <span>Товар</span><span>Ціна</span><span>Кількість</span><span>Сума</span><span />
            </div>

            <AnimatePresence>
              {items.map(({ product, qty, weight_option }) => (
                <motion.div key={`${product.id}-${weight_option || 'default'}`} layout exit={{ opacity: 0, x: -20 }}
                  className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_44px] gap-4 items-center py-5"
                  style={{ borderBottom: '1px solid var(--bd)' }}>
                  <Link to={`/product/${product.slug}`} className="flex gap-4 items-center">
                    <div className="w-20 flex-shrink-0">
                      <LazyImage src={product.images[0]} alt={product.name_uk} aspectRatio="aspect-[3/4]" className="w-20" />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 300, color: 'var(--t0)', marginBottom: 4 }}>{product.name_uk}</h3>
                      <p style={{ fontSize: 11, color: 'var(--t2)' }}>{product.category}{weight_option && ` · ${weight_option}`}</p>
                    </div>
                  </Link>
                  <div className="flex items-center" style={{ border: '1px solid var(--bd)', width: 'fit-content' }}>
                    <button onClick={() => setQty(product.id, qty - 1)} className="w-9 h-10 flex items-center justify-center hover:bg-[var(--b1)]" style={{ background: 'none', border: 'none', color: 'var(--t0)' }}><Minus size={13} /></button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 13, borderLeft: '1px solid var(--bd)', borderRight: '1px solid var(--bd)', lineHeight: '40px', color: 'var(--t0)' }}>{qty}</span>
                    <button onClick={() => setQty(product.id, qty + 1)} className="w-9 h-10 flex items-center justify-center hover:bg-[var(--b1)]" style={{ background: 'none', border: 'none', color: 'var(--t0)' }}><Plus size={13} /></button>
                  </div>
                  <button onClick={() => remove(product.id)} className="flex items-center justify-center hover:text-[var(--rose)] transition-colors" style={{ background: 'none', border: 'none', color: 'var(--t2)' }}>
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between pt-5">
              <button onClick={clear} className="btn-ghost text-[11px]">Очистити кошик</button>
              <Link to="/catalog" className="btn-ghost text-[11px]">← Продовжити покупки</Link>
            </div>
          </div>

          <div className="sticky top-24">
            <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 28 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--bd)' }}>Підсумок</h3>
              <div className="flex mb-4" style={{ border: '1px solid var(--bd)' }}>
                <input placeholder="Промокод" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '11px 14px', fontSize: 13, color: 'var(--t0)', fontFamily: 'Jost, sans-serif' }} />
                <button style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--bd)', padding: '11px 14px', fontSize: 11, color: 'var(--gold-d)', letterSpacing: 1 }}>OK</button>
              </div>
              <Link to="/checkout" className="btn-dark w-full justify-center" style={{ display: 'flex', marginBottom: 12 }}>
                Оформити замовлення <ArrowRight size={16} />
              </Link>
              <p style={{ fontSize: 11, color: 'var(--t2)', textAlign: 'center' }}>Visa · Mastercard · LiqPay · Monobank · Накладений платіж</p>
            </div>
          </div>
        </div>

        {/* Recommended */}
        {recommended.length > 0 && (
          <div className="mt-20 pt-16" style={{ borderTop: '1px solid var(--bd)' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--t0)', marginBottom: 36 }}>Можливо, вас зацікавить</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommended.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
