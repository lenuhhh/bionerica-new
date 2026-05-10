import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Package, CheckCircle, Truck, Clock, XCircle, ChevronRight } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import { getPublicOrderById } from '@/lib/supabase'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const STEPS: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: 'pending',    label: 'Очікується',    icon: Clock },
  { status: 'confirmed',  label: 'Підтверджено',  icon: CheckCircle },
  { status: 'processing', label: 'Обробляється',  icon: Package },
  { status: 'shipped',    label: 'В дорозі',      icon: Truck },
  { status: 'delivered',  label: 'Доставлено',    icon: CheckCircle },
]

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function getStepIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1
  return STATUS_ORDER.indexOf(status)
}

type OrderData = {
  id: string
  status: OrderStatus
  created_at: string
  estimated_delivery?: string | null
  tracking?: string | null
  items?: unknown[]
  total?: number
  delivery_method?: string
}

export default function OrderTracking() {
  const { id: paramId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [inputId, setInputId] = useState(paramId ?? '')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useSEO({
    title: 'Відстежити замовлення',
    description: 'Перевірте статус вашого замовлення в Bionerica — у реальному часі.',
    url: paramId ? `/order/${paramId}` : '/order',
    noindex: true,
  })

  const fetchOrder = useCallback(async (id: string) => {
    if (!id.trim()) return
    setLoading(true)
    setError(null)
    setOrder(null)

    const { data, error: err } = await getPublicOrderById(id.trim())
    setLoading(false)

    if (err || !data) {
      setError('Замовлення не знайдено. Перевірте номер замовлення.')
      return
    }

    setOrder(data as OrderData)
  }, [])

  useEffect(() => {
    if (paramId) {
      setInputId(paramId)
      void fetchOrder(paramId)
    }
  }, [paramId, fetchOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputId.trim()) return
    navigate(`/order/${inputId.trim()}`)
    void fetchOrder(inputId.trim())
  }

  const currentStep = order ? getStepIndex(order.status) : -1
  const isCancelled = order?.status === 'cancelled'

  return (
    <div style={{ minHeight: '80vh', background: 'var(--b0)', padding: 'clamp(32px, 6vw, 80px) clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
            Відстеження замовлення
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 300, color: 'var(--t0)', margin: 0 }}>
            Де моє замовлення?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t2)', marginTop: 12 }}>
            Введіть номер замовлення щоб перевірити статус доставки
          </p>
        </motion.div>

        {/* Search form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 10, marginBottom: 40 }}
        >
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--bd)', background: 'var(--b1)', padding: '12px 16px',
          }}>
            <Search size={16} style={{ color: 'var(--t2)', flexShrink: 0 }} />
            <input
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              placeholder="Номер замовлення (напр. BN-12345)"
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 15, color: 'var(--t0)', fontFamily: 'Jost, sans-serif', flex: 1,
              }}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputId.trim()}
            className="btn-dark"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '12px 22px' }}
          >
            {loading ? 'Пошук...' : <><ChevronRight size={16} /></>}
          </button>
        </motion.form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.25)',
              padding: 20, marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}
          >
            <XCircle size={18} style={{ color: 'var(--berry)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--berry)', margin: 0, fontSize: 14 }}>{error}</p>
          </motion.div>
        )}

        {/* Order result */}
        {order && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Order header */}
            <div style={{
              background: 'var(--b1)', border: '1px solid var(--bd)', padding: '20px 24px',
              marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 4 }}>
                  Замовлення
                </p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500, color: 'var(--t0)', margin: 0 }}>
                  #{order.id}
                </p>
                {order.created_at && (
                  <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                    від {new Date(order.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {order.total && (
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--t0)', margin: 0 }}>
                    {Number(order.total).toLocaleString('uk-UA')} ₴
                  </p>
                )}
                {order.delivery_method && (
                  <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>{order.delivery_method}</p>
                )}
              </div>
            </div>

            {/* Status timeline */}
            {isCancelled ? (
              <div style={{
                background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)',
                padding: 24, display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <XCircle size={32} style={{ color: 'var(--berry)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--berry)', marginBottom: 4 }}>Замовлення скасовано</p>
                  <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
                    Якщо у вас є питання — зв'яжіться з нами через чат або телефон.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', padding: '8px 0' }}>
                {/* Progress line */}
                <div style={{
                  position: 'absolute', left: 19, top: 32, bottom: 32, width: 2,
                  background: 'var(--bd)',
                }} />
                <div style={{
                  position: 'absolute', left: 19, top: 32, width: 2,
                  height: `${(currentStep / (STEPS.length - 1)) * 100}%`,
                  background: 'var(--gold)', transition: 'height 0.5s ease',
                }} />

                {STEPS.map((step, index) => {
                  const Icon = step.icon
                  const done = index <= currentStep
                  const active = index === currentStep
                  return (
                    <div key={step.status} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 20,
                      marginBottom: index < STEPS.length - 1 ? 28 : 0,
                      position: 'relative',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? (active ? 'var(--gold)' : 'var(--sage)') : 'var(--b1)',
                        border: `2px solid ${done ? (active ? 'var(--gold)' : 'var(--sage)') : 'var(--bd)'}`,
                        transition: 'all 0.3s',
                        zIndex: 1,
                      }}>
                        <Icon size={16} style={{ color: done ? '#fff' : 'var(--t2)' }} />
                      </div>
                      <div style={{ paddingTop: 8 }}>
                        <p style={{
                          fontWeight: active ? 600 : done ? 500 : 400,
                          color: active ? 'var(--gold)' : done ? 'var(--t0)' : 'var(--t2)',
                          marginBottom: 2, fontSize: 15,
                        }}>
                          {step.label}
                          {active && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--gold)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>Зараз</span>}
                        </p>
                        {active && step.status === 'shipped' && order.tracking && (
                          <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>
                            ТТН: <strong>{order.tracking}</strong>
                          </p>
                        )}
                        {active && step.status === 'shipped' && order.estimated_delivery && (
                          <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, marginTop: 2 }}>
                            Очікувана дата: {new Date(order.estimated_delivery).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tracking number */}
            {order.tracking && order.status === 'shipped' && (
              <div style={{
                marginTop: 28, background: 'rgba(143,173,133,0.1)', border: '1px solid rgba(143,173,133,0.3)',
                padding: '16px 20px',
              }}>
                <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 6 }}>
                  Трекінг-номер
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: 16, color: 'var(--t0)', margin: 0, fontWeight: 600 }}>
                  {order.tracking}
                </p>
                <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                  Відстежити на сайті Нової Пошти або Укрпошти
                </p>
              </div>
            )}

            {/* Contact help */}
            <div style={{ marginTop: 32, padding: '20px 24px', border: '1px solid var(--bd)', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
                Маєте питання щодо замовлення?
              </p>
              <a href="/contact" className="btn-outline btn-sm" style={{ fontSize: 12 }}>
                Зв'язатися з нами
              </a>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!order && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t2)' }}>
            <Package size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Введіть номер замовлення для перевірки статусу</p>
          </div>
        )}
      </div>
    </div>
  )
}
