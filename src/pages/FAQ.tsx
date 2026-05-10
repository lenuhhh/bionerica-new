// FAQ.tsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ChevronDown, Search, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSEO, buildFAQSchema } from '@/hooks/useSEO'

const faqData = [
  {
    category: 'Замовлення',
    items: [
      { q: 'Як зробити замовлення?', a: 'Оберіть продукти у каталозі, додайте до кошика, вкажіть дані доставки та оберіть спосіб оплати. Ми підтвердимо замовлення та скажемо дату збору в той же день.' },
      { q: 'Коли можна замовити?', a: 'Замовлення приймаємо для сезонної продукції. Черешня, полуниця: червень. Томати, огірки: липень-вересень. Зелень: березень-жовтень. Розсада: березень-травень.' },
      { q: 'Чи можна замовити оптом?', a: 'Так! Гуртові поставки від 5 кг. Спеціальні ціни та умови доставки. Напишіть нам або позвоніть для обговорення деталей.' },
      { q: 'Чи дозволяєте змішані замовлення?', a: 'Так! На замовлення можна включити кілька видів продукції одночасно — беруться замовлення як чисте (один вид) так і змішані кошики.' },
    ],
  },
  {
    category: 'Доставка та зберігання',
    items: [
      { q: 'Як доставляється продукція?', a: 'Нова Пошта (1-2 дні), Укрпошта (3-7 днів), або самовивіз у Полтаві. Всі продукти охолоджуються перед відправкою у спеціальній упаковці з льодом.' },
      { q: 'Як довго зберігається замовлення?', a: 'Ягоди: 5-7 днів в холодильнику. Томати, овочі: 10-14 днів. Зелень: 5-7 днів у вакуумі. Рекомендуємо вживати якомога швидше для максимальної свіжості.' },
      { q: 'Що якщо товар прийшов іспорченим?', a: 'Зробіть фото прямо в коробці та напишіть нам протягом 24 годин. Замінимо або повернемо кошти за всю партію.' },
      { q: 'Чи можна забрати самовивозом?', a: 'Так! Пункт самовивозу у м. Полтава, вул. Набережна, 34. Пн-Пт 10:00-19:00, Сб 11:00-17:00. Замовлення готується в день збору.' },
    ],
  },
  {
    category: 'Якість та органіка',
    items: [
      { q: 'Ви дійсно органічна ферма?', a: 'Так! Не використовуємо пестициди та синтетичні добрива. Ґрунт удобрюємо компостом та органічними засобами. Усі продукти сертифіковані та перевірені.' },
      { q: 'Чи робите тестування на якість?', a: 'Так, кожна партія проходить перевірку перед відправкою. Беремо проби на вміст нітратів, забруднень та свіжості. Результати надаємо по запиту.' },
      { q: 'Як ви гарантуєте свіжість?', a: 'Збираємо у день замовлення або напередодні. Охолоджуємо протягом 2 годин після збору. Упаковуємо у спеціальні контейнери з льодом для мінімалізації нагрівання.' },
      { q: 'Які сорти ви вирощуєте?', a: 'Черешня: Крупка, Валерія. Полуниця: Альба, Клери. Томати: Мандарин, Бочка, Черрі. Зелень: базилік, петрушка, мята, кріп. Розсада: помідори, огірки, квіти.' },
    ],
  },
  {
    category: 'Оплата та повернення',
    items: [
      { q: 'Які способи оплати?', a: 'Visa/Mastercard, Apple Pay, Google Pay, LiqPay, Monobank, накладений платіж (Україна). Оплата приймається до відправки або при отриманні.' },
      { q: 'Чи можна повернути товар?', a: 'Повернення можливе протягом 2 годин після отримання у разі неякісної продукції. Сезонні товари поверненню не підлягають, але замінимо на еквівалент.' },
      { q: 'Коли повертають кошти?', a: 'При достатніх доказах пошкодження (фото у упаковці) — протягом 3-5 робочих днів на карту або накладеним платежем.' },
      { q: 'Чи є абонентські поставки?', a: 'Так! Програма "Сезонна коробка" — від 500 до 2000₴ на тиждень. Вибір вмісту, гнучкі умови, знижка 10%. Напишіть нам для деталей.' },
    ],
  },
  {
    category: 'Розсада та мульча',
    items: [
      { q: 'Коли і що робите розсаду?', a: 'З лютого по травень. Помідори, огірки, перець, баклажани, капуста, квіти (петунія, сальвія, мальва). Висилаємо у гарних контейнерах з готовою грунтовою сумішшю.' },
      { q: 'Як доглядати розсаду при отриманні?', a: 'Розмістіть у світлому місці, поливайте коли верхній шар грунту подсихає. Закаляйте на сонці за 2 тижні до посадки в ґрунт, починаючи з 1-2 годин.' },
      { q: 'Чи робите органічну мульчу?', a: 'Так! Органічна мульча з компосту та лісового листя. Мінімальне замовлення 10 кг. Доставляємо разом з продукцією або окремо.' },
      { q: 'Чи дозволяєте рекомендації по посадці?', a: 'Абсолютно! Надаємо інформаційні карти при кожному замовленню розсади. Можна написати нам або зателефонувати — допоможемо вибрати сорти під ваш ґрунт та клімат.' },
    ],
  },
]

