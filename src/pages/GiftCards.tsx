import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, CreditCard, Download, Copy, Check, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useSEO } from '@/hooks/useSEO'
import toast from 'react-hot-toast'

const AMOUNTS = [500, 1000, 1500, 2000, 3000, 5000]

type GiftForm = {
  amount: string; custom_amount: string
  recipient_name: string; recipient_email: string
  sender_name: string; sender_message: string
  delivery: 'email' | 'print'
}

export default function GiftCards() {
  const [selected, setSelected] = useState(1000)
  const [custom, setCustom] = useState('')
  const [copied, setCopied] = useState(false)
  const { register, handleSubmit, reset } = useForm<GiftForm>()

  useSEO({
    title: 'Подарункові сертифікати Broiderie',
    description: 'Подарункові сертифікати на вишиванки та вироби ручної роботи. Від 500₴. Надсилаємо на email або у роздрукованому вигляді.',
    url: '/gift-cards',
  })

  const finalAmount = custom ? Number(custom) : selected

  const onOrder = (d: GiftForm) => {
    toast.success(`Сертифікат на ${finalAmount.toLocaleString()}₴ замовлено! 🎁`, { className: 'hot-toast', duration: 4000 })
    reset()
  }

  const demoCode = 'GIFT-BRDX-2025-7K4M'

  const copyCode = () => {
    navigator.clipboard.writeText(demoCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Код скопійовано!', { className: 'hot-toast' })
  }

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Hero */}
      <div className="dark-section" style={{ padding: '72px 0', position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0 orn-bg" style={{ opacity: 0.06 }} />
        <div className="page-wrap relative z-[1]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Подарункові сертифікати</span>
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(44px,6vw,76px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.05, marginBottom: 20 }}>
                Подаруй<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>мистецтво</em>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.5)', lineHeight: 1.8, maxWidth: 420, marginBottom: 32 }}>
                Ідеальний подарунок для тих, хто цінує автентичну українську культуру. Сертифікат діє 1 рік.
              </p>
              <div className="flex flex-wrap gap-4">
                {[['🎁','Для будь-якого приводу'],['⚡','Миттєва доставка на email'],['📝','Персональне послання']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2" style={{ fontSize: 13, color: 'rgba(245,240,232,0.55)' }}>
                    <span>{icon}</span> {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'linear-gradient(135deg, #2a2318 0%, #1a1612 60%, #241f15 100%)', border: '1px solid rgba(201,169,110,0.3)', padding: 36, position: 'relative', overflow: 'hidden' }}>
              <div className="absolute inset-0 orn-bg" style={{ opacity: 0.12 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, letterSpacing: 4, color: 'var(--gold-l)' }}>Broiderie</p>
                    <p style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginTop: 2 }}>GIFT CERTIFICATE</p>
                  </div>
                  <Gift size={28} style={{ color: 'var(--gold)' }} />
                </div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: 'var(--gold-l)', lineHeight: 1, marginBottom: 8 }}>
                  {finalAmount ? finalAmount.toLocaleString() : '1 000'}₴
                </p>
                <p style={{ fontSize: 12, color: 'rgba(201,169,110,0.45)', marginBottom: 24 }}>На будь-які вироби ручної вишивки</p>
                <div style={{ borderTop: '1px solid rgba(201,169,110,0.15)', paddingTop: 16 }}>
                  <p style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(201,169,110,0.4)' }}>GIFT-BRDX-2025-XXXX</p>
                  <p style={{ fontSize: 10, color: 'rgba(201,169,110,0.3)', marginTop: 4 }}>Дійсний до: 31.12.2026</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--b1)', borderBottom: '1px solid var(--bd)' }}>
        <div className="page-wrap py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Оберіть суму', desc: 'Від 500₴ до 10 000₴ або введіть свою' },
              { step: '02', title: 'Вкажіть дані', desc: 'Ім\'я отримувача та персональне послання' },
              { step: '03', title: 'Оплатіть онлайн', desc: 'Карта, Apple Pay, Google Pay, LiqPay' },
              { step: '04', title: 'Отримайте код', desc: 'На email або у красивому PDF для друку' },
            ].map(s => (
              <div key={s.step}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: 'var(--bd2)', lineHeight: 1, marginBottom: 8 }}>{s.step}</p>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main form */}
      <div className="page-wrap section">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Замовити сертифікат</span>
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 300, color: 'var(--t0)', paddingBottom: 14, borderBottom: '1px solid var(--bd)', marginBottom: 32 }}>
              Налаштуйте подарунок
            </h2>

            <form onSubmit={handleSubmit(onOrder)} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Amount */}
              <div>
                <p className="field-label" style={{ marginBottom: 14 }}>Сума сертифіката</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {AMOUNTS.map(amt => (
                    <button key={amt} type="button" onClick={() => { setSelected(amt); setCustom('') }}
                      style={{
                        padding: '10px 20px', border: `1px solid ${selected === amt && !custom ? 'var(--t0)' : 'var(--bd)'}`,
                        background: selected === amt && !custom ? 'var(--t0)' : 'none',
                        color: selected === amt && !custom ? 'var(--t-inv)' : 'var(--t1)',
                        fontFamily: 'Cormorant Garamond, serif', fontSize: 18, cursor: 'none', transition: 'all .2s',
                      }}>
                      {amt.toLocaleString()}₴
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--t2)' }}>Або введіть свою суму:</span>
                  <input type="number" value={custom} onChange={e => { setCustom(e.target.value); setSelected(0) }}
                    placeholder="наприклад 2500"
                    style={{ width: 140, border: 'none', borderBottom: `1px solid ${custom ? 'var(--gold)' : 'var(--bd)'}`, background: 'none', padding: '8px 0', fontSize: 16, color: 'var(--t0)', outline: 'none', fontFamily: 'Jost, sans-serif' }} />
                  {custom && <span style={{ color: 'var(--t2)', fontSize: 14 }}>₴</span>}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <p className="field-label" style={{ marginBottom: 14 }}>Для кого</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="field-wrap"><label className="field-label">Ім'я отримувача *</label><input className="field-input" placeholder="Оксана" {...register('recipient_name', { required: true })} /></div>
                  <div className="field-wrap"><label className="field-label">Email отримувача *</label><input type="email" className="field-input" placeholder="oksana@gmail.com" {...register('recipient_email', { required: true })} /></div>
                </div>
              </div>

              {/* Sender */}
              <div>
                <p className="field-label" style={{ marginBottom: 14 }}>Від кого</p>
                <div className="field-wrap" style={{ marginBottom: 16 }}>
                  <label className="field-label">Ваше ім'я *</label>
                  <input className="field-input" placeholder="Марія" {...register('sender_name', { required: true })} />
                </div>
                <div className="field-wrap">
                  <label className="field-label">Персональне послання</label>
                  <textarea rows={4} className="field-input" style={{ resize: 'none' }}
                    placeholder="З Днем народження! Нехай ця вишиванка приносить тобі радість..."
                    {...register('sender_message')} />
                </div>
              </div>

              {/* Delivery */}
              <div>
                <p className="field-label" style={{ marginBottom: 14 }}>Спосіб отримання</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { value: 'email', label: 'На email отримувача', desc: 'Миттєво після оплати' },
                    { value: 'print', label: 'PDF для самостійного друку', desc: 'Завантажте красивий сертифікат формату A5' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid var(--bd)', cursor: 'none' }}>
                      <input type="radio" value={opt.value} defaultChecked={opt.value === 'email'} {...register('delivery')} style={{ accentColor: 'var(--gold)' }} />
                      <div>
                        <p style={{ fontSize: 14, color: 'var(--t0)' }}>{opt.label}</p>
                        <p style={{ fontSize: 12, color: 'var(--t2)' }}>{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--t2)', letterSpacing: 1 }}>Сума до оплати</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: 'var(--t0)', lineHeight: 1 }}>
                    {(finalAmount || 1000).toLocaleString()}₴
                  </p>
                </div>
                <button type="submit" className="btn-dark" style={{ display: 'flex', gap: 10 }}>
                  <CreditCard size={16} /> Оплатити та отримати
                </button>
              </div>
            </form>
          </div>

          {/* How to use */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 28 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Як використати сертифікат</p>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Оберіть вироби у каталозі',
                  'Перейдіть до оформлення',
                  'Введіть код сертифіката у поле "Промокод"',
                  'Сума буде автоматично списана',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 mb-4">
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gold)', color: '#18160e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{i+1}</span>
                    <span style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.5 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Demo code */}
            <div style={{ background: '#1a1612', border: '1px solid rgba(201,169,110,0.2)', padding: 24 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Приклад коду</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.06)' }}>
                <code style={{ flex: 1, fontSize: 15, letterSpacing: 3, color: 'var(--gold-l)', fontFamily: 'monospace' }}>{demoCode}</code>
                <button onClick={copyCode} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.5)', cursor: 'none' }}>
                  {copied ? <Check size={16} style={{ color: 'var(--sage)' }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ padding: 20, border: '1px solid var(--bd)', background: 'var(--b1)' }}>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
                ✓ Сертифікат дійсний 12 місяців<br />
                ✓ Можна використати частково<br />
                ✓ Не підлягає поверненню<br />
                ✓ Поєднується з акційними цінами<br />
                ✓ Корпоративне замовлення від 5 шт.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
