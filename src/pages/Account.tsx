import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingBag, Heart, MapPin, Settings, Gift, Shield,
  LogOut, ChevronRight, Package, Truck, Users, ArrowLeft, Plus,
  CheckCircle, Clock, XCircle, Upload, Phone, Mail, Calendar, Bell, MessageCircle, Bot
} from 'lucide-react'
import { useAuth, useWishlist } from '@/store'
import { getOrders, signOut, getConversations, getConversationMessages, createConversation, addMessage, updateConversation, updateProfile, uploadAvatar, supabase } from '@/lib/supabase'
import { enqueueOfflineAction, flushOfflineQueue } from '@/lib/offlineQueue'
import { isLikelyNetworkError, retryWithBackoff } from '@/lib/network'
import { products as allProducts } from '@/data'
import LazyImage from '@/components/ui/LazyImage'
import { Breadcrumb } from '@/components/ui'
import { PushSettings, PushPermissionPrompt } from '@/components/ui/PWA'
import ReferralWidget from '@/components/ui/ReferralWidget'
import NewsletterWidget from '@/components/ui/NewsletterWidget'
import { usePushNotifications } from '@/hooks/usePush'
import { useSitePresence } from '@/hooks/useSitePresence'
import { useSEO } from '@/hooks/useSEO'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'chat' | 'settings' | 'loyalty'

const tabs: { id: Tab; icon: typeof User; label: string }[] = [
  { id: 'overview',   icon: User,       label: 'Огляд'           },
  { id: 'orders',     icon: ShoppingBag, label: 'Замовлення'      },
  { id: 'wishlist',   icon: Heart,       label: 'Список бажань'   },
  { id: 'addresses',  icon: MapPin,      label: 'Адреси'          },
  { id: 'chat',       icon: MessageCircle, label: 'Чат з менеджером' },
  { id: 'loyalty',    icon: Gift,        label: 'Бонуси'          },
  { id: 'settings',   icon: Settings,    label: 'Налаштування'    },
]

type AccountChatMessage = {
  id: number | string
  sender_type: string
  sender_name?: string
  content: string
  created_at: string
}

type ChatConversationStatus = 'open' | 'resolved' | 'closed'

type SavedAddress = {
  id: string
  name: string
  phone: string
  city: string
  delivery: 'nova_poshta' | 'ukrposhta' | 'courier'
  branch: string
  street: string
  apartment: string
  is_default: boolean
}

const emptyAddrForm = (): Omit<SavedAddress, 'id' | 'is_default'> => ({
  name: '', phone: '', city: '', delivery: 'nova_poshta', branch: '', street: '', apartment: '',
})

const deliveryLabels: Record<SavedAddress['delivery'], string> = {
  nova_poshta: 'Нова Пошта',
  ukrposhta: 'Укрпошта',
  courier: "Кур'єр",
}

const formatAddress = (a: SavedAddress) => {
  if (a.delivery === 'courier') {
    return `${a.city}, ${a.street}${a.apartment ? `, кв. ${a.apartment}` : ''} — Кур'єр`
  }
  return `${a.city} — ${deliveryLabels[a.delivery]}${a.branch ? `, відд. #${a.branch}` : ''}`
}

const quickAiPrompts = [
  'Коли відправляєте замовлення після оплати?',
  'Які варіанти доставки і скільки це коштує?',
  'Скільки днів триває доставка по Україні?',
  'Чи можна оплатити при отриманні?',
  'Як обміняти або повернути товар?',
]

const buildAiDraftAnswer = (question: string) => {
  const q = question.toLowerCase()

  if (q.includes('коли') && (q.includes('відправ') || q.includes('замовлення'))) {
    return 'Зазвичай ми відправляємо замовлення протягом 24 годин у робочі дні. Якщо товар потребує додаткової підготовки, менеджер уточнить точний термін у чаті.'
  }

  if (q.includes('достав') || q.includes('нова пошта') || q.includes('укрпошта')) {
    return 'Доступна доставка Новою Поштою та Укрпоштою. Вартість залежить від служби, ваги та міста отримувача. Точний розрахунок менеджер надсилає перед підтвердженням замовлення.'
  }

  if (q.includes('скільки') && (q.includes('днів') || q.includes('термін'))) {
    return 'Середній термін доставки по Україні: 1-3 дні після відправлення. У пікові періоди або для віддалених населених пунктів термін може бути довший.'
  }

  if (q.includes('оплат') || q.includes('післяплата') || q.includes('при отриманні')) {
    return 'Оплата доступна онлайн (карткою) та, для частини відправлень, післяплатою при отриманні. Менеджер підкаже, який варіант доступний саме для вашого замовлення.'
  }

  if (q.includes('повернен') || q.includes('обмін')) {
    return 'Обмін/повернення можливі згідно з умовами магазину. Напишіть номер замовлення в чат, і менеджер підготує інструкцію по кроках.'
  }

  return 'Я можу дати попередню відповідь, а менеджер уточнить деталі для вашого замовлення. Оберіть питання із заготовок або напишіть вручну.'
}

