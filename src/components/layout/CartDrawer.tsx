import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Gift } from 'lucide-react'
import { useCart } from '@/store'
import LazyImage from '@/components/ui/LazyImage'

export default function CartDrawer() {
  const { items, isOpen, close, remove, setQty, total, count, savings } = useCart()
  const t = total()
  const delivery = t >= 2000 ? 0 : 150
  const savingsAmt = savings()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(30,27,23,0.55)' }}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[101] flex flex-col"
            style={{ width: 420, maxWidth: '100vw', background: 'var(--b0)', borderLeft: '1px solid var(--bd)', boxShadow: 'var(--sh-lg)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--bd)' }}>
              <div className="flex items-center gap-3">
                <ShoppingBag size={19} style={{ color: 'var(--gold)' }} />
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)' }}>
                  Кошик
                </h2>
                {count() > 0 && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                    style={{ background: 'var(--gold)', color: 'var(--b-inv)' }}>
                    {count()}
                  </span>
                )}
              </div>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--t2)' }}
                className="hover:text-[var(--t0)] transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
                  <div className="orn-bg w-28 h-28 rounded-full opacity-30 flex items-center justify-center">
                    <ShoppingBag size={36} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>
                      Кошик порожній
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
                      Додайте вироби нашіх майстринь
                    </p>
                  </div>
                  <button onClick={close} className="btn-outline btn-sm">
                    До каталогу
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 flex flex-col gap-4">
                  <AnimatePresence>
                    {items.map(({ product, qty, weight_option }) => (
                      <motion.div
                        key={`${product.id}-${weight_option || 'default'}`}
                        layout
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4"
                        style={{ paddingBottom: 16, borderBottom: '1px solid var(--bd)' }}
                      >
                        <Link to={`/product/${product.slug}`} onClick={close} className="shrink-0 w-20">
                          <LazyImage src={product.images[0]} alt={product.name_uk} aspectRatio="aspect-[3/4]" className="w-20" />
                        </Link>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <Link to={`/product/${product.slug}`} onClick={close}>
                                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 300, color: 'var(--t0)', lineHeight: 1.2 }}>
                                  {product.name_uk}
                                </h3>
                              </Link>
                              <button onClick={() => remove(product.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--t2)', flexShrink: 0 }}
                                className="hover:text-[var(--rose)] transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 3 }}>
                              {product.category}
                              {weight_option && ` · ${weight_option}`}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Qty control */}
                            <div className="flex items-center" style={{ border: '1px solid var(--bd)' }}>
                              <button onClick={() => setQty(product.id, qty - 1)}
                                style={{ width: 30, height: 30, background: 'none', border: 'none', color: 'var(--t0)' }}
                                className="flex items-center justify-center hover:bg-[var(--b1)] transition-colors">
                                <Minus size={12} />
                              </button>
                              <span style={{ width: 30, textAlign: 'center', fontSize: 13, color: 'var(--t0)', borderLeft: '1px solid var(--bd)', borderRight: '1px solid var(--bd)', lineHeight: '30px' }}>
                                {qty}
                              </span>
                              <button onClick={() => setQty(product.id, qty + 1)}
                                style={{ width: 30, height: 30, background: 'none', border: 'none', color: 'var(--t0)' }}
                                className="flex items-center justify-center hover:bg-[var(--b1)] transition-colors">
                                <Plus size={12} />
                              </button>
                            </div>

                            <div className="text-right">
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Promo */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-sm" style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                    <Gift size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <input
                      placeholder="Промокод або подарунковий сертифікат"
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--t0)', fontFamily: 'Jost, sans-serif' }}
                    />
                    <button style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--gold)', background: 'none', border: 'none' }}>
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5" style={{ borderTop: '1px solid var(--bd)', background: 'var(--b1)' }}>
                {/* Delivery */}
                <div className="mb-3 flex items-center gap-2">
                  {delivery === 0 ? (
                    <p className="text-[12px] tracking-wide" style={{ color: 'var(--sage)' }}>
                      ✓ Безкоштовна доставка
                    </p>
                  ) : (
                    <p className="text-[12px]" style={{ color: 'var(--t2)' }}>
                      До безкоштовної доставки
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                {delivery > 0 && (
                  <div className="mb-4 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((t / 2000) * 100, 100)}%` }}
                      className="h-full rounded-full"
                      style={{ background: 'var(--gold)' }}
                    />
                  </div>
                )}

                {/* Savings */}
                {savingsAmt > 0 && (
                  <p className="text-[12px] mb-3" style={{ color: 'var(--sage)' }}>
                    Ваша економія
                  </p>
                )}

                {/* Total */}
                <div className="flex justify-between items-baseline mb-4">
                  <span style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--t2)' }}>Разом</span>
                </div>

                <Link to="/checkout" onClick={close}
                  className="btn-dark w-full justify-center mb-3"
                  style={{ display: 'flex' }}>
                  Оформити замовлення <ArrowRight size={16} />
                </Link>
                <Link to="/cart" onClick={close}
                  className="btn-ghost w-full justify-center text-center text-[11px]"
                  style={{ display: 'block', paddingBottom: 0, border: 'none' }}>
                  Переглянути кошик
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
