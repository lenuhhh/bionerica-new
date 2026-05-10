import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, X, Check, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShareProps {
  title: string
  description?: string
  image?: string
  url?: string
  price?: number
  compact?: boolean
}

const platforms = [
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#2AABEE',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.615c-.15.68-.543.847-1.098.528l-3.04-2.24-1.467 1.41c-.163.163-.3.3-.613.3l.218-3.1 5.64-5.098c.245-.218-.054-.34-.38-.122l-6.975 4.39-3.004-.94c-.652-.204-.665-.652.136-.966l11.718-4.52c.54-.198 1.012.12.905.943z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E4405F',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    getUrl: (url: string) => `https://www.instagram.com/`,
    native: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    color: '#000000',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'viber',
    label: 'Viber',
    color: '#7360F2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.693 6.698.623 9.82c-.07 3.121-.154 8.972 5.5 10.565h.005l-.004 2.42s-.037.975.605 1.172c.774.241 1.228-.498 1.967-1.295.406-.437.967-1.077 1.388-1.564 3.834.32 6.783-.414 7.117-.522.775-.251 5.159-.812 5.875-6.622.738-5.984-.358-9.766-2.317-11.479l-.001-.002C18.8.64 15.8-.063 11.399.002zm.064 1.804c3.8-.056 6.338.578 7.827 1.934C20.99 5.17 21.895 8.348 21.26 13.5c-.591 4.808-4.027 5.104-4.677 5.311-.287.093-2.918.726-6.263.527 0 0-2.484 2.999-3.258 3.783-.125.127-.27.177-.369.152-.138-.036-.176-.198-.174-.438l.021-3.726C2.078 17.6 2.23 12.84 2.291 10.166c.063-2.72.553-4.842 1.974-6.221C5.924 2.4 9.477 1.862 11.462 1.806zm.16 3.054c-.217.001-.432.166-.429.453.02 1.768-.019 4.247 2.471 5.2.129.042.22.023.288-.033.043-.035.069-.087.072-.143l.075-1.038c.013-.183-.104-.34-.275-.402-.63-.228-1.012-.699-1.135-1.352-.072-.388-.083-.807-.082-1.244.002-.22-.131-.443-.426-.443h-.001c-.192-.001-.357.002-.558.002zm-3.76.64C7.3 5.39 6.567 6.22 6.3 7.13c-.167.573.001 1.308.464 2.06.578.943 1.513 1.975 2.704 2.876 1.177.892 2.48 1.596 3.632 1.996.866.299 1.771.347 2.383.101.79-.316 1.423-1.081 1.573-1.83.04-.196-.038-.374-.204-.483l-2.127-1.437c-.178-.12-.375-.098-.524.07l-.611.691c-.152.171-.39.214-.585.104-.65-.369-1.338-.875-1.916-1.46-.574-.582-1.013-1.192-1.26-1.765-.074-.17-.018-.373.136-.499l.636-.52c.18-.147.221-.36.112-.555L8.387 5.787c-.094-.17-.239-.278-.424-.286z"/>
      </svg>
    ),
    getUrl: (url: string, title: string) => `viber://forward?text=${encodeURIComponent(title + ' ' + url)}`,
  },
]

export default function SocialShare({ title, description, image, url, price, compact = false }: ShareProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = url || window.location.href

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: shareUrl })
        return
      } catch {}
    }
    setOpen(true)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Посилання скопійовано!', { className: 'hot-toast' })
    setTimeout(() => setCopied(false), 2500)
  }

  const openPlatform = (platform: typeof platforms[0]) => {
    if (platform.native) {
      toast('Скопіюйте посилання та вставте в Instagram', { className: 'hot-toast' })
      copyLink()
    } else {
      window.open(platform.getUrl(shareUrl, title), '_blank', 'width=600,height=400,noopener')
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleNativeShare}
        className="btn-icon transition-all"
        title="Поділитись"
        style={{ position: 'relative' }}
      >
        <Share2 size={18} />
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: '1px solid var(--bd)',
          padding: '9px 16px', color: 'var(--t1)',
          fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
          fontFamily: 'Jost, sans-serif', cursor: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'}
      >
        <Share2 size={15} /> Поділитись
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute', bottom: '110%', left: 0,
                background: 'var(--b0)', border: '1px solid var(--bd)',
                boxShadow: 'var(--sh-lg)', zIndex: 99, minWidth: 300, padding: 20,
              }}
            >
              {/* OG Preview */}
              {image && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 12, background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                  <img src={image} alt={title} style={{ width: 56, height: 72, objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 3 }}>broiderie.ua</p>
                    <p style={{ fontSize: 13, color: 'var(--t0)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.3, marginBottom: 3 }}>{title}</p>
                    {price && <p style={{ fontSize: 14, color: 'var(--t0)', fontFamily: 'Cormorant Garamond, serif' }}>{price.toLocaleString('uk-UA')} ₴</p>}
                  </div>
                </div>
              )}

              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Поділитись</p>

              {/* Platform buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {platforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => openPlatform(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', background: 'var(--b1)',
                      border: '1px solid var(--bd)', cursor: 'none',
                      color: 'var(--t1)', fontSize: 13, fontFamily: 'Jost, sans-serif',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = p.color + '18'
                      el.style.borderColor = p.color + '60'
                      el.style.color = p.color
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'var(--b1)'
                      el.style.borderColor = 'var(--bd)'
                      el.style.color = 'var(--t1)'
                    }}
                  >
                    <span style={{ color: p.color, display: 'flex', flexShrink: 0 }}>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Copy link */}
              <button
                onClick={copyLink}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: copied ? 'rgba(138,158,140,0.12)' : 'var(--b1)',
                  border: `1px solid ${copied ? 'var(--sage)' : 'var(--bd)'}`,
                  cursor: 'none', color: copied ? 'var(--sage)' : 'var(--t1)',
                  fontSize: 12, fontFamily: 'Jost, sans-serif', transition: 'all 0.2s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                  {copied ? 'Скопійовано!' : 'Скопіювати посилання'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--t2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shareUrl.replace('https://', '')}
                </span>
              </button>

              <button
                onClick={() => setOpen(false)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--t2)', cursor: 'none', display: 'flex' }}
              >
                <X size={15} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
