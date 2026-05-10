import { useEffect, useState, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Truck, CreditCard, Package, Gift, Tag, ArrowRight, Shield, Phone, ChevronDown } from 'lucide-react'
import { useCart, useAuth } from '@/store'
import { createOrder, adjustLoyaltyPoints } from '@/lib/supabase'
import { useDiscount } from '@/store/discount'
import { usePushNotifications } from '@/hooks/usePush'
import { useSEO } from '@/hooks/useSEO'
import { flushOfflineQueue, enqueueOfflineAction } from '@/lib/offlineQueue'
import { isLikelyNetworkError, retryWithBackoff } from '@/lib/network'
import toast from 'react-hot-toast'

type Form = {
  name: string
  email: string
  phone: string
  city: string
  address: string
  delivery: string
  payment: string
  deliveryDate: string
  subscription: 'none' | 'weekly' | 'biweekly'
  notes: string
}

const payments = [
  { value: 'liqpay',    label: 'LiqPay',           sub: 'Visa · Mastercard · GPay · ApplePay', icon: '💳', best: true },
  { value: 'mono',      label: 'Monobank',          sub: 'Картка Моно або Portmone',           icon: '🟡' },
  { value: 'wayforpay', label: 'WayForPay',         sub: 'Всі українські банки',               icon: '🔐' },
  { value: 'privat',    label: 'Приват24',           sub: 'Оплата через Приват24',              icon: '🟢' },
  { value: 'cod',       label: 'Накладений платіж', sub: 'Оплата при отриманні + ~50₴ комісія', icon: '💵' },
]

const deliveries = [
  { value: 'nova',        label: 'Нова Пошта (відділення)', price: 80,  free: 2000 },
  { value: 'nova_c',      label: 'Нова Пошта (кур\'єр)',    price: 130, free: 3000 },
  { value: 'ukr',         label: 'Укрпошта',                price: 60,  free: 2500 },
  { value: 'meest',       label: 'Meest Express',           price: 95,  free: 3000 },
  { value: 'pickup',      label: 'Самовивіз (Полтава)',      price: 0,   free: 0 },
]

