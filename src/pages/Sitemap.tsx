import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSEO } from '@/hooks/useSEO'

const SECTIONS = [
  {
    label: 'Магазин',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    links: [
      { href: '/catalog',    label: 'Каталог товарів' },
      { href: '/cart',       label: 'Кошик' },
      { href: '/checkout',   label: 'Оформлення замовлення' },
      { href: '/wishlist',   label: 'Список бажань' },
      { href: '/gift-cards', label: 'Подарункові картки' },
    ],
  },
  {
    label: 'Про нас',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    links: [
      { href: '/story',    label: 'Наша історія' },
      { href: '/lookbook', label: 'Lookbook' },
      { href: '/reviews',  label: 'Відгуки клієнтів' },
      { href: '/partners', label: 'Партнери' },
      { href: '/blog',     label: 'Блог' },
    ],
  },
  {
    label: 'Клієнтам',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
    links: [
      { href: '/account',  label: 'Особистий кабінет' },
      { href: '/delivery', label: 'Доставка та оплата' },
      { href: '/care',     label: 'Правила зберігання' },
      { href: '/faq',      label: 'Часті запитання' },
      { href: '/contact',  label: 'Зв\'язатися з нами' },
    ],
  },
  {
    label: 'Правова інформація',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    links: [
      { href: '/privacy', label: 'Політика конфіденційності' },
      { href: '/terms',   label: 'Умови використання' },
    ],
  },
]

export default function Sitemap() {
  useSEO({ title: 'Карта сайту — Bionerica', noindex: true })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--b0)', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background ──────────────────────────────────────── */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Hero image layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=60&fm=webp&auto=format)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: 0.06,
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(160deg, rgba(247,250,245,0.96) 0%, rgba(238,244,234,0.92) 50%, rgba(247,250,245,0.97) 100%)',
          }}
        />
        {/* Dot grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(74,140,63,0.09) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        {/* Large leaf — top right */}
        <svg
          style={{ position: 'absolute', top: -40, right: -60, width: 440, opacity: 0.06 }}
          viewBox="0 0 380 360"
          fill="none"
        >
          <path
            d="M40 340 C80 200 180 60 340 20 C300 120 260 200 180 260 C120 300 80 320 40 340Z"
            fill="#3a6b33"
          />
          <path d="M40 340 C100 280 200 200 340 20" stroke="#3a6b33" strokeWidth="2" fill="none" />
          <path d="M100 300 C140 240 210 170 300 80" stroke="#3a6b33" strokeWidth="1.2" fill="none" />
        </svg>
        {/* Large leaf — bottom left */}
        <svg
          style={{
            position: 'absolute',
            bottom: -40,
            left: -60,
            width: 360,
            opacity: 0.06,
            transform: 'rotate(180deg)',
          }}
          viewBox="0 0 380 360"
          fill="none"
        >
          <path
            d="M40 340 C80 200 180 60 340 20 C300 120 260 200 180 260 C120 300 80 320 40 340Z"
            fill="#3a6b33"
          />
          <path d="M40 340 C100 280 200 200 340 20" stroke="#3a6b33" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          padding: 'clamp(60px, 8vw, 120px) var(--content-gutter)',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)' }}
        >
          {/* Brand mark */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="48" height="48" viewBox="0 0 84 84" fill="none">
              <circle cx="42" cy="42" r="40" stroke="rgba(74,140,63,.22)" strokeWidth=".8" />
              <circle cx="42" cy="42" r="28" stroke="rgba(74,140,63,.14)" strokeWidth=".8" />
              <g stroke="#4a8c3f" strokeLinecap="round" fill="none">
                <path d="M42 70 C42 54 42 44 42 22" strokeWidth="1.4" />
                <path d="M42 48 C34 42 28 34 30 26 C38 30 43 38 42 48Z" strokeWidth="1.1" />
                <path d="M42 37 C50 31 56 23 54 15 C46 20 40 28 42 37Z" strokeWidth="1.1" />
              </g>
            </svg>
          </div>

          <p
            style={{
              fontSize: 9,
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 14,
              fontFamily: 'Jost, sans-serif',
            }}
          >
            Bionerica
          </p>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 300,
              color: 'var(--t0)',
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Карта сайту
          </h1>
          <div
            style={{
              width: 40,
              height: 1,
              background: 'var(--gold)',
              margin: '0 auto',
              opacity: 0.4,
            }}
          />
        </motion.div>

        {/* Grid of sections */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'clamp(24px, 3vw, 40px)',
          }}
        >
          {SECTIONS.map((section, si) => (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + si * 0.08 }}
            >
              {/* Section label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 20,
                  paddingBottom: 14,
                  borderBottom: '1px solid rgba(74,140,63,.15)',
                  color: 'var(--gold-d)',
                }}
              >
                {section.icon}
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontFamily: 'Jost, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  {section.label}
                </span>
              </div>

              {/* Links */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        fontSize: 14.5,
                        color: 'var(--t1)',
                        textDecoration: 'none',
                        transition: 'color .2s, gap .2s',
                        fontFamily: 'Jost, sans-serif',
                        fontWeight: 300,
                        borderBottom: '1px solid transparent',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold)'
                        ;(e.currentTarget as HTMLAnchorElement).style.gap = '14px'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--t1)'
                        ;(e.currentTarget as HTMLAnchorElement).style.gap = '10px'
                      }}
                    >
                      <svg
                        width="5"
                        height="5"
                        viewBox="0 0 5 5"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="2.5" cy="2.5" r="2.5" fill="var(--gold)" opacity=".5" />
                      </svg>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            textAlign: 'center',
            marginTop: 'clamp(48px, 6vw, 80px)',
            fontSize: 12,
            color: 'var(--t2)',
            letterSpacing: '0.08em',
            fontFamily: 'Jost, sans-serif',
          }}
        >
          © {new Date().getFullYear()} Bionerica — Органічна ферма
        </motion.p>
      </div>
    </div>
  )
}
