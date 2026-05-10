import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Smartphone, Download, Check, Share, ArrowDown,
  MoreVertical, Monitor, Wifi, WifiOff, Bell, Zap, Shield
} from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import { getOS, isStandalone, usePWAInstall } from '@/hooks/usePWA'

/* Platform detector */
function getPlatformDetails() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const os = getOS()
  const isChrome  = /Chrome/.test(ua) && !/Edg|OPR/.test(ua)
  const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  const isEdge    = /Edg/.test(ua)
  const isSamsung = /SamsungBrowser/.test(ua)
  const isOpera   = /OPR/.test(ua)

  let browser = 'Chrome'
  if (isSafari)  browser = 'Safari'
  if (isFirefox) browser = 'Firefox'
  if (isEdge)    browser = 'Edge'
  if (isSamsung) browser = 'Samsung Internet'
  if (isOpera)   browser = 'Opera'

  return { os, browser, isChrome, isSafari, isFirefox, isEdge, isSamsung }
}

/* Feature pill */
function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      border: '1px solid var(--bd)',
      background: 'var(--b1)',
    }}>
      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--t1)' }}>{text}</span>
    </div>
  )
}

/* Step card */
function StepCard({ n, icon, title, desc, highlight }: {
  n: string; icon: React.ReactNode; title: string; desc: string; highlight?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: parseInt(n) * 0.1 }}
      style={{
        display: 'flex', gap: 16, alignItems: 'flex-start',
        padding: '20px 0',
        borderBottom: '1px solid var(--bd)',
      }}
    >
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: 'rgba(201,169,110,0.1)',
        border: '1px solid rgba(201,169,110,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8,
      }}>
        <span style={{ color: 'var(--gold)' }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 11,
            color: 'var(--gold)', letterSpacing: 3,
          }}>
            Крок {n}
          </span>
        </div>
        <p style={{ fontSize: 15, color: 'var(--t0)', fontWeight: 400, marginBottom: 4, lineHeight: 1.3 }}>
          {title}
        </p>
        <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65 }}>{desc}</p>
        {highlight && (
          <div style={{
            marginTop: 8, padding: '6px 12px',
            background: 'rgba(201,169,110,0.08)',
            borderLeft: '2px solid var(--gold)',
            fontSize: 12, color: 'var(--gold-d)',
          }}>
            {highlight}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<ReturnType<typeof getPlatformDetails> | null>(null)
  const [installed, setInstalled] = useState(false)
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('android')
  const { installNative, canInstall } = usePWAInstall()

  useSEO({
    title: 'Встановити додаток Broiderie',
    description: 'Встановіть Broiderie на телефон як додаток — швидко, зручно, працює офлайн. Інструкція для iOS та Android.',
    url: '/install',
    noindex: false,
  })

  useEffect(() => {
    const p = getPlatformDetails()
    setPlatform(p)
    setInstalled(isStandalone())
    // Auto-select tab based on detected OS
    if (p.os === 'ios')     setActiveTab('ios')
    if (p.os === 'android') setActiveTab('android')
    if (p.os === 'desktop') setActiveTab('desktop')
  }, [])

  const handleInstall = async () => {
    const outcome = await installNative()
    if (outcome === 'accepted') setInstalled(true)
  }

  const tabs = [
    { id: 'ios'     as const, label: 'iPhone / iPad', emoji: '🍎' },
    { id: 'android' as const, label: 'Android',       emoji: '🤖' },
    { id: 'desktop' as const, label: 'Комп\'ютер',    emoji: '💻' },
  ]

  const iosSteps = [
    {
      n: '1', icon: <Share size={18} />,
      title: 'Відкрийте Safari',
      desc: 'Важливо: лише Safari підтримує встановлення на iPhone. Chrome та інші браузери не дозволяють цього.',
      highlight: '⚠️ Працює тільки в Safari',
    },
    {
      n: '2', icon: <Share size={18} />,
      title: 'Натисніть кнопку «Поділитись»',
      desc: 'Знайдіть іконку у вигляді квадрата зі стрілкою вгору — вона знаходиться в нижній панелі Safari.',
      highlight: '↑ Ця іконка є в нижньому центрі екрану',
    },
    {
      n: '3', icon: <ArrowDown size={18} />,
      title: 'Прокрутіть вниз і виберіть «На екран «Додому»»',
      desc: 'У меню що відкрилось — прокрутіть список вниз. Шукайте пункт «На екран «Додому»» або «Add to Home Screen».',
    },
    {
      n: '4', icon: <Check size={18} />,
      title: 'Натисніть «Додати»',
      desc: 'Підтвердіть у верхньому правому куті. Broiderie з\'явиться на вашому головному екрані як нативний додаток!',
      highlight: '🪡 Готово! Відкривайте без браузера',
    },
  ]

  const androidSteps = [
    {
      n: '1', icon: <Smartphone size={18} />,
      title: 'Відкрийте у Chrome',
      desc: 'Переконайтесь що використовуєте Google Chrome. Samsung Internet також підтримує встановлення.',
    },
    {
      n: '2', icon: <MoreVertical size={18} />,
      title: 'Натисніть меню ⋮ (три крапки)',
      desc: 'Знайдіть три вертикальні крапки у правому верхньому куті Chrome і натисніть на них.',
    },
    {
      n: '3', icon: <Download size={18} />,
      title: 'Виберіть «Додати на головний екран»',
      desc: 'Шукайте пункт «Додати на головний екран» або «Install App» / «Add to Home Screen».',
      highlight: 'На деяких пристроях з\'являється банер внизу автоматично',
    },
    {
      n: '4', icon: <Check size={18} />,
      title: 'Підтвердіть встановлення',
      desc: 'Натисніть «Встановити» або «Додати» у діалозі. Додаток з\'явиться на головному екрані!',
      highlight: '🤖 Готово! Повноцінний додаток без браузера',
    },
  ]

  const desktopSteps = [
    {
      n: '1', icon: <Monitor size={18} />,
      title: 'Відкрийте в Chrome або Edge',
      desc: 'PWA-встановлення підтримують Google Chrome, Microsoft Edge та Opera. Firefox поки не підтримує.',
    },
    {
      n: '2', icon: <Download size={18} />,
      title: 'Знайдіть іконку встановлення',
      desc: 'В адресному рядку справа з\'явиться іконка монітора зі стрілкою вниз — натисніть на неї.',
      highlight: '💡 Або: меню Chrome ⋮ → «Встановити Broiderie»',
    },
    {
      n: '3', icon: <Check size={18} />,
      title: 'Натисніть «Встановити»',
      desc: 'Підтвердіть у діалозі. Broiderie відкриється у власному вікні без браузерної панелі.',
      highlight: '💻 Готово! Додаток доступний у Пуску / Finder',
    },
  ]

  const activeSteps = activeTab === 'ios' ? iosSteps : activeTab === 'android' ? androidSteps : desktopSteps

  return (
    <div style={{ background: 'var(--b0)' }}>

      {/* Header */}
      <div className="dark-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0 orn-bg" style={{ opacity: 0.05 }} />
        <div className="page-wrap py-16 relative z-[1]">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>
                  PWA · Progressive Web App
                </span>
              </div>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(40px, 6vw, 72px)',
                fontWeight: 300,
                color: 'rgba(245,240,232,0.93)',
                lineHeight: 1.05,
                marginBottom: 16,
              }}>
                Встановіть Broiderie<br />
                на <em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>телефон</em>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.5)', lineHeight: 1.8, maxWidth: 480, marginBottom: 32 }}>
                Broiderie працює як нативний додаток — швидко відкривається,
                працює офлайн, надсилає сповіщення. Без App Store.
              </p>

              {/* Installed state */}
              {installed && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '12px 20px',
                  background: 'rgba(138,158,140,0.15)',
                  border: '1px solid rgba(138,158,140,0.4)',
                }}>
                  <Check size={16} style={{ color: 'var(--sage)' }} />
                  <span style={{ fontSize: 13, color: 'var(--sage)' }}>Додаток вже встановлено!</span>
                </div>
              )}

              {/* Quick install for Android/Desktop */}
              {!installed && canInstall && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleInstall}
                  className="btn-gold btn-shimmer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                >
                  <Download size={16} />
                  Встановити зараз (1 клік)
                </motion.button>
              )}
            </div>

            {/* Phone mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div style={{
                width: 200, height: 380,
                border: '2px solid rgba(201,169,110,0.4)',
                borderRadius: 32,
                background: '#1a1612',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              }}>
                {/* Status bar */}
                <div style={{ height: 28, background: '#14120e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
                  <span style={{ fontSize: 9, color: 'rgba(245,240,232,0.5)' }}>9:41</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Wifi size={10} style={{ color: 'rgba(245,240,232,0.5)' }} />
                    <span style={{ fontSize: 9, color: 'rgba(245,240,232,0.5)' }}>100%</span>
                  </div>
                </div>
                {/* App content */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
                    Broiderie
                  </div>
                  <div style={{ height: 90, background: 'rgba(201,169,110,0.08)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🪡</div>
                  {[80, 60, 90, 50].map((w, i) => (
                    <div key={i} style={{ height: 6, background: 'rgba(245,240,232,0.08)', borderRadius: 3, marginBottom: 5, width: `${w}%` }} />
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ height: 50, background: 'rgba(201,169,110,0.07)', borderRadius: 4 }} />
                    ))}
                  </div>
                </div>
                {/* Home indicator */}
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 60, height: 4, background: 'rgba(245,240,232,0.2)', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section style={{ background: 'var(--b1)', borderBottom: '1px solid var(--bd)', padding: '32px 0' }}>
        <div className="page-wrap">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FeaturePill icon={<Zap size={16} />}  text="Відкривається миттєво" />
            <FeaturePill icon={<WifiOff size={16} />} text="Працює офлайн" />
            <FeaturePill icon={<Bell size={16} />}  text="Push-сповіщення" />
            <FeaturePill icon={<Shield size={16} />} text="Без App Store" />
          </div>
        </div>
      </section>

      {/* Install guide */}
      <section className="section">
        <div className="page-wrap">
          <div className="grid lg:grid-cols-[1fr_400px] gap-16">

            {/* Steps */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>
                  Покрокова інструкція
                </span>
              </div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 300, color: 'var(--t0)',
                paddingBottom: 14, borderBottom: '1px solid var(--bd)',
                marginBottom: 0,
              }}>
                Як встановити
              </h2>

              {/* Platform tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 24, marginTop: 24, borderBottom: '1px solid var(--bd)' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 20px',
                      background: 'none',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === tab.id ? 'var(--gold)' : 'transparent'}`,
                      color: activeTab === tab.id ? 'var(--t0)' : 'var(--t2)',
                      fontSize: 13,
                      fontFamily: 'Jost, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: -1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{tab.emoji}</span>
                    {tab.label}
                    {/* Highlight current platform */}
                    {platform?.os === tab.id && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px',
                        background: 'var(--gold)',
                        color: '#18160e',
                        letterSpacing: 1,
                      }}>
                        Ваш
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeSteps.map(step => (
                    <StepCard key={step.n} {...step} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* iOS Safari note */}
              {activeTab === 'ios' && (
                <div style={{
                  marginTop: 24, padding: '16px 20px',
                  background: 'rgba(201,169,110,0.06)',
                  border: '1px solid rgba(201,169,110,0.2)',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--gold-d)' }}>Чому не через App Store?</strong><br />
                    Broiderie — це PWA (Progressive Web App). Не потрібно App Store, оновлення автоматичні,
                    займає менше місця ніж нативний додаток. Функціонал 100% такий самий.
                  </p>
                </div>
              )}
            </div>

            {/* QR code + quick links */}
            <div>
              <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 28, marginBottom: 20 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
                  Відскануйте QR-код
                </p>
                {/* QR placeholder */}
                <div style={{
                  width: '100%', aspectRatio: '1/1',
                  background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  position: 'relative',
                }}>
                  {/* Simple SVG QR-like pattern */}
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    {/* QR corners */}
                    <rect x="10" y="10" width="44" height="44" fill="#1a1612" rx="2"/>
                    <rect x="18" y="18" width="28" height="28" fill="white" rx="1"/>
                    <rect x="24" y="24" width="16" height="16" fill="#1a1612" rx="1"/>
                    <rect x="106" y="10" width="44" height="44" fill="#1a1612" rx="2"/>
                    <rect x="114" y="18" width="28" height="28" fill="white" rx="1"/>
                    <rect x="120" y="24" width="16" height="16" fill="#1a1612" rx="1"/>
                    <rect x="10" y="106" width="44" height="44" fill="#1a1612" rx="2"/>
                    <rect x="18" y="114" width="28" height="28" fill="white" rx="1"/>
                    <rect x="24" y="120" width="16" height="16" fill="#1a1612" rx="1"/>
                    {/* Data dots */}
                    {[
                      [66,10],[74,10],[82,10],[66,18],[82,18],[66,26],[74,26],[82,26],
                      [10,66],[18,66],[26,66],[10,74],[26,74],[10,82],[18,82],[26,82],
                      [66,66],[82,66],[90,66],[98,66],[106,66],[66,74],[90,74],[98,74],
                      [66,82],[74,82],[90,82],[98,82],[106,82],[66,90],[74,90],[82,90],
                      [90,90],[98,90],[106,90],[114,66],[130,66],[138,66],[114,74],
                      [122,74],[138,74],[114,82],[130,82],[114,90],[122,90],[130,90],
                      [138,90],[66,106],[74,106],[82,106],[98,106],[114,106],[130,106],
                      [66,114],[82,114],[90,114],[98,114],[66,122],[74,122],[98,122],
                      [114,122],[130,122],[138,122],[66,130],[82,130],[90,130],[106,130],
                      [114,130],[138,130],[66,138],[74,138],[82,138],[90,138],[98,138],
                      [106,138],[114,138],[122,138],[130,138],[138,138],
                    ].map(([x, y], i) => (
                      <rect key={i} x={x} y={y} width="6" height="6" fill="#1a1612" rx="0.5" />
                    ))}
                    {/* Center logo */}
                    <rect x="68" y="68" width="24" height="24" fill="white" />
                    <text x="80" y="83" textAnchor="middle" fontSize="14" fill="#c9a96e">🪡</text>
                  </svg>
                </div>
                <p style={{ fontSize: 12, color: 'var(--t2)', textAlign: 'center', lineHeight: 1.5 }}>
                  Відскануйте камерою телефону<br />
                  щоб відкрити Broiderie на мобільному
                </p>
                <p style={{ fontSize: 10, color: 'var(--t2)', textAlign: 'center', marginTop: 8, letterSpacing: 1 }}>
                  broiderie.ua
                </p>
              </div>

              {/* Already installed check */}
              <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12, lineHeight: 1.6 }}>
                  Перевірте чи встановлено:
                </p>
                {[
                  { label: 'Відкрито без адресного рядка', ok: isStandalone() },
                  { label: 'Service Worker активний', ok: typeof navigator !== 'undefined' && 'serviceWorker' in navigator },
                  { label: 'Manifest завантажено', ok: true },
                  { label: 'Offline підтримка', ok: typeof navigator !== 'undefined' && 'serviceWorker' in navigator },
                ].map(({ label, ok }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--bd)', fontSize: 12 }}>
                    <span style={{ color: 'var(--t2)' }}>{label}</span>
                    <span style={{ color: ok ? 'var(--sage)' : 'var(--t2)' }}>
                      {ok ? '✓' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ background: 'var(--b1)', padding: '64px 0' }}>
        <div className="page-wrap">
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(28px,3.5vw,44px)',
            fontWeight: 300, color: 'var(--t0)',
            textAlign: 'center',
            paddingBottom: 14, borderBottom: '1px solid var(--bd)',
            marginBottom: 36,
          }}>
            PWA vs Браузер
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bd)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--t2)', fontWeight: 400, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Функція</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--gold)', fontWeight: 500, fontSize: 13 }}>🪡 Broiderie PWA</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--t2)', fontWeight: 400 }}>В браузері</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Швидкість запуску',     '⚡ Миттєво',        '🐌 3-5 секунд'],
                  ['Офлайн режим',          '✓ Є',               '✗ Немає'],
                  ['Push-сповіщення',       '✓ Є',               '△ Обмежено'],
                  ['Іконка на екрані',      '✓ Є',               '✗ Немає'],
                  ['Займає місця',          '⚡ ~2 МБ',           '— 0 МБ'],
                  ['Оновлення',             '⚡ Автоматично',     '✓ Завжди актуально'],
                  ['Повноекранний режим',   '✓ Так',             '✗ Є панелі браузера'],
                  ['Ярлики на екрані',      '✓ Каталог, Кошик',  '✗ Немає'],
                ].map(([feat, pwa, browser]) => (
                  <tr key={feat} style={{ borderBottom: '1px solid var(--bd)' }}>
                    <td style={{ padding: '13px 16px', color: 'var(--t1)' }}>{feat}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', color: 'var(--sage)' }}>{pwa}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', color: 'var(--t2)' }}>{browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/catalog" className="btn-dark">
              Перейти до каталогу →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
