import { useState, useEffect } from 'react'
import { Bell, Send, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export type PushNotification = {
  id: string
  title: string
  body: string
  icon?: string
  tag: string
  scheduledAt?: string
  sent: boolean
  sentAt?: string
}

type PushManagerProps = {
  onSend?: (notification: Omit<PushNotification, 'id' | 'sent' | 'sentAt'>) => Promise<boolean>
}

export function PushNotificationManager({ onSend }: PushManagerProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    icon: '',
    tag: 'bionerica-notification',
    scheduledAt: '',
  })

  const handleSendNotification = async () => {
    const { title, body, tag, scheduledAt } = form

    if (!title.trim() || !body.trim()) {
      toast.error('Заповніть заголовок і текст')
      return
    }

    setSending(true)
    try {
      if (onSend) {
        const success = await onSend({
          title,
          body,
          tag,
          icon: form.icon || undefined,
          scheduledAt: scheduledAt || undefined,
        })

        if (success) {
          const newNotif: PushNotification = {
            id: `${Date.now()}`,
            title,
            body,
            icon: form.icon || undefined,
            tag,
            scheduledAt: scheduledAt || undefined,
            sent: true,
            sentAt: new Date().toISOString(),
          }

          setNotifications([newNotif, ...notifications])
          setForm({
            title: '',
            body: '',
            icon: '',
            tag: 'bionerica-notification',
            scheduledAt: '',
          })
          setFormOpen(false)
          toast.success('Push-уведомлення надіслано')
        } else {
          toast.error('Помилка при відправці')
        }
      }
    } finally {
      setSending(false)
    }
  }

  const handleTestNotification = async () => {
    const title = 'Test Notification'
    const body = 'Це тестове push-уведомлення'

    setSending(true)
    try {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          // Use service worker to show notification
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              body,
              icon: '/logo.svg',
              tag: 'test-notification',
              badge: '/badge.svg',
            })
          })
          toast.success('Тестове уведомлення показано')
        } else if (Notification.permission !== 'denied') {
          // Request permission
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                  body,
                  icon: '/logo.svg',
                  tag: 'test-notification',
                  badge: '/badge.svg',
                })
              })
              toast.success('Дозвіл на push надано. Тестове уведомлення показано')
            }
          })
        }
      }
    } catch (error) {
      console.error('Test notification error:', error)
      toast.error('Помилка при показі тестового уведомлення')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.success('Уведомлення видалено')
  }

  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          toast.success('Дозвіл на push-уведомлення надано')
        } else {
          toast.error('Дозвіл на push-уведомлення відхилено')
        }
      }
    } catch (error) {
      console.error('Permission request error:', error)
      toast.error('Помилка при запиті дозволу')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Push Permission Status */}
      <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Bell size={16} style={{ color: 'var(--gold)' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)' }}>Статус push-уведомлень</p>
        </div>
        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>
          {typeof Notification !== 'undefined' ? (
            Notification.permission === 'granted' ? (
              <span style={{ color: 'var(--gold)' }}>✓ Push-уведомлення ввімкнені</span>
            ) : Notification.permission === 'denied' ? (
              <span style={{ color: 'var(--rose)' }}>✕ Push-уведомлення заблоковані в налаштуваннях браузера</span>
            ) : (
              <span style={{ color: 'var(--t2)' }}>○ Необхідно надати дозвіл на push-уведомлення</span>
            )
          ) : (
            'Push-уведомлення не підтримуються'
          )}
        </p>
        {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            style={{
              background: 'var(--gold)',
              color: '#1a1612',
              border: 'none',
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Надати дозвіл
          </button>
        )}
      </div>

      {/* Send Notification Form */}
      <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)', textTransform: 'uppercase', letterSpacing: 1 }}>Надіслати push-уведомлення</p>
          {formOpen && (
            <button
              onClick={() => setFormOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t2)',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Сховати
            </button>
          )}
        </div>

        {!formOpen ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFormOpen(true)}
              style={{
                background: 'var(--gold)',
                color: '#1a1612',
                border: 'none',
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Send size={12} /> Нове повідомлення
            </button>
            <button
              onClick={handleTestNotification}
              disabled={sending}
              style={{
                background: 'transparent',
                border: '1px solid var(--bd)',
                color: 'var(--t0)',
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Тест
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Заголовок</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Новий товар в наявності"
                style={{
                  width: '100%',
                  background: 'var(--b0)',
                  border: '1px solid var(--bd)',
                  padding: '8px 12px',
                  color: 'var(--t0)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  borderRadius: 4,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Текст повідомлення</label>
              <textarea
                value={form.body}
                onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Опишіть деталі та заклик до дії..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--b0)',
                  border: '1px solid var(--bd)',
                  padding: '8px 12px',
                  color: 'var(--t0)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  borderRadius: 4,
                  resize: 'vertical',
                  fontFamily: 'Jost, sans-serif',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>URL іконки (опціонально)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    background: 'var(--b0)',
                    border: '1px solid var(--bd)',
                    padding: '8px 12px',
                    color: 'var(--t0)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    borderRadius: 4,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Тег</label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))}
                  placeholder="bionerica-notification"
                  style={{
                    width: '100%',
                    background: 'var(--b0)',
                    border: '1px solid var(--bd)',
                    padding: '8px 12px',
                    color: 'var(--t0)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Запланована дата (опціонально)</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'var(--b0)',
                  border: '1px solid var(--bd)',
                  padding: '8px 12px',
                  color: 'var(--t0)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  borderRadius: 4,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSendNotification}
                disabled={sending}
                style={{
                  background: 'var(--gold)',
                  color: '#1a1612',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Send size={12} /> {sending ? 'Відправка...' : 'Надіслати'}
              </button>
              <button
                onClick={() => setFormOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--bd)',
                  color: 'var(--t0)',
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Скасувати
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 16, borderRadius: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Останні push-уведомлення</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {notif.sent && <Check size={12} style={{ color: 'var(--gold)' }} />}
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)' }}>{notif.title}</p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>{notif.body}</p>
                  <p style={{ fontSize: 10, color: 'var(--t2)' }}>
                    {notif.sentAt && new Date(notif.sentAt).toLocaleString('uk-UA')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNotification(notif.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--rose)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 6,
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
