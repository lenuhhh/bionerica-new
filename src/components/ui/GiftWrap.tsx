// GiftWrap.tsx — Add gift wrapping to any order
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, X, Check, ChevronDown } from 'lucide-react'

interface Props {
  onSelect: (option: GiftOption | null) => void
  selected: GiftOption | null
}

export interface GiftOption {
  id: string
  name: string
  description: string
  price: number
  preview: string
}

const giftOptions: GiftOption[] = [
  {
    id: 'classic',
    name: 'Класична',
    description: 'Крафтовий папір, золота стрічка, листівка',
    price: 150,
    preview: '📦',
  },
  {
    id: 'premium',
    name: 'Преміум',
    description: 'Фірмова коробка, шовкова тканина, сургучева печатка',
    price: 350,
    preview: '🎁',
  },
  {
    id: 'wedding',
    name: 'Весільна',
    description: 'Біла атласна коробка, вишиті інціали, суха квітка',
    price: 550,
    preview: '🤍',
  },
]

export function GiftWrapSelect({ onSelect, selected }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ border: '1px solid var(--bd)', marginTop: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', background: selected ? 'rgba(201,169,110,0.06)' : 'none',
          border: 'none', cursor: 'none', textAlign: 'left',
        }}
      >
        <Gift size={18} style={{ color: selected ? 'var(--gold)' : 'var(--t2)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--t0)', fontFamily: 'Jost, sans-serif' }}>
            {selected ? `Подарункова упаковка: ${selected.name}` : 'Додати подарункову упаковку'}
          </p>
          {selected && <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>{selected.name}</p>}
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'var(--t2)' }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
              {/* No wrapping option */}
              <button
                onClick={() => { onSelect(null); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  border: `1px solid ${!selected ? 'var(--t0)' : 'var(--bd)'}`,
                  background: !selected ? 'var(--b1)' : 'none',
                  cursor: 'none', textAlign: 'left',
                }}
              >
                <X size={16} style={{ color: 'var(--t2)' }} />
                <span style={{ fontSize: 13, color: 'var(--t1)', fontFamily: 'Jost, sans-serif' }}>Без упаковки</span>
              </button>

              {giftOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onSelect(opt); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    border: `1px solid ${selected?.id === opt.id ? 'var(--gold)' : 'var(--bd)'}`,
                    background: selected?.id === opt.id ? 'rgba(201,169,110,0.06)' : 'none',
                    cursor: 'none', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.preview}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 2, fontFamily: 'Jost, sans-serif' }}>{opt.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--t2)' }}>{opt.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {selected?.id === opt.id && <Check size={14} style={{ color: 'var(--sage)', marginLeft: 'auto' }} />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Size Guide Modal ─────────────────────────────────────────────────────────
interface SizeGuideProps { isOpen: boolean; onClose: () => void; category: string }

const sizeData = {
  vyshyvanky: {
    headers: ['Розмір', 'Груди', 'Талія', 'Бедра', 'Довжина'],
    rows: [
      ['XS', '80–84', '60–64', '88–92', '66'],
      ['S',  '84–88', '64–68', '92–96', '68'],
      ['M',  '88–92', '68–72', '96–100','70'],
      ['L',  '92–96', '72–76', '100–104','72'],
      ['XL', '96–100','76–80', '104–108','74'],
      ['XXL','100–108','80–88','108–116','76'],
    ],
  },
  sukni: {
    headers: ['Розмір', 'Груди', 'Талія', 'Бедра', 'Довжина'],
    rows: [
      ['XS', '80–84', '60–64', '88–92', '128'],
      ['S',  '84–88', '64–68', '92–96', '130'],
      ['M',  '88–92', '68–72', '96–100','132'],
      ['L',  '92–96', '72–76', '100–104','134'],
      ['XL', '96–100','76–80', '104–108','136'],
    ],
  },
}

export function SizeGuideModal({ isOpen, onClose, category }: SizeGuideProps) {
  const data = sizeData[category as keyof typeof sizeData] || sizeData.vyshyvanky
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm')

  const convert = (val: string) => {
    if (unit === 'cm') return val
    return val.split('–').map(v => Math.round(parseInt(v) / 2.54)).join('–')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 300 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '90%', maxWidth: 640,
              background: 'var(--b0)', border: '1px solid var(--bd)',
              zIndex: 301, padding: 40, maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)' }}>
                Таблиця розмірів
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['cm', 'inch'] as const).map(u => (
                  <button key={u} onClick={() => setUnit(u)}
                    style={{
                      padding: '6px 14px', fontSize: 11, letterSpacing: 1,
                      background: unit === u ? 'var(--t0)' : 'none',
                      color: unit === u ? 'var(--t-inv, white)' : 'var(--t2)',
                      border: '1px solid var(--bd)', cursor: 'none', fontFamily: 'Jost, sans-serif',
                    }}>
                    {u}
                  </button>
                ))}
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t2)', marginLeft: 8, cursor: 'none' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {data.headers.map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', borderBottom: '1px solid var(--bd)', background: 'var(--b1)' }}>
                      {h} {unit === 'inch' && h !== 'Розмір' ? '(дюйм)' : unit === 'cm' && h !== 'Розмір' ? '(см)' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--b1)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '12px', borderBottom: '1px solid var(--bd)', color: j === 0 ? 'var(--t0)' : 'var(--t1)', fontWeight: j === 0 ? 500 : 300, fontFamily: j === 0 ? 'Cormorant Garamond, serif' : 'Jost, sans-serif', fontSize: j === 0 ? 16 : 13 }}>
                        {j === 0 ? cell : convert(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 24, padding: 16, background: 'var(--b1)', border: '1px solid var(--bd)', fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--t0)' }}>Як виміряти:</strong><br />
              <strong>Груди</strong> — горизонтально по найвищій точці, рука розслаблена.<br />
              <strong>Талія</strong> — у найвужчому місці.<br />
              <strong>Бедра</strong> — горизонтально у найширшому місці.<br />
              При сумнівах — замовляйте на розмір більше.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
