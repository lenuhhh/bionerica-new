// Admin.tsx
import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { createPortal } from 'react-dom'
import { TrendingUp, ShoppingBag, Users, Star, Plus, Edit, Trash2, Search, ArrowLeft, Package, CheckCircle, Clock, XCircle, Eye, EyeOff, BarChart3, MessageSquareWarning, TriangleAlert, Bell, Palette, ShieldCheck, Save, UserRound, Radio, MessageCircleMore, LogOut, Layers, Activity, RotateCcw, X } from 'lucide-react'
import { products, blogPosts } from '@/data'
import { createPost, deletePost, getAllOrders, getAllPosts, getAllProducts, getAllReviews, getAllProfiles, removeReview, setReviewApproved, updatePost, createProduct, updateProduct, upsertProduct, deleteProduct, uploadProductImage, getAllConversations, getConversationMessages, addMessage, updateConversation, updateOrderStatus, updateProfile, signOut, addOrderAdminNote, getAllPartnerApplications, updatePartnerApplicationStatus, supabase } from '@/lib/supabase'
import { useAuth } from '@/store'
import { useSEO } from '@/hooks/useSEO'
import { CardStylePreset } from '@/components/admin/CardStylePreview'
import { PushNotificationManager } from '@/components/admin/PushNotificationManager'
import toast from 'react-hot-toast'
import type { BlogPost, Product, UserProfile } from '@/types'

type Tab = 'dashboard' | 'products' | 'orders' | 'reviews' | 'blog' | 'chats' | 'partners' | 'analytics' | 'content' | 'activity' | 'design' | 'settings'

type ActivityEntry = {
  id: string
  timestamp: string
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'status_changed' | 'published' | 'hidden'
  section: 'product' | 'post' | 'order' | 'review' | 'chat' | 'content' | 'settings'
  target: string
  details?: string
  snapshot?: Record<string, unknown>
}

type ContentBlockGroup = 'hero' | 'cta' | 'contacts' | 'seo' | 'banner'
type ContentBlockType = 'text' | 'textarea' | 'url' | 'toggle'

type ContentBlock = {
  id: string
  label: string
  type: ContentBlockType
  value: string
  description?: string
  group: ContentBlockGroup
}

type ContentEditorMode = 'blocks' | 'pages'
type EditablePageKey = 'home' | 'catalog' | 'product' | 'blog' | 'contact' | 'faq' | 'delivery'

type PageFieldType = 'text' | 'textarea' | 'toggle'

type PageEditableField = {
  id: string
  label: string
  type: PageFieldType
  value: string
  description?: string
}

type PageStyleSettings = {
  accentColor: string
  background: string
  cardRadius: string
  headingScale: string
}

type PageEditorConfig = {
  title: string
  path: string
  description: string
  fields: PageEditableField[]
  style: PageStyleSettings
}

const pageEditorDefaults: Record<EditablePageKey, PageEditorConfig> = {
  home: {
    title: 'Головна',
    path: '/',
    description: 'Перший екран, основний оффер і ключові CTA.',
    fields: [
      { id: 'hero_title', label: 'Заголовок Hero', type: 'text', value: 'Свіжі ягоди та овочі з поля' },
      { id: 'hero_subtitle', label: 'Підзаголовок Hero', type: 'textarea', value: 'Органічна ферма зі щоденною доставкою в день збору.' },
      { id: 'hero_primary_btn', label: 'Текст кнопки 1', type: 'text', value: 'Перейти до каталогу' },
      { id: 'hero_secondary_btn', label: 'Текст кнопки 2', type: 'text', value: 'Дізнатись більше' },
      { id: 'show_season_banner', label: 'Показувати сезонний банер', type: 'toggle', value: 'true' },
    ],
    style: { accentColor: '#4a8c3f', background: '#f7faf5', cardRadius: '16', headingScale: '100' },
  },
  catalog: {
    title: 'Каталог',
    path: '/catalog',
    description: 'Сторінка категорій і фільтрів товарів.',
    fields: [
      { id: 'page_title', label: 'Заголовок сторінки', type: 'text', value: 'Оберіть категорію' },
      { id: 'page_subtitle', label: 'Підзаголовок', type: 'textarea', value: 'Свіжі ягоди, фрукти та овочі від ферми Bionerica.' },
      { id: 'empty_state_title', label: 'Заголовок, якщо товарів немає', type: 'text', value: 'Товари не знайдено' },
      { id: 'empty_state_text', label: 'Текст, якщо товарів немає', type: 'textarea', value: 'Спробуйте змінити фільтр або повернутися до всіх категорій.' },
    ],
    style: { accentColor: '#5b9ab0', background: '#f5faf8', cardRadius: '14', headingScale: '96' },
  },
  product: {
    title: 'Картка товару',
    path: '/product/:slug',
    description: 'Тексти та стиль сторінки окремого товару.',
    fields: [
      { id: 'buy_btn', label: 'Кнопка покупки', type: 'text', value: 'Додати в кошик' },
      { id: 'delivery_info', label: 'Блок доставки', type: 'textarea', value: 'Доставимо в день збору або наступного ранку.' },
      { id: 'care_title', label: 'Заголовок блоку догляду', type: 'text', value: 'Як зберігати продукт' },
      { id: 'show_related', label: 'Показувати схожі товари', type: 'toggle', value: 'true' },
    ],
    style: { accentColor: '#8fad85', background: '#f7faf5', cardRadius: '18', headingScale: '102' },
  },
  blog: {
    title: 'Блог',
    path: '/blog',
    description: 'Список статей та контент підписки.',
    fields: [
      { id: 'page_title', label: 'Заголовок сторінки', type: 'text', value: 'Блог про органічне харчування' },
      { id: 'page_subtitle', label: 'Підзаголовок', type: 'textarea', value: 'Поради щодо зберігання, користі та сезонності продуктів.' },
      { id: 'newsletter_title', label: 'Заголовок підписки', type: 'text', value: 'Отримуйте нові матеріали' },
      { id: 'newsletter_btn', label: 'Кнопка підписки', type: 'text', value: 'Підписатися' },
    ],
    style: { accentColor: '#e67e22', background: '#fbf7f1', cardRadius: '12', headingScale: '98' },
  },
  contact: {
    title: 'Контакти',
    path: '/contact',
    description: 'Контактна форма, блок адреси й телефони.',
    fields: [
      { id: 'page_title', label: 'Заголовок сторінки', type: 'text', value: "Зв'яжіться з нами" },
      { id: 'form_title', label: 'Заголовок форми', type: 'text', value: 'Напишіть менеджеру' },
      { id: 'success_message', label: 'Повідомлення після відправки', type: 'textarea', value: 'Дякуємо! Ми відповімо протягом 15 хвилин.' },
      { id: 'show_map', label: 'Показувати карту', type: 'toggle', value: 'true' },
    ],
    style: { accentColor: '#4a8c3f', background: '#f6faf4', cardRadius: '14', headingScale: '100' },
  },
  faq: {
    title: 'FAQ',
    path: '/faq',
    description: 'Питання-відповіді для покупців.',
    fields: [
      { id: 'page_title', label: 'Заголовок сторінки', type: 'text', value: 'Часті запитання' },
      { id: 'page_subtitle', label: 'Пояснення під заголовком', type: 'textarea', value: 'Відповіді на найпоширеніші запитання про доставку та продукцію.' },
      { id: 'contact_cta', label: 'Текст CTA внизу', type: 'text', value: 'Не знайшли відповідь? Напишіть нам' },
    ],
    style: { accentColor: '#6b8f61', background: '#f7faf5', cardRadius: '12', headingScale: '100' },
  },
  delivery: {
    title: 'Доставка',
    path: '/delivery',
    description: 'Умови доставки, оплати, зона покриття.',
    fields: [
      { id: 'page_title', label: 'Заголовок сторінки', type: 'text', value: 'Доставка та оплата' },
      { id: 'delivery_window', label: 'Час доставки', type: 'text', value: 'Щоденно з 10:00 до 20:00' },
      { id: 'free_delivery_threshold', label: 'Поріг безкоштовної доставки', type: 'text', value: 'від 1500 ₴' },
      { id: 'show_express', label: 'Показувати експрес-доставку', type: 'toggle', value: 'false' },
    ],
    style: { accentColor: '#5b9ab0', background: '#f4f9fb', cardRadius: '12', headingScale: '100' },
  },
}

const clonePageEditorDefaults = (): Record<EditablePageKey, PageEditorConfig> =>
  JSON.parse(JSON.stringify(pageEditorDefaults)) as Record<EditablePageKey, PageEditorConfig>

const pageEditorStorageKey = 'bionerica_admin_page_editor_v1'

const loadPageEditorConfig = (): Record<EditablePageKey, PageEditorConfig> => {
  const defaults = clonePageEditorDefaults()
  if (typeof window === 'undefined') return defaults

  try {
    const raw = window.localStorage.getItem(pageEditorStorageKey)
    if (!raw) return defaults

    const parsed = JSON.parse(raw) as Partial<Record<EditablePageKey, Partial<PageEditorConfig>>>
    const result = clonePageEditorDefaults()

    ;(Object.keys(result) as EditablePageKey[]).forEach(pageKey => {
      const savedPage = parsed[pageKey]
      if (!savedPage) return

      result[pageKey] = {
        ...result[pageKey],
        ...savedPage,
        fields: result[pageKey].fields.map(defaultField => {
          const savedField = (savedPage.fields || []).find(field => field.id === defaultField.id)
          return savedField ? { ...defaultField, ...savedField } : defaultField
        }),
        style: {
          ...result[pageKey].style,
          ...(savedPage.style || {}),
        },
      }
    })

    return result
  } catch {
    return defaults
  }
}

const contentGroupMeta: Record<ContentBlockGroup, { title: string; hint: string }> = {
  hero: { title: 'Hero', hint: 'Головний екран і заголовки першого блоку' },
  cta: { title: 'CTA', hint: 'Кнопки та заклики до дії' },
  contacts: { title: 'Контакти', hint: 'Телефон, email, адреса та графік роботи' },
  banner: { title: 'Банер', hint: 'Верхня інформаційна стрічка' },
  seo: { title: 'SEO', hint: 'Title/description для пошуку' },
}

const contentTypeMeta: Record<ContentBlockType, string> = {
  text: 'Короткий текст',
  textarea: 'Довгий текст',
  url: 'URL / посилання',
  toggle: 'Перемикач',
}

type AdminPreferences = {
  isOnline: boolean
  showAdminName: boolean
  showLastSeen: boolean
  notificationsEmail: boolean
  notificationsSound: boolean
  notificationsBrowser: boolean
  autoReplyEnabled: boolean
  quickReplyTemplate: string
  statusMessage: string
  defaultTab: Tab
  compactMetrics: boolean
  confirmDangerActions: boolean
  showChatPreview: boolean
}

type AdminBooleanPreference =
  | 'isOnline'
  | 'showAdminName'
  | 'showLastSeen'
  | 'notificationsEmail'
  | 'notificationsSound'
  | 'notificationsBrowser'
  | 'autoReplyEnabled'
  | 'compactMetrics'
  | 'confirmDangerActions'
  | 'showChatPreview'

const adminTabLabels: Record<Tab, string> = {
  dashboard: 'Фермерський дашборд',
  products: 'Керування каталогом',
  orders: 'Замовлення',
  reviews: 'Відгуки',
  blog: 'Блог',
  chats: 'Чати з клієнтами',
  partners: 'Заявки на партнерство',
  analytics: 'Аналітика',
  content: 'Контент сайту',
  activity: 'Журнал змін',
  design: 'Дизайн карточок',
  settings: 'Налаштування адмінки',
}

type AdminProfileForm = {
  full_name: string
  phone: string
  city: string
  birthday: string
}

const ADMIN_PREFS_KEY = 'broiderie_admin_preferences_v1'
const ADMIN_POSTS_KEY = 'bionerica_admin_posts_v1'
const ADMIN_ACTIVITY_KEY = 'bionerica_admin_activity_v1'
const ADMIN_CONTENT_KEY = 'bionerica_admin_content_v1'
const ADMIN_DELETED_PRODUCTS_KEY = 'bionerica_admin_deleted_products_v1'

const getDefaultAdminPreferences = (): AdminPreferences => ({
  isOnline: true,
  showAdminName: true,
  showLastSeen: false,
  notificationsEmail: true,
  notificationsSound: true,
  notificationsBrowser: false,
  autoReplyEnabled: true,
  quickReplyTemplate: 'Вітаю! Я вже перевіряю ваше звернення та повернуся з відповіддю найближчим часом.',
  statusMessage: 'Онлайн · відповідаємо протягом 15 хвилин',
  defaultTab: 'dashboard',
  compactMetrics: false,
  confirmDangerActions: true,
  showChatPreview: true,
})

const loadAdminPreferences = (): AdminPreferences => {
  if (typeof window === 'undefined') return getDefaultAdminPreferences()

  try {
    const raw = window.localStorage.getItem(ADMIN_PREFS_KEY)
    return raw ? { ...getDefaultAdminPreferences(), ...JSON.parse(raw) } : getDefaultAdminPreferences()
  } catch {
    return getDefaultAdminPreferences()
  }
}

const loadLocalAdminPosts = (): BlogPost[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ADMIN_POSTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as BlogPost[]) : []
  } catch {
    return []
  }
}

const saveLocalAdminPosts = (posts: BlogPost[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_POSTS_KEY, JSON.stringify(posts))
  } catch {
    // ignore localStorage write failures
  }
}

const loadDeletedProductSlugs = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ADMIN_DELETED_PRODUCTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

const persistDeletedProductSlugs = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(deletedSlugsCache)))
  } catch {
    // ignore localStorage write failures
  }
}

const defaultContentBlocks: ContentBlock[] = [
  { id: 'hero_eyebrow', label: 'Hero: Надпис над заголовком', type: 'text', value: 'Тижнева підписка', group: 'hero' },
  { id: 'hero_title', label: 'Hero: Рядок заголовку 1', type: 'text', value: 'Оформи бокс', group: 'hero' },
  { id: 'hero_title2', label: 'Hero: Рядок заголовку 2 (акцент)', type: 'text', value: 'свіжих ягід та овочів', group: 'hero' },
  { id: 'hero_text', label: 'Hero: Текст під заголовком', type: 'textarea', value: 'Щотижнева або двотижнева доставка свіжих ягід, фруктів і овочів. Ми збираємо зранку і доставляємо в день збору. Оберіть, коли і скільки.', group: 'hero', description: 'Підзаголовок на головній під кнопками' },
  { id: 'cta_eyebrow', label: 'CTA-блок: Надпис', type: 'text', value: 'Тижнева підписка', group: 'cta' },
  { id: 'cta_title', label: 'CTA-блок: Заголовок рядок 1', type: 'text', value: 'Оформи бокс', group: 'cta' },
  { id: 'cta_title_accent', label: 'CTA-блок: Заголовок рядок 2 (акцент)', type: 'text', value: 'свіжих ягід та овочів', group: 'cta' },
  { id: 'cta_text', label: 'CTA-блок: Текст', type: 'textarea', value: 'Щотижнева або двотижнева доставка свіжих ягід, фруктів і овочів. Ми збираємо зранку і доставляємо в день збору. Оберіть, коли і скільки.', group: 'cta' },
  { id: 'cta_btn_primary', label: 'CTA-блок: Кнопка 1 (текст)', type: 'text', value: 'Оформити підписку', group: 'cta' },
  { id: 'cta_btn_secondary', label: 'CTA-блок: Кнопка 2 (текст)', type: 'text', value: 'Запитати', group: 'cta' },
  { id: 'contact_phone', label: 'Контакти: Телефон', type: 'text', value: '+380 (xx) xxx-xx-xx', group: 'contacts' },
  { id: 'contact_email', label: 'Контакти: Email', type: 'text', value: 'hello@bionerica.ua', group: 'contacts' },
  { id: 'contact_address', label: 'Контакти: Адреса', type: 'text', value: '', group: 'contacts', description: 'Адреса ферми або офісу' },
  { id: 'contact_hours', label: 'Контакти: Години роботи', type: 'text', value: 'Пн–Пт: 9:00–18:00', group: 'contacts' },
  { id: 'banner_text', label: 'Банер: Текст оголошення', type: 'text', value: 'Безкоштовна доставка від 1500 ₴', group: 'banner', description: 'Текст у верхньому банері / стрічці' },
  { id: 'banner_enabled', label: 'Банер: Показувати банер', type: 'toggle', value: 'true', group: 'banner' },
  { id: 'seo_title', label: 'SEO: Заголовок сайту', type: 'text', value: 'Bionerica — Органічна ферма', group: 'seo' },
  { id: 'seo_description', label: 'SEO: Мета-опис', type: 'textarea', value: 'Щотижнева доставка свіжих органічних ягід, фруктів та овочів просто з ферми.', group: 'seo' },
]

