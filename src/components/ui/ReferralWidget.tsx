import { useState } from 'react'
import { Copy, Check, Share2, Users, Gift } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface ReferralWidgetProps {
  userId: string
  referralCode?: string
  referralCount?: number
  bonusEarned?: number
}

/** Детермінований реферальний код з userId */
export function generateReferralCode(userId: string): string {
  const clean = userId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `BIO${clean}`
}

export default function ReferralWidget({
  userId,
  referralCode: propCode,
  referralCount = 0,
  bonusEarned = 0,
}: ReferralWidgetProps) {
  const code = propCode ?? generateReferralCode(userId)
  const referralLink = `${window.location.origin}/?ref=${code}`
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Скопійовано!', { className: 'hot-toast', duration: 2000 })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Bionerica — органічна ферма',
      text: 'Привіт! Замов органічні ягоди та овочі просто з ферми. Знижка 10% на перше замовлення за моїм посиланням:',
      url: referralLink,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled, ignore
      }
    } else {
      await handleCopy(referralLink)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '1px solid var(--bd)',
        background: 'var(--b1)',
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Gift size={18} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--t0)', margin: 0, fontSize: 15 }}>
            Запроси друга — отримай бонус
          </p>
          <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>
            Твій друг отримає знижку 10%, ти — 50 ₴ бонусів
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
            <Users size={14} style={{ color: 'var(--t2)' }} />
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)', margin: 0 }}>
            {referralCount}
          </p>
          <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0, letterSpacing: '0.05em' }}>запрошено</p>
        </div>
        <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
            <Gift size={14} style={{ color: 'var(--t2)' }} />
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--gold)', margin: 0 }}>
            {bonusEarned} ₴
          </p>
          <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0, letterSpacing: '0.05em' }}>зароблено</p>
        </div>
      </div>

      {/* Referral code */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 8 }}>
          Твій реферальний код
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, background: 'var(--b0)', border: '1px solid var(--bd)',
            padding: '11px 16px', fontFamily: 'monospace', fontSize: 16,
            fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)',
          }}>
            {code}
          </div>
          <button
            onClick={() => void handleCopy(code)}
            style={{
              width: 44, height: 44, border: '1px solid var(--bd)', background: 'var(--b0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: copied ? 'var(--sage)' : 'var(--t1)', transition: 'all 0.2s',
              flexShrink: 0,
            }}
            title="Скопіювати код"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Referral link */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 8 }}>
          Або поділись посиланням
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, background: 'var(--b0)', border: '1px solid var(--bd)',
            padding: '11px 16px', fontSize: 12, color: 'var(--t2)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {referralLink}
          </div>
          <button
            onClick={() => void handleShare()}
            style={{
              width: 44, height: 44, border: '1px solid var(--bd)', background: 'var(--b0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'var(--t1)', transition: 'all 0.2s', flexShrink: 0,
            }}
            title="Поділитись"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
        <p style={{ margin: 0 }}>
          🌿 Друг вводить код при замовленні — отримує <strong style={{ color: 'var(--t1)' }}>знижку 10%</strong>.<br />
          Після його першої доставки ти отримуєш <strong style={{ color: 'var(--gold)' }}>50 ₴ бонусів</strong> на рахунок.
        </p>
      </div>
    </motion.div>
  )
}
