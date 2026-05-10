import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, Phone, Clock } from 'lucide-react'
import { useAuth } from '@/store'

interface ChatMessage {
  id: string
  from: 'user' | 'agent'
  text: string
  time: string
  read?: boolean
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    from: 'agent',
    text: 'Вітаємо в Broiderie! 🪡 Я Ганна — рада допомогти з вибором вишивки або відповісти на питання про наші вироби.',
    time: 'Зараз',
    read: true,
  },
]

const QUICK_REPLIES = [
  'Скільки коштує доставка?',
  'Чи є розмір XL?',
  'Скільки часу виготовлення?',
  'Чи можна замовити свій орнамент?',
]

const ONLINE_HOURS = { start: 9, end: 20 }

function isOnline() {
  const h = new Date().getHours()
  return h >= ONLINE_HOURS.start && h < ONLINE_HOURS.end
}

function autoReply(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('доставк'))         return 'Доставка Новою Поштою від 80₴, безкоштовна від 2000₴. Міжнародна — від 300₴. Відправляємо протягом 1-2 робочих днів. 📦'
  if (t.includes('розмір') || t.includes('xl') || t.includes('xxl'))
    return 'Виготовляємо усі розміри від XS до XXXL та навіть нестандартні. Просто вкажіть свої мірки при замовленні! 📏'
  if (t.includes('виготовл') || t.includes('скільки'))
    return 'Готові вироби: 1-3 дні + доставка. Індивідуальне пошиття: 2-6 тижнів залежно від складності. 🧵'
  if (t.includes('орнамент') || t.includes('свій'))
    return 'Так, приймаємо індивідуальні замовлення з вашим орнаментом! Надішліть ескіз або фото, і ми підготуємо розрахунок вартості. ✨'
  if (t.includes('ціна') || t.includes('вартість') || t.includes('коштує'))
    return 'Ціни починаються від 1100₴ за аксесуари. Вишиванки — від 1900₴, сукні — від 4100₴. Детальніше у нашому каталозі! 🛍️'
  if (t.includes('повернення') || t.includes('обмін'))
    return 'Повернення протягом 14 днів при збереженні вигляду. Обмін розміру — безкоштовно (без врахування доставки). 🔄'
  return 'Дякуємо за питання! Наш менеджер відповість найближчим часом. Зазвичай ми відповідаємо протягом 15-30 хвилин у робочий час. 🙏'
}

export default function LiveChat() {
  const [open, setOpen]         = useState(false)
  const [minimized, setMin]     = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput]       = useState('')
  const [unread, setUnread]     = useState(0)
  const [typing, setTyping]     = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const online = isOnline()

  useEffect(() => {
    if (open) { setUnread(0); endRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  }, [open, messages])

  // Show unread badge after 8s if chat not opened
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setUnread(1), 8000)
      return () => clearTimeout(t)
    }
  }, [])

  const now = () => new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')

    const userMsg: ChatMessage = { id: Date.now().toString(), from: 'user', text: msg, time: now() }
    setMessages(m => [...m, userMsg])

    // Simulate typing
    setTyping(true)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
    setTyping(false)

    const reply: ChatMessage = { id: (Date.now() + 1).toString(), from: 'agent', text: autoReply(msg), time: now(), read: false }
    setMessages(m => [...m, reply])
    if (!open || minimized) setUnread(u => u + 1)
  }

  return (
    <>
      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', bottom: 88, right: 20, zIndex: 190,
              width: 360, maxWidth: 'calc(100vw - 32px)',
              background: 'var(--b0)',
              border: '1px solid var(--bd)',
              boxShadow: 'var(--sh-lg)',
              display: 'flex', flexDirection: 'column',
              height: minimized ? 'auto' : 520,
            }}
          >
            {/* Header */}
            <div style={{ background: '#1a1612', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'Cormorant Garamond, serif', color: '#18160e' }}>ГП</div>
                  {online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: '2px solid #1a1612' }} />}
                </div>
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.9)', fontWeight: 400, fontFamily: 'Jost, sans-serif' }}>Ганна Петрівна</p>
                  <p style={{ fontSize: 11, color: online ? '#4ade80' : 'rgba(245,240,232,0.4)' }}>
                    {online ? '● Онлайн' : `● Офлайн · відповімо до ${ONLINE_HOURS.start}:00`}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setMin(m => !m)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'none' }}>
                  <Minimize2 size={15} />
                </button>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'none' }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: msg.from === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                      {msg.from === 'agent' && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#18160e', flexShrink: 0 }}>ГП</div>
                      )}
                      <div style={{
                        maxWidth: '78%', padding: '10px 14px',
                        background: msg.from === 'user' ? 'var(--t0)' : 'var(--b1)',
                        color: msg.from === 'user' ? 'var(--t-inv)' : 'var(--t0)',
                        borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        fontSize: 13, lineHeight: 1.55,
                      }}>
                        {msg.text}
                        <p style={{ fontSize: 10, color: msg.from === 'user' ? 'rgba(245,240,232,0.45)' : 'var(--t2)', marginTop: 4, textAlign: 'right' }}>{msg.time}</p>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#18160e' }}>ГП</div>
                      <div style={{ background: 'var(--b1)', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', display: 'flex', gap: 4 }}>
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div key={i}
                            animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay }}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--t2)' }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Quick replies */}
                {messages.length <= 2 && (
                  <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_REPLIES.map(q => (
                      <button key={q} onClick={() => sendMessage(q)}
                        style={{ fontSize: 11, padding: '6px 10px', border: '1px solid var(--bd)', background: 'none', color: 'var(--t2)', cursor: 'none', fontFamily: 'Jost, sans-serif', transition: 'all .15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bd)', display: 'flex', gap: 8 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Напишіть повідомлення..."
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--t0)', fontFamily: 'Jost, sans-serif' }}
                  />
                  <button onClick={() => sendMessage()} disabled={!input.trim()}
                    style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? 'var(--gold)' : 'var(--b2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', transition: 'background .2s' }}>
                    <Send size={15} style={{ color: input.trim() ? '#18160e' : 'var(--t2)' }} />
                  </button>
                </div>

                {/* Footer */}
                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={11} style={{ color: 'var(--t2)' }} />
                  <p style={{ fontSize: 10, color: 'var(--t2)', letterSpacing: 0.5 }}>
                    Пн–Пт 9:00–20:00 · Сб 10:00–18:00
                  </p>
                  <a href="tel:+380961234567" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold)', textDecoration: 'none' }}>
                    <Phone size={11} /> Подзвонити
                  </a>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB button ── */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => { setOpen(o => !o); setUnread(0) }}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 191,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? 'var(--t0)' : 'var(--gold)',
          border: 'none', cursor: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          color: open ? 'var(--t-inv)' : '#18160e',
          transition: 'background .25s',
        }}
        aria-label="Чат підтримки"
      >
        <AnimatePresence mode="wait">
          <motion.div key={open ? 'close' : 'chat'}
            initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}>
            {open ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.div>
        </AnimatePresence>

        {/* Unread badge */}
        {unread > 0 && !open && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: 'var(--rose)', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--b0)' }}>
            {unread}
          </motion.div>
        )}
      </motion.button>
    </>
  )
}