const loadActivityLog = (): ActivityEntry[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ADMIN_ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : []
  } catch { return [] }
}

const loadContentBlocks = (): ContentBlock[] => {
  if (typeof window === 'undefined') return defaultContentBlocks
  try {
    const raw = window.localStorage.getItem(ADMIN_CONTENT_KEY)
    if (!raw) return defaultContentBlocks
    const saved = JSON.parse(raw) as ContentBlock[]
    return defaultContentBlocks.map(def => saved.find(s => s.id === def.id) ?? def)
  } catch { return defaultContentBlocks }
}


const mockOrders = [
  { id: 'BR-2401', client: 'Оксана К.', email: 'ox@gmail.com', date: '12.03.2025', total: 3800, status: 'delivered', items: 1 },
  { id: 'BR-2389', client: 'Марія Л.',  email: 'ma@gmail.com', date: '08.03.2025', total: 6200, status: 'shipped',   items: 1 },
  { id: 'BR-2376', client: 'Тетяна Г.', email: 'te@gmail.com', date: '01.03.2025', total: 4300, status: 'delivered', items: 2 },
  { id: 'BR-2341', client: 'Ірина М.',  email: 'ir@gmail.com', date: '25.02.2025', total: 3200, status: 'cancelled', items: 1 },
]

const statusBadge = { delivered: 'badge-status-ok', shipped: 'badge-status-warn', pending: 'badge-status-warn', cancelled: 'badge-status-err', confirmed: 'badge-status-ok', processing: 'badge-status-warn' }
const statusLabel = { delivered: 'Доставлено', shipped: 'В дорозі', pending: 'Очікується', cancelled: 'Скасовано', confirmed: 'Підтверджено', processing: 'Обробляється' }

type AdminOrderRow = {
  id: string
  user_id?: string | null
  client: string
  email: string
  date: string
  total: number
  status: string
  items: number
  delivery_method?: string
  notes?: string
  payment_method?: string
}

type ReviewRow = {
  id: number
  author: string
  rating: number
  text: string
  created_at: string
  approved?: boolean
}

type AnalyticsSource = {
  source: 'review' | 'chat' | 'order'
  text: string
  meta: string
}

const analyticsRules = [
  { key: 'delivery', label: 'Доставка', keywords: ['достав', 'відправ', 'посилка', 'нова пошта', 'укрпошта', 'довго', 'затрим', 'термін'] },
  { key: 'quality', label: 'Якість', keywords: ['якість', 'неякіс', 'крив', 'нитк', 'брак', 'дефект', 'матеріал', 'тканин'] },
  { key: 'size', label: 'Розмір / посадка', keywords: ['розмір', 'мал', 'вел', 'посад', 'не підійш', 'завуз', 'широк'] },
  { key: 'price', label: 'Ціна / цінність', keywords: ['дорого', 'ціна', 'варт', 'знижк', 'зависок'] },
  { key: 'service', label: 'Комунікація', keywords: ['менедж', 'відповід', 'сервіс', 'підтримк', 'ігнор'] },
  { key: 'payment', label: 'Оплата', keywords: ['оплат', 'післяплата', 'картк', 'рахунок'] },
]

type PostFormState = {
  id?: number
  slug: string
  title: string
  subtitle: string
  excerpt: string
  content: string
  image: string
  category: string
  tags: string
  author: string
  read_time: string
  published: boolean
  gallery: string
}

type ProductFormTab = 'basic' | 'attrs' | 'media' | 'seo' | 'status'

type ProductFormState = {
  id?: number
  slug: string
  name_uk: string
  name: string
  subtitle: string
  price: number
  old_price: number
  category: string
  subcategory: string
  tags: string
  description: string
  description_long: string
  benefits: string          // comma-separated list
  storage: string           // comma-separated list
  unit: string              // кг, шт, пучок…
  weight_options: string    // comma-separated: "0.5 кг,1 кг,2 кг"
  min_order: string         // e.g. "0.5 кг"
  harvest_date: string
  shelf_life: string
  season: string            // comma-separated months
  is_seasonal: boolean
  is_organic: boolean
  calories: string          // e.g. "52 ккал / 100г"
  origin: string
  images: string
  video: string
  in_stock: boolean
  stock_count: number
  is_new: boolean
  is_bestseller: boolean
  is_limited: boolean
}

const makePostTemplate = (): PostFormState => ({
  slug: '',
  title: 'Нова стаття Broiderie',
  subtitle: 'Короткий підзаголовок до статті',
  excerpt: 'Короткий вступ: 2-3 речення, що пояснюють користь і зміст публікації.',
  content:
    '## Вступ\n\nПоясніть, для кого ця стаття та яку проблему вона вирішує.\n\n:::note Важливо: тут можна додати акцентну думку або попередження. :::\n\n## Основна частина\n\n- Теза або крок 1\n- Теза або крок 2\n- Теза або крок 3\n\n> Коротка цитата, яка підсилює матеріал.\n\n[image] https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=700&fit=crop\n\n---\n\n### Практичний блок\n\n1) Зробіть дію A\n2) Зробіть дію B\n3) Отримайте результат\n\n## Висновок\n\nПідсумуйте головну думку та дайте читачу наступний крок.',
  image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=700&fit=crop',
  category: 'Поради',
  tags: 'вишивка, догляд, традиції',
  author: 'Команда Broiderie',
  read_time: '5 хв',
  published: true,
  gallery: '',
})