const getProfileInitials = (fullName?: string | null, email?: string | null) => {
  const nameParts = (fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (nameParts.length >= 2) {
    return `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase()
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase()
  }

  return (email || 'BI').slice(0, 2).toUpperCase()
}

const mockOrders = [
  { id: 'BR-2401', date: '12 Березня 2025', status: 'delivered' as const, total: 3800, items: [{ name: 'Вишиванка Полтавська Преміум', price: 3800, qty: 1, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=250&fit=crop' }], tracking: 'UA12345678', delivery: 'Нова Пошта' },
  { id: 'BR-2389', date: '5 Березня 2025',  status: 'shipped'   as const, total: 6200, items: [{ name: 'Сукня Вишита "Осінній настрій"', price: 6200, qty: 1, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=250&fit=crop' }], tracking: 'UA98765432', delivery: 'Укрпошта' },
  { id: 'BR-2341', date: '18 Лютого 2025', status: 'delivered' as const, total: 4300, items: [{ name: 'Рушник Весільний "Золота нитка"', price: 2200, qty: 1, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=200&h=250&fit=crop' }, { name: 'Хустина Шифонова "Маки"', price: 1600, qty: 1, image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=200&h=250&fit=crop' }], tracking: 'UA11223344', delivery: 'Нова Пошта' },
  { id: 'BR-2298', date: '3 Лютого 2025',  status: 'cancelled' as const, total: 3200, items: [{ name: 'Сорочка Чоловіча "Гетьман"', price: 3200, qty: 1, image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=200&h=250&fit=crop' }], tracking: '', delivery: '' },
]

type AccountOrder = {
  id: string
  date: string
  status: keyof typeof statusMap
  total: number
  items: Array<{ name: string; price: number; qty: number; image: string }>
  tracking: string
  delivery: string
}

const statusMap = {
  pending:   { icon: Clock,         label: 'Очікується',   color: 'var(--gold)',  cls: 'badge-status-warn' },
  confirmed: { icon: CheckCircle,   label: 'Підтверджено', color: 'var(--sage)',  cls: 'badge-status-ok'   },
  processing:{ icon: Package,       label: 'В обробці',    color: 'var(--gold)',  cls: 'badge-status-warn' },
  shipped:   { icon: Truck,         label: 'В дорозі',     color: 'var(--sky)',   cls: 'badge-status-warn' },
  delivered: { icon: CheckCircle,   label: 'Доставлено',   color: 'var(--sage)',  cls: 'badge-status-ok'   },
  cancelled: { icon: XCircle,       label: 'Скасовано',    color: 'var(--rose)',  cls: 'badge-status-err'  },
}

const mapOrdersForAccount = (data: Array<Record<string, unknown>>): AccountOrder[] =>
  data.map((o) => {
    const rawItems = Array.isArray(o.items) ? o.items as Array<Record<string, unknown>> : []
    const mappedItems = rawItems.map((it) => ({
      name: (it.name as string) || 'Товар',
      price: Number(it.price) || 0,
      qty: Number(it.qty) || 1,
      image: (it.image as string) || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=250&fit=crop',
    }))

    return {
      id: String(o.id || ''),
      date: new Date(String(o.created_at || Date.now())).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' }),
      status: ((o.status as string) in statusMap ? o.status : 'pending') as keyof typeof statusMap,
      total: Number(o.total) || 0,
      items: mappedItems,
      tracking: (o.tracking as string) || '',
      delivery: (o.delivery_method as string) || '',
    } satisfies AccountOrder
  })

const accountTabLabels: Record<Tab, string> = {
  overview: 'Особистий кабінет',
  orders: 'Мої замовлення',
  wishlist: 'Список бажань',
  addresses: 'Адреси доставки',
  chat: 'Чат з менеджером',
  settings: 'Налаштування профілю',
  loyalty: 'Бонуси та лояльність',
}

export default function Account() {
  const { tab: paramTab } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>((paramTab as Tab) || 'overview')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [chatConversationId, setChatConversationId] = useState<number | null>(null)
  const [chatConversationStatus, setChatConversationStatus] = useState<ChatConversationStatus>('open')
  const [chatMessages, setChatMessages] = useState<AccountChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSending, setChatSending] = useState(false)
  const [chatRestoring, setChatRestoring] = useState(false)
  const [chatText, setChatText] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [aiDraftQuestion, setAiDraftQuestion] = useState('')
  const [aiDraftAnswer, setAiDraftAnswer] = useState('')
  const { user, profile, logout, loading, setProfile } = useAuth()
  const { ids: wishIds } = useWishlist()
  const { register, handleSubmit } = useForm({ defaultValues: { full_name: profile?.full_name || '', phone: profile?.phone || '', city: profile?.city || '', birthday: profile?.birthday || '' } })
  const { notify, isSubscribed } = usePushNotifications()
  const lastSeenMsgIdRef = useRef<number | string | null>(null)
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatListRef = useRef<HTMLDivElement | null>(null)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [lastDataSyncAt, setLastDataSyncAt] = useState<string>('')
  const { onlineNow, connected: presenceConnected } = useSitePresence(user?.id)

  // Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [addrFormOpen, setAddrFormOpen] = useState(false)
  const [editingAddr, setEditingAddr] = useState<SavedAddress | null>(null)
  const [addrForm, setAddrForm] = useState(emptyAddrForm())
  const [addrSaving, setAddrSaving] = useState(false)

  useSEO({
    title: accountTabLabels[activeTab] || 'Особистий кабінет',
    description: 'Особистий кабінет Bionerica: замовлення, бонуси, адреси доставки та зв\'язок з менеджером.',
    url: activeTab === 'overview' ? '/account' : `/account/${activeTab}`,
    noindex: true,
  })

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}>Завантаження профілю...</div>
  }
  if (!user) return <Navigate to="/auth" />

  const profileInitials = getProfileInitials(profile?.full_name, user.email)

  const wishProducts = allProducts.filter(p => wishIds.has(p.id))

  const profileCompletion = Math.round(([
    profile?.full_name,
    profile?.phone,
    profile?.city,
    profile?.birthday,
    profile?.avatar_url,
  ].filter(v => typeof v === 'string' ? v.trim().length > 0 : Boolean(v)).length / 5) * 100)

  useEffect(() => {
    let cancelled = false
    if (!user) return

    const loadOrders = async () => {
      setOrdersLoading(true)
      const { data, error } = await getOrders(user.id)
      if (cancelled) return

      if (!error && data) {
        const mapped = mapOrdersForAccount(data as Array<Record<string, unknown>>)
        setOrders(mapped)
        setLastDataSyncAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }))
      }
      setOrdersLoading(false)
    }

    void loadOrders()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user) return

    const refreshOrders = async () => {
      const { data, error } = await getOrders(user.id)
      if (error || !data) return

      const mapped = mapOrdersForAccount(data as Array<Record<string, unknown>>)
      setOrders(mapped)
      setLastDataSyncAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }))
    }

    const id = window.setInterval(() => { void refreshOrders() }, 45_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshOrders()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`account-orders-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, async () => {
        const { data, error } = await getOrders(user.id)
        if (error || !data) return
        const mapped = mapOrdersForAccount(data as Array<Record<string, unknown>>)
        setOrders(mapped)
        setLastDataSyncAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    if (!user) return

    const loadChat = async () => {
      setChatLoading(true)

      const { data: convData, error: convError } = await getConversations(user.id)
      if (cancelled) return

      if (convError) {
        setChatLoading(false)
        return
      }

      const conversations = (convData as Array<Record<string, unknown>> | null) || []
      let currentConversation = conversations[0]

      if (!currentConversation) {
        const { data: created, error: createError } = await createConversation({
          user_id: user.id,
          guest_email: null,
          guest_name: null,
          subject: 'Підтримка з особистого кабінету',
          status: 'open',
          priority: 'normal',
        })

        if (createError || !created) {
          setChatLoading(false)
          return
        }

        currentConversation = created as unknown as Record<string, unknown>
      }

      const conversationId = Number(currentConversation.id)
      setChatConversationId(conversationId)
      const conversationStatus = String(currentConversation.status || 'open')
      setChatConversationStatus(
        (conversationStatus === 'resolved' || conversationStatus === 'closed' ? conversationStatus : 'open') as ChatConversationStatus
      )

      const { data: msgData } = await getConversationMessages(conversationId)
      if (cancelled) return

      const mapped = ((msgData as Array<Record<string, unknown>> | null) || []).map((m) => ({
        id: Number(m.id),
        sender_type: String(m.sender_type || 'user'),
        sender_name: typeof m.sender_name === 'string' ? m.sender_name : undefined,
        content: String(m.content || ''),
        created_at: String(m.created_at || new Date().toISOString()),
      }))

      setChatMessages(mapped)
      setChatLoading(false)
    }

    void loadChat()
    return () => { cancelled = true }
  }, [user])

  const refreshChatMessages = async (conversationId: number) => {
    const { data } = await retryWithBackoff(() => Promise.resolve(getConversationMessages(conversationId) as any), { retries: 2, baseDelayMs: 250 }) as any
    const mapped = ((data as Array<Record<string, unknown>> | null) || []).map((m) => ({
      id: Number(m.id),
      sender_type: String(m.sender_type || 'user'),
      sender_name: typeof m.sender_name === 'string' ? m.sender_name : undefined,
      content: String(m.content || ''),
      created_at: String(m.created_at || new Date().toISOString()),
    }))
    setChatMessages(mapped)
  }

  const refreshChatConversationStatus = async (conversationId: number) => {
    const { data } = await supabase
      .from('conversations')
      .select('status')
      .eq('id', conversationId)
      .single()

    const status = String((data as Record<string, unknown> | null)?.status || 'open')
    setChatConversationStatus(
      (status === 'resolved' || status === 'closed' ? status : 'open') as ChatConversationStatus
    )
  }

  useEffect(() => {
    if (activeTab !== 'chat') return
    const box = chatListRef.current
    if (!box) return
    box.scrollTop = box.scrollHeight
    setShowJumpToLatest(false)
  }, [chatMessages, activeTab])

  useEffect(() => {
    const flushPending = async () => {
      if (!navigator.onLine || !user) return
      const { processed } = await flushOfflineQueue({
        'send-chat-message': payload => addMessage(payload),
      })
      if (processed > 0 && chatConversationId) {
        await refreshChatMessages(chatConversationId)
      }
    }

    const onOnline = () => { void flushPending() }
    window.addEventListener('online', onOnline)
    void flushPending()
    return () => window.removeEventListener('online', onOnline)
  }, [chatConversationId, user])

  /* Poll for new admin messages and fire push notification */
  useEffect(() => {
    if (!chatConversationId) {
      if (chatPollRef.current) clearInterval(chatPollRef.current)
      return
    }
    chatPollRef.current = setInterval(async () => {
      const { data } = await retryWithBackoff(() => Promise.resolve(getConversationMessages(chatConversationId) as any), { retries: 1, baseDelayMs: 250 }) as any
      const msgs = ((data as Array<Record<string, unknown>> | null) || []).map((m) => ({
        id: Number(m.id),
        sender_type: String(m.sender_type || 'user'),
        sender_name: typeof m.sender_name === 'string' ? m.sender_name : undefined,
        content: String(m.content || ''),
        created_at: String(m.created_at || new Date().toISOString()),
      }))
      if (!msgs.length) return
      const latestMsg = msgs[msgs.length - 1]
      if (lastSeenMsgIdRef.current === null) {
        lastSeenMsgIdRef.current = latestMsg.id
      } else if (latestMsg.id !== lastSeenMsgIdRef.current && latestMsg.sender_type === 'admin') {
        lastSeenMsgIdRef.current = latestMsg.id
        if (isSubscribed) void notify.chatMessage(latestMsg.sender_name)
        if (activeTab === 'chat') setShowJumpToLatest(true)
      } else if (latestMsg.id !== lastSeenMsgIdRef.current) {
        lastSeenMsgIdRef.current = latestMsg.id
      }
      setChatMessages(msgs)
      await refreshChatConversationStatus(chatConversationId)
    }, 10_000)
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current) }
  }, [chatConversationId, isSubscribed, notify, activeTab])

  const handleSendToManager = async () => {
    const text = chatText.trim()
    if (!text || !chatConversationId || !user) return
    if (chatConversationStatus === 'closed') {
      toast('Чат закрито. Натисніть "Відновити чат"', { className: 'hot-toast' })
      return
    }

    setChatSending(true)
    setChatText('')

    const payload = {
      conversation_id: chatConversationId,
      sender_id: user.id,
      sender_type: 'user',
      sender_name: profile?.full_name || 'Клієнт',
      content: text,
    }

    const { error } = await retryWithBackoff(() => Promise.resolve(addMessage(payload) as any), { retries: 2, baseDelayMs: 250 }).catch(err => ({ error: err })) as any

    if (error) {
      if (isLikelyNetworkError(error)) {
        enqueueOfflineAction('send-chat-message', payload)
        setChatMessages(prev => [...prev, {
          id: `local-${Date.now()}`,
          sender_type: 'user',
          sender_name: profile?.full_name || 'Клієнт',
          content: `${text} (буде відправлено при появі мережі)`,
          created_at: new Date().toISOString(),
        }])
        toast('Немає мережі: повідомлення поставлено у чергу', { className: 'hot-toast' })
      } else {
        toast.error('Не вдалося відправити повідомлення')
      }
      setChatSending(false)
      return
    }

    await refreshChatMessages(chatConversationId)
    await refreshChatConversationStatus(chatConversationId)
    setChatSending(false)
  }

  const handleRestoreChat = async () => {
    if (!user) return
    setChatRestoring(true)

    let targetConversationId = chatConversationId
    let restoredInCurrent = false

    if (chatConversationId) {
      const { data: updated, error: updateError } = await updateConversation(chatConversationId, {
        status: 'open',
        updated_at: new Date().toISOString(),
      })

      if (!updateError && updated) {
        targetConversationId = Number((updated as Record<string, unknown>).id)
        restoredInCurrent = true
      }
    }

    if (!targetConversationId || !restoredInCurrent) {
      const { data: created, error: createError } = await createConversation({
        user_id: user.id,
        guest_email: null,
        guest_name: null,
        subject: 'Підтримка з особистого кабінету',
        status: 'open',
        priority: 'normal',
      })

      if (createError || !created) {
        setChatRestoring(false)
        toast.error('Не вдалося відновити чат')
        return
      }

      targetConversationId = Number((created as Record<string, unknown>).id)
      setChatConversationId(targetConversationId)
    }

    const restoreNote = {
      conversation_id: targetConversationId,
      sender_id: user.id,
      sender_type: 'user',
      sender_name: profile?.full_name || 'Клієнт',
      content: 'Користувач відновив чат і хоче поставити питання.',
    }

    const { error: noteError } = await addMessage(restoreNote)
    if (noteError) {
      setChatRestoring(false)
      toast.error('Чат відкрито, але не вдалося надіслати службове повідомлення')
      return
    }

    setChatConversationStatus('open')
    await refreshChatMessages(targetConversationId)
    await refreshChatConversationStatus(targetConversationId)
    setChatRestoring(false)
    toast.success('Чат відновлено')
  }

  const handleAskAi = (question: string) => {
    setAiDraftQuestion(question)
    setAiDraftAnswer(buildAiDraftAnswer(question))
  }

  // ── ADDRESSES ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = (profile as Record<string, unknown> | null | undefined)?.addresses
    if (Array.isArray(raw)) {
      setAddresses(raw as SavedAddress[])
    }
  }, [profile])

  const persistAddresses = async (updated: SavedAddress[]) => {
    if (!user) return
    setAddresses(updated)
    await updateProfile(user.id, { addresses: updated })
  }

  const openAddForm = (addr?: SavedAddress) => {
    if (addr) {
      setEditingAddr(addr)
      const { id: _id, is_default: _d, ...fields } = addr
      setAddrForm(fields)
    } else {
      setEditingAddr(null)
      setAddrForm(emptyAddrForm())
    }
    setAddrFormOpen(true)
  }

  const handleSaveAddress = async () => {
    const { name, city, delivery } = addrForm
    if (!name.trim() || !city.trim() || !delivery) {
      toast.error("Заповніть обов'язкові поля: ПІБ, місто, спосіб доставки")
      return
    }
    setAddrSaving(true)
    let updated: SavedAddress[]
    if (editingAddr) {
      updated = addresses.map(a =>
        a.id === editingAddr.id ? { ...editingAddr, ...addrForm } : a
      )
    } else {
      const newAddr: SavedAddress = {
        ...addrForm,
        id: crypto.randomUUID(),
        is_default: addresses.length === 0,
      }
      updated = [...addresses, newAddr]
    }
    await persistAddresses(updated)
    setAddrSaving(false)
    setAddrFormOpen(false)
    toast.success('Адресу збережено', { className: 'hot-toast' })
  }

  const handleDeleteAddress = async (id: string) => {
    const updated = addresses.filter(a => a.id !== id).map((a, i) =>
      i === 0 ? { ...a, is_default: true } : a
    )
    await persistAddresses(updated)
    toast.success('Адресу видалено', { className: 'hot-toast' })
  }

  const handleSetDefault = async (id: string) => {
    const updated = addresses.map(a => ({ ...a, is_default: a.id === id }))
    await persistAddresses(updated)
  }

  const handleSendAddressToManager = async (addr: SavedAddress) => {
    if (!chatConversationId || !user) {
      setActiveTab('chat')
      toast('Відкрийте чат і спробуйте ще раз', { className: 'hot-toast' })
      return
    }
    if (chatConversationStatus === 'closed') {
      toast('Чат закрито. Натисніть "Відновити чат"', { className: 'hot-toast' })
      return
    }
    const text = `📦 Адреса доставки:\n${addr.name}${addr.phone ? ' · ' + addr.phone : ''}\n${formatAddress(addr)}`
    const payload = {
      conversation_id: chatConversationId,
      sender_id: user.id,
      sender_type: 'user',
      sender_name: profile?.full_name || 'Клієнт',
      content: text,
    }
    await addMessage(payload)
    await refreshChatMessages(chatConversationId)
    setActiveTab('chat')
    toast.success('Адресу надіслано менеджеру', { className: 'hot-toast' })
  }

  const totalSpent = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const loyaltyPoints = profile?.loyalty_points ?? 0
  const loyaltyValueUah = Math.floor(loyaltyPoints * 0.5)
  const loyaltyEarnRate = '1 бал за кожні 20 ₴'

  const personalizedRecommendations = useMemo(() => {
    const purchasedNames = new Set(
      orders.flatMap(order => order.items.map(item => item.name.toLowerCase().trim()))
    )

    const purchasedCategories = orders.flatMap(order =>
      order.items
        .map(item => allProducts.find(p => p.name_uk.toLowerCase().trim() === item.name.toLowerCase().trim())?.category)
        .filter(Boolean) as string[]
    )

    const topCategory = purchasedCategories.length
      ? purchasedCategories.sort((a, b) => purchasedCategories.filter(v => v === b).length - purchasedCategories.filter(v => v === a).length)[0]
      : null

    return allProducts
      .filter(product => {
        if (purchasedNames.has(product.name_uk.toLowerCase().trim())) return false
        if (wishIds.has(product.id)) return false
        if (!product.in_stock) return false
        if (topCategory && product.category === topCategory) return true
        return product.is_bestseller || product.is_new || product.rating >= 4.7
      })
      .sort((a, b) => {
        const scoreA = (a.rating || 0) + (a.is_bestseller ? 1 : 0) + (a.is_new ? 0.6 : 0)
        const scoreB = (b.rating || 0) + (b.is_bestseller ? 1 : 0) + (b.is_new ? 0.6 : 0)
        return scoreB - scoreA
      })
      .slice(0, 4)
  }, [orders, wishIds])

  const handleSave = async (data: Record<string, string>) => {
    if (!user) return
    const payload = {
      full_name: data.full_name,
      phone: data.phone,
      city: data.city,
      birthday: data.birthday || null,
    }
    const { error } = await updateProfile(user.id, payload)
    if (error) {
      toast.error('Помилка збереження', { className: 'hot-toast' })
    } else {
      if (profile) {
        setProfile({
          ...profile,
          ...payload,
          birthday: payload.birthday || undefined,
        })
      }
      toast.success('Профіль оновлено!', { className: 'hot-toast' })
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Підтримуються лише JPG, PNG, WebP')
      event.currentTarget.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Файл завеликий. Максимум 5 МБ')
      event.currentTarget.value = ''
      return
    }

    setAvatarUploading(true)
    const uploadedUrl = await uploadAvatar(user.id, file)
    if (!uploadedUrl) {
      setAvatarUploading(false)
      toast.error('Не вдалося завантажити фото')
      event.currentTarget.value = ''
      return
    }

    const { error } = await updateProfile(user.id, { avatar_url: uploadedUrl })
    setAvatarUploading(false)
    if (error) {
      toast.error('Не вдалося зберегти фото профілю')
      event.currentTarget.value = ''
      return
    }

    if (profile) {
      setProfile({ ...profile, avatar_url: uploadedUrl })
    }
    toast.success('Фото профілю оновлено')
    event.currentTarget.value = ''
  }

  const handleLogout = async () => {
    logout()
    try {
      await signOut()
    } catch {
      // Local logout already applied.
    }
  }

  const isChatClosed = chatConversationStatus === 'closed'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--b0)' }}>
      <div className="page-wrap" style={{ paddingTop: 18, paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
        <div className="grid gap-5 items-start">

      {/* ── SIDEBAR ── */}
      <aside className="hidden" style={{ width: '100%', flexShrink: 0, flexDirection: 'column', background: 'rgba(255,255,255,0.97)', border: '1px solid var(--bd)', position: 'sticky', top: 86 }}>

        {/* Logo block — same as admin */}
        <div style={{ padding: '26px 24px 18px', borderBottom: '1px solid var(--bd)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--bd)', background: 'linear-gradient(135deg, #f4f7ef 0%, #e8efe0 100%)', color: 'var(--gold-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, flexShrink: 0 }}>
              B
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--t0)' }}>
                Bio<span style={{ color: 'var(--gold)' }}>nerica</span>
              </div>
              <div style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--t2)', marginTop: 2 }}>
                ФЕРМА · ОРГАНІКА · UA
              </div>
            </div>
          </div>

          {/* Profile mini row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 0', borderTop: '1px solid var(--bd)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 30% 30%, var(--gold-l), var(--gold) 58%, var(--gold-d) 100%)', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profileInitials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || 'Вітаємо!'}
              </p>
              <p style={{ fontSize: 10, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                {user.email}
              </p>
            </div>
          </div>

          {profileCompletion < 100 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                <div style={{ width: `${profileCompletion}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--gold-d))' }} />
              </div>
              <p style={{ fontSize: 9, color: 'var(--t2)', marginTop: 3, letterSpacing: 1, textTransform: 'uppercase' }}>Профіль {profileCompletion}%</p>
            </div>
          )}
        </div>

        {/* Nav — exact same style as admin panel */}
        <nav style={{ flex: 1, padding: '10px 14px 14px' }}>
          {tabs.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', width: '100%', background: activeTab === item.id ? 'var(--b1)' : 'transparent', border: '1px solid transparent', borderLeft: activeTab === item.id ? '2px solid var(--gold)' : '2px solid transparent', borderRadius: 10, color: activeTab === item.id ? 'var(--t0)' : 'var(--t1)', fontSize: 14, fontWeight: activeTab === item.id ? 600 : 400, textAlign: 'left', marginBottom: 4, transition: 'all 0.18s' }}
                onMouseEnter={e => { if (activeTab !== item.id) { ;(e.currentTarget as HTMLElement).style.background = 'var(--b1)'; ;(e.currentTarget as HTMLElement).style.color = 'var(--t0)' } }}
                onMouseLeave={e => { if (activeTab !== item.id) { ;(e.currentTarget as HTMLElement).style.background = 'transparent'; ;(e.currentTarget as HTMLElement).style.color = 'var(--t1)' } }}
              >
                <Icon size={16} style={{ color: activeTab === item.id ? 'var(--gold)' : 'var(--t2)', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === 'wishlist' && wishIds.size > 0 && (
                  <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: 'var(--rose)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                    {wishIds.size}
                  </span>
                )}
              </button>
            )
          })}

          <div style={{ paddingTop: 14, marginTop: 10, borderTop: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', color: 'var(--t2)', fontSize: 13, textDecoration: 'none' }}>
              <ArrowLeft size={15} style={{ color: 'var(--t2)', flexShrink: 0 }} />
              До магазину
            </Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', color: 'var(--gold-d)', fontSize: 13, textDecoration: 'none' }}>
                <Shield size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                Адмін-панель
              </Link>
            )}
            <button type="button" onClick={() => void handleLogout()}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', width: '100%', background: 'none', border: 'none', color: 'rgba(220,100,90,0.75)', fontSize: 13, fontWeight: 500, textAlign: 'left' }}>
              <LogOut size={15} style={{ color: 'rgba(220,100,90,0.75)', flexShrink: 0 }} />
              Вийти
            </button>
          </div>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="pb-24 lg:pb-0" style={{ minWidth: 0, position: 'relative', background: 'var(--b0)' }}>
        <div style={{ position: 'relative', padding: '8px 2px 0' }}>
          {/* Stats row — 4 cols like admin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 16, marginBottom: 30 }}>
            {[
              { icon: Package,     label: 'Замовлення',    value: String(orders.length),                          chg: orders.filter(o => o.status === 'delivered').length + ' доставлено' },
              { icon: ShoppingBag, label: 'Витрачено',     value: `₴ ${totalSpent.toLocaleString()}`,             chg: orders.filter(o => o.status === 'shipped').length + ' в дорозі' },
              { icon: Heart,       label: 'Список бажань', value: String(wishIds.size),                            chg: 'збережених товарів' },
              { icon: Gift,        label: 'Бонуси',        value: String(profile?.loyalty_points ?? 0),           chg: `≈ ${loyaltyValueUah} ₴ знижки` },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 20, position: 'relative', minHeight: 146, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 38, height: 38, background: 'var(--b0)', border: '1px solid var(--bd)', color: 'var(--t1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <s.icon size={16} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t2)', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)', lineHeight: 1 }}>{s.value}</p>
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>{s.chg}</span>
              </div>
            ))}
          </div>

          {/* Tab nav — same as admin */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 28, overflowX: 'auto', paddingInline: 2 }}>
            {tabs.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === item.id ? 'var(--gold)' : 'transparent'}`, padding: '10px 18px', marginBottom: -1, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: activeTab === item.id ? 'var(--t0)' : 'var(--t2)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.18s' }}>
                {item.label}
              </button>
            ))}
          </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className="flex flex-col gap-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {[
                        { label: 'Замовлень', value: orders.length, icon: Package },
                        { label: 'Витрачено', value: `${totalSpent.toLocaleString()} ₴`, icon: ShoppingBag },
                        { label: 'У списку бажань', value: wishIds.size, icon: Heart },
                        { label: 'Бонусних балів', value: profile?.loyalty_points ?? 0, icon: Gift },
                        { label: 'На сайті зараз', value: onlineNow, icon: Users },
                      ].map(s => (
                        <div key={s.label} className="p-5 flex flex-col" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', borderTop: '3px solid var(--gold)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <s.icon size={15} style={{ color: 'var(--gold)', opacity: 0.85 }} />
                          </div>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)', lineHeight: 1 }}>{s.value}</p>
                          <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', marginTop: 6 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-5" style={{ background: 'var(--b0)', border: '1px solid var(--bd)' }}>
                        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
                          Стан кабінету
                        </p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--t0)', marginBottom: 8 }}>
                          Профіль заповнено на {profileCompletion}%
                        </p>
                        <div style={{ height: 8, background: 'var(--b1)', border: '1px solid var(--bd)', overflow: 'hidden', marginBottom: 10 }}>
                          <div style={{ width: `${profileCompletion}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--gold-d))' }} />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                          Остання синхронізація: {lastDataSyncAt || 'щойно'}
                        </p>
                      </div>
                      <div className="p-5" style={{ background: 'var(--b0)', border: '1px solid var(--bd)' }}>
                        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
                          Швидка навігація
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-outline btn-sm" onClick={() => setActiveTab('orders')}>Мої замовлення</button>
                          <button className="btn-outline btn-sm" onClick={() => setActiveTab('chat')}>Чат менеджера</button>
                          <button className="btn-outline btn-sm" onClick={() => setActiveTab('loyalty')}>Бонуси</button>
                          <button className="btn-outline btn-sm" onClick={() => setActiveTab('settings')}>Профіль</button>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 10 }}>
                          Realtime: {presenceConnected ? 'підключено' : 'підключення...'}
                        </p>
                      </div>
                    </div>

                    {/* Recent orders */}
                    <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                      <div className="flex justify-between items-center mb-5">
                        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)' }}>Останні замовлення</h3>
                        <button onClick={() => setActiveTab('orders')} className="btn-ghost text-[11px]">Всі замовлення <ChevronRight size={13} /></button>
                      </div>
                      {orders.slice(0, 2).map(order => {
                        const st = statusMap[order.status]
                        return (
                          <div key={order.id} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-14 overflow-hidden flex-shrink-0">
                                <img src={order.items[0].image} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'var(--t0)', marginBottom: 2 }}>{order.id}</p>
                                <p style={{ fontSize: 11, color: 'var(--t2)' }}>{order.date} · {order.items.length} товар</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`badge ${st.cls} block mb-1`}>{st.label}</span>
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--t0)' }}>{order.total.toLocaleString()} ₴</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Wishlist preview */}
                    {wishProducts.length > 0 && (
                      <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                        <div className="flex justify-between items-center mb-5">
                          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)' }}>Список бажань</h3>
                          <button onClick={() => setActiveTab('wishlist')} className="btn-ghost text-[11px]">Всі <ChevronRight size={13} /></button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {wishProducts.slice(0, 4).map(p => (
                            <Link key={p.id} to={`/product/${p.slug}`}>
                              <LazyImage src={p.images[0]} alt={p.name_uk} aspectRatio="aspect-[3/4]" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {personalizedRecommendations.length > 0 && (
                      <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                        <div className="flex justify-between items-center mb-5">
                          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)' }}>
                            Рекомендовано для вас
                          </h3>
                          <Link to="/catalog" className="btn-ghost text-[11px]">В каталог <ChevronRight size={13} /></Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {personalizedRecommendations.map(product => (
                            <Link key={product.id} to={`/product/${product.slug}`}>
                              <LazyImage src={product.images[0]} alt={product.name_uk} aspectRatio="aspect-[3/4]" />
                              <p style={{ fontSize: 12, color: 'var(--t0)', marginTop: 7 }}>{product.name_uk}</p>
                              <p style={{ fontSize: 11, color: 'var(--t2)' }}>{product.price.toLocaleString('uk-UA')} ₴</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ORDERS ── */}
                {activeTab === 'orders' && (
                  <div className="flex flex-col gap-4">
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>Мої замовлення</h2>
                    {ordersLoading && <p style={{ color: 'var(--t2)', fontSize: 12 }}>Завантаження замовлень...</p>}
                    {!ordersLoading && orders.length === 0 && (
                      <div className="text-center py-20">
                        <ShoppingBag size={56} style={{ color: 'var(--bd)', margin: '0 auto 16px' }} />
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>Замовлень ще немає</p>
                        <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 24 }}>Перейдіть до каталогу, щоб зробити перше замовлення</p>
                        <Link to="/catalog" className="btn-dark">До каталогу</Link>
                      </div>
                    )}
                    {orders.map(order => {
                      const st = statusMap[order.status]
                      const StIcon = st.icon
                      const isOpen = expandedOrder === order.id
                      const matchedProduct = allProducts.find(
                        p => p.name_uk === order.items[0]?.name
                      )
                      const reviewLink = matchedProduct
                        ? `/reviews?write=1&product=${matchedProduct.id}`
                        : '/reviews?write=1'
                      return (
                        <div key={order.id} style={{ background: 'var(--b0)', border: '1px solid var(--bd)' }}>
                          <button onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                            className="w-full flex items-center gap-4 p-5 text-left transition-all"
                            style={{ background: 'none', border: 'none' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                          >
                            <div className="flex-1 grid sm:grid-cols-4 gap-3 items-center">
                              <div>
                                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--t0)', marginBottom: 3 }}>{order.id}</p>
                                <p style={{ fontSize: 11, color: 'var(--t2)' }}>{order.date}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StIcon size={14} style={{ color: st.color, flexShrink: 0 }} />
                                <span className={`badge ${st.cls}`}>{st.label}</span>
                              </div>
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'var(--t0)' }}>
                                {order.total.toLocaleString()} ₴
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--t2)' }}>{order.items.length} товар(ів)</p>
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--t2)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--bd)' }}>
                                  {/* Items */}
                                  <div className="flex flex-col gap-4 mt-4 mb-5">
                                    {order.items.map(item => (
                                      <div key={item.name} className="flex gap-4 items-center">
                                        <img src={item.image} alt={item.name} className="w-16 h-20 object-cover flex-shrink-0" />
                                        <div className="flex-1">
                                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'var(--t0)', marginBottom: 3 }}>{item.name}</p>
                                          <p style={{ fontSize: 12, color: 'var(--t2)' }}>× {item.qty}</p>
                                        </div>
                                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--t0)' }}>{(item.price * item.qty).toLocaleString()} ₴</p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Tracking */}
                                  {order.tracking && (
                                    <div className="p-4 mb-4" style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Відстеження</p>
                                      <p style={{ fontSize: 13, color: 'var(--t0)' }}>{order.delivery} · <strong>{order.tracking}</strong></p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-3 flex-wrap">
                                    {order.status === 'delivered' && (
                                      <Link to={reviewLink} className="btn-outline btn-sm">Залишити відгук</Link>
                                    )}
                                    {order.status === 'delivered' && (
                                      <button className="btn-dark btn-sm">Замовити ще раз</button>
                                    )}
                                    {(order.status === 'pending' || order.status === 'confirmed') && (
                                      <button className="btn-sm" style={{ border: '1px solid var(--rose)', color: 'var(--rose)', background: 'none', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 20px' }}>
                                        Скасувати
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── WISHLIST ── */}
                {activeTab === 'wishlist' && (
                  <div>
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 24 }}>
                      Список бажань {wishProducts.length > 0 && `(${wishProducts.length})`}
                    </h2>
                    {wishProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {wishProducts.map((p, i) => (
                          <Link key={p.id} to={`/product/${p.slug}`} className="group block">
                            <LazyImage src={p.images[0]} alt={p.name_uk} aspectRatio="aspect-[3/4]"
                              className="mb-3 transition-transform duration-500 group-hover:scale-[1.02]" />
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'var(--t0)', marginBottom: 4 }}>{p.name_uk}</p>
                            <p style={{ fontSize: 15, color: 'var(--t0)' }}>{p.price.toLocaleString()} ₴</p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <Heart size={56} style={{ color: 'var(--bd)', margin: '0 auto 16px' }} />
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>Список порожній</p>
                        <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 24 }}>Натисніть ♡ на товарі, щоб зберегти</p>
                        <Link to="/catalog" className="btn-dark">До каталогу</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ADDRESSES ── */}
                {activeTab === 'addresses' && (
                  <div>
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 24 }}>Збережені адреси</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <div key={addr.id} className="p-6" style={{ border: addr.is_default ? '2px solid var(--gold)' : '1px solid var(--bd)', background: 'var(--b0)' }}>
                          <div className="flex justify-between items-start mb-3">
                            {addr.is_default
                              ? <span className="badge badge-hot">Основна</span>
                              : <button onClick={() => void handleSetDefault(addr.id)}
                                  style={{ background: 'none', border: '1px solid var(--bd)', fontSize: 11, color: 'var(--t2)', padding: '2px 8px', letterSpacing: 1, cursor: 'pointer' }}>
                                  Зробити основною
                                </button>
                            }
                            <div className="flex gap-3">
                              <button onClick={() => openAddForm(addr)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--gold-d)', letterSpacing: 1, cursor: 'pointer' }}>Змінити</button>
                              <button onClick={() => void handleDeleteAddress(addr.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--rose)', letterSpacing: 1, cursor: 'pointer' }}>Видалити</button>
                            </div>
                          </div>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--t0)', marginBottom: 2 }}>{addr.name}</p>
                          {addr.phone && <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>{addr.phone}</p>}
                          <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.7 }}>{formatAddress(addr)}</p>
                          <button
                            onClick={() => void handleSendAddressToManager(addr)}
                            style={{ marginTop: 12, background: 'none', border: '1px solid var(--bd)', fontSize: 11, color: 'var(--gold-d)', padding: '5px 10px', letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <MessageCircle size={12} /> Надіслати менеджеру
                          </button>
                        </div>
                      ))}
                      <button className="p-6 flex flex-col items-center justify-center gap-3 transition-all"
                        onClick={() => openAddForm()}
                        style={{ border: '1px dashed var(--bd)', background: 'none', color: 'var(--t2)', cursor: 'pointer', minHeight: 140 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'}
                      >
                        <MapPin size={24} />
                        <span style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Додати адресу</span>
                      </button>
                    </div>

                    {/* ── ADDRESS FORM MODAL ── */}
                    <AnimatePresence>
                      {addrFormOpen && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                          onClick={(e) => { if (e.target === e.currentTarget) setAddrFormOpen(false) }}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 32, width: '100%', maxWidth: 520 }}
                          >
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)', marginBottom: 24 }}>
                              {editingAddr ? 'Редагувати адресу' : 'Нова адреса'}
                            </h3>
                            <div className="flex flex-col gap-4">
                              <div>
                                <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>ПІБ отримувача *</label>
                                <input className="field-input" style={{ margin: 0 }} value={addrForm.name}
                                  onChange={e => setAddrForm(f => ({ ...f, name: e.target.value }))} placeholder="Шевченко Тарас Григорович" />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Телефон</label>
                                <input className="field-input" style={{ margin: 0 }} value={addrForm.phone}
                                  onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} placeholder="+380 XX XXX XX XX" />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Місто *</label>
                                <input className="field-input" style={{ margin: 0 }} value={addrForm.city}
                                  onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} placeholder="Київ" />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Спосіб доставки *</label>
                                <div className="flex gap-2">
                                  {(['nova_poshta', 'ukrposhta', 'courier'] as SavedAddress['delivery'][]).map(d => (
                                    <button key={d} onClick={() => setAddrForm(f => ({ ...f, delivery: d }))}
                                      style={{ flex: 1, padding: '8px 4px', fontSize: 11, letterSpacing: 0.8, border: addrForm.delivery === d ? '1px solid var(--gold)' : '1px solid var(--bd)', background: addrForm.delivery === d ? 'var(--b0)' : 'none', color: addrForm.delivery === d ? 'var(--t0)' : 'var(--t2)', cursor: 'pointer', transition: 'all 200ms' }}>
                                      {deliveryLabels[d]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {(addrForm.delivery === 'nova_poshta' || addrForm.delivery === 'ukrposhta') && (
                                <div>
                                  <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Номер відділення</label>
                                  <input className="field-input" style={{ margin: 0 }} value={addrForm.branch}
                                    onChange={e => setAddrForm(f => ({ ...f, branch: e.target.value }))} placeholder="5" />
                                </div>
                              )}
                              {addrForm.delivery === 'courier' && (
                                <div className="flex gap-3">
                                  <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Вулиця, будинок</label>
                                    <input className="field-input" style={{ margin: 0 }} value={addrForm.street}
                                      onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} placeholder="вул. Хрещатик, 1" />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Квартира</label>
                                    <input className="field-input" style={{ margin: 0 }} value={addrForm.apartment}
                                      onChange={e => setAddrForm(f => ({ ...f, apartment: e.target.value }))} placeholder="15" />
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-3 pt-2">
                                <button className="btn-dark" style={{ flex: 1, opacity: addrSaving ? 0.6 : 1 }}
                                  disabled={addrSaving} onClick={() => void handleSaveAddress()}>
                                  {addrSaving ? 'Зберігаємо...' : 'Зберегти'}
                                </button>
                                <button className="btn-outline" onClick={() => setAddrFormOpen(false)}>Скасувати</button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── CHAT ── */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>Чат з менеджером</h2>
                      <p style={{ fontSize: 13, color: 'var(--t2)' }}>AI дає швидку попередню відповідь, а менеджер уточнює деталі по замовленню.</p>
                      <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1px solid ${isOnline ? 'rgba(74,140,63,0.32)' : 'rgba(192,92,78,0.35)'}`, background: isOnline ? 'rgba(74,140,63,0.08)' : 'rgba(192,92,78,0.08)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--sage)' : 'var(--rose)' }} />
                        <span style={{ fontSize: 11, color: isOnline ? 'var(--sage)' : 'var(--rose)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                          {isOnline ? 'Онлайн' : 'Офлайн'}
                        </span>
                      </div>
                      {!isOnline && (
                        <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 8 }}>
                          Повідомлення, відправлені зараз, будуть поставлені у чергу і підуть автоматично після відновлення мережі.
                        </p>
                      )}
                    </div>

                    {!isSubscribed && <PushPermissionPrompt />}

                    {addresses.length > 0 && (
                      <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 18 }}>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={16} style={{ color: 'var(--gold)' }} />
                          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)' }}>Надіслати адресу доставки</p>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10 }}>Менеджер отримає вашу адресу одразу в чаті — для уточнення замовлення</p>
                        <div className="flex flex-col gap-2">
                          {addresses.map(addr => (
                            <button key={addr.id}
                              onClick={() => void handleSendAddressToManager(addr)}
                              className="flex items-center gap-3 p-3 text-left transition-all"
                              disabled={isChatClosed}
                              style={{ background: 'none', border: '1px solid var(--bd)', cursor: isChatClosed ? 'default' : 'pointer', opacity: isChatClosed ? 0.55 : 1 }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'}
                            >
                              <MapPin size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 1 }}>{addr.name}</p>
                                <p style={{ fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatAddress(addr)}</p>
                              </div>
                              {addr.is_default && <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1, flexShrink: 0 }}>основна</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 18 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Bot size={16} style={{ color: 'var(--gold)' }} />
                        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)' }}>Швидкі питання до AI</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickAiPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handleAskAi(prompt)}
                            className="btn-outline btn-sm"
                            style={{ fontSize: 10, letterSpacing: 1.5, padding: '8px 12px' }}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      {aiDraftAnswer && (
                        <div className="mt-4 p-4" style={{ background: 'var(--b1)', border: '1px solid var(--bd)' }}>
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>Питання: {aiDraftQuestion}</p>
                          <p style={{ fontSize: 13, color: 'var(--t0)', lineHeight: 1.7 }}>{aiDraftAnswer}</p>
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: 14, borderBottom: '1px solid var(--bd)', fontSize: 12, color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span>Діалог з менеджером</span>
                        <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: isChatClosed ? 'var(--rose)' : chatConversationStatus === 'resolved' ? 'var(--gold-d)' : 'var(--sage)' }}>
                          {isChatClosed ? 'закрито' : chatConversationStatus === 'resolved' ? 'вирішено' : 'відкрито'}
                        </span>
                      </div>

                      <div ref={chatListRef} style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                        {chatLoading && <p style={{ fontSize: 12, color: 'var(--t2)' }}>Завантаження чату...</p>}

                        {!chatLoading && chatMessages.length === 0 && (
                          <p style={{ fontSize: 12, color: 'var(--t2)' }}>Поки що немає повідомлень. Напишіть першим.</p>
                        )}

                        {chatMessages.map((msg) => {
                          const isManager = msg.sender_type === 'admin'
                          return (
                            <div
                              key={msg.id}
                              style={{
                                alignSelf: isManager ? 'flex-start' : 'flex-end',
                                background: isManager
                                  ? 'var(--b0)'
                                  : 'linear-gradient(135deg, #2c3a25 0%, #1e2b1a 100%)',
                                color: isManager ? 'var(--t0)' : 'rgba(245,240,228,0.95)',
                                border: isManager ? '1px solid var(--bd)' : '1px solid rgba(74,110,54,0.35)',
                                padding: '10px 14px',
                                maxWidth: '86%',
                                boxShadow: isManager ? 'none' : '0 2px 12px rgba(30,43,26,0.22)',
                              }}
                            >
                              <p style={{ margin: 0, fontSize: 11, opacity: isManager ? 0.55 : 0.6, marginBottom: 4, letterSpacing: 0.3 }}>
                                {msg.sender_name || (isManager ? 'Менеджер' : 'Ви')}
                              </p>
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{msg.content}</p>
                              <p style={{ margin: 0, marginTop: 5, fontSize: 10, opacity: isManager ? 0.45 : 0.5 }}>
                                {new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ padding: 12, borderTop: '1px solid var(--bd)' }}>
                        {isChatClosed ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--t2)' }}>
                              Чат закритий менеджером. Ви можете відновити його одним кліком.
                            </p>
                            <button
                              className="btn-dark"
                              disabled={chatRestoring}
                              onClick={() => void handleRestoreChat()}
                              style={{ opacity: chatRestoring ? 0.6 : 1 }}
                            >
                              {chatRestoring ? 'Відновлюємо...' : 'Відновити чат'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={chatText}
                              onChange={(e) => setChatText(e.target.value)}
                              placeholder="Напишіть менеджеру..."
                              className="field-input"
                              style={{ margin: 0 }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  void handleSendToManager()
                                }
                              }}
                            />
                            <button
                              className="btn-dark"
                              disabled={chatSending || !chatText.trim()}
                              onClick={() => void handleSendToManager()}
                              style={{ opacity: chatSending || !chatText.trim() ? 0.6 : 1 }}
                            >
                              {chatSending ? '...' : isOnline ? 'Надіслати' : 'У чергу'}
                            </button>
                          </div>
                        )}
                      </div>
                      {showJumpToLatest && (
                        <button
                          onClick={() => {
                            const box = chatListRef.current
                            if (box) box.scrollTop = box.scrollHeight
                            setShowJumpToLatest(false)
                          }}
                          className="btn-outline btn-sm"
                          style={{ alignSelf: 'center', marginBottom: 10 }}
                        >
                          Нові повідомлення ↓
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const box = chatListRef.current
                        if (box) box.scrollTop = box.scrollHeight
                      }}
                      className="lg:hidden"
                      style={{
                        position: 'fixed',
                        right: 14,
                        bottom: 20,
                        zIndex: 60,
                        background: 'var(--gold)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        color: '#18160e',
                        padding: '11px 14px',
                        fontSize: 11,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      Донизу чату
                    </button>
                  </div>
                )}

                {/* ── LOYALTY ── */}
                {activeTab === 'loyalty' && (
                  <div>
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>Програма лояльності</h2>
                    <p style={{ fontSize: 14, color: 'var(--t1)', marginBottom: 28 }}>Накопичуйте бали і використовуйте їх у checkout. Формула прозора і фіксована.</p>

                    {/* Balance card */}
                    <div className="p-8 mb-8 relative overflow-hidden" style={{ background: '#1a1612', color: 'rgba(245,240,232,0.93)' }}>
                      <div className="absolute inset-0 orn-bg opacity-[0.06]" />
                      <div className="relative z-[1]">
                        <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Ваш баланс</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 72, fontWeight: 300, color: 'var(--gold-l)', lineHeight: 1 }}>
                          {loyaltyPoints}
                        </p>
                        <p style={{ fontSize: 14, color: 'rgba(245,240,232,0.5)', marginTop: 4 }}>бонусних балів = {loyaltyValueUah.toLocaleString('uk-UA')} ₴ знижки</p>
                        <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.42)', marginTop: 6 }}>Нарахування: {loyaltyEarnRate}. Використання: до 30% суми замовлення.</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 mb-8">
                      <div className="p-4" style={{ background: 'var(--b0)', border: '1px solid var(--bd)' }}>
                        <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>Нараховано за весь час</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--t0)' }}>{Math.floor(totalSpent / 20)} балів</p>
                      </div>
                      <div className="p-4" style={{ background: 'var(--b0)', border: '1px solid var(--bd)' }}>
                        <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>Доступно до списання</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--gold-d)' }}>{loyaltyValueUah.toLocaleString('uk-UA')} ₴</p>
                      </div>
                      <div className="p-4" style={{ background: 'var(--b0)', border: '1px solid var(--bd)' }}>
                        <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>Термін дії балів</p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--t0)' }}>12 міс.</p>
                      </div>
                    </div>

                    {/* Tiers */}
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>Рівні програми</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { name: 'Срібний', min: 0,    max: 500,  discount: '2%',  color: '#a8a8a8' },
                        { name: 'Золотий', min: 501,  max: 2000, discount: '5%',  color: 'var(--gold)' },
                        { name: 'Платина', min: 2001, max: null, discount: '10%', color: '#b5cccc' },
                      ].map(tier => {
                        const pts = loyaltyPoints
                        const active = pts >= tier.min && (tier.max === null || pts <= tier.max)
                        return (
                          <div key={tier.name} className="p-5" style={{ border: `1px solid ${active ? tier.color : 'var(--bd)'}`, background: active ? 'var(--b0)' : 'none' }}>
                            <div className="w-8 h-8 rounded-full mb-3" style={{ background: tier.color, opacity: active ? 1 : 0.3 }} />
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 4 }}>{tier.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>{tier.min}+ балів</p>
                            <p style={{ fontSize: 18, color: tier.color, fontFamily: 'Cormorant Garamond, serif' }}>{tier.discount} знижка</p>
                            {active && <span className="badge badge-hot mt-2 block w-fit">Ваш рівень</span>}
                          </div>
                        )
                      })}
                    </div>

                    {/* History */}
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)', margin: '28px 0 16px' }}>Історія балів</h3>
                    {[
                      { desc: 'Замовлення BR-2401 (3800 ₴)', pts: '+190', date: '12 Берез.', color: 'var(--sage)' },
                      { desc: 'Замовлення BR-2341 (4300 ₴)', pts: '+215', date: '18 Лют.',   color: 'var(--sage)' },
                      { desc: 'Реферал (Марія Л.)', pts: '+50',  date: '1 Лют.',    color: 'var(--gold)' },
                      { desc: 'Використано знижку', pts: '-75',  date: '3 Лют.',    color: 'var(--rose)'  },
                    ].map((h, i) => (
                      <div key={i} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
                        <div>
                          <p style={{ fontSize: 14, color: 'var(--t0)', marginBottom: 2 }}>{h.desc}</p>
                          <p style={{ fontSize: 11, color: 'var(--t2)' }}>{h.date}</p>
                        </div>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: h.color }}>{h.pts} балів</span>
                      </div>
                    ))}

                    {/* Referral widget */}
                    <div style={{ marginTop: 32 }}>
                      <ReferralWidget
                        userId={user.id}
                        referralCount={orders.filter(o => (o as Record<string, unknown>).referrer_id === user.id).length}
                        bonusEarned={Math.floor(orders.filter(o => (o as Record<string, unknown>).referrer_id === user.id).length * 50)}
                      />
                    </div>

                    {/* Newsletter inside loyalty */}
                    <div style={{ marginTop: 24 }}>
                      <NewsletterWidget
                        title="Підписка на розсилку"
                        subtitle="Отримуйте сповіщення про збір і спецпропозиції першими"
                        compact
                      />
                    </div>
                  </div>
                )}

                {/* ── SETTINGS ── */}
                {activeTab === 'settings' && (
                  <div>
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 32 }}>Налаштування профілю</h2>

                    {/* Avatar upload */}
                    <div className="flex items-center gap-6 mb-10 pb-10" style={{ borderBottom: '1px solid var(--bd)' }}>
                      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, var(--gold-l), var(--gold) 58%, var(--gold-d) 100%)',
                          color: '#fff',
                          fontSize: 26,
                          fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          boxShadow: '0 14px 32px rgba(74,140,63,0.18)',
                          border: '1px solid rgba(255,255,255,0.65)',
                        }}>
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="Фото профілю" className="w-full h-full object-cover" />
                          : profileInitials}
                      </div>
                      <div>
                        <label className="btn-outline btn-sm flex items-center gap-2 mb-2" style={{ opacity: avatarUploading ? 0.65 : 1 }}>
                          <Upload size={14} /> {avatarUploading ? 'Завантаження...' : 'Завантажити фото'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarChange}
                            disabled={avatarUploading}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>JPG, PNG, WebP · до 5 МБ</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-7 max-w-lg">
                      <div className="grid sm:grid-cols-2 gap-7">
                        <div className="field-wrap">
                          <label className="field-label"><User size={12} style={{ display: 'inline', marginRight: 6 }} />Повне ім'я</label>
                          <input className="field-input" placeholder="Оксана Коваленко" {...register('full_name')} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label"><Phone size={12} style={{ display: 'inline', marginRight: 6 }} />Телефон</label>
                          <input className="field-input" placeholder="+38 (0XX) XXX-XX-XX" type="tel" {...register('phone')} />
                        </div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label"><Mail size={12} style={{ display: 'inline', marginRight: 6 }} />Email</label>
                        <input className="field-input" value={user.email || ''} disabled style={{ opacity: 0.5 }} />
                        <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>Email не можна змінити — він використовується для входу</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-7">
                        <div className="field-wrap">
                          <label className="field-label"><MapPin size={12} style={{ display: 'inline', marginRight: 6 }} />Місто</label>
                          <input className="field-input" placeholder="Київ" {...register('city')} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label"><Calendar size={12} style={{ display: 'inline', marginRight: 6 }} />День народження</label>
                          <input className="field-input" type="date" {...register('birthday')} />
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 28 }}>
                        <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>
                          Сповіщення
                        </h4>
                        {[
                          ['notify_orders', 'Статус замовлень'],
                          ['notify_promo', 'Акції та знижки'],
                          ['notify_new', 'Нові колекції'],
                          ['notify_wishlist', 'Зниження ціни у списку бажань'],
                        ].map(([k, l]) => (
                          <label key={k} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--bd)', cursor: 'none' }}>
                            <span style={{ fontSize: 14, color: 'var(--t0)' }}>{l}</span>
                            <input type="checkbox" defaultChecked={k !== 'notify_promo'} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                          </label>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <button type="submit" className="btn-dark">Зберегти зміни</button>
                        <button type="button" className="btn-outline">Скасувати</button>
                      </div>
                    </form>

                    {/* Push Notifications */}
                    <div className="mt-12 pt-10" style={{ borderTop: '1px solid var(--bd)' }}>
                      <div className="flex items-center gap-3 mb-5">
                        <Bell size={18} style={{ color: 'var(--gold)' }} />
                        <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)' }}>
                          Push-сповіщення
                        </h4>
                      </div>
                      <PushPermissionPrompt />
                      <PushSettings />
                    </div>

                    {/* Danger zone */}
                    <div className="mt-12 pt-10" style={{ borderTop: '1px solid var(--bd)' }}>
                      <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--rose)', marginBottom: 12 }}>
                        Небезпечна зона
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
                        Видалення акаунту незворотне. Всі ваші замовлення та дані будуть видалені.
                      </p>
                      <button className="btn-sm" style={{ border: '1px solid var(--rose)', color: 'var(--rose)', background: 'none', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '10px 24px' }}>
                        Видалити акаунт
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 55, borderTop: '1px solid var(--bd)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)' }}>
        <div className="grid grid-cols-4">
          {([
            { id: 'overview' as Tab, label: 'Огляд' },
            { id: 'orders'   as Tab, label: 'Замовл.' },
            { id: 'chat'     as Tab, label: 'Чат' },
            { id: 'loyalty'  as Tab, label: 'Бали' },
          ] as const).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              style={{ border: 'none', background: 'none', padding: '12px 8px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: activeTab === item.id ? 'var(--gold-d)' : 'var(--t2)', borderTop: `2px solid ${activeTab === item.id ? 'var(--gold)' : 'transparent'}` }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
    </div>
  )
}
