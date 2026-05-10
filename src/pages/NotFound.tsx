import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Search } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'

export default function NotFound() {
  useSEO({ title: '404 — Сторінку не знайдено', noindex: true })
  return (
    <div style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', background: 'var(--b0)' }}>
      {/* Ornament ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative mb-10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          style={{ width: 180, height: 180, position: 'relative' }}
        >
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
            <circle cx="90" cy="90" r="80" stroke="var(--bd2)" strokeWidth="0.8"/>
            <circle cx="90" cy="90" r="58" stroke="var(--bd)" strokeWidth="0.8"/>
            <line x1="10" y1="90" x2="170" y2="90" stroke="var(--bd)" strokeWidth="0.6"/>
            <line x1="90" y1="10" x2="90" y2="170" stroke="var(--bd)" strokeWidth="0.6"/>
            <line x1="33" y1="33" x2="147" y2="147" stroke="var(--bd)" strokeWidth="0.6"/>
            <line x1="147" y1="33" x2="33" y2="147" stroke="var(--bd)" strokeWidth="0.6"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 72, fontWeight: 300, color: 'var(--t0)', lineHeight: 1 }}>404</span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 14 }}>Сторінку не знайдено</span>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: 'var(--t0)', lineHeight: 1.05, marginBottom: 16 }}>
          Ця сторінка<br /><em style={{ color: 'var(--gold-d)', fontStyle: 'italic' }}>загубилась</em>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--t2)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Можливо, вона була переміщена або більше не існує. Але наші вишиванки нікуди не зникли!
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-dark">
            <ArrowLeft size={16} /> На головну
          </Link>
          <Link to="/catalog" className="btn-outline">
            <Search size={16} /> Переглянути каталог
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
