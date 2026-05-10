import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Bell, BellOff, Check, Smartphone, Package, Tag, Heart, Sparkles } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWA'
import { usePushNotifications } from '@/hooks/usePush'
import { getPwaMetrics, recordPwaMetric } from '@/lib/pwaMetrics'
import toast from 'react-hot-toast'

/* ════════════════════════════════════════════════════════════════
   iOS INSTALL GUIDE — 3-step bottom sheet
   "Share → Add to Home Screen → Add"
════════════════════════════════════════════════════════════════ */
function IOSGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      emoji: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
      title: 'Натисніть «Поділитись»',
      desc:  'Кнопка внизу Safari — квадрат зі стрілкою вгору',
      note:  'Тільки Safari підтримує встановлення на iPhone',
    },
    {
      emoji: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8"  y1="12" x2="16" y2="12"/>
        </svg>
      ),
      title: 'Оберіть «На екран Додому»',
      desc:  'Прокрутіть список вниз і натисніть цей пункт',
      note:  'Або "Add to Home Screen" якщо iPhone на англійській',
    },
    {
      emoji: <span style={{ fontSize: 28, lineHeight: 1 }}>🪡</span>,
      title: 'Натисніть «Додати»',
      desc:  'Вгорі праворуч — і Broiderie з\'явиться на вашому екрані',
      note:  'Додаток працює без браузера як нативний!',
    },
  ]

  const cur = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div style={{ position: 'relative', zIndex: 301 }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 300 }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: '#1a1612',
          borderTop: '1px solid rgba(201,169,110,0.3)',
          borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom, 24px)',
          boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(201,169,110,0.3)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px 20px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontFamily: 'Jost,sans-serif' }}>
              Встановити на iPhone
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 24, fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1 }}>
              Broiderie як додаток
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.3)', cursor: 'none', padding: 8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Step */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            style={{ padding: '28px 24px 20px' }}
          >
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              {/* Icon */}
              <div style={{
                width: 60, height: 60, borderRadius: 14, flexShrink: 0,
                background: 'rgba(201,169,110,0.1)',
                border: '1px solid rgba(201,169,110,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cur.emoji}
              </div>

              <div style={{ flex: 1 }}>
                {/* Step counter */}
                <p style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6, fontFamily: 'Jost,sans-serif' }}>
                  Крок {step + 1} з {steps.length}
                </p>
                <p style={{ fontSize: 17, fontWeight: 500, color: 'rgba(245,240,232,0.93)', marginBottom: 8, fontFamily: 'Jost,sans-serif', lineHeight: 1.3 }}>
                  {cur.title}
                </p>
                <p style={{ fontSize: 14, color: 'rgba(245,240,232,0.5)', lineHeight: 1.65, marginBottom: 12 }}>
                  {cur.desc}
                </p>
                {/* Hint */}
                <div style={{ background: 'rgba(201,169,110,0.08)', borderLeft: '2px solid var(--gold)', padding: '8px 14px' }}>
                  <p style={{ fontSize: 12, color: 'var(--gold)', lineHeight: 1.5, fontFamily: 'Jost,sans-serif' }}>
                    {cur.note}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 16 }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 28 : 8, height: 8, borderRadius: 4,
              background: i === step ? 'var(--gold)' : 'rgba(201,169,110,0.2)',
              border: 'none', transition: 'width .3s ease, background .2s', cursor: 'none',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '0 24px 8px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: 16, background: 'none', border: '1px solid rgba(201,169,110,0.25)', color: 'rgba(245,240,232,0.5)', fontFamily: 'Jost,sans-serif', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'none', borderRadius: 2 }}>
              ← Назад
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            style={{ flex: step > 0 ? 2 : 1, padding: 16, background: 'var(--gold)', border: 'none', color: '#18160e', fontFamily: 'Jost,sans-serif', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'none', fontWeight: 500, borderRadius: 2 }}>
            {isLast ? '✓ Зрозуміло, встановлю' : 'Далі →'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Android/Desktop GUIDE — if native prompt was dismissed
════════════════════════════════════════════════════════════════ */
function AndroidGuide({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'relative', zIndex: 301 }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 300 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: '#1a1612',
          borderTop: '1px solid rgba(201,169,110,0.3)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 24px env(safe-area-inset-bottom, 32px)',
          boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(201,169,110,0.3)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontFamily: 'Jost,sans-serif' }}>Встановити на Android</p>
            <p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, fontWeight: 300, color: 'rgba(245,240,232,0.93)' }}>Broiderie як додаток</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.3)', cursor: 'none' }}><X size={20} /></button>
        </div>

        {[
          { n: 1, title: 'Меню Chrome',            desc: 'Натисніть три крапки ⋮ у верхньому правому куті Chrome' },
          { n: 2, title: 'Додати до головного',    desc: 'Оберіть «Додати до головного екрана» або «Встановити додаток»' },
          { n: 3, title: 'Підтвердіть',             desc: 'Натисніть «Додати» — іконка Broiderie з\'явиться на екрані' },
        ].map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Cormorant Garamond,serif', fontSize: 14, color: 'var(--gold)' }}>
              {s.n}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(245,240,232,0.9)', marginBottom: 3, fontFamily: 'Jost,sans-serif' }}>{s.title}</p>
              <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.45)', lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          </div>
        ))}

        <button onClick={onClose} style={{ width: '100%', padding: '15px', marginTop: 8, background: 'var(--gold)', border: 'none', color: '#18160e', fontFamily: 'Jost,sans-serif', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', cursor: 'none', fontWeight: 500, borderRadius: 2 }}>
          ✓ Зрозуміло
        </button>
      </motion.div>
    </div>
  )
}

