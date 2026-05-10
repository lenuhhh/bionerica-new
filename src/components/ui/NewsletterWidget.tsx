import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Send, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { subscribeNewsletter } from '@/lib/supabase'
import { validators } from '@/lib/formProtection'

interface NewsletterWidgetProps {
  title?: string
  subtitle?: string
  showTelegram?: boolean
  compact?: boolean
}

export default function NewsletterWidget({
  title = 'Залишайтеся в курсі',
  subtitle = 'Отримуйте сповіщення про сезонні пропозиції, нові рецепти та знижки',
  showTelegram = true,
  compact = false,
}: NewsletterWidgetProps) {
  const [email, setEmail] = useState('')
  const [telegram, setTelegram] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!validators.email(email)) {
      setEmailError('Введіть коректний email')
      return
    }

    setLoading(true)
    try {
      const { error } = await subscribeNewsletter(email, telegram || undefined)
      if (error) {
        // Ignore duplicate error (already subscribed)
        if (String(error.code) === '23505') {
          setDone(true)
          toast.success('Ви вже підписані! Дякуємо.', { className: 'hot-toast' })
        } else {
          toast.error('Помилка підписки. Спробуйте ще раз.', { className: 'hot-toast' })
        }
        return
      }
      setDone(true)
      toast.success('Підписка оформлена! Вітальний лист вже в дорозі.', { className: 'hot-toast', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          border: '1px solid rgba(143,173,133,0.4)',
          background: 'rgba(143,173,133,0.08)',
          padding: compact ? '20px 24px' : '28px 32px',
          textAlign: 'center',
        }}
      >
        <CheckCircle size={36} style={{ color: 'var(--sage)', margin: '0 auto 12px' }} />
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--t0)', marginBottom: 8 }}>
          Дякуємо за підписку!
        </p>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
          Ми надішлемо вітальний лист і сповіщатимемо про нові пропозиції першими.
        </p>
      </motion.div>
    )
  }

  return (
    <div style={{
      border: '1px solid var(--bd)',
      background: 'var(--b1)',
      padding: compact ? '20px 24px' : '32px 36px',
    }}>
      {!compact && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Mail size={18} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--t0)', margin: 0, fontSize: 16 }}>{title}</p>
              <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>{subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {compact && (
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>{title}</p>
      )}

      <form onSubmit={e => void handleSubmit(e)}>
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: `1px solid ${emailError ? 'rgba(192,57,43,0.5)' : 'var(--bd)'}`,
            background: 'var(--b0)', padding: '11px 14px',
          }}>
            <Mail size={14} style={{ color: 'var(--t2)', flexShrink: 0 }} />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError('') }}
              placeholder="Ваш email"
              required
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: 'var(--t0)', fontFamily: 'Jost, sans-serif', flex: 1,
              }}
            />
          </div>
          {emailError && (
            <p style={{ fontSize: 11, color: 'var(--berry)', marginTop: 4 }}>{emailError}</p>
          )}
        </div>

        {showTelegram && !compact && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid var(--bd)', background: 'var(--b0)', padding: '11px 14px',
            }}>
              <span style={{ fontSize: 14, color: 'var(--t2)', flexShrink: 0 }}>@</span>
              <input
                type="text"
                value={telegram}
                onChange={e => setTelegram(e.target.value.replace(/^@/, ''))}
                placeholder="Telegram нікнейм (необов'язково)"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  fontSize: 14, color: 'var(--t0)', fontFamily: 'Jost, sans-serif', flex: 1,
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>
              Для сповіщень у Telegram про ваше замовлення
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-dark"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? (
            <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Підписуємо...</>
          ) : (
            <><Send size={15} /> Підписатися</>
          )}
        </button>

        <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 10, textAlign: 'center' }}>
          Без спаму. Відписатися можна в будь-який момент.
        </p>
      </form>
    </div>
  )
}
