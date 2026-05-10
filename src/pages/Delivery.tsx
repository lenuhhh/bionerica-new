// Delivery.tsx
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useSEO } from '@/hooks/useSEO'
import { Truck, Clock, Globe, CreditCard, RotateCcw, Shield, Package, CheckCircle } from 'lucide-react'

export default function Delivery() {
  useSEO({
    title: 'Доставка та оплата',
    description: 'Умови доставки та оплати замовлень Broiderie. Нова Пошта, Укрпошта, міжнародна доставка. Безкоштовна доставка від 2000₴.',
    url: '/delivery',
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div style={{ background: 'var(--b0)' }}>
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
        <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="page-wrap py-20">
            <div className="flex items-center gap-3 mb-4">
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Сервіс</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)' }}>
              Доставка та <em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>оплата</em>
            </h1>
          </div>
        </motion.div>
      </div>

      <div className="page-wrap section">
        {/* Delivery methods */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-3">
            <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'block' }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)' }}>Доставка по Україні</h2>
          </div>
          <div style={{ height: 1, background: 'var(--bd)', marginBottom: 28 }} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: 'Нова Пошта', subtitle: 'Відділення', time: '1–2 дні', price: '80 ₴', free: 'від 2 000 ₴', note: 'Також кур\'єр у межах міста' },
              { icon: Truck, title: 'Укрпошта',   subtitle: 'Відділення', time: '3–7 днів', price: '50 ₴', free: 'від 2 000 ₴', note: 'Рекомендовано для сіл' },
              { icon: Package, title: 'Самовивіз', subtitle: 'м. Полтава, атьє', time: 'У день замовлення', price: 'Безкоштовно', free: '', note: 'Пн–Пт 10:00–19:00, Сб 11:00–17:00' },
            ].map(d => (
              <div key={d.title} style={{ padding: 24, border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                <d.icon size={22} style={{ color: 'var(--gold)', marginBottom: 14 }} />
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)', marginBottom: 4 }}>{d.title}</h3>
                <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--t2)', textTransform: 'uppercase', marginBottom: 16 }}>{d.subtitle}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--t2)' }}>Термін</span><span style={{ color: 'var(--t0)' }}>{d.time}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--t2)' }}>Вартість</span><span style={{ color: 'var(--t0)' }}>{d.price}</span></div>
                  {d.free && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--t2)' }}>Безкоштовно</span><span style={{ color: 'var(--sage)' }}>{d.free}</span></div>}
                </div>
                {d.note && <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bd)', lineHeight: 1.5 }}>{d.note}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* International */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-3">
            <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'block' }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)' }}>Міжнародна доставка</h2>
          </div>
          <div style={{ height: 1, background: 'var(--bd)', marginBottom: 28 }} />
          <div className="grid sm:grid-cols-2 gap-6">
            <div style={{ padding: 24, border: '1px solid var(--bd)', background: 'var(--b1)' }}>
              <Globe size={22} style={{ color: 'var(--gold)', marginBottom: 14 }} />
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>Доставляємо у 50+ країн</h3>
              {[
                ['Нова Пошта International', '7–14 днів', '300–600 ₴'],
                ['DHL Express', '3–7 днів', '700–1500 ₴'],
                ['Укрпошта (EMS)', '14–21 день', '200–400 ₴'],
              ].map(([n, t, p]) => (
                <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}>
                  <span style={{ color: 'var(--t1)' }}>{n}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--t0)', display: 'block' }}>{t}</span>
                    <span style={{ color: 'var(--t2)', fontSize: 11 }}>{p}</span>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 14, lineHeight: 1.6 }}>
                * Митні збори та податки оплачує покупець відповідно до законодавства своєї країни.
              </p>
            </div>
            <div style={{ padding: 24, background: '#1a1612', position: 'relative', overflow: 'hidden' }}>
              <div className="absolute inset-0 orn-bg" style={{ opacity: 0.06 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Clock size={22} style={{ color: 'var(--gold)', marginBottom: 14 }} />
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Важливо знати</p>
                {[
                  'Відстеження посилки в особистому кабінеті',
                  'SMS та email сповіщення при зміні статусу',
                  'Страхування вантажу до 5 000 ₴ включено',
                  'Фото упаковки до відправки за запитом',
                  'При пошкодженні — повна компенсація',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <CheckCircle size={14} style={{ color: 'var(--sage)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.65)', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-3">
            <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'block' }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)' }}>Оплата</h2>
          </div>
          <div style={{ height: 1, background: 'var(--bd)', marginBottom: 28 }} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: CreditCard, title: 'Картка онлайн', desc: 'Visa, Mastercard через LiqPay або Stripe. Безпечно, миттєво.' },
              { icon: Shield,     title: 'Apple/Google Pay', desc: 'Один дотик — і оплата готова. Підтримується на iOS та Android.' },
              { icon: Package,    title: 'Накладений платіж', desc: 'Оплата при отриманні в Новій Пошті. Лише по Україні.' },
              { icon: Globe,      title: 'PayPal / SWIFT', desc: 'Для міжнародних замовлень. Деталі — при оформленні.' },
            ].map(p => (
              <div key={p.title} style={{ padding: 20, border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                <p.icon size={20} style={{ color: 'var(--gold)', marginBottom: 12 }} />
                <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>{p.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Returns */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'block' }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)' }}>Повернення та обмін</h2>
          </div>
          <div style={{ height: 1, background: 'var(--bd)', marginBottom: 28 }} />
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>Умови повернення</h3>
              {[
                ['Термін', '14 днів з дати отримання'],
                ['Стан', 'Виріб не носився, зберіг вигляд та бирки'],
                ['Упаковка', 'Оригінальна упаковка або аналогічна'],
                ['Доставка назад', 'За рахунок покупця'],
                ['Повернення коштів', '3–5 робочих днів'],
                ['Індивідуальні вироби', 'Не підлягають поверненню'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}>
                  <span style={{ color: 'var(--t2)' }}>{k}</span>
                  <span style={{ color: 'var(--t0)', textAlign: 'right', maxWidth: 200 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>Як повернути</h3>
              {[
                'Напишіть нам на hello@broiderie.ua або у Telegram',
                'Вкажіть номер замовлення та причину повернення',
                'Ми підтвердимо і надішлемо адресу повернення',
                'Відправте виріб у надійній упаковці',
                'Після отримання та перевірки — повернення коштів',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <span style={{ width: 28, height: 28, background: 'var(--gold)', color: '#18160e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0, borderRadius: '50%' }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6, paddingTop: 4 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