export function PWAUpdatePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onUpdateReady = () => setVisible(true)
    window.addEventListener('pwa-update-ready', onUpdateReady)
    return () => window.removeEventListener('pwa-update-ready', onUpdateReady)
  }, [])

  if (!visible) return null

  const applyUpdate = () => {
    const waitingWorker = (window as unknown as { __pwaWaitingWorker?: ServiceWorker }).__pwaWaitingWorker
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 320,
        background: '#1a1612',
        border: '1px solid rgba(201,169,110,0.35)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        padding: '12px 14px',
        width: 320,
      }}
    >
      <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.9)', marginBottom: 8, fontFamily: 'Jost,sans-serif' }}>
        Доступне оновлення додатку
      </p>
      <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginBottom: 12, lineHeight: 1.5 }}>
        Натисніть "Оновити", щоб застосувати нову версію без втрати даних.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: '1px solid rgba(201,169,110,0.25)', color: 'rgba(245,240,232,0.45)', padding: '8px 10px', fontSize: 11, cursor: 'none' }}
        >
          Пізніше
        </button>
        <button
          onClick={applyUpdate}
          style={{ background: 'var(--gold)', border: 'none', color: '#18160e', padding: '8px 12px', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', cursor: 'none', fontFamily: 'Jost,sans-serif' }}
        >
          Оновити
        </button>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════════
   PWAInstallBanner — main export
   Показується знизу через 3 секунди на мобільних
   На desktop — мала кнопка в куті
════════════════════════════════════════════════════════════════ */
export function PWAInstallBanner() {
  const { os, canInstall, iosReady, showBanner, alreadyInstalled, installNative, snooze } = usePWAInstall()
  const [guide, setGuide] = useState<'ios' | 'android' | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (showBanner) recordPwaMetric('pwa_install_prompt_shown')
  }, [showBanner])

  if (alreadyInstalled || !showBanner) return null

  const isMobile = os === 'ios' || os === 'android'

  const handleInstall = async () => {
    if (os === 'ios') {
      setGuide('ios')
      return
    }
    if (canInstall) {
      setInstalling(true)
      const result = await installNative()
      setInstalling(false)
      if (result === 'accepted') {
        recordPwaMetric('pwa_install_accepted')
        toast.success('Broiderie встановлено! 🪡', { className: 'hot-toast', duration: 4000 })
      } else if (result === 'dismissed') {
        recordPwaMetric('pwa_install_dismissed')
        // Native prompt was dismissed — show manual guide
        setGuide('android')
      }
    } else {
      // No native prompt (Firefox, Samsung Browser, etc.)
      setGuide('android')
    }
  }

  const handleSnooze = () => {
    recordPwaMetric('pwa_install_dismissed')
    snooze()
    toast('Ви можете встановити додаток пізніше', { className: 'hot-toast', duration: 2500 })
  }

  return (
    <>
      <AnimatePresence>
        {/* ── Mobile: bottom sheet banner ── */}
        {isMobile && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200, delay: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 200,
              background: '#1a1612',
              borderTop: '1px solid rgba(201,169,110,0.3)',
              padding: `18px 20px env(safe-area-inset-bottom, 20px)`,
              boxShadow: '0 -12px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* App icon */}
              <div style={{ width: 52, height: 52, background: 'var(--gold)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                🪡
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(245,240,232,0.93)', marginBottom: 2, fontFamily: 'Jost,sans-serif' }}>
                  Встановити Broiderie
                </p>
                <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', lineHeight: 1.4, fontFamily: 'Jost,sans-serif' }}>
                  {os === 'ios'
                    ? 'Додайте на головний екран — без Safari'
                    : 'Встановіть як додаток — швидко і офлайн'}
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={handleSnooze}
                  style={{ width: 36, height: 36, background: 'none', border: '1px solid rgba(201,169,110,0.2)', color: 'rgba(245,240,232,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', borderRadius: 2 }}>
                  <X size={15} />
                </button>
                <button onClick={handleInstall} disabled={installing}
                  style={{ height: 36, padding: '0 16px', background: 'var(--gold)', border: 'none', color: '#18160e', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Jost,sans-serif', cursor: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, borderRadius: 2, whiteSpace: 'nowrap' }}>
                  {installing
                    ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(24,22,14,0.3)', borderTopColor: '#18160e', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /></>
                    : <><Download size={13} /> {os === 'ios' ? 'Як?' : 'Встановити'}</>
                  }
                </button>
              </div>
            </div>

            {/* Features row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(201,169,110,0.1)' }}>
              {[
                ['⚡', 'Швидко'],
                ['📴', 'Офлайн'],
                ['🔔', 'Сповіщення'],
                ['🔒', 'Без реклами'],
              ].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(245,240,232,0.4)', fontFamily: 'Jost,sans-serif' }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Desktop: small floating button ── */}
        {!isMobile && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200, delay: 2 }}
            style={{
              position: 'fixed',
              top: 24, left: 24,
              zIndex: 200,
              background: '#1a1612',
              border: '1px solid rgba(201,169,110,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
              maxWidth: 320,
              borderRadius: 2,
            }}
          >
            <div style={{ fontSize: 22, flexShrink: 0 }}>🪡</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.9)', marginBottom: 2, fontFamily: 'Jost,sans-serif', fontWeight: 500 }}>Встановити Broiderie</p>
              <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', fontFamily: 'Jost,sans-serif' }}>Як додаток на ПК</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSnooze}
                style={{ width: 32, height: 32, background: 'none', border: 'none', color: 'rgba(245,240,232,0.25)', cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
              <button onClick={handleInstall}
                style={{ height: 32, padding: '0 14px', background: 'var(--gold)', border: 'none', color: '#18160e', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Jost,sans-serif', cursor: 'none', fontWeight: 500, borderRadius: 1 }}>
                Встановити
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guides */}
      <AnimatePresence>
        {guide === 'ios'     && <IOSGuide     onClose={() => { setGuide(null); snooze() }} />}
        {guide === 'android' && <AndroidGuide onClose={() => { setGuide(null); snooze() }} />}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   PushSettings — for Account → Settings tab
════════════════════════════════════════════════════════════════ */
export function PushSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    categories,
    history,
    quietHoursEnabled,
    quietStartHour,
    quietEndHour,
    maxPerDay,
    loading,
    subscribe,
    unsubscribe,
    toggleCategory,
    setQuietHoursEnabled,
    setQuietHoursRange,
    setMaxPerDay,
    notify,
  } = usePushNotifications()
  const [testing, setTesting] = useState(false)
  const [metrics] = useState(() => getPwaMetrics())

  const catOptions = [
    { id: 'orders'      as const, icon: Package,   label: 'Статус замовлень',      desc: 'Підтвердження, відправка, доставка' },
    { id: 'promo'       as const, icon: Tag,        label: 'Акції та знижки',       desc: 'Промокоди, розпродажі' },
    { id: 'wishlist'    as const, icon: Heart,      label: 'Зниження ціни',         desc: 'Коли ціна на виріб зі списку падає' },
    { id: 'restock'     as const, icon: Package,    label: 'Повернення в наявність', desc: 'Коли улюблений виріб знову є' },
    { id: 'new_arrival' as const, icon: Sparkles,   label: 'Нові колекції',         desc: 'Першими дізнавайтесь про нові вироби' },
  ]

  if (!isSupported) return (
    <div style={{ padding: '24px', border: '1px solid var(--bd)', textAlign: 'center' }}>
      <BellOff size={28} style={{ color: 'var(--t2)', margin: '0 auto 10px' }} />
      <p style={{ fontSize: 13, color: 'var(--t2)' }}>Ваш браузер не підтримує push. Спробуйте Chrome або Safari 16.4+</p>
    </div>
  )

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
      toast('Push-сповіщення вимкнено', { className: 'hot-toast' })
    } else {
      const ok = await subscribe()
      if (ok) {
        toast.success('Push підключено! 🔔', { className: 'hot-toast' })
        setTimeout(() => notify.promoCode('WELCOME10', '10%'), 2000)
      } else if (permission === 'denied') {
        toast.error('Дозвольте сповіщення в налаштуваннях браузера', { className: 'hot-toast' })
      }
    }
  }

  return (
    <div>
      {/* Main toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: isSubscribed ? 'rgba(138,158,140,0.08)' : 'var(--b1)', border: `1px solid ${isSubscribed ? 'var(--sage)' : 'var(--bd)'}`, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: isSubscribed ? 'var(--sage)' : 'var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isSubscribed ? <Bell size={18} style={{ color: 'white' }} /> : <BellOff size={18} style={{ color: 'var(--t2)' }} />}
          </div>
          <div>
            <p style={{ fontSize: 14, color: 'var(--t0)', marginBottom: 2, fontFamily: 'Jost,sans-serif' }}>Push-сповіщення</p>
            <p style={{ fontSize: 11, color: 'var(--t2)' }}>
              {isSubscribed ? 'Підключено' : permission === 'denied' ? '⚠️ Заблоковано в браузері' : 'Вимкнено'}
            </p>
          </div>
        </div>
        <button onClick={handleToggle} disabled={loading || permission === 'denied'}
          style={{ width: 52, height: 28, borderRadius: 14, background: isSubscribed ? 'var(--sage)' : 'var(--b3)', border: 'none', position: 'relative', cursor: loading ? 'wait' : 'none', transition: 'background .25s', opacity: permission === 'denied' ? 0.4 : 1 }}>
          <motion.div animate={{ x: isSubscribed ? 26 : 2 }} transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            style={{ position: 'absolute', top: 3, width: 22, height: 22, background: 'white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
        </button>
      </div>

      {/* Categories */}
      <AnimatePresence>
        {isSubscribed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Типи сповіщень</p>
            {catOptions.map(({ id, icon: Icon, label, desc }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--b1)', border: '1px solid var(--bd)', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={15} style={{ color: categories[id] ? 'var(--gold)' : 'var(--t2)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--t0)' }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--t2)' }}>{desc}</p>
                  </div>
                </div>
                <button onClick={() => toggleCategory(id, !categories[id])}
                  style={{ width: 42, height: 24, borderRadius: 12, background: categories[id] ? 'var(--gold)' : 'var(--b2)', border: 'none', position: 'relative', cursor: 'none', transition: 'background .25s', flexShrink: 0 }}>
                  <motion.div animate={{ x: categories[id] ? 20 : 2 }} transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                    style={{ position: 'absolute', top: 2, width: 20, height: 20, background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            ))}

            <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid var(--bd)', background: 'var(--b0)' }}>
              <p style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Тихі години</p>
              <label className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--t1)' }}>Не турбувати уночі</span>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  style={{ accentColor: 'var(--gold)' }}
                />
              </label>
              <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--t2)' }}>
                  Початок
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={quietStartHour}
                    onChange={(e) => setQuietHoursRange(Number(e.target.value || 0), quietEndHour)}
                    className="field-input"
                    style={{ marginTop: 4 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: 'var(--t2)' }}>
                  Кінець
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={quietEndHour}
                    onChange={(e) => setQuietHoursRange(quietStartHour, Number(e.target.value || 0))}
                    className="field-input"
                    style={{ marginTop: 4 }}
                  />
                </label>
              </div>
              <label style={{ fontSize: 11, color: 'var(--t2)' }}>
                Ліміт сповіщень на день
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(Number(e.target.value || 1))}
                  className="field-input"
                  style={{ marginTop: 4 }}
                />
              </label>
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid var(--bd)', background: 'var(--b0)' }}>
              <p style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Центр сповіщень</p>
              {history.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--t2)' }}>Історія поки порожня</p>
              )}
              {history.slice(0, 8).map(entry => (
                <div key={entry.id} style={{ borderTop: '1px solid var(--bd)', padding: '8px 0' }}>
                  <p style={{ fontSize: 12, color: 'var(--t0)', marginBottom: 2 }}>{entry.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 3 }}>{entry.body}</p>
                  <p style={{ fontSize: 10, color: 'var(--t2)' }}>{new Date(entry.createdAt).toLocaleString('uk-UA')}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid var(--bd)', background: 'var(--b0)' }}>
              <p style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>PWA метрики (локально)</p>
              <div className="grid grid-cols-2 gap-2">
                <p style={{ fontSize: 11, color: 'var(--t2)' }}>Інстали прийнято: <span style={{ color: 'var(--t0)' }}>{metrics.counts.pwa_install_accepted}</span></p>
                <p style={{ fontSize: 11, color: 'var(--t2)' }}>Інстали відхилено: <span style={{ color: 'var(--t0)' }}>{metrics.counts.pwa_install_dismissed}</span></p>
                <p style={{ fontSize: 11, color: 'var(--t2)' }}>Push дозволено: <span style={{ color: 'var(--t0)' }}>{metrics.counts.push_permission_granted}</span></p>
                <p style={{ fontSize: 11, color: 'var(--t2)' }}>Push заблоковано: <span style={{ color: 'var(--t0)' }}>{metrics.counts.push_permission_denied}</span></p>
              </div>
            </div>

            <button onClick={async () => { setTesting(true); await notify.orderConfirmed('#TEST'); setTimeout(() => setTesting(false), 2000) }}
              disabled={testing}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 18px', background: 'none', border: '1px solid var(--bd)', color: 'var(--t2)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Jost,sans-serif', cursor: 'none', transition: 'all .2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='var(--gold)'; el.style.color='var(--gold)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='var(--bd)'; el.style.color='var(--t2)' }}>
              {testing ? <Check size={14} style={{ color: 'var(--sage)' }} /> : <Bell size={14} />}
              {testing ? 'Надіслано!' : 'Тестове сповіщення'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA install hint */}
      <div style={{ marginTop: 20, padding: '14px 18px', border: '1px solid var(--bd)', background: 'var(--b1)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Smartphone size={17} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 4 }}>Встановіть як додаток</p>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>
            iOS: Поділитись → «На екран Додому»<br />
            Android: ⋮ → «Додати до головного екрана»<br />
            ПК: кнопка встановлення в адресному рядку
          </p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   PushPermissionPrompt — inline in Account settings
════════════════════════════════════════════════════════════════ */
export function PushPermissionPrompt() {
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications()
  const [visible, setVisible] = useState(true)
  if (!isSupported || !visible || isSubscribed) return null

  if (permission === 'denied') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '14px 16px', background: '#1a1612', border: '1px solid rgba(201,169,110,0.25)', marginBottom: 16 }}>
        <div className="flex items-start gap-3">
          <BellOff size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.92)', marginBottom: 6, fontFamily: 'Jost,sans-serif', fontWeight: 500 }}>
              Сповіщення вимкнені у браузері
            </p>
            <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.45)', lineHeight: 1.6 }}>
              Відкрийте налаштування сайту у браузері та дозвольте Notifications для цього домену.
            </p>
          </div>
          <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.25)', cursor: 'none' }}><X size={15} /></button>
        </div>
      </motion.div>
    )
  }

  if (permission !== 'default') return null

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      style={{ padding: '18px 20px', background: '#1a1612', border: '1px solid rgba(201,169,110,0.25)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Bell size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, color: 'rgba(245,240,232,0.92)', marginBottom: 6, fontFamily: 'Jost,sans-serif', fontWeight: 500 }}>Дозволити сповіщення?</p>
          <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.45)', lineHeight: 1.6, marginBottom: 14 }}>
            Дізнавайтесь про замовлення та акції прямо на телефоні
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async () => { const ok = await subscribe(); setVisible(false); if (ok) toast.success('Push підключено! 🔔', { className: 'hot-toast' }) }}
              style={{ background: 'var(--gold)', border: 'none', color: '#18160e', padding: '8px 16px', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Jost,sans-serif', cursor: 'none', fontWeight: 500 }}>
              Дозволити
            </button>
            <button onClick={() => setVisible(false)}
              style={{ background: 'none', border: '1px solid rgba(201,169,110,0.2)', color: 'rgba(245,240,232,0.35)', padding: '8px 12px', fontSize: 11, fontFamily: 'Jost,sans-serif', cursor: 'none' }}>
              Пізніше
            </button>
          </div>
        </div>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.25)', cursor: 'none' }}><X size={15} /></button>
      </div>
    </motion.div>
  )
}