const makeProductTemplate = (): ProductFormState => ({
  slug: '',
  name_uk: '',
  name: '',
  subtitle: '',
  price: 0,
  old_price: 0,
  category: '',
  subcategory: '',
  tags: '',
  description: '',
  description_long: '',
  benefits: '',
  storage: '',
  unit: 'кг',
  weight_options: '0.5 кг,1 кг,2 кг',
  min_order: '0.5 кг',
  harvest_date: '',
  shelf_life: '',
  season: '',
  is_seasonal: false,
  is_organic: true,
  calories: '',
  origin: 'Теплиці Bionerica',
  images: '',
  video: '',
  in_stock: true,
  stock_count: 10,
  is_new: false,
  is_bestseller: false,
  is_limited: false,
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const noImagePlaceholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760' viewBox='0 0 600 760'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#2a261f'/>
          <stop offset='100%' stop-color='#1b1813'/>
        </linearGradient>
      </defs>
      <rect width='600' height='760' fill='url(#g)'/>
      <rect x='36' y='36' width='528' height='688' fill='none' stroke='#c9a96e' stroke-opacity='0.35' stroke-width='2'/>
      <text x='300' y='350' text-anchor='middle' fill='#e8d5a3' font-size='38' font-family='Jost, Arial, sans-serif' opacity='0.95'>Товар не в наявності</text>
      <text x='300' y='400' text-anchor='middle' fill='#b8b0a0' font-size='22' font-family='Jost, Arial, sans-serif' opacity='0.85'>Фото відсутнє</text>
    </svg>`
  )

// Tracks products that are persisted in Supabase (used for DB/Local badge in table).
const dbProductKeysCache = new Set<string>()
// Tracks LOCAL products deleted during this session (not in DB, so no deleteProduct call needed).
const deletedSlugsCache = new Set<string>()

export default function Admin() {
  const { user, profile, loading, logout, setProfile } = useAuth()
  const hasAdminAccess = profile?.role === 'admin'
  const [tab, setTab] = useState<Tab>('dashboard')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<AdminOrderRow[]>(mockOrders)
  const [profilesData, setProfilesData] = useState<UserProfile[]>([])
  const [allChatSignals, setAllChatSignals] = useState<AnalyticsSource[]>([])
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [adminPosts, setAdminPosts] = useState<BlogPost[]>(() => {
    const local = loadLocalAdminPosts()
    return local.length > 0 ? local : blogPosts
  })
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [reviewToDelete, setReviewToDelete] = useState<ReviewRow | null>(null)
  // Visibility overrides for LOCAL products (slug -> in_stock boolean)
  const [localStockOverrides, setLocalStockOverrides] = useState<Record<string, boolean>>({})
  const [localDeleteTick, setLocalDeleteTick] = useState(0)
  const [postFormOpen, setPostFormOpen] = useState(false)
  const [postSaving, setPostSaving] = useState(false)
  const [postForm, setPostForm] = useState<PostFormState>(makePostTemplate())
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [productSaving, setProductSaving] = useState(false)
  const [productForm, setProductForm] = useState<ProductFormState>(makeProductTemplate())
  const [productFormTab, setProductFormTab] = useState<ProductFormTab>('basic')
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productsViewMode, setProductsViewMode] = useState<'table' | 'grid'>('grid')
  const [conversations, setConversations] = useState<Array<any>>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Array<any>>([])
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState<'all' | string>('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderDetailId, setOrderDetailId] = useState<string | null>(null)
  const [orderAdminNote, setOrderAdminNote] = useState('')
  const [orderNoteSaving, setOrderNoteSaving] = useState(false)

  // Partners
  type PartnerApp = { id: string; company: string; contact: string; email: string; phone?: string; type: string; volume: string; message?: string; status: string; created_at: string }
  const [partnerApps, setPartnerApps] = useState<PartnerApp[]>([])
  const [partnersBadge, setPartnersBadge] = useState(0)
  const [partnersLoading, setPartnersLoading] = useState(false)

    // Badge counters for sidebar
    const [chatBadge, setChatBadge] = useState(0)
    const [ordersBadge, setOrdersBadge] = useState(0)
    const [reviewsBadge, setReviewsBadge] = useState(0)
    // Track last-seen conversation ids for chat badge
    const seenConvsRef = useRef<Set<number>>(new Set())
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const msgPollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [adminProfileForm, setAdminProfileForm] = useState<AdminProfileForm>({
    full_name: '',
    phone: '',
    city: '',
    birthday: '',
  })

  useSEO({
    title: adminTabLabels[tab] || 'Farm Admin',
    description: 'Адмін-панель Bionerica для керування каталогом, замовленнями, відгуками та клієнтськими чатами.',
    url: '/admin',
    noindex: true,
  })
  const [adminPreferences, setAdminPreferences] = useState<AdminPreferences>(() => loadAdminPreferences())
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => loadActivityLog())
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityEntry['section']>('all')
  const [activitySearch, setActivitySearch] = useState('')
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() => loadContentBlocks())
  const [contentEditorMode, setContentEditorMode] = useState<ContentEditorMode>('blocks')
  const [contentFilter, setContentFilter] = useState<'all' | ContentBlockGroup>('all')
  const [contentSearch, setContentSearch] = useState('')
  const [contentDirty, setContentDirty] = useState(false)
  const [pageEditorConfig, setPageEditorConfig] = useState<Record<EditablePageKey, PageEditorConfig>>(() => loadPageEditorConfig())
  const [selectedPage, setSelectedPage] = useState<EditablePageKey>('home')
  const [pageEditorSearch, setPageEditorSearch] = useState('')
  const [pageEditorDirty, setPageEditorDirty] = useState(false)
  const anyContentDirty = contentDirty || pageEditorDirty

  const navItems = [
    { id: 'dashboard' as Tab, icon: BarChart3, label: 'Дашборд', badge: 0 },
    { id: 'products' as Tab, icon: Package, label: 'Товари', badge: 0 },
    { id: 'orders' as Tab, icon: ShoppingBag, label: 'Замовлення', badge: ordersBadge },
    { id: 'reviews' as Tab, icon: MessageSquareWarning, label: 'Відгуки', badge: reviewsBadge },
    { id: 'blog' as Tab, icon: Edit, label: 'Блог', badge: 0 },
    { id: 'chats' as Tab, icon: MessageCircleMore, label: 'Чати', badge: chatBadge },
    { id: 'partners' as Tab, icon: Users, label: 'Партнери', badge: partnersBadge },
    { id: 'analytics' as Tab, icon: TrendingUp, label: 'Аналітика', badge: 0 },
    { id: 'activity' as Tab, icon: Activity, label: 'Журнал змін', badge: 0 },
    { id: 'settings' as Tab, icon: ShieldCheck, label: 'Налаштування', badge: 0 },
  ]

  const handleLogout = async () => {
    logout()
    try {
      await signOut()
    } catch {
      // local logout is already applied
    }
  }

  // Keep all storefront products visible in admin catalog and let DB entries override by slug/id.
  // localDeleteTick is read here so React re-runs this block when a LOCAL product is deleted
  void localDeleteTick
  const catalogProducts = (() => {
    const map = new Map<string, Product>()

    for (const baseProduct of products) {
      if (!deletedSlugsCache.has(baseProduct.slug)) {
        const slug = baseProduct.slug
        const inStock = slug in localStockOverrides ? localStockOverrides[slug] : baseProduct.in_stock
        map.set(slug, { ...baseProduct, in_stock: inStock })
      }
    }

    for (const dbProduct of adminProducts) {
      const key = dbProduct.slug || String(dbProduct.id)
      map.set(key, dbProduct)
    }

    return Array.from(map.values())
  })()

  const filteredProducts = catalogProducts.filter(p =>
    p.name_uk.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleAdminPreference = (key: AdminBooleanPreference) => {
    setAdminPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const saveAdminPreferences = () => {
    try {
      window.localStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify(adminPreferences))
      toast.success('Робочі налаштування збережено', { className: 'hot-toast' })
    } catch {
      toast.error('Не вдалося зберегти налаштування', { className: 'hot-toast' })
    }
  }

  const logActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    }
    setActivityLog(prev => {
      const next = [newEntry, ...prev].slice(0, 300)
      try { window.localStorage.setItem(ADMIN_ACTIVITY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const handleRollback = async (entry: ActivityEntry) => {
    if (!entry.snapshot || rollingBack) return
    const snap = entry.snapshot
    setRollingBack(entry.id)
    try {
      if (snap.type === 'product' && snap.data) {
        const product = snap.data as Record<string, unknown>
        const { error } = await upsertProduct(product)
        if (error) throw error
        const p = product as unknown as Product
        const restoredSlug = p.slug || String(p.id)
        if (deletedSlugsCache.has(restoredSlug)) {
          deletedSlugsCache.delete(restoredSlug)
          persistDeletedProductSlugs()
          setLocalDeleteTick(t => t + 1)
        }
        dbProductKeysCache.add(p.slug || String(p.id))
        setAdminProducts(prev => {
          const merged = new Map<string, Product>()
          for (const x of prev) merged.set(x.slug || String(x.id), x)
          merged.set(p.slug || String(p.id), p)
          return Array.from(merged.values())
        })
        toast.success('Товар відновлено')
      } else if (snap.type === 'product_visibility' && snap.id !== undefined) {
        const { error } = await updateProduct(snap.id as number, { in_stock: snap.in_stock })
        if (error) throw error
        setAdminProducts(prev => prev.map(p => p.id === snap.id ? { ...p, in_stock: snap.in_stock as boolean } : p))
        toast.success('Видимість товару відновлено')
      } else if (snap.type === 'product_visibility_local' && snap.slug) {
        const prevStock = snap.in_stock as boolean
        setLocalStockOverrides(prev => ({ ...prev, [snap.slug as string]: prevStock }))
        toast.success('Видимість товару відновлено')
      } else if (snap.type === 'order_status' && snap.orderId) {
        const { error } = await updateOrderStatus(snap.orderId as string, snap.status as string)
        if (error) throw error
        setOrders(prev => prev.map(o => o.id === snap.orderId ? { ...o, status: snap.status as string } : o))
        toast.success('Статус замовлення відновлено')
      } else if (snap.type === 'post' && snap.data) {
        const post = snap.data as BlogPost
        const { error } = await updatePost(post.id, { ...(post as unknown as Record<string, unknown>) })
        if (error) throw error
        const nextPosts = adminPosts.map(p => p.id === post.id ? post : p)
        setAdminPosts(nextPosts)
        saveLocalAdminPosts(nextPosts)
        toast.success('Статтю відновлено')
      } else if (snap.type === 'review_approval' && snap.id !== undefined) {
        const { error } = await setReviewApproved(snap.id as number, snap.approved as boolean)
        if (error) throw error
        setReviews(prev => prev.map(r => r.id === snap.id ? { ...r, approved: snap.approved as boolean } : r))
        toast.success('Статус відгуку відновлено')
      } else {
        toast.error('Відкат для цієї дії недоступний')
        return
      }
      logActivity({ action: 'updated', section: entry.section, target: `[Відкат] ${entry.target}`, details: `Відновлено до стану: ${new Date(entry.timestamp).toLocaleString('uk-UA')}` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Невідома помилка'
      toast.error(`Помилка відкату: ${msg}`)
    } finally {
      setRollingBack(null)
    }
  }

  const handleClearActivityLog = () => {
    setActivityLog([])
    try { window.localStorage.removeItem(ADMIN_ACTIVITY_KEY) } catch {}
    toast.success('Журнал очищено')
  }

  const handleSaveContentBlock = (id: string, newValue: string) => {
    setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, value: newValue } : b))
    setContentDirty(true)
  }

  const handleSaveAllContent = () => {
    try {
      window.localStorage.setItem(ADMIN_CONTENT_KEY, JSON.stringify(contentBlocks))
      setContentDirty(false)
      toast.success('Контент збережено')
      logActivity({ action: 'updated', section: 'content', target: 'Блоки контенту', details: 'Зміни збережено' })
    } catch {
      toast.error('Не вдалося зберегти контент')
    }
  }

  const handleResetContentBlock = (id: string) => {
    const def = defaultContentBlocks.find(b => b.id === id)
    if (!def) return
    setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, value: def.value } : b))
    setContentDirty(true)
  }

  const handleResetAllContent = () => {
    setContentBlocks(defaultContentBlocks.map(block => ({ ...block })))
    setContentDirty(true)
    toast.success('Усі блоки скинуто до стандартних значень')
  }

  const handlePageFieldChange = (page: EditablePageKey, fieldId: string, value: string) => {
    setPageEditorConfig(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        fields: prev[page].fields.map(field => field.id === fieldId ? { ...field, value } : field),
      },
    }))
    setPageEditorDirty(true)
  }

  const handlePageStyleChange = (page: EditablePageKey, key: keyof PageStyleSettings, value: string) => {
    setPageEditorConfig(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        style: {
          ...prev[page].style,
          [key]: value,
        },
      },
    }))
    setPageEditorDirty(true)
  }

  const handleResetPageEditor = (page: EditablePageKey) => {
    const defaults = clonePageEditorDefaults()
    setPageEditorConfig(prev => ({ ...prev, [page]: defaults[page] }))
    setPageEditorDirty(true)
    toast.success(`Сторінку «${defaults[page].title}» скинуто до стандарту`)
  }

  const handleSavePageEditor = () => {
    try {
      window.localStorage.setItem(pageEditorStorageKey, JSON.stringify(pageEditorConfig))
      setPageEditorDirty(false)
      toast.success('Налаштування сторінок збережено')
      logActivity({ action: 'updated', section: 'content', target: 'Редактор сторінок', details: `Оновлено: ${pageEditorConfig[selectedPage].title}` })
    } catch {
      toast.error('Не вдалося зберегти налаштування сторінок')
    }
  }

  const handleExportPageEditor = async (page: EditablePageKey) => {
    const payload = JSON.stringify(pageEditorConfig[page], null, 2)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload)
        toast.success('JSON сторінки скопійовано в буфер')
      } else {
        toast('Буфер обміну недоступний, відкрийте DevTools для копіювання')
        console.log(payload)
      }
    } catch {
      toast.error('Не вдалося скопіювати JSON')
    }
  }

  const pageEditorFilteredFields = useMemo(() => {
    const search = pageEditorSearch.trim().toLowerCase()
    const fields = pageEditorConfig[selectedPage].fields
    if (!search) return fields

    return fields.filter(field => [field.label, field.id, field.description || '', field.value].join(' ').toLowerCase().includes(search))
  }, [pageEditorConfig, selectedPage, pageEditorSearch])

  const filteredContentBlocks = useMemo(() => {
    const search = contentSearch.trim().toLowerCase()
    return contentBlocks.filter(block => {
      const byGroup = contentFilter === 'all' || block.group === contentFilter
      if (!byGroup) return false
      if (!search) return true

      return [block.label, block.id, block.description || '', block.value]
        .join(' ')
        .toLowerCase()
        .includes(search)
    })
  }, [contentBlocks, contentFilter, contentSearch])

  const handleSaveAdminProfile = async () => {
    if (!user) return
    setSettingsSaving(true)

    const payload = {
      full_name: adminProfileForm.full_name.trim(),
      phone: adminProfileForm.phone.trim() || null,
      city: adminProfileForm.city.trim() || null,
      birthday: adminProfileForm.birthday || null,
    }

    const { error } = await updateProfile(user.id, payload)

    if (error) {
      toast.error('Не вдалося оновити профіль', { className: 'hot-toast' })
      setSettingsSaving(false)
      return
    }

    if (profile) {
      setProfile({
        ...profile,
        full_name: payload.full_name,
        phone: payload.phone || undefined,
        city: payload.city || undefined,
        birthday: payload.birthday || undefined,
      })
    }

    toast.success('Профіль адміністратора оновлено', { className: 'hot-toast' })
    setSettingsSaving(false)
  }

  const dashboardMetrics = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered')
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0)
    const openChats = conversations.filter(c => c.status !== 'closed').length
    const lowRatedReviews = reviews.filter(r => r.rating <= 3).length
    const mergedCatalog = (() => {
      const map = new Map<string, Product>()
      for (const baseProduct of products) map.set(baseProduct.slug, baseProduct)
      for (const dbProduct of adminProducts) map.set(dbProduct.slug || String(dbProduct.id), dbProduct)
      return Array.from(map.values())
    })()
    const hiddenProducts = mergedCatalog.filter(p => !p.in_stock).length

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: profilesData.filter(p => p.role !== 'admin').length,
      totalReviews: reviews.length,
      openChats,
      lowRatedReviews,
      hiddenProducts,
      averageOrderValue: deliveredOrders.length ? totalRevenue / deliveredOrders.length : 0,
    }
  }, [adminProducts, conversations, orders, profilesData, reviews])

  const analyticsSummary = useMemo(() => {
    const sources: AnalyticsSource[] = [
      ...reviews
        .filter(r => r.rating <= 3 || analyticsRules.some(rule => rule.keywords.some(keyword => r.text.toLowerCase().includes(keyword))))
        .map(r => ({ source: 'review' as const, text: r.text, meta: `${r.author} · ${r.rating}/5` })),
      ...orders
        .filter(o => o.status === 'cancelled' || Boolean(o.notes))
        .map(o => ({ source: 'order' as const, text: `${o.notes || ''} ${o.delivery_method || ''} ${o.payment_method || ''}`.trim(), meta: `${o.id} · ${o.client}` })),
      ...allChatSignals,
    ].filter(item => item.text.trim())

    const categories = analyticsRules.map(rule => {
      const matched = sources.filter(item =>
        rule.keywords.some(keyword => item.text.toLowerCase().includes(keyword))
      )

      return {
        key: rule.key,
        label: rule.label,
        count: matched.length,
        examples: matched.slice(0, 3),
      }
    }).sort((a, b) => b.count - a.count)

    const uncategorized = sources.filter(item =>
      !analyticsRules.some(rule => rule.keywords.some(keyword => item.text.toLowerCase().includes(keyword)))
    )

    const recommendations = categories
      .filter(category => category.count > 0)
      .slice(0, 3)
      .map(category => {
        if (category.key === 'delivery') return 'Перевірити SLA доставки, повідомлення про терміни та шаблони відправлення.'
        if (category.key === 'quality') return 'Передивитися контроль якості, фото товарів і точність опису матеріалів.'
        if (category.key === 'size') return 'Додати точні заміри, поради по посадці та візуальні підказки по розміру.'
        if (category.key === 'service') return 'Скоротити час відповіді менеджера і підготувати шаблони відповідей на типові питання.'
        if (category.key === 'price') return 'Посилити пояснення цінності товару, матеріалів і ручної роботи.'
        if (category.key === 'payment') return 'Зробити блок оплати зрозумілішим: доступні способи, післяплата, підтвердження.'
        return 'Оновити процес або контент у зоні, де користувачі стикаються з повторюваною проблемою.'
      })

    return {
      totalSignals: sources.length,
      categories,
      uncategorized: uncategorized.slice(0, 5),
      recommendations,
    }
  }, [allChatSignals, orders, reviews])

  const handleApproveReview = async (reviewId: number, approved: boolean) => {
    const { error } = await setReviewApproved(reviewId, approved)
    if (error) {
      toast.error('Не вдалося оновити статус відгуку')
      return
    }
    setReviews(prev => prev.map(r => (r.id === reviewId ? { ...r, approved } : r)))
    toast.success(approved ? 'Відгук схвалено' : 'Відгук відхилено')
    const reviewBefore = reviews.find(r => r.id === reviewId)
    logActivity({ action: approved ? 'approved' : 'rejected', section: 'review', target: `Відгук #${reviewId}`, snapshot: reviewBefore ? { type: 'review_approval', id: reviewId, approved: !approved } : undefined })
  }

  const handleDeleteReview = (review: ReviewRow) => {
    setReviewToDelete(review)
  }

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return
    const { error } = await removeReview(reviewToDelete.id)
    if (error) {
      toast.error('Не вдалося видалити відгук')
      setReviewToDelete(null)
      return
    }
    setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id))
    toast.success('Відгук видалено')
    logActivity({ action: 'deleted', section: 'review', target: `${reviewToDelete.author} · ★${reviewToDelete.rating}`, snapshot: { type: 'review', data: reviewToDelete } })
    setReviewToDelete(null)
  }

  const openCreateProduct = () => {
    setProductForm(makeProductTemplate())
    setProductFormTab('basic')
    setProductImageFile(null)
    setProductFormOpen(true)
  }

  const openEditProduct = (p: Product) => {
    setProductForm({
      id: p.id,
      slug: p.slug,
      name_uk: p.name_uk,
      name: p.name,
      subtitle: p.subtitle || '',
      price: p.price,
      old_price: p.old_price || 0,
      category: p.category,
      subcategory: p.subcategory || '',
      tags: p.tags.join(','),
      description: p.description,
      description_long: p.description_long || '',
      benefits: (p.benefits || []).join('\n'),
      storage: (p.storage || []).join('\n'),
      unit: p.unit || 'кг',
      weight_options: (p.weight_options || []).join(','),
      min_order: p.min_order || '',
      harvest_date: p.harvest_date || '',
      shelf_life: p.shelf_life || '',
      season: (p.season || []).join(','),
      is_seasonal: p.is_seasonal || false,
      is_organic: p.is_organic || false,
      calories: p.calories || '',
      origin: p.origin || '',
      images: p.images.join(','),
      video: p.video || '',
      in_stock: p.in_stock,
      stock_count: p.stock_count || 0,
      is_new: p.is_new || false,
      is_bestseller: p.is_bestseller || false,
      is_limited: p.is_limited || false,
    })
    setProductFormTab('basic')
    setProductImageFile(null)
    setProductFormOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name_uk.trim()) {
      toast.error('Введіть назву товару')
      return
    }
    if (!productForm.slug) {
      toast.error('Введіть slug')
      return
    }

    setProductSaving(true)
    try {
      let imageUrls = productForm.images.split(',').map((i: string) => i.trim()).filter(Boolean)

      // Завантажити файл якщо був вибраний
      if (productImageFile) {
        const uploadedUrl = await uploadProductImage(productImageFile, productForm.slug)
        if (uploadedUrl) {
          imageUrls.unshift(uploadedUrl)
        } else {
          toast.error('Помилка загрузки зображення')
          setProductSaving(false)
          return
        }
      }

      // Якщо поле зображень очищене, зберігаємо це як placeholder (а не повертаємо старі URLs)
      if (imageUrls.length === 0) {
        imageUrls = [noImagePlaceholder]
      }

      // Only include columns that exist in the Supabase products table schema
      const saveData: Record<string, unknown> = {
        slug: productForm.slug,
        name_uk: productForm.name_uk,
        name: productForm.name,
        subtitle: productForm.subtitle || null,
        price: productForm.price,
        old_price: productForm.old_price || null,
        category: productForm.category,
        subcategory: productForm.subcategory || null,
        tags: productForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        description: productForm.description,
        description_long: productForm.description_long || null,
        origin: productForm.origin || null,
        images: imageUrls,
        in_stock: productForm.in_stock,
        stock_count: productForm.stock_count,
        is_new: productForm.is_new,
        is_bestseller: productForm.is_bestseller,
        is_limited: productForm.is_limited,
      }

      const isEdit = Boolean(productForm.id)

      // Use upsert by slug — works for both new and existing products,
      // and also for mock products that are not yet in the DB.
      const { data: savedProduct, error: saveError } = await upsertProduct(saveData)

      if (saveError) {
        toast.error(`Помилка збереження товару: ${saveError.message}`)
        console.error('Upsert error:', saveError)
        return
      }

      if (savedProduct) {
        const saved = savedProduct as Product
        const savedSlug = saved.slug || String(saved.id)
        if (deletedSlugsCache.has(savedSlug)) {
          deletedSlugsCache.delete(savedSlug)
          persistDeletedProductSlugs()
          setLocalDeleteTick(t => t + 1)
        }
        dbProductKeysCache.add(saved.slug || String(saved.id))
        setAdminProducts(prev => {
          const merged = new Map<string, Product>()
          for (const p of prev) merged.set(p.slug || String(p.id), p)
          merged.set(saved.slug || String(saved.id), saved)
          return Array.from(merged.values())
        })
      } else {
        // Reload all products from DB to sync state
        const { data: freshProducts } = await getAllProducts()
        if (freshProducts) {
          const dbItems = freshProducts as Product[]
          dbProductKeysCache.clear()
          dbItems.forEach(item => dbProductKeysCache.add(item.slug || String(item.id)))
          setAdminProducts(dbItems)
        }
      }

      const beforeProduct = adminProducts.find(p => p.slug === productForm.slug || (productForm.id && p.id === productForm.id))
      toast.success(isEdit ? 'Товар оновлено' : 'Товар створено')
      logActivity({
        action: isEdit ? 'updated' : 'created',
        section: 'product',
        target: productForm.name_uk,
        details: `slug: ${productForm.slug}`,
        snapshot: beforeProduct ? { type: 'product', data: beforeProduct } : undefined,
      })

      setProductFormOpen(false)
      setProductImageFile(null)
    } finally {
      setProductSaving(false)
    }
  }

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product)
  }

  const withPreservedMainScroll = (mutate: () => void) => {
    if (typeof window === 'undefined') {
      mutate()
      return
    }
    const mainEl = document.getElementById('admin-main-scroll') as HTMLElement | null
    const prevScrollTop = mainEl?.scrollTop ?? 0
    mutate()
    if (mainEl) {
      requestAnimationFrame(() => {
        mainEl.scrollTop = prevScrollTop
      })
    }
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return
    const slug = productToDelete.slug || String(productToDelete.id)
    const isLocal = !dbProductKeysCache.has(slug)

    if (isLocal) {
      // LOCAL product — not in DB, just hide it from the merged catalog
      deletedSlugsCache.add(slug)
      persistDeletedProductSlugs()
      withPreservedMainScroll(() => {
        setAdminProducts(prev => prev.filter(p => (p.slug || String(p.id)) !== slug))
      })
      setLocalDeleteTick(t => t + 1)
    } else {
      const { error } = await deleteProduct(productToDelete.id)
      if (error) {
        toast.error('Не вдалося видалити товар')
        setProductToDelete(null)
        return
      }
      dbProductKeysCache.delete(slug)
      deletedSlugsCache.add(slug)
      persistDeletedProductSlugs()
      withPreservedMainScroll(() => {
        setAdminProducts(prev => prev.filter(p => p.id !== productToDelete.id))
      })
      setLocalDeleteTick(t => t + 1)
    }

    toast.success('Товар видалено')
    logActivity({ action: 'deleted', section: 'product', target: productToDelete.name_uk, snapshot: { type: 'product', data: productToDelete } })
    setProductToDelete(null)
  }

  const handleToggleProductVisibility = async (product: Product) => {
    const slug = product.slug || String(product.id)
    const isLocal = !dbProductKeysCache.has(slug)
    const nextInStock = !product.in_stock

    if (isLocal) {
      setLocalStockOverrides(prev => ({ ...prev, [slug]: nextInStock }))
      toast.success(nextInStock ? 'Товар показано' : 'Товар приховано')
      logActivity({ action: nextInStock ? 'published' : 'hidden', section: 'product', target: product.name_uk, snapshot: { type: 'product_visibility_local', slug: product.slug, in_stock: product.in_stock } })
      return
    }

    const { error, data } = await updateProduct(product.id, { in_stock: nextInStock })
    if (error) {
      toast.error('Не вдалося змінити видимість товару')
      console.error('Toggle visibility error:', error)
      return
    }

    if (data) {
      setAdminProducts(prev => prev.map(p => (p.id === product.id ? (data as Product) : p)))
    } else {
      setAdminProducts(prev => prev.map(p => (p.id === product.id ? { ...p, in_stock: nextInStock } : p)))
    }

    toast.success(nextInStock ? 'Товар показано' : 'Товар приховано')
    logActivity({ action: nextInStock ? 'published' : 'hidden', section: 'product', target: product.name_uk, snapshot: { type: 'product_visibility', id: product.id, slug: product.slug, in_stock: product.in_stock } })
  }

  const loadConversations = useCallback(async () => {
    const { data, error } = await getAllConversations()
    if (!error && data) {
      setConversations(data)
      // compute chat badge: convs where last message not from admin (unread by admin)
      const unread = data.filter((c: any) => {
        const lastSender = c.last_sender_type || c.last_message_sender || ''
        const hasNew = c.status === 'open' || c.status === 'active' || c.unread_admin
        return lastSender !== 'admin' && (hasNew || c.unread_count > 0)
      })
      setChatBadge(unread.length)
    }
  }, [])

  const selectConversation = async (conversationId: number) => {
    setSelectedConversation(conversationId)
    const { data, error } = await getConversationMessages(conversationId)
    if (!error && data) {
      setConversationMessages(data)
    }
  }

  const sendChatMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return
    setSendingMessage(true)
    try {
      const { error } = await addMessage({
        conversation_id: selectedConversation,
        sender_id: user?.id,
        sender_type: 'admin',
        sender_name: profile?.full_name || 'Адмін',
        content: messageText,
      })
      if (error) {
        toast.error('Помилка при відправці')
        return
      }
      setMessageText('')
      await selectConversation(selectedConversation)
      toast.success('Повідомлення відправлено')
    } finally {
      setSendingMessage(false)
    }
  }

  const updateOrderStatusHandler = async (orderId: string, newStatus: string) => {
    const { error } = await updateOrderStatus(orderId, newStatus)
    if (error) {
      toast.error('Помилка при оновленні')
      return
    }
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)))
    setEditingOrderId(null)
    toast.success('Статус оновлено')
    const oldStatus = orders.find(o => o.id === orderId)?.status || ''
    // Send push notification to customer on status change
    const orderRow = orders.find(o => o.id === orderId)
    if (orderRow?.user_id) {
      try {
        const statusMessages: Record<string, string> = {
          confirmed: 'Ваше замовлення підтверджено! Починаємо збір.',
          processing: 'Ваше замовлення обробляється.',
          shipped: 'Ваше замовлення відправлено та в дорозі!',
          delivered: 'Ваше замовлення доставлено. Смачного! 🌿',
          cancelled: 'Ваше замовлення скасовано. Зв’яжіться з нами для деталей.',
        }
        const msg = statusMessages[newStatus]
        if (msg) {
          await supabase.from('push_notifications').insert([{
            user_id: orderRow.user_id,
            title: 'Оновлення замовлення — Bionerica',
            body: msg,
            url: `/order/${orderId}`,
          }])
        }
      } catch { /* non-critical */ }
    }
    logActivity({ action: 'status_changed', section: 'order', target: `Замовлення ${orderId}`, details: `→ ${statusLabel[newStatus as keyof typeof statusLabel] || newStatus}`, snapshot: { type: 'order_status', orderId, status: oldStatus } })
  }

  const loadPartnerApps = async () => {
    setPartnersLoading(true)
    const { data } = await getAllPartnerApplications()
    if (data) {
      setPartnerApps(data as PartnerApp[])
      const newCount = (data as PartnerApp[]).filter(p => p.status === 'new').length
      setPartnersBadge(newCount)
    }
    setPartnersLoading(false)
  }

  const handlePartnerStatus = async (id: string, status: string) => {
    await updatePartnerApplicationStatus(id, status)
    setPartnerApps(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    const remaining = partnerApps.filter(p => p.id !== id && p.status === 'new').length
    setPartnersBadge(remaining)
    toast.success(status === 'contacted' ? 'Позначено: зв\'язались' : status === 'rejected' ? 'Заявку відхилено' : 'Статус оновлено', { className: 'hot-toast' })
  }

  const saveOrderAdminNote = async () => {
    if (!orderDetailId) return
    setOrderNoteSaving(true)
    const { error } = await addOrderAdminNote(orderDetailId, orderAdminNote)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderDetailId ? { ...o, notes: orderAdminNote } : o))
      toast.success('Нотатку збережено', { className: 'hot-toast' })
    } else {
      toast.error('Помилка збереження')
    }
    setOrderNoteSaving(false)
  }

  const openCreatePost = () => {
    setPostForm(makePostTemplate())
    setPostFormOpen(true)
  }

  const openEditPost = (post: BlogPost) => {
    setPostForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      subtitle: post.subtitle || '',
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      author: post.author,
      read_time: post.read_time,
      published: post.published,
      gallery: Array.isArray(post.gallery) ? post.gallery.join(', ') : '',
    })
    setPostFormOpen(true)
  }

  const handleSavePost = async () => {
    const title = postForm.title.trim()
    const excerpt = postForm.excerpt.trim()
    const content = postForm.content.trim()
    const image = postForm.image.trim()
    if (!title || !excerpt || !content || !image) {
      toast.error('Заповніть обовʼязкові поля: заголовок, вступ, контент, картинка')
      return
    }

    const slugBase = (postForm.slug || title).trim()
    const slug = slugify(slugBase)
    if (!slug) {
      toast.error('Некоректний slug. Використайте латиницю або цифри.')
      return
    }

    const payload = {
      slug,
      title,
      subtitle: postForm.subtitle.trim() || null,
      excerpt,
      content,
      image,
      category: postForm.category.trim() || 'Поради',
      tags: postForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      author: postForm.author.trim() || 'Команда Broiderie',
      read_time: postForm.read_time.trim() || '5 хв',
      published: postForm.published,
      gallery: postForm.gallery.split(',').map(g => g.trim()).filter(Boolean),
    }

    setPostSaving(true)
    if (postForm.id) {
      const { data, error } = await updatePost(postForm.id, payload)
      setPostSaving(false)
      const fallbackPost = {
        ...(adminPosts.find(p => p.id === postForm.id) || {}),
        ...payload,
        id: postForm.id,
        created_at: adminPosts.find(p => p.id === postForm.id)?.created_at || new Date().toISOString(),
      } as BlogPost
      const nextPost = (data as BlogPost | null) || fallbackPost
      const nextPosts = adminPosts.map(p => (p.id === postForm.id ? nextPost : p))
      setAdminPosts(nextPosts)
      saveLocalAdminPosts(nextPosts)

      if (error || !data) {
        toast.success('Статтю оновлено локально')
      } else {
        toast.success('Статтю оновлено')
      }
      const beforePost = adminPosts.find(p => p.id === postForm.id)
      logActivity({ action: 'updated', section: 'post', target: title, details: `slug: ${slug}`, snapshot: beforePost ? { type: 'post', data: beforePost } : undefined })
    } else {
      const { data, error } = await createPost(payload)
      setPostSaving(false)
      const nextPost = (data as BlogPost | null) || ({
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString(),
      } as BlogPost)
      const nextPosts = [nextPost, ...adminPosts]
      setAdminPosts(nextPosts)
      saveLocalAdminPosts(nextPosts)

      if (error || !data) {
        toast.success('Статтю створено локально')
      } else {
        toast.success('Статтю створено')
      }
      logActivity({ action: 'created', section: 'post', target: title, details: `slug: ${slug}` })
    }

    setPostFormOpen(false)
  }

  const handleDeletePost = (post: BlogPost) => {
    setPostToDelete(post)
  }

  const confirmDeletePost = async () => {
    if (!postToDelete) return

    const { error } = await deletePost(postToDelete.id)
    const nextPosts = adminPosts.filter(p => p.id !== postToDelete.id)
    setAdminPosts(nextPosts)
    saveLocalAdminPosts(nextPosts)

    if (error) {
      toast.success('Статтю видалено локально')
    } else {
      toast.success('Статтю видалено')
    }

    setPostToDelete(null)
  }

  useEffect(() => {
    if (!user || !hasAdminAccess) return
    let cancelled = false

    const loadAdminData = async () => {
      setLoadingData(true)
      const [ordersRes, reviewsRes, productsRes, postsRes, convsRes, profilesRes] = await Promise.all([
        getAllOrders(), 
        getAllReviews(), 
        getAllProducts(), 
        getAllPosts(),
        getAllConversations(),
        getAllProfiles(),
      ])
      if (cancelled) return

      const profilesMap = new Map(
        ((profilesRes.data as UserProfile[] | null) || []).map(profileItem => [profileItem.id, profileItem])
      )

      if (!profilesRes.error && profilesRes.data) {
        setProfilesData(profilesRes.data as UserProfile[])
      }

      if (!ordersRes.error && ordersRes.data) {
        const mapped = ordersRes.data.map(o => ({
          id: o.id,
          user_id: (o.user_id as string | undefined) || null,
          client:
            profilesMap.get((o.user_id as string) || '')?.full_name ||
            (o.email as string) ||
            'Клієнт',
          email:
            profilesMap.get((o.user_id as string) || '')?.email ||
            (o.email as string) ||
            '-',
          date: new Date(o.created_at).toLocaleDateString('uk-UA'),
          total: Number(o.total) || 0,
          status: (o.status as string) || 'pending',
          items: Array.isArray(o.items) ? o.items.length : 0,
          delivery_method: (o.delivery_method as string) || '',
          notes: (o.notes as string) || '',
          payment_method: (o.payment_method as string) || '',
        }))
        setOrders(mapped.length ? mapped : mockOrders)
      }

      if (!reviewsRes.error && reviewsRes.data) {
        setReviews(reviewsRes.data.map(r => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          text: r.text,
          created_at: r.created_at,
          approved: r.approved,
        })))
      }

      if (!productsRes.error && productsRes.data && productsRes.data.length > 0) {
        const dbItems = productsRes.data as Product[]
        dbProductKeysCache.clear()
        dbItems.forEach(item => dbProductKeysCache.add(item.slug || String(item.id)))
        setAdminProducts(dbItems)
      } else if (!productsRes.error) {
        // Supabase returned empty — keep DB list empty.
        // Mock products are already displayed by `catalogProducts` base layer.
        dbProductKeysCache.clear()
        setAdminProducts([])
      }

      if (!postsRes.error && postsRes.data) {
        const remotePosts = postsRes.data as BlogPost[]
        if (remotePosts.length > 0) {
          setAdminPosts(remotePosts)
          saveLocalAdminPosts(remotePosts)
        } else {
          const localPosts = loadLocalAdminPosts()
          setAdminPosts(localPosts.length > 0 ? localPosts : blogPosts)
        }
      } else {
        const localPosts = loadLocalAdminPosts()
        if (localPosts.length > 0) {
          setAdminPosts(localPosts)
        }
      }

      if (!convsRes.error && convsRes.data) {
        setConversations(convsRes.data)
          // Badge: count convs with unread messages
          const unread = convsRes.data.filter((c: any) => {
            const lastSender = c.last_sender_type || c.last_message_sender || ''
            return lastSender !== 'admin' && (c.status === 'open' || c.status === 'active' || c.unread_count > 0)
          })
          setChatBadge(unread.length)

        const allMessages = await Promise.all(
          convsRes.data.map(async (conversation) => {
            const { data } = await getConversationMessages(conversation.id)
            return ((data as Array<Record<string, unknown>> | null) || [])
              .filter(message => message.sender_type !== 'admin')
              .map(message => ({
                source: 'chat' as const,
                text: `${conversation.subject || ''} ${String(message.content || '')}`.trim(),
                meta: `${conversation.guest_email || 'Користувач'} · чат #${conversation.id}`,
              }))
          })
        )

        if (!cancelled) {
          setAllChatSignals(allMessages.flat())
        }
      }
      setLoadingData(false)
    }

    void loadAdminData()

      // Poll conversations every 20s for badge updates
      pollingRef.current = setInterval(() => void loadConversations(), 20_000)
      return () => {
        cancelled = true
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    }, [hasAdminAccess, loadConversations, user])
  useEffect(() => {
    if (!selectedConversation) {
      if (msgPollingRef.current) clearInterval(msgPollingRef.current)
      return
    }
    msgPollingRef.current = setInterval(async () => {
      const { data, error } = await getConversationMessages(selectedConversation)
      if (!error && data) setConversationMessages(data)
    }, 8_000)
    return () => { if (msgPollingRef.current) clearInterval(msgPollingRef.current) }
  }, [selectedConversation])
  useEffect(() => {
    if (tab === 'chats') setChatBadge(0)
    if (tab === 'orders') setOrdersBadge(0)
    if (tab === 'reviews') setReviewsBadge(0)
    if (tab === 'partners') { setPartnersBadge(0); void loadPartnerApps() }
  }, [tab])
  useEffect(() => {
    setOrdersBadge(orders.filter(o => o.status === 'pending').length)
  }, [orders])

  useEffect(() => {
    setReviewsBadge(reviews.filter(r => !r.approved).length)
  }, [reviews])
  useEffect(() => {
    setAdminProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      birthday: profile?.birthday || '',
    })
  }, [profile?.birthday, profile?.city, profile?.full_name, profile?.phone])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify(adminPreferences))
  }, [adminPreferences])

  useEffect(() => {
    const savedDeletedSlugs = loadDeletedProductSlugs()
    deletedSlugsCache.clear()
    savedDeletedSlugs.forEach(slug => deletedSlugsCache.add(slug))
    setLocalDeleteTick(t => t + 1)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasDeleteModalOpen = Boolean(productToDelete || reviewToDelete || postToDelete)
    if (!hasDeleteModalOpen) return

    const mainEl = document.getElementById('admin-main-scroll') as HTMLElement | null
    if (!mainEl) return

    const prevOverflow = mainEl.style.overflow
    const prevScrollTop = mainEl.scrollTop

    // Lock only the admin scroll container and keep its current position.
    mainEl.style.overflow = 'hidden'

    return () => {
      mainEl.style.overflow = prevOverflow
      requestAnimationFrame(() => {
        mainEl.scrollTop = prevScrollTop
      })
    }
  }, [postToDelete, productToDelete, reviewToDelete])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}>Завантаження...</div>
  if (!user) return <Navigate to="/auth" />
  if (!hasAdminAccess) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}>
        Немає доступу до адмін-панелі.
      </div>
    )
  }

  const sidebarRef = useRef<HTMLElement>(null)
  const { scrollYProgress: sidebarScroll } = useScroll({ target: sidebarRef, offset: ['start start', 'end end'] })
  const sidebarBgY = useTransform(sidebarScroll, [0, 1], ['0%', '20%'])

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '100vh', background: 'var(--b0)' }}>
      {/* Sidebar */}
      <aside ref={sidebarRef} style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', alignSelf: 'stretch', minHeight: '100%', background: 'rgba(255,255,255,0.97)', borderRight: '1px solid var(--bd)' }}>
        <div style={{ padding: '26px 24px 18px', borderBottom: '1px solid var(--bd)', marginBottom: 12 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
            <div style={{ flexShrink: 0, transform: 'translateY(-1px)' }}>
              <img src="/logo.png" alt="Bionerica logo" width={38} height={38} style={{ display: 'block', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--t0)' }}>
                Bio<span style={{ color: 'var(--gold)' }}>nerica</span>
              </div>
              <div style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--t2)', marginTop: 2 }}>
                ФЕРМА · ОРГАНІКА · UA
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--t2)', display: 'block' }}>Панель керування каталогом, замовленнями та клієнтськими зверненнями.</span>
        </div>
        <nav style={{ flex: 1, padding: '10px 14px 14px' }}>
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', width: '100%', background: tab === item.id ? 'var(--b1)' : 'transparent', border: '1px solid transparent', borderLeft: tab === item.id ? '2px solid var(--gold)' : '2px solid transparent', borderRadius: 10, color: tab === item.id ? 'var(--t0)' : 'var(--t1)', fontSize: 14, fontWeight: tab === item.id ? 600 : 400, textAlign: 'left', marginBottom: 4, transition: 'all 0.18s' }}
                onMouseEnter={e => {
                  if (tab !== item.id) {
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--b1)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--t0)'
                  }
                }}
                onMouseLeave={e => {
                  if (tab !== item.id) {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--t1)'
                  }
                }}>
                <Icon size={16} style={{ color: tab === item.id ? 'var(--gold)' : 'var(--t2)', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && tab !== item.id && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 999, background: 'var(--berry)',
                    color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', padding: '0 5px', letterSpacing: 0, flexShrink: 0,
                  }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            )
          })}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px 0',
              width: '100%',
              borderTop: '1px solid var(--bd)',
              marginTop: 10,
              color: 'var(--t2)',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <ArrowLeft size={15} style={{ color: 'var(--t2)', flexShrink: 0 }} />
            До сайту
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px 0',
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'rgba(220,100,90,0.75)',
              fontSize: 13,
              fontWeight: 500,
              textAlign: 'left',
            }}
          >
            <LogOut size={15} style={{ color: 'rgba(220,100,90,0.75)', flexShrink: 0 }} />
            Вийти
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main id="admin-main-scroll" style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--b0)' }}>
        <div style={{ position: 'relative', padding: '24px clamp(14px, 2.4vw, 24px)', maxWidth: 1180, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: TrendingUp, label: 'Дохід', value: `₴ ${dashboardMetrics.totalRevenue.toLocaleString('uk-UA')}`, chg: `${dashboardMetrics.averageOrderValue.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`, col: 'var(--t2)' },
            { icon: ShoppingBag, label: 'Замовлення', value: String(dashboardMetrics.totalOrders), chg: `${dashboardMetrics.openChats} чатів`, col: 'var(--gold)' },
            { icon: Users, label: 'Клієнти', value: dashboardMetrics.totalCustomers.toLocaleString('uk-UA'), chg: `${profilesData.filter(p => p.total_orders > 0).length} активних`, col: 'var(--t2)' },
            { icon: Star, label: 'Відгуки', value: String(dashboardMetrics.totalReviews), chg: `${dashboardMetrics.lowRatedReviews} проблемних`, col: 'var(--gold)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 20, position: 'relative' }}>
              <div style={{ width: 38, height: 38, background: 'var(--b0)', border: '1px solid var(--bd)', color: 'var(--t1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <s.icon size={16} strokeWidth={1.8} />
              </div>
              <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t2)', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)', lineHeight: 1 }}>{s.value}</p>
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, color: s.col, fontWeight: 500 }}>{s.chg}</span>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 28, overflowX: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === item.id ? 'var(--gold)' : 'transparent'}`, padding: '10px 18px', marginBottom: -1, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: tab === item.id ? 'var(--t0)' : 'var(--t2)', cursor: 'none', whiteSpace: 'nowrap', transition: 'color 0.18s' }}>
              {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* PRODUCTS */}
            {tab === 'products' && (
              <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--bd)', padding: '9px 14px', flex: 1, maxWidth: 360 }}>
                    <Search size={14} style={{ color: 'var(--t2)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t0)', fontFamily: 'Jost, sans-serif', flex: 1 }} />
                  </div>
                  <button onClick={openCreateProduct} className="btn-dark btn-sm flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={14} /> Додати товар
                  </button>
                </div>

                {productFormOpen && (
                  <div style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: 24, marginBottom: 24 }}>
                    {/* Form header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', margin: 0 }}>
                        {productForm.id ? `Редагування: ${productForm.name_uk || '—'}` : 'Новий товар'}
                      </p>
                      <button onClick={() => setProductFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
                    </div>

                    {/* Form tabs */}
                    <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--bd)', paddingBottom: 0 }}>
                      {([
                        { id: 'basic', label: 'Основне' },
                        { id: 'attrs', label: 'Характеристики' },
                        { id: 'media', label: 'Медіа' },
                        { id: 'seo', label: 'SEO / Теги' },
                        { id: 'status', label: 'Статус' },
                      ] as { id: ProductFormTab; label: string }[]).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setProductFormTab(t.id)}
                          style={{
                            padding: '7px 16px',
                            fontSize: 11,
                            letterSpacing: 1.5,
                            textTransform: 'uppercase',
                            background: 'none',
                            border: 'none',
                            borderBottom: productFormTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                            color: productFormTab === t.id ? 'var(--gold)' : 'var(--t2)',
                            cursor: 'pointer',
                            fontFamily: 'Jost, sans-serif',
                            marginBottom: -1,
                            transition: 'color .15s',
                          }}
                        >{t.label}</button>
                      ))}
                    </div>

                    {/* TAB: Основне */}
                    {productFormTab === 'basic' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Назва (укр) *</label>
                          <input value={productForm.name_uk} onChange={e => setProductForm(prev => ({ ...prev, name_uk: e.target.value, slug: prev.id ? prev.slug : slugify(e.target.value) }))} placeholder="напр. Полуниця Клері" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Назва товару українською — відображається на сайті</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Slug (URL) *</label>
                          <input value={productForm.slug} onChange={e => setProductForm(prev => ({ ...prev, slug: slugify(e.target.value) }))} placeholder="полуниця-клері" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Унікальний URL-ідентифікатор. Генерується автоматично. Лише a-z, 0-9, дефіс</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Назва (eng)</label>
                          <input value={productForm.name} onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Strawberry Clery" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Назва англійською — для SEO та міжнародних ринків</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Підзаголовок</label>
                          <input value={productForm.subtitle} onChange={e => setProductForm(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="напр. Свіжі ягоди з теплиці" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Рядок під назвою на картці товару. До 60 символів</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Ціна (₴) *</label>
                          <input type="number" min={0} value={productForm.price} onChange={e => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))} placeholder="150" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Поточна ціна продажу в гривнях</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Стара ціна (₴)</label>
                          <input type="number" min={0} value={productForm.old_price || ''} onChange={e => setProductForm(prev => ({ ...prev, old_price: e.target.value ? Number(e.target.value) : 0 }))} placeholder="200" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Якщо є — показується закресленою і розраховується % знижки</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Категорія *</label>
                          <input value={productForm.category} onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))} placeholder="напр. Ягоди" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Основна категорія: Ягоди, Зелень, Овочі, Мікрозелень, Фрукти…</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Підкатегорія</label>
                          <input value={productForm.subcategory} onChange={e => setProductForm(prev => ({ ...prev, subcategory: e.target.value }))} placeholder="напр. Полуниця" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Уточнення всередині категорії для фільтрів каталогу</p>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Короткий опис *</label>
                          <textarea value={productForm.description} onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))} placeholder="2–3 речення про товар. Відображається на картці та на сторінці товару" rows={2} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>До 200 символів. Виводиться під назвою на сторінці товару</p>
                        </div>
                      </div>
                    )}

                    {/* TAB: Характеристики */}
                    {productFormTab === 'attrs' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Одиниця виміру</label>
                          <input value={productForm.unit} onChange={e => setProductForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="кг" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Одиниця продажу: кг, г, шт, пучок, ящик, л</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Варіанти ваги/об'єму</label>
                          <input value={productForm.weight_options} onChange={e => setProductForm(prev => ({ ...prev, weight_options: e.target.value }))} placeholder="0.5 кг,1 кг,2 кг,5 кг" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Через кому: 0.5 кг, 1 кг, 3 кг, 5 кг — стануть кнопками вибору</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Мінімальне замовлення</label>
                          <input value={productForm.min_order} onChange={e => setProductForm(prev => ({ ...prev, min_order: e.target.value }))} placeholder="0.5 кг" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Найменша можлива одиниця замовлення. Приклад: 0.5 кг, 1 пучок</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Калорійність</label>
                          <input value={productForm.calories} onChange={e => setProductForm(prev => ({ ...prev, calories: e.target.value }))} placeholder="52 ккал / 100г" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Енергетична цінність на 100г або на 1 шт. Приклад: 52 ккал / 100г</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Дата збору</label>
                          <input value={productForm.harvest_date} onChange={e => setProductForm(prev => ({ ...prev, harvest_date: e.target.value }))} placeholder="25 квітня 2026" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Дата або опис: «щодня», «05.05.2026», «після замовлення»</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Термін зберігання</label>
                          <input value={productForm.shelf_life} onChange={e => setProductForm(prev => ({ ...prev, shelf_life: e.target.value }))} placeholder="5–7 днів при +2°C" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Скільки зберігається і за якої температури. Показується у вкладці «Зберігання»</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Походження</label>
                          <input value={productForm.origin} onChange={e => setProductForm(prev => ({ ...prev, origin: e.target.value }))} placeholder="Теплиці Bionerica, Київщина" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Регіон або назва ферми. Приклад: Київщина, ферма «Зелений луг»</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Сезони</label>
                          <input value={productForm.season} onChange={e => setProductForm(prev => ({ ...prev, season: e.target.value }))} placeholder="квітень,травень,червень" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Місяці доступності через кому. Використовується для сезонного фільтру</p>
                        </div>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: '12px 0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={productForm.is_seasonal} onChange={e => setProductForm(prev => ({ ...prev, is_seasonal: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                            Сезонний товар
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={productForm.is_organic} onChange={e => setProductForm(prev => ({ ...prev, is_organic: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                            Органічний / Eco
                          </label>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Корисні властивості</label>
                          <textarea value={productForm.benefits} onChange={e => setProductForm(prev => ({ ...prev, benefits: e.target.value }))} placeholder={"Багатий на вітамін C\nАнтиоксидантна дія\nПідтримує імунітет"} rows={4} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Кожна корисна властивість — з нового рядка. Виводяться як список з іконками ✓</p>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Умови зберігання</label>
                          <textarea value={productForm.storage} onChange={e => setProductForm(prev => ({ ...prev, storage: e.target.value }))} placeholder={"Зберігати при температурі +2°C..+4°C\nНе заморожувати\nВживати протягом 5–7 днів"} rows={3} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Кожна інструкція — з нового рядка. Виводяться у вкладці «Зберігання» на сторінці товару</p>
                        </div>
                      </div>
                    )}

                    {/* TAB: Медіа */}
                    {productFormTab === 'media' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>URL зображень</label>
                          <textarea value={productForm.images} onChange={e => setProductForm(prev => ({ ...prev, images: e.target.value }))} placeholder="https://cdn.../img1.jpg,https://cdn.../img2.jpg" rows={3} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 13, fontFamily: 'Jost,sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>URL зображень через кому. <strong>Перше фото</strong> — головне на картці товару. Рекомендований розмір: 800×800px, формат WebP</p>
                        </div>
                        {/* Image preview */}
                        {productForm.images && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {productForm.images.split(',').map((url, i) => url.trim()).filter(Boolean).map((url, i) => {
                              const imageUrls = productForm.images.split(',').map((u: string) => u.trim()).filter(Boolean)
                              const canDelete = imageUrls.length > 1
                              return (
                                <div key={i} style={{ position: 'relative' }}>
                                  <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--bd)' }} loading="lazy" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }} />
                                  {i === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--gold)', color: '#fff', fontSize: 9, textAlign: 'center', letterSpacing: 1 }}>ГОЛОВНЕ</span>}
                                  {canDelete && (
                                    <button
                                      onClick={() => {
                                        const newImages = imageUrls.filter((_, idx) => idx !== i).join(',')
                                        setProductForm(prev => ({ ...prev, images: newImages }))
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -8,
                                        width: 24,
                                        height: 24,
                                        background: '#d32f2f',
                                        border: 'none',
                                        borderRadius: '50%',
                                        color: '#fff',
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: 1,
                                        padding: 0,
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#f57c00'; e.currentTarget.style.transform = 'scale(1.15)' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = '#d32f2f'; e.currentTarget.style.transform = 'scale(1)' }}
                                      title="Видалити фото"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Або завантажити файл</label>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--bd)', background: 'var(--b0)', padding: '10px 12px' }}>
                            <label htmlFor="product-image-upload" style={{ minWidth: 130, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bd)', color: 'var(--t0)', fontSize: 13, background: 'var(--b1)', cursor: 'pointer' }}>
                              Вибрати файл
                            </label>
                            <input id="product-image-upload" type="file" accept="image/*" onChange={e => setProductImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                            <span style={{ color: productImageFile ? 'var(--gold)' : 'var(--t2)', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {productImageFile ? `✓ ${productImageFile.name}` : 'Файл не вибрано'}
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Файл завантажиться у Supabase Storage і буде доданий на початок списку зображень</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Відео (URL)</label>
                          <input value={productForm.video} onChange={e => setProductForm(prev => ({ ...prev, video: e.target.value }))} placeholder="https://youtube.com/watch?v=... або https://vimeo.com/..." style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>YouTube або Vimeo посилання. Відображається у медіа-галереї товару</p>
                        </div>
                      </div>
                    )}

                    {/* TAB: SEO / Теги */}
                    {productFormTab === 'seo' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Теги</label>
                          <input value={productForm.tags} onChange={e => setProductForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="полуниця,ягоди,свіже,теплиця,органік" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Теги через кому. Впливають на пошук і фільтри каталогу. Без пробілів навколо коми</p>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Розширений опис</label>
                          <textarea value={productForm.description_long} onChange={e => setProductForm(prev => ({ ...prev, description_long: e.target.value }))} placeholder="Детальна інформація про товар: сорт, умови вирощування, смакові якості, рекомендації щодо вживання..." rows={6} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Розгорнутий текст для вкладки «Опис» на сторінці товару. Підтримує параграфи (Enter)</p>
                        </div>
                      </div>
                    )}

                    {/* TAB: Статус */}
                    {productFormTab === 'status' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Кількість в наявності</label>
                          <input type="number" min={0} value={productForm.stock_count} onChange={e => setProductForm(prev => ({ ...prev, stock_count: Number(e.target.value) }))} placeholder="10" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '9px 12px', color: 'var(--t0)', fontSize: 14, fontFamily: 'Jost,sans-serif', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>Залишок на складі. При 0 — автоматично виводиться «Немає в наявності»</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t0)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={productForm.in_stock} onChange={e => setProductForm(prev => ({ ...prev, in_stock: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                            <div>
                              <div style={{ fontWeight: 500 }}>В наявності</div>
                              <div style={{ fontSize: 11, color: 'var(--t2)' }}>Товар відображається і доступний для замовлення</div>
                            </div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t0)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={productForm.is_new} onChange={e => setProductForm(prev => ({ ...prev, is_new: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                            <div>
                              <div style={{ fontWeight: 500 }}>Новинка</div>
                              <div style={{ fontSize: 11, color: 'var(--t2)' }}>Бейдж «NEW» на картці товару у каталозі</div>
                            </div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t0)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={productForm.is_bestseller} onChange={e => setProductForm(prev => ({ ...prev, is_bestseller: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                            <div>
                              <div style={{ fontWeight: 500 }}>Бестселер</div>
                              <div style={{ fontSize: 11, color: 'var(--t2)' }}>Бейдж «ХІТ» і пріоритет у видачі каталогу</div>
                            </div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t0)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={productForm.is_limited} onChange={e => setProductForm(prev => ({ ...prev, is_limited: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                            <div>
                              <div style={{ fontWeight: 500 }}>Обмежена кількість</div>
                              <div style={{ fontSize: 11, color: 'var(--t2)' }}>Бейдж «LIMITED» — підсилює відчуття дефіциту</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Form actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bd)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={() => void handleSaveProduct()} disabled={productSaving} className="btn-dark btn-sm" style={{ minWidth: 120 }}>
                        {productSaving ? 'Збереження...' : (productForm.id ? 'Оновити товар' : 'Створити товар')}
                      </button>
                      <button onClick={() => setProductFormOpen(false)} className="btn-outline btn-sm">Скасувати</button>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        {(['basic','attrs','media','seo','status'] as ProductFormTab[]).map((t, i, arr) => (
                          <button key={t} onClick={() => setProductFormTab(t)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', background: productFormTab === t ? 'var(--gold)' : 'var(--bd)', cursor: 'pointer', padding: 0 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Фото', 'Назва', 'Категорія', 'Ціна', 'Статус', 'Рейтинг', 'Дії'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--t2)', borderBottom: '1px solid var(--bd)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                            <img src={p.images?.[0] || noImagePlaceholder} alt="" style={{ width: 44, height: 58, objectFit: 'cover' }} loading="lazy" />
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                            <p style={{ fontSize: 14, color: 'var(--t0)', marginBottom: 2 }}>{p.name_uk}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0 }}>{p.category}</p>
                              <span
                                style={{
                                  border: `1px solid ${dbProductKeysCache.has(p.slug || String(p.id)) ? 'rgba(74,140,63,0.35)' : 'rgba(201,169,110,0.35)'}`,
                                  background: dbProductKeysCache.has(p.slug || String(p.id)) ? 'rgba(74,140,63,0.08)' : 'rgba(201,169,110,0.08)',
                                  color: dbProductKeysCache.has(p.slug || String(p.id)) ? 'var(--sage)' : 'var(--gold-d)',
                                  padding: '2px 7px',
                                  fontSize: 9,
                                  letterSpacing: 1.2,
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                }}
                              >
                                {dbProductKeysCache.has(p.slug || String(p.id)) ? 'DB' : 'Local'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                            <span style={{ border: '1px solid var(--bd)', padding: '3px 10px', fontSize: 11, letterSpacing: 1, color: 'var(--t2)' }}>{p.category}</span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)', fontSize: 14, color: 'var(--t0)' }}>{p.price.toLocaleString()} ₴</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                            <span className={`badge ${p.in_stock ? 'badge-status-ok' : 'badge-status-err'}`}>{p.in_stock ? 'В наявності' : 'Немає'}</span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)', color: 'var(--gold)', fontSize: 13 }}>★ {p.rating}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" onClick={() => openEditProduct(p)} style={{ width: 32, height: 32, border: '1px solid var(--bd)', background: 'none', color: 'var(--t0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={13} /></button>
                              <button
                                type="button"
                                onClick={() => void handleToggleProductVisibility(p)}
                                title={p.in_stock ? 'Сховати товар' : 'Показати товар'}
                                style={{ width: 32, height: 32, border: '1px solid var(--bd)', background: 'none', color: p.in_stock ? 'var(--t0)' : 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {p.in_stock ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                title="Видалити товар"
                                style={{ width: 32, height: 32, border: '1px solid rgba(192,57,43,0.35)', background: 'rgba(192,57,43,0.08)', color: 'var(--berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transition: 'all .18s ease' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--berry)'; (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--berry)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--berry)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,57,43,0.35)' }}
                              ><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {tab === 'orders' && (() => {
              const filteredOrders = orders
                .filter(o => orderFilter === 'all' || o.status === orderFilter)
                .filter(o => !orderSearch || o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.client.toLowerCase().includes(orderSearch.toLowerCase()))
              const detailOrder = orderDetailId ? orders.find(o => o.id === orderDetailId) : null
              const customerHistory = detailOrder?.user_id ? orders.filter(o => o.user_id === detailOrder.user_id) : []

              return (
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)' }}>Замовлення</h3>
                    <input
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      placeholder="Пошук за ID або клієнтом..."
                      style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: '8px 14px', color: 'var(--t0)', fontSize: 13, minWidth: 220 }}
                    />
                  </div>

                  {/* Status filter pills */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setOrderFilter(f)}
                        style={{
                          padding: '5px 14px', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
                          border: '1px solid var(--bd)', cursor: 'pointer',
                          background: orderFilter === f ? 'var(--gold)' : 'var(--b1)',
                          color: orderFilter === f ? '#1a1008' : 'var(--t2)',
                          fontWeight: orderFilter === f ? 600 : 400,
                        }}
                      >
                        {f === 'all' ? 'Всі' : statusLabel[f as keyof typeof statusLabel]}
                      </button>
                    ))}
                  </div>

                  {loadingData && <p style={{ color: 'var(--t2)', fontSize: 12, marginBottom: 12 }}>Оновлюємо дані...</p>}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>
                        {['ID', 'Клієнт', 'Дата', 'Сума', 'Товарів', 'Статус', 'Дії'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--t2)', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {filteredOrders.map(o => (
                          <tr key={o.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)', fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: 'var(--t0)', whiteSpace: 'nowrap' }}>{o.id.slice(0, 8)}…</td>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                              <p style={{ fontSize: 13, color: 'var(--t0)' }}>{o.client}</p>
                              <p style={{ fontSize: 11, color: 'var(--t2)' }}>{o.email}</p>
                            </td>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)', fontSize: 13, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{o.date}</td>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)', fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--t0)', whiteSpace: 'nowrap' }}>{o.total.toLocaleString()} ₴</td>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)', fontSize: 13, color: 'var(--t2)', textAlign: 'center' }}>{o.items}</td>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                              {editingOrderId === o.id ? (
                                <select
                                  value={o.status}
                                  onChange={e => void updateOrderStatusHandler(o.id, e.target.value)}
                                  style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '4px 8px', color: 'var(--t0)', fontSize: 12 }}
                                >
                                  <option value="pending">Очікується</option>
                                  <option value="confirmed">Підтверджено</option>
                                  <option value="processing">Обробляється</option>
                                  <option value="shipped">В дорозі</option>
                                  <option value="delivered">Доставлено</option>
                                  <option value="cancelled">Скасовано</option>
                                </select>
                              ) : (
                                <span className={`badge ${statusBadge[o.status as keyof typeof statusBadge]}`}>{statusLabel[o.status as keyof typeof statusLabel]}</span>
                              )}
                            </td>
                            <td style={{ padding: '14px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  title="Деталі замовлення"
                                  onClick={() => { setOrderDetailId(o.id); setOrderAdminNote(o.notes || '') }}
                                  style={{ width: 32, height: 32, border: '1px solid var(--bd)', background: 'none', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                ><Eye size={13} /></button>
                                <button
                                  title="Змінити статус"
                                  onClick={() => setEditingOrderId(editingOrderId === o.id ? null : o.id)}
                                  style={{ width: 32, height: 32, border: '1px solid var(--bd)', background: 'none', color: 'var(--t0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                ><Edit size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--t2)', fontSize: 13 }}>Замовлень не знайдено</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Order detail side panel */}
                  {detailOrder && (
                    <>
                      <div
                        onClick={() => setOrderDetailId(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
                      />
                      <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440,
                        background: 'var(--b0)', borderLeft: '1px solid var(--bd)', zIndex: 201,
                        overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)' }}>Деталі замовлення</h4>
                          <button onClick={() => setOrderDetailId(null)} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gap: 10 }}>
                          {[
                            ['ID', detailOrder.id],
                            ['Клієнт', detailOrder.client],
                            ['Email', detailOrder.email],
                            ['Дата', detailOrder.date],
                            ['Сума', `${detailOrder.total.toLocaleString()} ₴`],
                            ['Товарів', String(detailOrder.items)],
                            ['Доставка', detailOrder.delivery_method || '—'],
                            ['Оплата', detailOrder.payment_method || '—'],
                            ['Статус', statusLabel[detailOrder.status as keyof typeof statusLabel] || detailOrder.status],
                          ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                              <span style={{ color: 'var(--t2)', minWidth: 80, flexShrink: 0 }}>{label}</span>
                              <span style={{ color: 'var(--t0)', wordBreak: 'break-all' }}>{val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Customer history */}
                        {detailOrder.user_id && customerHistory.length > 1 && (
                          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
                            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Історія клієнта ({customerHistory.length} замовл.)</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {customerHistory.map(ch => (
                                <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t2)' }}>
                                  <span>{ch.date}</span>
                                  <span>{ch.total.toLocaleString()} ₴</span>
                                  <span className={`badge ${statusBadge[ch.status as keyof typeof statusBadge]}`} style={{ fontSize: 10 }}>{statusLabel[ch.status as keyof typeof statusLabel]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin note */}
                        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
                          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Нотатка адміна</p>
                          <textarea
                            value={orderAdminNote}
                            onChange={e => setOrderAdminNote(e.target.value)}
                            rows={4}
                            placeholder="Внутрішня нотатка (не видно клієнту)..."
                            style={{ width: '100%', background: 'var(--b1)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', fontSize: 13, resize: 'vertical', marginBottom: 10 }}
                          />
                          <button
                            onClick={() => void saveOrderAdminNote()}
                            disabled={orderNoteSaving}
                            className="btn-dark btn-sm"
                          >
                            {orderNoteSaving ? 'Збереження...' : 'Зберегти нотатку'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* REVIEWS */}
            {tab === 'reviews' && (
              <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)', marginBottom: 24 }}>Модерація відгуків</h3>
                {loadingData && <p style={{ color: 'var(--t2)', fontSize: 12, marginBottom: 12 }}>Оновлюємо дані...</p>}
                <div style={{ display: 'grid', gap: 12 }}>
                  {reviews.map((r) => (
                    <div key={r.id} style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <p style={{ fontSize: 13, color: 'var(--t0)' }}>
                          {r.author} · ★ {r.rating}
                        </p>
                        <span className={`badge ${r.approved ? 'badge-status-ok' : 'badge-status-warn'}`}>{r.approved ? 'Схвалено' : 'На модерації'}</span>
                      </div>
                      <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{r.text}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn-dark btn-sm" onClick={() => void handleApproveReview(r.id, true)}>Схвалити</button>
                        <button className="btn-outline btn-sm" onClick={() => void handleApproveReview(r.id, false)}>Відхилити</button>
                        <button className="btn-outline btn-sm" style={{ color: 'var(--rose)', borderColor: 'rgba(217,108,108,.35)' }} onClick={() => handleDeleteReview(r)}>Видалити</button>
                      </div>
                    </div>
                  ))}
                  {!loadingData && reviews.length === 0 && (
                    <p style={{ color: 'var(--t2)', fontSize: 13 }}>Відгуків поки немає.</p>
                  )}
                </div>
              </div>
            )}

            {/* BLOG */}
            {tab === 'blog' && (
              <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)' }}>Публікації</h3>
                  <button onClick={openCreatePost} className="btn-dark btn-sm flex items-center gap-2" style={{ display: 'flex', gap: 8 }}><Plus size={14} /> Нова стаття</button>
                </div>
                {postFormOpen && (
                  <div style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: 16, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
                      {postForm.id ? 'Редагування статті' : 'Нова стаття (шаблон)'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 10 }}>
                      <input value={postForm.title} onChange={e => setPostForm(prev => ({ ...prev, title: e.target.value, slug: prev.id ? prev.slug : slugify(e.target.value) }))} placeholder="Заголовок" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                      <input value={postForm.slug} onChange={e => setPostForm(prev => ({ ...prev, slug: slugify(e.target.value) }))} placeholder="slug" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                      <input value={postForm.subtitle} onChange={e => setPostForm(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Підзаголовок" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                      <input value={postForm.category} onChange={e => setPostForm(prev => ({ ...prev, category: e.target.value }))} placeholder="Категорія" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                      <input value={postForm.read_time} onChange={e => setPostForm(prev => ({ ...prev, read_time: e.target.value }))} placeholder="Час читання" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                      <input value={postForm.author} onChange={e => setPostForm(prev => ({ ...prev, author: e.target.value }))} placeholder="Автор" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                    </div>
                    <input value={postForm.image} onChange={e => setPostForm(prev => ({ ...prev, image: e.target.value }))} placeholder="URL обкладинки" style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', marginBottom: 10 }} />
                    <textarea value={postForm.excerpt} onChange={e => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))} placeholder="Короткий опис" rows={3} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', marginBottom: 10, resize: 'vertical' }} />
                    <textarea value={postForm.content} onChange={e => setPostForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Контент (можна с ## заголовками)" rows={9} style={{ width: '100%', background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', marginBottom: 10, resize: 'vertical' }} />
                    <p style={{ color: 'var(--t2)', fontSize: 11, marginBottom: 10 }}>
                      Підтримка блоків: ## Заголовок, ### Підзаголовок, списки (- або 1), цитата (&gt;), note (:::note ... :::), зображення ([image] URL), розділювач (---).
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
                      <input value={postForm.tags} onChange={e => setPostForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="Теги через кому" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                      <input value={postForm.gallery} onChange={e => setPostForm(prev => ({ ...prev, gallery: e.target.value }))} placeholder="Gallery URL через кому" style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)' }} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t2)', fontSize: 12, marginBottom: 12 }}>
                      <input type="checkbox" checked={postForm.published} onChange={e => setPostForm(prev => ({ ...prev, published: e.target.checked }))} /> Опублікувати одразу
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => void handleSavePost()} disabled={postSaving} className="btn-dark btn-sm">
                        {postSaving ? 'Збереження...' : (postForm.id ? 'Оновити' : 'Створити')}
                      </button>
                      <button onClick={() => setPostFormOpen(false)} className="btn-outline btn-sm">Скасувати</button>
                    </div>
                  </div>
                )}
                {adminPosts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--bd)' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <img src={p.image} alt="" style={{ width: 56, height: 40, objectFit: 'cover' }} loading="lazy" />
                      <div>
                        <p style={{ fontSize: 14, color: 'var(--t0)', marginBottom: 2 }}>{p.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>{p.category} · {p.read_time}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`badge ${p.published ? 'badge-status-ok' : 'badge-status-err'}`}>{p.published ? 'Опублікована' : 'Чернетка'}</span>
                      <button onClick={() => openEditPost(p)} style={{ width: 32, height: 32, border: '1px solid var(--bd)', background: 'none', color: 'var(--t0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={13} /></button>
                      <button
                        onClick={() => handleDeletePost(p)}
                        title="Видалити"
                        style={{
                          width: 34,
                          height: 34,
                          border: '1px solid rgba(192,57,43,0.35)',
                          background: 'rgba(192,57,43,0.08)',
                          color: 'var(--berry)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                          transition: 'all .18s ease',
                        }}
                        onMouseEnter={e => {
                          ;(e.currentTarget as HTMLElement).style.background = 'var(--berry)'
                          ;(e.currentTarget as HTMLElement).style.color = '#fff'
                        }}
                        onMouseLeave={e => {
                          ;(e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.08)'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--berry)'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {typeof window !== 'undefined' && createPortal(
              <>
            <AnimatePresence>
              {productToDelete && (
                <motion.div
                  key="product-del-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'grid', placeItems: 'center', width: '100vw', height: '100dvh', background: 'rgba(8, 14, 11, 0.62)', backdropFilter: 'blur(1px)', padding: '16px', overflowY: 'auto' }}
                  onClick={() => setProductToDelete(null)}
                >
                  <motion.div
                    key="product-del-modal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    style={{ width: 'min(92vw, 480px)', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh-lg)', padding: 28, borderRadius: 14 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(192,57,43,0.12)', color: 'var(--berry)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </div>
                      <p style={{ fontSize: 16, color: 'var(--t0)', margin: 0 }}>Підтвердити видалення</p>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 18 }}>
                      Видалити товар "{productToDelete.name}"?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button type="button" className="btn-outline btn-sm" onClick={() => setProductToDelete(null)}>
                        Скасувати
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => void confirmDeleteProduct()}
                        style={{ background: 'var(--berry)', border: '1px solid var(--berry)', color: '#fff', padding: '10px 20px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}
                      >
                        Видалити
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {reviewToDelete && (
                <motion.div
                  key="review-del-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'grid', placeItems: 'center', width: '100vw', height: '100dvh', background: 'rgba(8, 14, 11, 0.62)', backdropFilter: 'blur(1px)', padding: '16px', overflowY: 'auto' }}
                  onClick={() => setReviewToDelete(null)}
                >
                  <motion.div
                    key="review-del-modal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    style={{ width: 'min(92vw, 460px)', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh-lg)', padding: 28, borderRadius: 14 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(192,57,43,0.12)', color: 'var(--berry)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </div>
                      <p style={{ fontSize: 16, color: 'var(--t0)', margin: 0 }}>Підтвердити видалення</p>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 4 }}>
                      Видалити відгук від <strong>{reviewToDelete.author}</strong>?
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 18, fontStyle: 'italic' }}>
                      "{reviewToDelete.text.slice(0, 80)}{reviewToDelete.text.length > 80 ? '…' : ''}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button type="button" className="btn-outline btn-sm" onClick={() => setReviewToDelete(null)}>
                        Скасувати
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => void confirmDeleteReview()}
                        style={{ background: 'var(--berry)', border: '1px solid var(--berry)', color: '#fff', padding: '10px 20px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}
                      >
                        Видалити
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {postToDelete && (
                <motion.div
                  key="post-del-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'grid', placeItems: 'center', width: '100vw', height: '100dvh', background: 'rgba(8, 14, 11, 0.62)', backdropFilter: 'blur(1px)', padding: '16px', overflowY: 'auto' }}
                  onClick={() => setPostToDelete(null)}
                >
                  <motion.div
                    key="post-del-modal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    style={{ width: 'min(92vw, 460px)', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh-lg)', padding: 28, borderRadius: 14 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(192,57,43,0.12)', color: 'var(--berry)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </div>
                      <p style={{ fontSize: 16, color: 'var(--t0)', margin: 0 }}>Підтвердити видалення</p>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 18 }}>
                      Видалити статтю "{postToDelete.title}"?
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button type="button" className="btn-outline btn-sm" onClick={() => setPostToDelete(null)}>
                        Скасувати
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => void confirmDeletePost()}
                        style={{ background: 'var(--berry)', border: '1px solid var(--berry)', color: '#fff', padding: '10px 20px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}
                      >
                        Видалити
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
              </>,
              document.body,
            )}

            {/* CHATS */}
            {tab === 'chats' && (
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 300px)' }}>
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', borderRadius: 2, overflowY: 'auto' }}>
                  <div style={{ padding: 16, borderBottom: '1px solid var(--bd)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', margin: 0 }}>Чати</p>
                      <span style={{ fontSize: 10, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)', display: 'inline-block' }} />
                        авто-оновлення
                      </span>
                    </div>
                    <button onClick={() => void loadConversations()} style={{ width: '100%', padding: '6px 10px', fontSize: 11, background: 'rgba(74,140,63,0.1)', color: 'var(--gold-d)', border: '1px solid rgba(74,140,63,0.2)', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}>Оновити зараз</button>
                  </div>

                  <div style={{ padding: '8px 0' }}>
                    <div style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 1, color: 'var(--t2)', textTransform: 'uppercase' }}>Зареєстровані</div>
                    {conversations.filter(c => c.user_id).map(c => {
                      const isUnread = (c.last_sender_type || c.last_message_sender || '') !== 'admin' && (c.status === 'open' || c.status === 'active' || c.unread_count > 0)
                      return (
                        <button
                          key={c.id}
                          onClick={() => void selectConversation(c.id)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            background: selectedConversation === c.id ? 'var(--b1)' : 'none',
                            border: 'none',
                            borderLeft: selectedConversation === c.id ? `2px solid var(--gold)` : isUnread ? '2px solid var(--berry)' : '2px solid transparent',
                            color: selectedConversation === c.id ? 'var(--t0)' : 'var(--t1)',
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: isUnread ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject || 'Без теми'}</div>
                            <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.guest_email || 'Користувач'}</div>
                          </div>
                          {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--berry)', flexShrink: 0 }} />}
                        </button>
                      )
                    })}

                    <div style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 1, color: 'var(--t2)', textTransform: 'uppercase', marginTop: 12 }}>Гості</div>
                    {conversations.filter(c => !c.user_id).map(c => {
                      const isUnread = (c.last_sender_type || c.last_message_sender || '') !== 'admin' && (c.status === 'open' || c.status === 'active' || c.unread_count > 0)
                      return (
                        <button
                          key={c.id}
                          onClick={() => void selectConversation(c.id)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            background: selectedConversation === c.id ? 'var(--b1)' : 'none',
                            border: 'none',
                            borderLeft: selectedConversation === c.id ? `2px solid var(--gold)` : isUnread ? '2px solid var(--berry)' : '2px solid transparent',
                            color: selectedConversation === c.id ? 'var(--t0)' : 'var(--t1)',
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: isUnread ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject || 'Без теми'}</div>
                            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.guest_email} {c.guest_name ? `(${c.guest_name})` : ''}</div>
                          </div>
                          {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--berry)', flexShrink: 0 }} />}
                        </button>
                      )
                    })}

                    {conversations.length === 0 && (
                      <div style={{ padding: '16px', color: 'var(--t2)', fontSize: 12, textAlign: 'center' }}>Чатів нема</div>
                    )}
                  </div>
                </div>

                {selectedConversation ? (
                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', display: 'flex', flexDirection: 'column' }}>
                    {conversations.find(c => c.id === selectedConversation) && (
                      <div style={{ padding: 16, borderBottom: '1px solid var(--bd)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <p style={{ fontSize: 16, color: 'var(--t0)', fontWeight: 600, marginBottom: 4 }}>{conversations.find(c => c.id === selectedConversation)?.subject}</p>
                            <p style={{ fontSize: 12, color: 'var(--t2)' }}>{conversations.find(c => c.id === selectedConversation)?.guest_email || 'Користувач'}</p>
                          </div>
                          <select
                            value={conversations.find(c => c.id === selectedConversation)?.status || 'open'}
                            onChange={async (e) => {
                              const nextStatus = e.target.value
                              const { error } = await updateConversation(selectedConversation, { status: nextStatus })
                              if (error) {
                                toast.error('Не вдалося оновити статус чату')
                                return
                              }
                              setConversations(prev => prev.map(c => c.id === selectedConversation ? { ...c, status: nextStatus } : c))
                              toast.success('Статус чату оновлено')
                            }}
                            style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: '6px 10px', color: 'var(--t0)', fontSize: 12 }}
                          >
                            <option value="open">Відкритий</option>
                            <option value="resolved">Вирішено</option>
                            <option value="closed">Закрито</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {conversationMessages.map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: msg.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                            maxWidth: '70%',
                            background: msg.sender_type === 'admin'
                              ? 'linear-gradient(135deg, #2c3a25 0%, #1e2b1a 100%)'
                              : 'var(--b0)',
                            color: msg.sender_type === 'admin' ? 'rgba(245,240,228,0.95)' : 'var(--t0)',
                            border: msg.sender_type === 'admin'
                              ? '1px solid rgba(74,110,54,0.35)'
                              : '1px solid var(--bd)',
                            padding: '10px 14px',
                            borderRadius: 2,
                            boxShadow: msg.sender_type === 'admin' ? '0 2px 12px rgba(30,43,26,0.22)' : 'none',
                          }}
                        >
                          <p style={{ fontSize: 11, opacity: 0.55, marginBottom: 4, letterSpacing: 0.3 }}>
                            {msg.sender_name} · {new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.content}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: 16, borderTop: '1px solid var(--bd)', display: 'flex', gap: 10 }}>
                      <textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Введіть повідомлення..."
                        rows={2}
                        style={{ flex: 1, background: 'var(--b1)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', resize: 'none' }}
                      />
                      <button
                        onClick={() => void sendChatMessage()}
                        disabled={sendingMessage || !messageText.trim()}
                        style={{
                          padding: '10px 16px',
                          background: 'var(--gold)',
                          color: '#1a1612',
                          border: 'none',
                          cursor: sendingMessage || !messageText.trim() ? 'default' : 'pointer',
                          opacity: sendingMessage || !messageText.trim() ? 0.6 : 1,
                        }}
                      >
                        {sendingMessage ? 'Надсилання...' : 'Надіслати'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}>
                    <p>Виберіть чат для перегляду</p>
                  </div>
                )}
              </div>
            )}

            {/* PARTNERS */}
            {tab === 'partners' && (() => {
              const statusLabel: Record<string, string> = { new: 'Нова', contacted: "Зв'язались", approved: 'Прийнято', rejected: 'Відхилено' }
              const statusColor: Record<string, string> = { new: 'var(--gold)', contacted: 'var(--sage)', approved: '#6aab6a', rejected: 'var(--rose, #c06)' }
              return (
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)' }}>Заявки на партнерство</h3>
                    <button onClick={() => void loadPartnerApps()} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RotateCcw size={13} /> Оновити
                    </button>
                  </div>

                  {partnersLoading && <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 16 }}>Завантаження...</p>}

                  {!partnersLoading && partnerApps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t2)' }}>
                      <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 14 }}>Заявок поки немає</p>
                      <p style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>Нові заявки зі сторінки /partners з'являться тут автоматично</p>
                    </div>
                  )}

                  {partnerApps.length > 0 && (
                    <div style={{ display: 'grid', gap: 14 }}>
                      {partnerApps.map(app => (
                        <div key={app.id} style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: '20px 24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)' }}>{app.company}</span>
                                <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', padding: '2px 10px', border: `1px solid ${statusColor[app.status] || 'var(--bd)'}`, color: statusColor[app.status] || 'var(--t2)' }}>
                                  {statusLabel[app.status] || app.status}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                                {new Date(app.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {app.status === 'new' && (
                                <button onClick={() => void handlePartnerStatus(app.id, 'contacted')} className="btn-dark btn-sm">
                                  Зв'язались
                                </button>
                              )}
                              {app.status !== 'approved' && app.status !== 'rejected' && (
                                <button onClick={() => void handlePartnerStatus(app.id, 'approved')} className="btn-outline btn-sm" style={{ color: '#6aab6a', borderColor: 'rgba(106,171,106,0.4)' }}>
                                  Прийняти
                                </button>
                              )}
                              {app.status !== 'rejected' && (
                                <button onClick={() => void handlePartnerStatus(app.id, 'rejected')} className="btn-outline btn-sm" style={{ color: 'var(--rose, #c06)', borderColor: 'rgba(200,60,60,0.3)' }}>
                                  Відхилити
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 20px', marginBottom: app.message ? 12 : 0 }}>
                            {[
                              ['Контактна особа', app.contact],
                              ['Email', app.email],
                              ['Телефон', app.phone || '—'],
                              ['Тип партнерства', app.type],
                              ['Обсяг / місяць', app.volume],
                            ].map(([label, val]) => (
                              <div key={label} style={{ fontSize: 12 }}>
                                <span style={{ color: 'var(--t2)', display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{label}</span>
                                <span style={{ color: 'var(--t0)' }}>{val}</span>
                              </div>
                            ))}
                          </div>

                          {app.message && (
                            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, borderTop: '1px solid var(--bd)', paddingTop: 12, marginTop: 4 }}>
                              {app.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ANALYTICS */}
            {tab === 'analytics' && (

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <TriangleAlert size={16} style={{ color: 'var(--gold)' }} />
                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Що варто виправити в першу чергу</p>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {analyticsSummary.recommendations.length > 0 ? analyticsSummary.recommendations.map((recommendation, index) => (
                        <div key={index} style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: 14 }}>
                          <p style={{ fontSize: 13, color: 'var(--t0)', lineHeight: 1.6 }}>{recommendation}</p>
                        </div>
                      )) : (
                        <p style={{ fontSize: 13, color: 'var(--t2)' }}>Ще недостатньо даних для рекомендацій.</p>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <MessageSquareWarning size={16} style={{ color: 'var(--gold)' }} />
                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Інші сигнали</p>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {analyticsSummary.uncategorized.length > 0 ? analyticsSummary.uncategorized.map((signal, index) => (
                        <div key={index} style={{ borderBottom: '1px solid rgba(201,169,110,0.12)', paddingBottom: 10 }}>
                          <p style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 4 }}>{signal.meta}</p>
                          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{signal.text.slice(0, 120)}{signal.text.length > 120 ? '...' : ''}</p>
                        </div>
                      )) : (
                        <p style={{ fontSize: 13, color: 'var(--t2)' }}>Всі сигнали розкладено по основних категоріях.</p>
                      )}
                    </div>
                  </div>
                </div>
            )}

            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)', marginBottom: 10 }}>Огляд бізнесу</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
                      {[
                        { label: 'Середній чек', value: `${dashboardMetrics.averageOrderValue.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴` },
                        { label: 'Відкриті чати', value: String(dashboardMetrics.openChats) },
                        { label: 'Приховані товари', value: String(dashboardMetrics.hiddenProducts) },
                        { label: 'Низькі оцінки', value: String(dashboardMetrics.lowRatedReviews) },
                      ].map((item) => (
                        <div key={item.label} style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 16 }}>
                          <p style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--t2)', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</p>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 300, color: 'var(--t0)' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <BarChart3 size={16} style={{ color: 'var(--gold)' }} />
                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Головні болі клієнтів</p>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {analyticsSummary.categories.slice(0, 4).map((category) => (
                        <div key={category.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--t0)' }}>{category.label}</span>
                            <span style={{ fontSize: 12, color: 'var(--gold)' }}>{category.count}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--b1)', border: '1px solid rgba(201,169,110,0.14)' }}>
                            <div style={{ width: `${analyticsSummary.totalSignals ? Math.min(100, (category.count / analyticsSummary.totalSignals) * 100) : 0}%`, height: '100%', background: 'var(--gold)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)', marginBottom: 14 }}>Останні замовлення</h4>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(201,169,110,0.12)', paddingBottom: 12 }}>
                          <div>
                            <p style={{ fontSize: 14, color: 'var(--t0)' }}>{order.client}</p>
                            <p style={{ fontSize: 11, color: 'var(--t2)' }}>{order.id} · {order.date}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'var(--t0)' }}>{order.total.toLocaleString('uk-UA')} ₴</p>
                            <span className={`badge ${statusBadge[order.status as keyof typeof statusBadge] || 'badge-status-warn'}`}>{statusLabel[order.status as keyof typeof statusLabel] || order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 24 }}>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)', marginBottom: 14 }}>Клієнтські сигнали</h4>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {[...analyticsSummary.categories.filter(c => c.count > 0).slice(0, 3), ...analyticsSummary.uncategorized.slice(0, 2).map((item, index) => ({ key: `other-${index}`, label: 'Інше', count: 1, examples: [item] }))].slice(0, 5).map((item) => (
                        <div key={item.key} style={{ borderBottom: '1px solid rgba(201,169,110,0.12)', paddingBottom: 12 }}>
                          <p style={{ fontSize: 12, letterSpacing: 1.5, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</p>
                          {item.examples[0] ? (
                            <>
                              <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>{item.examples[0].meta}</p>
                              <p style={{ fontSize: 13, color: 'var(--t0)', lineHeight: 1.5 }}>{item.examples[0].text.slice(0, 120)}{item.examples[0].text.length > 120 ? '...' : ''}</p>
                            </>
                          ) : (
                            <p style={{ fontSize: 13, color: 'var(--t2)' }}>Поки без сигналів.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY LOG */}
            {tab === 'activity' && (() => {
              const sectionLabels: Record<string, string> = { product: 'Товар', post: 'Блог', order: 'Замовлення', review: 'Відгук', chat: 'Чат', content: 'Контент', settings: 'Налаштування' }
              const sectionColors: Record<string, string> = { product: '#4a7c59', post: '#7c6a4a', order: '#4a5f7c', review: '#7c4a6a', chat: '#4a7a7c', content: '#7c7a4a', settings: '#6a6a6a' }
              const actionIcons: Record<string, string> = { created: '＋', updated: '✎', deleted: '✕', approved: '✓', rejected: '✗', status_changed: '⇄', published: '◉', hidden: '◎' }
              const actionLabels: Record<string, string> = { created: 'Створено', updated: 'Оновлено', deleted: 'Видалено', approved: 'Схвалено', rejected: 'Відхилено', status_changed: 'Статус змінено', published: 'Опубліковано', hidden: 'Приховано' }
              const sections = ['all', 'product', 'post', 'order', 'review', 'chat', 'content', 'settings'] as const
              const filterLabels: Record<string, string> = { all: 'Всі', product: 'Товари', post: 'Блог', order: 'Замовлення', review: 'Відгуки', chat: 'Чати', content: 'Контент', settings: 'Налаштування' }

              const filtered = activityLog.filter(e => {
                const matchSection = activityFilter === 'all' || e.section === activityFilter
                const q = activitySearch.toLowerCase()
                const matchSearch = !q || e.target.toLowerCase().includes(q) || (e.details || '').toLowerCase().includes(q)
                return matchSection && matchSearch
              })

              return (
                <div style={{ display: 'grid', gap: 20 }}>
                  <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <Activity size={16} style={{ color: 'var(--gold)' }} />
                          <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Журнал змін</p>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t2)' }}>{activityLog.length} записів · показано {filtered.length}</p>
                      </div>
                      <button
                        onClick={handleClearActivityLog}
                        style={{ background: 'none', border: '1px solid rgba(220,100,90,0.3)', color: 'rgba(220,100,90,0.75)', fontSize: 11, padding: '6px 14px', cursor: 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Trash2 size={12} /> Очистити журнал
                      </button>
                    </div>

                    {/* Search */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--bd)', padding: '9px 14px', marginBottom: 16, maxWidth: 420 }}>
                      <Search size={13} style={{ color: 'var(--t2)', flexShrink: 0 }} />
                      <input
                        value={activitySearch}
                        onChange={e => setActivitySearch(e.target.value)}
                        placeholder="Пошук по назві або деталях..."
                        style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t0)', fontFamily: 'Jost, sans-serif', flex: 1 }}
                      />
                      {activitySearch && (
                        <button onClick={() => setActivitySearch('')} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Section filters */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                      {sections.map(s => (
                        <button
                          key={s}
                          onClick={() => setActivityFilter(s === 'all' ? 'all' : s as ActivityEntry['section'])}
                          style={{
                            padding: '5px 14px',
                            fontSize: 11,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            border: `1px solid ${activityFilter === s ? 'var(--gold)' : 'var(--bd)'}`,
                            background: activityFilter === s ? 'rgba(201,169,110,0.1)' : 'transparent',
                            color: activityFilter === s ? 'var(--gold)' : 'var(--t2)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {filterLabels[s]}
                          {s !== 'all' && <span style={{ marginLeft: 5, opacity: 0.6 }}>
                            {activityLog.filter(e => e.section === s).length}
                          </span>}
                        </button>
                      ))}
                    </div>

                    {/* Log entries */}
                    {filtered.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--t2)', fontSize: 13 }}>
                        {activityLog.length === 0 ? 'Журнал порожній. Зміни будуть з\'являтися тут автоматично.' : 'Нічого не знайдено за вашим запитом.'}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 1 }}>
                        {filtered.map((entry, idx) => {
                          const canRollback = Boolean(entry.snapshot) && !entry.target.startsWith('[Відкат]')
                          const isRolling = rollingBack === entry.id
                          const dt = new Date(entry.timestamp)
                          const dateStr = dt.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          const timeStr = dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
                          const secColor = sectionColors[entry.section] || '#888'

                          return (
                            <div key={entry.id} style={{
                              display: 'grid',
                              gridTemplateColumns: '36px 1fr auto',
                              gap: 12,
                              alignItems: 'center',
                              padding: '12px 14px',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                              borderBottom: '1px solid var(--bd)',
                            }}>
                              {/* Action icon */}
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: `${secColor}18`,
                                border: `1px solid ${secColor}40`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, color: secColor, flexShrink: 0,
                              }}>
                                {actionIcons[entry.action] || '·'}
                              </div>

                              {/* Content */}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                                  <span style={{
                                    fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                                    padding: '2px 7px', background: `${secColor}18`, color: secColor,
                                    border: `1px solid ${secColor}35`, flexShrink: 0,
                                  }}>
                                    {sectionLabels[entry.section] || entry.section}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--t2)', letterSpacing: 0.5, flexShrink: 0 }}>
                                    {actionLabels[entry.action] || entry.action}
                                  </span>
                                  <span style={{ fontSize: 13, color: 'var(--t0)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {entry.target}
                                  </span>
                                </div>
                                {entry.details && (
                                  <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0, lineHeight: 1.4 }}>{entry.details}</p>
                                )}
                                <p style={{ fontSize: 10, color: 'var(--t2)', margin: '3px 0 0', opacity: 0.7 }}>
                                  {dateStr} о {timeStr}
                                </p>
                              </div>

                              {/* Rollback */}
                              {canRollback ? (
                                <button
                                  onClick={() => void handleRollback(entry)}
                                  disabled={Boolean(rollingBack)}
                                  title="Відкатити цю зміну"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', fontSize: 11, letterSpacing: 0.5,
                                    border: '1px solid var(--bd)',
                                    background: isRolling ? 'var(--b1)' : 'transparent',
                                    color: isRolling ? 'var(--gold)' : 'var(--t2)',
                                    cursor: rollingBack ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s',
                                    flexShrink: 0,
                                    opacity: rollingBack && !isRolling ? 0.4 : 1,
                                  }}
                                  onMouseEnter={e => { if (!rollingBack) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' } }}
                                  onMouseLeave={e => { if (!rollingBack) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'; (e.currentTarget as HTMLElement).style.color = 'var(--t2)' } }}
                                >
                                  <RotateCcw size={11} style={{ animation: isRolling ? 'spin 1s linear infinite' : 'none' }} />
                                  {isRolling ? 'Відкат...' : 'Відкат'}
                                </button>
                              ) : (
                                <div style={{ width: 80 }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* SETTINGS */}
            {tab === 'settings' && (
              <div style={{ display: 'grid', gap: 20 }}>
                {/* Admin Profile */}
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <UserRound size={16} style={{ color: 'var(--gold)' }} />
                    <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Профіль адміністратора</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
                    {[
                      { key: 'full_name' as const, label: "Ім'я та прізвище", type: 'text' },
                      { key: 'phone' as const, label: 'Телефон', type: 'text' },
                      { key: 'city' as const, label: 'Місто', type: 'text' },
                      { key: 'birthday' as const, label: 'Дата народження', type: 'date' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>{field.label}</label>
                        <input type={field.type} value={adminProfileForm[field.key]} onChange={e => setAdminProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))} style={{ width: '100%', background: 'var(--b1)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => void handleSaveAdminProfile()} disabled={settingsSaving} className="btn-dark btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={13} /> {settingsSaving ? 'Збереження...' : 'Зберегти профіль'}
                  </button>
                </div>

                {/* Notifications */}
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Bell size={16} style={{ color: 'var(--gold)' }} />
                    <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Сповіщення</p>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {([
                      { key: 'notificationsEmail' as const, label: 'Email-сповіщення', desc: 'Отримувати email про нові замовлення та відгуки' },
                      { key: 'notificationsSound' as const, label: 'Звукові сповіщення', desc: 'Звук при новому чаті або замовленні' },
                      { key: 'notificationsBrowser' as const, label: 'Push у браузері', desc: 'Браузерні сповіщення про активність' },
                    ]).map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                        <input type="checkbox" checked={adminPreferences[item.key]} onChange={() => toggleAdminPreference(item.key)} style={{ marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 2 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: 'var(--t2)' }}>{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Automation */}
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Radio size={16} style={{ color: 'var(--gold)' }} />
                    <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Автоматизація чатів</p>
                  </div>
                  <div style={{ display: 'grid', gap: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                      <input type="checkbox" checked={adminPreferences.autoReplyEnabled} onChange={() => toggleAdminPreference('autoReplyEnabled')} style={{ marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 2 }}>Авто-відповідь на нові звернення</p>
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>Автоматично надсилати шаблон при відкритті нового чату</p>
                      </div>
                    </label>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Шаблон авто-відповіді</label>
                      <textarea value={adminPreferences.quickReplyTemplate} onChange={e => setAdminPreferences(prev => ({ ...prev, quickReplyTemplate: e.target.value }))} rows={3} style={{ width: '100%', background: 'var(--b1)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', fontSize: 13, resize: 'vertical', fontFamily: 'Jost, sans-serif', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Статус оператора (відображається клієнту)</label>
                      <input value={adminPreferences.statusMessage} onChange={e => setAdminPreferences(prev => ({ ...prev, statusMessage: e.target.value }))} style={{ width: '100%', background: 'var(--b1)', border: '1px solid var(--bd)', padding: '10px 12px', color: 'var(--t0)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Interface */}
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Palette size={16} style={{ color: 'var(--gold)' }} />
                    <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>Інтерфейс адмінки</p>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {([
                      { key: 'compactMetrics' as const, label: 'Компактний дашборд', desc: 'Зменшені метрики та картки на дашборді' },
                      { key: 'confirmDangerActions' as const, label: 'Підтверджувати видалення', desc: 'Показувати діалог перед видаленням товарів, статей, відгуків' },
                      { key: 'showChatPreview' as const, label: "Прев'ю чатів", desc: 'Показувати уривок повідомлення у списку чатів' },
                      { key: 'showAdminName' as const, label: "Показувати ім'я адміна", desc: "Відображати ім'я в чаті від адміністратора" },
                    ]).map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                        <input type="checkbox" checked={adminPreferences[item.key]} onChange={() => toggleAdminPreference(item.key)} style={{ marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 13, color: 'var(--t0)', marginBottom: 2 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: 'var(--t2)' }}>{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div style={{ background: 'var(--b0)', border: '1px solid var(--bd)', padding: 28 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t0)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bell size={16} style={{ color: 'var(--gold)' }} /> Push-уведомлення
                  </h4>
                  <PushNotificationManager />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveAdminPreferences} className="btn-dark btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={13} /> Зберегти налаштування
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </main>
    </div>
  )
}