export default function FAQ() {
  const [search, setSearch] = useState('')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const allFaqItems = faqData.flatMap(cat => cat.items)

  useSEO({
    title: 'FAQ — Часті питання про органічну продукцію',
    description: 'Питання про замовлення, доставку, якість та цінові умови органічної продукції Bionerica. Ягоди, овочі, розсада.',
    keywords: 'FAQ Bionerica, замовлення ягід, доставка овощей, органічна ферма, питання',
    url: '/faq',
    schema: buildFAQSchema(allFaqItems),
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const filtered = faqData.map(cat => ({
    ...cat,
    items: search
      ? cat.items.filter(i =>
          i.q.toLowerCase().includes(search.toLowerCase()) ||
          i.a.toLowerCase().includes(search.toLowerCase())
        )
      : cat.items,
  })).filter(cat => cat.items.length > 0)

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Parallax Hero */}
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
        <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="page-wrap py-20">
            <div className="flex items-center gap-3 mb-5">
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>FAQ</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(44px,7vw,80px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', marginBottom: 16 }}>
              Часті<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>питання</em>
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.5)', maxWidth: 480, lineHeight: 1.7, marginBottom: 32 }}>
              Все про замовлення свіжої органічної продукції, доставку та розсаду. Не знайшли відповідь?{' '}
              <Link to="/contact" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Напишіть нам</Link> — допоможемо!
            </p>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', border: '1px solid rgba(201,169,110,0.25)', background: 'rgba(245,240,232,0.05)', maxWidth: 480 }}>
              <Search size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Пошук питань..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'rgba(245,240,232,0.8)', fontFamily: 'Jost, sans-serif' }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* FAQ Content */}
      <div className="page-wrap section">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16 items-start">
          {/* Category nav */}
          <div className="hidden lg:block sticky top-24">
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Розділи</p>
            {faqData.map(cat => (
              <a
                key={cat.category}
                href={`#${cat.category}`}
                style={{ display: 'block', padding: '10px 0', fontSize: 14, color: 'var(--t2)', borderBottom: '1px solid var(--bd)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--gold)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--t2)'}
              >
                {cat.category}
                <span style={{ float: 'right', fontSize: 11, color: 'var(--t2)' }}>{cat.items.length}</span>
              </a>
            ))}
            <Link to="/contact" className="btn-dark btn-sm" style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <MessageCircle size={14} /> Задати питання
            </Link>
          </div>

          {/* Questions */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--t0)', marginBottom: 8 }}>Нічого не знайдено</p>
                <p style={{ fontSize: 14, color: 'var(--t2)' }}>Спробуйте інший запит або{' '}
                  <Link to="/contact" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>напишіть нам</Link>
                </p>
              </div>
            ) : (
              filtered.map(cat => (
                <section key={cat.category} id={cat.category} style={{ marginBottom: 48 }}>
                  <div className="flex items-center gap-3 mb-5">
                    <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'block' }} />
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)' }}>
                      {cat.category}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {cat.items.map((item, i) => {
                      const key = `${cat.category}-${i}`
                      const isOpen = openItem === key
                      return (
                        <div key={key} style={{ borderBottom: '1px solid var(--bd)' }}>
                          <button
                            onClick={() => setOpenItem(isOpen ? null : key)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '18px 0',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'none',
                            }}
                          >
                            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,2vw,20px)', fontWeight: 300, color: 'var(--t0)', paddingRight: 20, lineHeight: 1.3 }}>
                              {item.q}
                            </span>
                            <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ flexShrink: 0 }}>
                              <ChevronDown size={18} style={{ color: 'var(--gold)' }} />
                            </motion.span>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.85, paddingBottom: 20 }}>
                                  {item.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Still need help */}
      <div className="dark-section" style={{ padding: '64px 0' }}>
        <div className="page-wrap text-center">
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', marginBottom: 16 }}>
            Залишились питання?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(245,240,232,0.5)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Команда Bionerica відповідає на всі питання протягом кількох годин
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn-gold">Написати нам</Link>
            <a href="tel:+380961234567" className="btn-outline" style={{ borderColor: 'rgba(201,169,110,0.35)', color: 'rgba(245,240,232,0.7)' }}>
              Позвоніть
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
