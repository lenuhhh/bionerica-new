import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, Zap } from 'lucide-react'
import { useCountdown, hoursFromNow } from '@/hooks/useCountdown'
import { Link } from 'react-router-dom'

interface Props {
  /** Promo end date — defaults to 24h from now */
  endsAt?: Date
  discountLabel?: string
  promoCode?: string
}

/* Flip digit — animates when value changes */
function Digit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, '0')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div
        style={{
          background: 'rgba(201,169,110,0.15)',
          border: '1px solid rgba(201,169,110,0.3)',
          padding: '6px 10px',
          minWidth: 44,
          textAlign: 'center',
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 300,
          color: 'var(--gold-l)',
          letterSpacing: 2,
          lineHeight: 1,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={str}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'block' }}
          >
            {str}
          </motion.span>
        </AnimatePresence>
      </div>
      <span style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)' }}>
        {label}
      </span>
    </div>
  )
}

export default function CountdownBanner({ endsAt, discountLabel = '15%', promoCode = 'BROIDERIE15' }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const target = endsAt || hoursFromNow(24)
  const { hours, minutes, seconds, days, expired } = useCountdown(target)

  if (expired || dismissed) return null

  return (
    <div
      style={{
        background: '#1a1612',
        borderBottom: '1px solid rgba(201,169,110,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle ornament */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: -40, top: '50%',
          transform: 'translateY(-50%)',
          width: 120, height: 120,
          opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, #c9a96e 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          pointerEvents: 'none',
        }}
      />

      <div
        className="page-wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(12px, 3vw, 36px)',
          padding: '12px 20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', lineHeight: 1, marginBottom: 2 }}>
              Ексклюзивна акція
            </p>
            <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: 'rgba(245,240,232,0.85)', fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, lineHeight: 1 }}>
              Знижка <strong style={{ color: 'var(--gold-l)' }}>{discountLabel}</strong> закінчується через:
            </p>
          </div>
        </div>

        {/* Countdown digits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {days > 0 && <><Digit value={days} label="дні" /><span style={{ color: 'var(--gold)', fontSize: 22, lineHeight: 1, alignSelf: 'flex-start', marginTop: 4 }}>:</span></>}
          <Digit value={hours} label="год" />
          <span style={{ color: 'var(--gold)', fontSize: 22, lineHeight: 1, alignSelf: 'flex-start', marginTop: 4 }}>:</span>
          <Digit value={minutes} label="хв" />
          <span style={{ color: 'var(--gold)', fontSize: 22, lineHeight: 1, alignSelf: 'flex-start', marginTop: 4 }}>:</span>
          <Digit value={seconds} label="сек" />
        </div>

        {/* Promo code + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              border: '1px dashed rgba(201,169,110,0.5)',
              padding: '5px 14px',
              fontSize: 13,
              letterSpacing: 3,
              fontFamily: 'Jost, sans-serif',
              color: 'var(--gold)',
            }}
          >
            {promoCode}
          </div>
          <Link
            to="/catalog"
            style={{
              background: 'var(--gold)',
              color: '#18160e',
              padding: '8px 18px',
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontFamily: 'Jost, sans-serif',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Купити зараз →
          </Link>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none',
          color: 'rgba(245,240,232,0.3)', cursor: 'none',
          display: 'flex', alignItems: 'center',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.7)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.3)'}
        aria-label="Закрити"
      >
        <X size={16} />
      </button>
    </div>
  )
}
