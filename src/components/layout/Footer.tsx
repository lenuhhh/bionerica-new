import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Instagram, Facebook, Youtube, ArrowRight, MapPin, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'

/* ── Hard-coded dark palette — never changes with theme ───────────────────
  Footer uses the same warm premium tone as dark sections/reviews.
  We define CSS custom props INLINE so they can't be overridden by .dark
──────────────────────────────────────────────────────────────────────── */
const BG   = '#16110d'
const BG2  = '#1f1812'
const GOLD = '#5aaa4e'
const GOLD_L = '#a8d5a0'
const GOLD_D = '#3d8432'
const WHITE_HIGH   = 'rgba(232,245,226,0.92)'
const WHITE_MED    = 'rgba(232,245,226,0.58)'
const WHITE_LOW    = 'rgba(232,245,226,0.38)'
const WHITE_GHOST  = 'rgba(232,245,226,0.18)'
const BORDER       = 'rgba(90,170,78,0.30)'
const BORDER_MED   = 'rgba(90,170,78,0.42)'

export default function Footer() {
  const [email, setEmail] = useState('')
  const { language, setLanguage } = useI18n()

  const footerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: footerRef, offset: ['start end', 'end end'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-15%', '0%'])

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    toast.success('Дякуємо! Ви підписались.', { className: 'hot-toast' })
    setEmail('')
  }

  const navCols = [
    {
      heading: 'Каталог',
      links: [
        ['/catalog?cat=berries',    '🍓 Ягоди'],
        ['/catalog?cat=fruits',     '🍎 Фрукти'],
        ['/catalog?cat=vegetables', '🥦 Овочі'],
        ['/catalog?cat=greens',     '🌿 Зелень'],
        ['/catalog?cat=plants',     '🌱 Розсада'],
        ['/catalog?cat=baskets',    '🧺 Набори'],
      ],
    },
    {
      heading: 'Компанія',
      links: [
        ['/story', 'Як ми вирощуємо'],
        ['/blog',  'Блог про їжу'],
        ['/contact', 'Контакти'],
        ['/auth', 'Особистий кабінет'],
      ],
    },
    {
      heading: 'Послуги',
      links: [
        ['/contact',    'Оптові замовлення'],
        ['/contact',    'Тижнева підписка'],
        ['/contact',    'Подарункові набори'],
        ['/gift-cards', 'Подарункові сертифікати'],
      ],
    },
    {
      heading: 'Підтримка',
      links: [
        ['/faq',      'Часті питання'],
        ['/delivery', 'Доставка та оплата'],
        ['/care',     'Зберігання продуктів'],
        ['/install',  '📱 Встановити додаток'],
        ['/contact',  'Написати нам'],
      ],
    },
  ]

  return (
    <footer
      ref={footerRef}
      itemScope
      itemType="https://schema.org/WPFooter"
      style={{
        color: WHITE_HIGH,
        position: 'relative',
        overflow: 'hidden',
        zIndex: 2,
        colorScheme: 'dark',
      }}
    >
      {/* Parallax photo background */}
      <motion.div
        aria-hidden="true"
        style={{
          y: bgY,
          position: 'absolute',
          inset: '-15% 0',
          backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&h=900&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          willChange: 'transform',
          zIndex: 0,
        }}
      />
      {/* Dark overlay */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,6,4,0.92) 0%, rgba(10,8,5,0.88) 50%, rgba(8,6,4,0.95) 100%)', zIndex: 1 }} />
      {/* Vignette */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(4,3,2,0.6) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
      {/* Gold gradient divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

      {/* ── TOP: Brand + Subscribe ─────────────────────────────────────────── */}
      <div
        className="page-wrap"
        style={{ paddingTop: 72, paddingBottom: 56, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
          {/* Brand */}
          <div className="flex-1">
            <Link
              to="/"
              itemProp="name"
              style={{
                fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif',
                fontSize: 'clamp(48px, 5.5vw, 72px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: GOLD_L,
                lineHeight: 1,
                display: 'block',
                textDecoration: 'none',
              }}
            >
              Bio<span style={{ color: GOLD }}>nerica</span>
            </Link>
            <p style={{ fontSize: 11, letterSpacing: '0.45em', textTransform: 'uppercase', color: WHITE_LOW, marginTop: 10 }}>
              Свіжо з ферми · органіка · з 2020
            </p>

            {/* Contact micro-info */}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { Icon: MapPin, text: 'м. Полтава, вул. Набережна 34', href: 'https://maps.google.com/?q=Полтава' },
                { Icon: Phone,  text: '+38 (050) 555-77-99', href: 'tel:+380505557799' },
                { Icon: Mail,   text: 'hello@bionerica.ua',  href: 'mailto:hello@bionerica.ua' },
              ].map(({ Icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: WHITE_LOW, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = GOLD}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = WHITE_LOW}
                >
                  <Icon size={13} style={{ color: GOLD, flexShrink: 0 }} />
                  {text}
                </a>
              ))}
            </div>
          </div>

          {/* Subscribe */}
          <div style={{ flex: 1, maxWidth: 420 }}>
            <h4
              style={{
                fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: GOLD_L,
                marginBottom: 10,
                lineHeight: 1.15,
              }}
            >
              Отримуйте новини
            </h4>
            <div style={{ width: 40, height: 1, background: GOLD, marginBottom: 16 }} />
            <p style={{ fontSize: 13, color: WHITE_MED, marginBottom: 22, lineHeight: 1.75 }}>
              Сезонні пропозиції, новинки і поради про зберігання — першими для підписників.
            </p>
            <form
              onSubmit={onSubscribe}
              style={{ display: 'flex', border: `1px solid ${BORDER_MED}` }}
              aria-label="Підписка на розсилку"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ваш email"
                aria-label="Email для підписки"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '14px 18px',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 13,
                  color: WHITE_HIGH,
                }}
              />
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingInline: 20,
                  background: GOLD,
                  border: 'none',
                  color: '#18160e',
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 400,
                  cursor: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = GOLD_D}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = GOLD}
              >
                Підписатись <ArrowRight size={14} />
              </button>
            </form>

            {/* Social row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 24, alignItems: 'center' }}>
              <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: WHITE_GHOST }}>
                Соцмережі:
              </span>
              {[
                { Icon: Instagram, href: 'https://instagram.com/bionerica_ua', label: 'Instagram' },
                { Icon: Facebook,  href: 'https://facebook.com/bionerica',     label: 'Facebook'  },
                { Icon: Youtube,   href: 'https://youtube.com/@bionerica',     label: 'YouTube'   },
              ].map(({ Icon, href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: 34, height: 34,
                    border: `1px solid ${BORDER_MED}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: WHITE_LOW,
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = GOLD
                    el.style.color = GOLD
                    el.style.background = 'rgba(90,170,78,0.1)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = BORDER_MED
                    el.style.color = WHITE_LOW
                    el.style.background = 'transparent'
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── NAV GRID ─────────────────────────────────────────────────────────── */}
      <div className="page-wrap" style={{ paddingTop: 52, paddingBottom: 52, borderBottom: `1px solid ${BORDER}` }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {navCols.map(col => (
            <nav key={col.heading} aria-label={col.heading}>
              <h5
                style={{
                  fontSize: 10,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: 20,
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 400,
                }}
              >
                {col.heading}
              </h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(([to, label]) => (
                  <li key={label}>
                    <Link
                      to={to}
                      style={{ fontSize: 13, color: WHITE_LOW, textDecoration: 'none', lineHeight: 1.4 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = WHITE_HIGH}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = WHITE_LOW}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* ── BOTTOM BAR ───────────────────────────────────────────────────────── */}
      <div className="page-wrap" style={{ paddingTop: 24, paddingBottom: 28 }}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-5 flex-wrap">
          {/* Copyright */}
          <p style={{ fontSize: 12, color: WHITE_GHOST, order: 2 }}>
            © {new Date().getFullYear()} Bionerica. Всі права захищені.&nbsp;&nbsp;·&nbsp;&nbsp;ФОП Петрівська Г.М.
          </p>

          {/* Legal links */}
          <div style={{ display: 'flex', gap: 20, order: 1, flexWrap: 'wrap' }}>
            {[
              ['/privacy', 'Конфіденційність'],
              ['/terms',   'Умови використання'],
              ['/sitemap', 'Карта сайту'],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                style={{ fontSize: 11, color: WHITE_GHOST, textDecoration: 'none', letterSpacing: 0.5 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = GOLD}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = WHITE_GHOST}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Language switcher */}
          <div style={{ display: 'flex', gap: 8, order: 3 }}>
            {[
              { code: 'uk', label: 'UA' },
              { code: 'ru', label: 'RU' },
              { code: 'en', label: 'EN' },
            ].map(({ code, label }) => {
              const active = language === code
              return (
              <button
                key={code}
                aria-label={`Мова: ${label}`}
                onClick={() => setLanguage(code as 'uk' | 'ru' | 'en')}
                style={{
                  fontSize: 10,
                  letterSpacing: 3,
                  color: active ? GOLD : WHITE_GHOST,
                  background: 'none',
                  border: `1px solid ${active ? GOLD : 'transparent'}`,
                  padding: '4px 8px',
                  fontFamily: 'Jost, sans-serif',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = GOLD}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = active ? GOLD : WHITE_GHOST
                }}
              >
                {label}
              </button>
              )
            })}
          </div>
        </div>
      </div>
      </div>
    </footer>
  )
}