export default function Checkout() {
  const { items, total, count, clear } = useCart()
  const { user, profile } = useAuth()
  const { appliedCode, applyCode, removeCode, getDiscount, getFreeShipping, loyaltyDiscount, applyLoyalty } = useDiscount()
  const { notify } = usePushNotifications()
  const [loading, setLoading] = useState(false)
  const [done, setDone]   = useState(false)
  const [orderId, setOrderId] = useState('')
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [dCost, setDCost] = useState(80)
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(true)
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useSEO({ title: 'Оформлення замовлення', noindex: true })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    defaultValues: {
      delivery: 'nova',
      payment: 'liqpay',
      deliveryDate: '',
      subscription: 'none',
    }
  })

  const wDel  = watch('delivery')
  const wPay  = watch('payment')
  const tot   = total()
  const disc  = getDiscount(tot)
  const promoDiscount = Math.max(0, disc - loyaltyDiscount)
  const fship = getFreeShipping()
  const shipCost = fship ? 0 : dCost
  const grand = Math.max(0, tot - disc + shipCost)
  const availablePoints = profile?.loyalty_points ?? 0
  const loyaltyAmount = useLoyaltyPoints
    ? Math.min(Math.floor(availablePoints * 0.5), Math.floor(tot * 0.3))
    : 0

  useEffect(() => {
    applyLoyalty(useLoyaltyPoints ? availablePoints : 0, tot)
  }, [applyLoyalty, useLoyaltyPoints, availablePoints, tot])

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const flushOrders = async () => {
      if (!navigator.onLine) return
      const { processed } = await flushOfflineQueue({
        'create-order': payload => Promise.resolve(createOrder(payload) as any),
      })
      if (processed > 0) {
        toast.success(`Відправлено ${processed} відкладених замовлень`, { className: 'hot-toast' })
      }
    }

    const onOnline = () => { void flushOrders() }
    window.addEventListener('online', onOnline)
    void flushOrders()

    return () => window.removeEventListener('online', onOnline)
  }, [])

  if (count() === 0 && !done) return <Navigate to="/cart" />

  const onPromo = () => {
    const r = applyCode(promoInput)
    toast[r.success ? 'success' : 'error'](r.message, { className: 'hot-toast' })
    if (r.success) setPromoOpen(false)
  }

  const formRef = useRef<Form | null>(null)

  const onSubmit = async (formData: Form) => {
    formRef.current = formData
    setLoading(true)
    const id = `BNR-${Math.floor(1000 + Math.random() * 9000)}`
    const orderPayload: Record<string, unknown> = {
      id,
      user_id: user?.id || null,
      email: formData.email || user?.email || null,
      total: grand,
      status: 'pending',
      delivery_method: formData.delivery,
      payment_method: formData.payment,
      notes: formData.notes || null,
      loyalty_points_used: loyaltyAmount > 0 ? Math.ceil(loyaltyAmount / 0.5) : 0,
      items: items.map(i => ({
        id: i.product.id,
        name: i.product.name_uk,
        price: i.product.price,
        qty: i.qty,
        image: i.product.images?.[0] || null,
      })),
      address: [formData.address, formData.city].filter(Boolean).join(', ') || null,
    }

    try {
      await retryWithBackoff(() => Promise.resolve(createOrder(orderPayload) as any), { retries: 2, baseDelayMs: 350 })

      // ── Loyalty: deduct spent points, then earn new ones ──
      if (user?.id) {
        const pointsSpent = loyaltyAmount > 0 ? Math.ceil(loyaltyAmount / 0.5) : 0
        const pointsEarned = Math.floor(grand / 20)
        const delta = pointsEarned - pointsSpent
        if (delta !== 0) {
          void adjustLoyaltyPoints(user.id, delta)
        }
      }
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        enqueueOfflineAction('create-order', orderPayload)
        toast('Немає мережі: замовлення збережено і буде відправлено автоматично', { className: 'hot-toast', duration: 4500 })
      }
    }
    setOrderId(id); clear(); setDone(true); setLoading(false)
    notify.orderConfirmed(id)
    toast.success(`Замовлення ${id} прийнято!`, { className: 'hot-toast', duration: 5000 })
  }

  if (done) return (
    <div className="section" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14 }}
        style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={36} color="white" strokeWidth={2.5} />
      </motion.div>
      <div>
        <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Успішно!</p>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 'clamp(36px,5vw,52px)', fontWeight: 700, color: 'var(--t0)', marginBottom: 8 }}>Дякуємо!</h1>
        <p style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--gold-d)', marginBottom: 16 }}>{orderId}</p>
        <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.8, maxWidth: 440, margin: '0 auto 32px' }}>
          Підтвердження надіслано на email. Зв'яжемось для підтвердження часу доставки свіжого збору.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user && <Link to="/account/orders" className="btn-dark">Мої замовлення</Link>}
          <Link to="/catalog" className="btn-outline">Продовжити покупки</Link>
        </div>
        {/* Referral */}
        <div style={{ marginTop: 36, padding: 24, border: '1px solid var(--bd)', background: 'var(--b1)', maxWidth: 420, margin: '36px auto 0' }}>
          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Запросіть друга</p>
          <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 12, lineHeight: 1.6 }}>Ваш друг отримає 10% знижки, а ви — 200₴ бонусів</p>
          <div style={{ display: 'flex', border: '1px solid var(--bd)' }}>
            <input readOnly value={`https://bionerica.ua/?ref=${user?.id?.slice(0,8) || 'GUEST'}`}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 14px', fontSize: 12, color: 'var(--t2)', fontFamily: 'Jost, sans-serif', outline: 'none' }} />
            <button onClick={() => { navigator.clipboard.writeText('https://bionerica.ua'); toast.success('Скопійовано!', { className: 'hot-toast' }) }}
              style={{ padding: '10px 16px', background: 'var(--gold)', border: 'none', color: '#18160e', fontSize: 11, letterSpacing: 1.5, fontFamily: 'Jost, sans-serif', cursor: 'none' }}>
              Копіювати
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const Step = ({ n, label }: { n: number; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 28, height: 28, background: 'var(--t0)', color: 'var(--t-inv)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0 }}>{n}</div>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)' }}>{label}</h2>
    </div>
  )

  const RadioCard = ({ checked, children }: { checked: boolean; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', border: `1px solid ${checked ? 'var(--t0)' : 'var(--bd)'}`, background: checked ? 'var(--b1)' : 'transparent', transition: 'all 0.15s', cursor: 'none' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${checked ? 'var(--t0)' : 'var(--bd)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--t0)' }} />}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ background: 'var(--b0)' }}>
      <div style={{ background: 'var(--b1)', borderBottom: '1px solid var(--bd)', padding: '20px 0' }}>
        <div className="page-wrap">
          <nav style={{ fontSize: 12, color: 'var(--t2)', letterSpacing: 1, marginBottom: 8 }}>
            <Link to="/" style={{ color: 'var(--t2)' }}>Головна</Link> › <Link to="/cart" style={{ color: 'var(--t2)' }}>Кошик</Link> › <span style={{ color: 'var(--t0)' }}>Оформлення</span>
          </nav>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(30px,4vw,44px)', fontWeight: 300, color: 'var(--t0)' }}>
            Оформлення замовлення
          </h1>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1px solid ${isOnline ? 'rgba(74,140,63,0.32)' : 'rgba(192,92,78,0.35)'}`, background: isOnline ? 'rgba(74,140,63,0.08)' : 'rgba(192,92,78,0.08)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--sage)' : 'var(--rose)' }} />
            <span style={{ fontSize: 11, color: isOnline ? 'var(--sage)' : 'var(--rose)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {isOnline ? 'Онлайн: замовлення відправляється одразу' : 'Офлайн: замовлення буде поставлено у чергу'}
            </span>
          </div>
        </div>
      </div>

      <div className="page-wrap py-14 pb-24">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 32 }} className="lg:grid-cols-[1fr_360px] lg:gap-[48px]">
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Contact */}
            <section><Step n={1} label="Контактні дані" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 20 }}>
                <div className="field-wrap"><label className="field-label">Ім'я та прізвище *</label>
                  <input className="field-input" placeholder="Оксана Коваленко" {...register('name', { required: true })} /></div>
                <div className="field-wrap"><label className="field-label">Телефон *</label>
                  <input className="field-input" type="tel" placeholder="+38 (0XX) XXX-XX-XX" {...register('phone', { required: true })} /></div>
                <div className="field-wrap" style={{ gridColumn: '1 / -1' }}><label className="field-label">Email *</label>
                  <input className="field-input" type="email" placeholder="your@email.com" {...register('email', { required: true })} /></div>
              </div>
            </section>

            {/* Delivery */}
            <section><Step n={2} label="Доставка" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {deliveries.map(d => (
                  <label key={d.value} style={{ cursor: 'none' }}>
                    <input type="radio" value={d.value} {...register('delivery')}
                      onChange={() => setDCost(d.price)} style={{ display: 'none' }} />
                    <RadioCard checked={wDel === d.value}>
                      <Package size={14} style={{ color: 'var(--t2)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: 'var(--t0)' }}>{d.label}</p>
                        {d.free > 0 && tot < d.free && <p style={{ fontSize: 11, color: 'var(--t2)' }}>Безкоштовно від {d.free.toLocaleString()} ₴</p>}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--sage)', flexShrink: 0 }}>
                        Безкоштовно
                      </span>
                    </RadioCard>
                  </label>
                ))}
              </div>
              {wDel !== 'pickup' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 20 }}>
                  <div className="field-wrap"><label className="field-label">Місто *</label>
                    <input className="field-input" placeholder="Київ" {...register('city', { required: true })} /></div>
                  <div className="field-wrap"><label className="field-label">Відділення / адреса *</label>
                    <input className="field-input" placeholder="Відд. №5" {...register('address', { required: true })} /></div>
                  <div className="field-wrap" style={{ gridColumn: '1 / -1' }}><label className="field-label">Бажана дата доставки *</label>
                    <input className="field-input" type="date" {...register('deliveryDate', { required: true })} /></div>
                </div>
              )}
            </section>

            {/* Subscription */}
            <section><Step n={3} label="Підписка на бокси" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'none', label: 'Без підписки', sub: 'Разове замовлення' },
                  { value: 'weekly', label: 'Щотижня', sub: 'Свіжий бокс щотижня (–5%)' },
                  { value: 'biweekly', label: 'Раз на 2 тижні', sub: 'Зручний регулярний графік (–3%)' },
                ].map((opt) => (
                  <label key={opt.value} style={{ cursor: 'none' }}>
                    <input type="radio" value={opt.value} {...register('subscription')} style={{ display: 'none' }} />
                    <RadioCard checked={watch('subscription') === opt.value}>
                      <Gift size={14} style={{ color: 'var(--t2)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: 'var(--t0)' }}>{opt.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>{opt.sub}</p>
                      </div>
                    </RadioCard>
                  </label>
                ))}
              </div>
            </section>

            {/* Payment */}
            <section><Step n={4} label="Оплата" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {payments.map(p => (
                  <label key={p.value} style={{ cursor: 'none' }}>
                    <input type="radio" value={p.value} {...register('payment')} style={{ display: 'none' }} />
                    <RadioCard checked={wPay === p.value}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--t0)' }}>{p.label}</span>
                          {p.best && <span style={{ fontSize: 9, background: 'var(--sage)', color: 'white', padding: '2px 6px', letterSpacing: 1 }}>Рекомендуємо</span>}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>{p.sub}</p>
                      </div>
                      <Shield size={13} style={{ color: 'var(--bd)', flexShrink: 0 }} />
                    </RadioCard>
                  </label>
                ))}
              </div>
            </section>

            {/* Promo */}
            <div>
              <button type="button" onClick={() => setPromoOpen(!promoOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontSize: 13, color: 'var(--gold-d)', cursor: 'none', fontFamily: 'Jost, sans-serif' }}>
                <Gift size={14} />
                {appliedCode ? `✓ Промокод «${appliedCode.code}» застосовано` : 'Є промокод або подарунковий сертифікат?'}
                {!appliedCode && <ChevronDown size={13} style={{ transform: promoOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
              </button>
              <AnimatePresence>
                {promoOpen && !appliedCode && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', border: '1px solid var(--bd)' }}>
                      <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="WELCOME10"
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '11px 14px', fontSize: 13, color: 'var(--t0)', fontFamily: 'Jost, sans-serif', letterSpacing: 2 }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onPromo())} />
                      <button type="button" onClick={onPromo}
                        style={{ padding: '11px 18px', background: 'var(--t0)', border: 'none', color: 'var(--t-inv)', fontSize: 11, letterSpacing: 2, fontFamily: 'Jost, sans-serif', cursor: 'none' }}>OK</button>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 5 }}>Спробуйте: WELCOME10 · BROIDERIE15 · FREESHIP</p>
                  </motion.div>
                )}
                {appliedCode && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Tag size={13} style={{ color: 'var(--sage)' }} />
                    <span style={{ fontSize: 12, color: 'var(--sage)' }}>{appliedCode.description}</span>
                    <button type="button" onClick={removeCode} style={{ fontSize: 11, color: 'var(--rose)', background: 'none', border: 'none', cursor: 'none' }}>Видалити</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Loyalty */}
            {availablePoints > 0 && (
              <div style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: 14 }}>
                <label className="flex items-center justify-between gap-4" style={{ cursor: 'none' }}>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 4 }}>
                      Використати бонусні бали ({availablePoints})
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--t2)' }}>
                      Максимум 30% від суми замовлення. Зараз: -{loyaltyAmount.toLocaleString('uk-UA')} ₴
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--gold)' }}
                  />
                </label>
              </div>
            )}

            <div className="field-wrap">
              <label className="field-label">Коментар</label>
              <textarea className="field-input" rows={3} {...register('notes')} placeholder="Побажання, зручний час дзвінка..." style={{ resize: 'none' }} />
            </div>

            <div>
              <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.6 }}>
                Оформлюючи замовлення, ви погоджуєтесь з{' '}
                <Link to="/terms" style={{ color: 'var(--gold-d)', textDecoration: 'underline' }}>умовами</Link> та{' '}
                <Link to="/privacy" style={{ color: 'var(--gold-d)', textDecoration: 'underline' }}>політикою конфіденційності</Link>
              </p>
              <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                className="btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingInline: 36 }}>
                {loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'block' }} /> Обробляємо...</>
                  : <><CreditCard size={15} /> {isOnline ? 'Підтвердити та оплатити' : 'Підтвердити (в чергу)'} <ArrowRight size={14} /></>
                }
              </motion.button>
            </div>
          </form>

          {/* Summary sidebar */}
          <div style={{ position: 'sticky', top: 96 }}>
            <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 'clamp(14px, 3.4vw, 22px)', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 300, color: 'var(--t0)', marginBottom: 14 }}>Замовлення ({count()})</h3>
              {items.map(({ product, qty, weight_option }) => (
                <div key={`${product.id}-${weight_option || 'd'}`} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <img src={product.images[0]} alt={product.name_uk} style={{ width: 48, height: 60, objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: 'var(--t0)', lineHeight: 1.2 }}>{product.name_uk}</p>
                    <p style={{ fontSize: 11, color: 'var(--t2)' }}>× {qty}{weight_option ? ` · ${weight_option}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 'clamp(14px, 3.4vw, 22px)' }}>
              <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 14 }}>
                Підсумок
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, borderBottom: '1px solid var(--bd)', paddingBottom: 12, marginBottom: 12 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Товари</span>
                  <span style={{ fontSize: 13, color: 'var(--t0)' }}>{tot.toLocaleString('uk-UA')} ₴</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Доставка</span>
                  <span style={{ fontSize: 13, color: 'var(--t0)' }}>{shipCost === 0 ? 'Безкоштовно' : `${shipCost.toLocaleString('uk-UA')} ₴`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Знижки</span>
                  <span style={{ fontSize: 13, color: 'var(--sage)' }}>-{promoDiscount.toLocaleString('uk-UA')} ₴</span>
                </div>
                {useLoyaltyPoints && loyaltyDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: 'var(--t2)' }}>Бонусні бали</span>
                    <span style={{ fontSize: 13, color: 'var(--gold-d)' }}>-{loyaltyDiscount.toLocaleString('uk-UA')} ₴</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--t0)' }}>Разом</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--gold-d)' }}>{grand.toLocaleString('uk-UA')} ₴</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {['🔒 Безпечна оплата SSL/TLS', '🚚 Доставка свіжого збору', '🌱 Контроль якості ферми'].map(t => (
                  <p key={t} style={{ fontSize: 11, color: 'var(--t2)' }}>{t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
