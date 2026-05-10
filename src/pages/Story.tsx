// Story.tsx
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import LazyImage from '@/components/ui/LazyImage'
import { SectionTitle } from '@/components/ui'
import { useSEO } from '@/hooks/useSEO'

export default function Story() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  useSEO({
    title: 'Наша історія ферми',
    description: 'Як Bionerica виросла з родинної ділянки у Полтавській області до ферми зі свіжими ягодами, овочами, зеленню та розсадою.',
    keywords: 'Bionerica історія, органічна ферма Полтавщина, ягоди та овочі з ферми',
    url: '/story',
  })
  return (
    <div>
      {/* ── PARALLAX HERO ────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ minHeight: '72vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}
      >
        {/* Parallax background image */}
        <motion.div
          style={{
            y: bgY,
            position: 'absolute',
            inset: '-20% 0',
            backgroundImage: 'url(https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1800&h=1200&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            willChange: 'transform',
          }}
        />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(18,15,12,0.82) 0%, rgba(18,15,12,0.55) 60%, rgba(18,15,12,0.72) 100%)' }} />
        {/* Ornamental pattern overlay */}
        <div className="absolute inset-0 orn-bg opacity-[0.05]" />
        {/* Bottom depth gradient */}
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(201,169,110,0.1), transparent)' }} />

        {/* Content */}
        <motion.div
          style={{ y: contentY, opacity, position: 'relative', zIndex: 1, width: '100%' }}
        >
          <div className="page-wrap py-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-3 mb-8"
            >
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Наша Історія</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(52px,8vw,108px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1 }}
            >
              Вирощуємо<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>з турботою</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(245,240,232,0.45)', maxWidth: 480, marginTop: 24 }}
            >
              Від родинної грядки до сезонної ферми з доставкою в день збору — це історія Bionerica.
            </motion.p>
          </div>
        </motion.div>
      </section>

      <section className="section">
        <div className="page-wrap grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <SectionTitle eyebrow="Як це почалось" title="Від родинної землі" subtitle="Bionerica почалась із невеликої родинної ділянки біля Полтави, де ми вирощували полуницю, зелень та першу розсаду для себе й сусідів." className="mb-8" />
            <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--t1)', marginBottom: 24 }}>
                Ми починали з кількох теплиць, ручного збору та прямого спілкування з покупцями. Головним принципом від першого дня стала проста річ: продавати лише те, що самі готові поставити на власний стіл.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--t1)', marginBottom: 32 }}>
                Сьогодні Bionerica — це команда фермерів, агрономів і пакувальників, які щодня відповідають за якість збору, охолодження, сортування та швидку доставку свіжої продукції.
            </p>
              <Link to="/contact" className="btn-dark">Зв'язатися з фермою</Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <LazyImage src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=600&fit=crop" alt="" aspectRatio="aspect-[4/5]" className="sm:mt-8" />
            <LazyImage src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=600&fit=crop" alt="" aspectRatio="aspect-[4/5]" />
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--b1)' }}>
        <div className="page-wrap">
          <SectionTitle eyebrow="Хронологія" title="Наш шлях" align="center" className="mb-16" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { year: '2018', title: 'Перші грядки', text: 'Родина заклала перші полуничні грядки та теплицю з зеленню для локального продажу у Полтаві.' },
              { year: '2019', title: 'Сезонні поставки', text: 'Додали черешню, томати та базилік, почали возити замовлення кілька разів на тиждень.' },
              { year: '2020', title: 'Запуск Bionerica онлайн', text: 'Зібрали перший каталог і запустили онлайн-замовлення зі швидким підтвердженням у день збору.' },
              { year: '2022', title: 'Стійкість і підтримка', text: 'Попри складний період, зберегли сезон, підтримали локальних працівників і розширили площі під овочі.' },
              { year: '2023', title: 'Нові культури', text: 'Додали лісову чорницю, подарункові кошики та розсаду для домашніх городів і терас.' },
              { year: '2025', title: 'Bionerica сьогодні', text: 'Ферма з сезонним каталогом, прямими замовленнями та доставкою свіжого збору для сімей і бізнесу.' },
            ].map(m => (
              <motion.div key={m.year}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ border: '1px solid var(--bd)', padding: 28, background: 'var(--b0)' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: 'var(--bd)', display: 'block', lineHeight: 1, marginBottom: 12 }}>{m.year}</span>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)', marginBottom: 10 }}>{m.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{m.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
