export { default as ReviewsSlider } from './ReviewsSlider'
export { default as ChatWidget } from './ChatWidget'
export { FadeIn, StaggerGrid, SlideReveal } from './FadeIn'
// ThemeToggle.tsx
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/store'
import type { Theme } from '@/types'

const opts: { id: Theme; icon: typeof Sun; label: string }[] = [
  { id: 'light',  icon: Sun,     label: 'Світла'   },
  { id: 'dark',   icon: Moon,    label: 'Темна'    },
  { id: 'system', icon: Monitor, label: 'Авто'     },
]

export function ThemeToggle() {
  const { theme, resolved, set } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const Icon = theme === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', color: 'var(--t0)', padding: '4px' }}
        className="hover:text-[var(--gold)] transition-colors"
        aria-label="Тема"
      >
        <motion.div
          key={resolved}
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Icon size={18} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-2 z-[200] overflow-hidden"
            style={{ width: 148, background: 'var(--b1)', border: '1px solid var(--bd)', boxShadow: 'var(--sh)' }}
          >
            {opts.map(({ id, icon: Ic, label }) => (
              <button
                key={id}
                onClick={() => { set(id); setOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[12px] transition-all"
                style={{
                  background: 'none', border: 'none', textAlign: 'left',
                  color: theme === id ? 'var(--gold)' : 'var(--t2)',
                  borderLeft: `2px solid ${theme === id ? 'var(--gold)' : 'transparent'}`,
                }}
              >
                <Ic size={13} /> {label}
                {theme === id && <span className="ml-auto" style={{ fontSize: 10, color: 'var(--gold)' }}>✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// StarRating.tsx
export function StarRating({ rating, size = 14, count }: { rating: number; size?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < Math.round(rating) ? 'var(--gold)' : 'none'} stroke={i < Math.round(rating) ? 'var(--gold)' : 'var(--bd2)'} strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
      </div>
      {count !== undefined && <span style={{ fontSize: 12, color: 'var(--t2)' }}>({count})</span>}
    </div>
  )
}

// SectionTitle.tsx
interface SectionTitleProps {
  eyebrow?: string
  title: string
  titleItalic?: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionTitle({ eyebrow, title, titleItalic, subtitle, align = 'left', className = '' }: SectionTitleProps) {
  return (
    <div className={`${className} ${align === 'center' ? 'text-center' : ''}`}>
      {eyebrow && (
        <div className={`mb-4 ${align === 'center' ? 'justify-center' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>
          {align !== 'center' && <span style={{ width: 28, height: 1, background: 'var(--gold)', flexShrink: 0 }} />}
          {eyebrow}
          {align === 'center' && <span style={{ width: 28, height: 1, background: 'var(--gold)', flexShrink: 0 }} />}
        </div>
      )}
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(32px,4vw,54px)',
        fontWeight: 300,
        color: 'var(--t0)',
        lineHeight: 1.08,
        paddingBottom: 14,
        borderBottom: '1px solid var(--bd)',
        marginBottom: subtitle ? 0 : 0,
      }}>
        {title}
        {titleItalic && <><br /><em style={{ fontStyle: 'italic', color: 'var(--gold-d)' }}>{titleItalic}</em></>}
      </h2>
      {subtitle && (
        <p className="mt-4" style={{
          fontSize: 15, lineHeight: 1.8, color: 'var(--t1)',
          maxWidth: align === 'center' ? 560 : 480,
          margin: align === 'center' ? '16px auto 0' : '16px 0 0',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// Breadcrumb.tsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 flex-wrap" style={{ fontSize: 11, letterSpacing: 1, color: 'var(--t2)' }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight size={12} />}
          {item.to
            ? <Link to={item.to} className="hover:text-[var(--gold)] transition-colors">{item.label}</Link>
            : <span style={{ color: 'var(--t0)' }}>{item.label}</span>
          }
        </span>
      ))}
    </nav>
  )
}
