import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle } from 'lucide-react'
import { createConversation, addMessage, getConversationMessages, supabase } from '@/lib/supabase'
import { useAuth } from '@/store'
import { useTheme } from '@/store'
import toast from 'react-hot-toast'

export default function ChatWidget() {
  const { user } = useAuth()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Array<any>>([])
  const [messageText, setMessageText] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestName, setGuestName] = useState('')
  const [subject, setSubject] = useState('')
  const [step, setStep] = useState<'form' | 'chat'>('form')
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Tracks the anonymous Supabase user ID assigned to guests after signInAnonymously
  const guestAnonId = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user && !guestEmail.trim()) {
      toast.error('Введіть email')
      return
    }
    if (!subject.trim()) {
      toast.error('Введіть тему')
      return
    }

    setCreating(true)
    try {
      // For guests: get an anonymous Supabase session so existing RLS policies work.
      // signInAnonymously must be enabled in the Supabase dashboard (Auth → Settings).
      let effectiveUserId = user?.id ?? null
      if (!user) {
        try {
          const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
          if (!anonErr && anonData.user) {
            effectiveUserId = anonData.user.id
            guestAnonId.current = anonData.user.id
          }
        } catch {
          // Anonymous sign-in not enabled — proceed with null userId.
          // The 'Guests can create conversations' RLS policy handles this case
          // as long as the migration has been run.
        }
      }

      const { error, data } = await createConversation({
        user_id: effectiveUserId,
        guest_email: !user ? guestEmail : null,
        guest_name: !user ? (guestName || guestEmail.split('@')[0]) : null,
        subject: subject.trim(),
        status: 'open',
        priority: 'normal',
      })

      if (error) {
        console.error('Create conversation error:', error)
        toast.error('Помилка при створенні чату. Спробуйте ще раз')
        return
      }

      if (!data) {
        toast.error('Не вдалося створити чат')
        return
      }

      setConversationId(data.id)
      // Persist so guests can return to their chat after page reload
      if (!user) {
        try { localStorage.setItem('bionerica_guest_conv_id', String(data.id)) } catch { /* ignore */ }
      }
      setMessages([])
      setStep('chat')
      toast.success('Чат відкрито!')
    } catch (err) {
      console.error('Exception:', err)
      toast.error('Помилка з\'єднання. Спробуйте пізніше')
    } finally {
      setCreating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId) return

    setSending(true)
    try {
      const effectiveSenderId = user?.id ?? guestAnonId.current ?? null
      const effectiveSenderType = (user || guestAnonId.current) ? 'user' : 'guest'
      const { error } = await addMessage({
        conversation_id: conversationId,
        sender_id: effectiveSenderId,
        sender_type: effectiveSenderType,
        sender_name: user ? (user.user_metadata?.full_name || 'Ви') : (guestName || guestEmail.split('@')[0] || 'Гість'),
        content: messageText,
      })

      if (error) {
        console.error('Send message error:', error)
        toast.error('Помилка при відправці')
        return
      }

      setMessageText('')
      // Load messages
      const { data } = await getConversationMessages(conversationId)
      if (data) {
        setMessages(data)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!isOpen ? (
        <motion.button
          key="chat-fab"
          initial={{ opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.9 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            background: 'var(--gold)',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isDark ? '0 16px 48px rgba(201, 169, 110, 0.15)' : '0 16px 48px rgba(30, 27, 23, 0.12)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 999,
          } as React.CSSProperties}
          title="Написати менеджеру"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = isDark
              ? '0 24px 64px rgba(201, 169, 110, 0.22)'
              : '0 24px 64px rgba(30, 27, 23, 0.16)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = isDark
              ? '0 16px 48px rgba(201, 169, 110, 0.15)'
              : '0 16px 48px rgba(30, 27, 23, 0.12)'
          }}
        >
          <MessageCircle size={24} color="#ffffff" />
        </motion.button>
      ) : (
        <motion.div
          key="chat-panel"
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.96 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: '95vw',
            maxWidth: 420,
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--b0)',
            border: '1px solid var(--bd)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            boxShadow: 'var(--sh-lg)',
            fontFamily: "'Jost', sans-serif",
            overflow: 'hidden',
            transformOrigin: 'bottom right',
          } as React.CSSProperties}
        >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--bd)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: isDark
            ? 'linear-gradient(135deg, rgba(201, 169, 110, 0.85), rgba(201, 169, 110, 0.75))'
            : 'linear-gradient(135deg, var(--gold), rgba(201, 169, 110, 0.85))',
        } as React.CSSProperties}
      >
        <div>
          <p style={{ color: 'var(--b-inv)', fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, margin: 0, letterSpacing: '0.5px' }}>Менеджер</p>
          <p style={{ color: 'var(--b-inv)', fontSize: 11, opacity: 0.75, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Зазвичай 5-15 хвилин</p>
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setStep('form')
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--b-inv)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
        >
          <X size={22} />
        </button>
      </div>

      {/* Content */}
      {step === 'form' ? (
        <form onSubmit={handleCreateConversation} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, flex: 1, justifyContent: 'center' }}>
          <div>
            <label style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Тема</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="потрібна допомога з вибором"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--b1)',
                border: '1px solid var(--bd)',
                borderRadius: '4px',
                color: 'var(--t0)',
                fontSize: 13,
                fontFamily: "'Jost', sans-serif",
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--b0)'
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--b1)'
              }}
            />
          </div>

          {!user && (
            <>
              <div>
                <label style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Ваше ім'я</label>
                <input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Марія"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--b1)',
                    border: '1px solid var(--bd)',
                    borderRadius: '4px',
                    color: 'var(--t0)',
                    fontSize: 13,
                    fontFamily: "'Jost', sans-serif",
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--b0)'
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--b1)'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--b1)',
                    border: '1px solid var(--bd)',
                    borderRadius: '4px',
                    color: 'var(--t0)',
                    fontSize: 13,
                    fontFamily: "'Jost', sans-serif",
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--b0)'
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--b1)'
                  }}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={creating}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--gold)',
              color: 'var(--b-inv)',
              border: '1px solid var(--gold)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: creating ? 'default' : 'pointer',
              fontFamily: "'Jost', sans-serif",
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              marginTop: 8,
              opacity: creating ? 0.7 : 1,
              borderRadius: '4px',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!creating) {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--gold-d)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--gold)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            {creating ? 'Створення...' : 'Почати чат'}
          </button>

          <p style={{ fontSize: 11, color: 'var(--t2)', textAlign: 'center', marginTop: 8, lineHeight: 1.6, fontWeight: 300 }}>
            Наша команда готова допомогти з питаннями про товари, доставку та замовлення.
          </p>
        </form>
      ) : (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--t2)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ marginTop: 40, marginBottom: 40 }}>
                  <p style={{ margin: 0, lineHeight: 1.6, fontWeight: 400 }}>Менеджер незабаром <br /> з вами звʼяжеться</p>
                  <p style={{ fontSize: 11, marginTop: 12, opacity: 0.6, fontWeight: 300 }}>⏱ Зазвичай 5-15 хвилин</p>
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender_type === 'admin' ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  background: msg.sender_type === 'admin' ? 'var(--b1)' : 'var(--gold)',
                  color: msg.sender_type === 'admin' ? 'var(--t0)' : 'var(--b-inv)',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <p style={{ margin: 0, fontWeight: msg.sender_type === 'admin' ? 500 : 400 }}>{msg.content}</p>
                <p style={{ fontSize: 10, opacity: msg.sender_type === 'admin' ? 0.6 : 0.75, marginTop: 4, margin: 0 }}>
                  {new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: 16, borderTop: '1px solid var(--bd)', display: 'flex', gap: 10, background: 'var(--b0)' }}>
            <input
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !e.shiftKey && !sending && void handleSendMessage()}
              placeholder="Напишіть повідомлення..."
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'var(--b1)',
                border: '1px solid var(--bd)',
                borderRadius: '4px',
                color: 'var(--t0)',
                fontSize: 13,
                fontFamily: "'Jost', sans-serif",
                transition: 'border-color 0.2s ease',
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'
              }}
            />
            <button
              onClick={() => void handleSendMessage()}
              disabled={sending || !messageText.trim()}
              style={{
                width: 40,
                height: 40,
                background: 'var(--gold)',
                color: 'var(--b-inv)',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: sending || !messageText.trim() ? 'default' : 'pointer',
                opacity: sending || !messageText.trim() ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!sending && messageText.trim()) {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--gold-d)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--gold)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
