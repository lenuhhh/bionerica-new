/**
 * Пример интеграции Push-уведомлений на Supabase
 * 
 * Этот файл содержит примеры функций для:
 * 1. Сохранения подписок пользователей на push
 * 2. Отправки push-уведомлений
 * 3. Управления подписками
 */

import { createClient } from '@supabase/supabase-js'

// Инициализируем Supabase клиент
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)

/**
 * Тип для сохранения подписки на push
 */
type PushSubscription = {
  userId: string
  endpoint: string
  auth: string
  p256dh: string
  userAgent?: string
  createdAt?: string
  active?: boolean
}

/**
 * Тип для push-уведомления
 */
type PushNotificationPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
}

/**
 * Сохранить подписку пользователя на push
 * 
 * Использование:
 * const subscription = await registration.pushManager.getSubscription()
 * await savePushSubscription(userId, subscription)
 */
export async function savePushSubscription(
  userId: string,
  subscription: any
): Promise<{ error?: any; data?: any }> {
  try {
    const subscriptionJson = subscription.toJSON()

    // Сохраняем в Supabase таблицу push_subscriptions
    const { error, data } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscriptionJson.endpoint,
          auth: subscriptionJson.keys.auth,
          p256dh: subscriptionJson.keys.p256dh,
          user_agent: navigator.userAgent,
          active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
        }
      )
      .select()

    if (error) {
      console.error('Error saving subscription:', error)
      return { error }
    }

    console.log('Subscription saved:', data)
    return { data }
  } catch (error) {
    console.error('Error in savePushSubscription:', error)
    return { error }
  }
}

/**
 * Получить все активные подписки
 */
export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllPushSubscriptions:', error)
    return []
  }
}

/**
 * Отправить push-уведомление всем пользователям
 * 
 * Требует установки модуля web-push:
 * npm install web-push
 */
export async function broadcastPushNotification(
  payload: PushNotificationPayload,
  options?: {
    userId?: string // Если указан, отправить только этому пользователю
    tag?: string    // Тег для группировки уведомлений
  }
): Promise<{
  success: number
  failed: number
  errors: Array<{ endpoint: string; error: string }>
}> {
  // Динамический импорт web-push (только на сервере)
  let webpush: any
  try {
    webpush = await import('web-push')
  } catch {
    console.error('web-push module not found. Install with: npm install web-push')
    return { success: 0, failed: 0, errors: [] }
  }

  // Настроить VAPID ключи
  const vapidPublicKey = process.env.VITE_PUBLIC_VAPID_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('VAPID keys not configured')
    return { success: 0, failed: 0, errors: [] }
  }

  webpush.setVapidDetails(
    `mailto:${process.env.PUSH_CONTACT_EMAIL || 'admin@bionerica.com'}`,
    vapidPublicKey,
    vapidPrivateKey
  )

  let subscriptions: any[] = []

  if (options?.userId) {
    // Получить подписки конкретного пользователя
    const { data } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', options.userId)
      .eq('active', true)

    subscriptions = data || []
  } else {
    // Получить все активные подписки
    subscriptions = await getAllPushSubscriptions()
  }

  const notification = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/logo.svg',
    badge: payload.badge || '/badge.svg',
    tag: payload.tag || options?.tag || 'bionerica-notification',
    data: payload.data || {},
  }

  let success = 0
  let failed = 0
  const errors: Array<{ endpoint: string; error: string }> = []

  // Отправить уведомление каждому пользователю
  for (const sub of subscriptions) {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      }

      await webpush.sendNotification(subscription, JSON.stringify(notification))
      success++

      console.log(`Push sent to ${sub.endpoint}`)
    } catch (error: any) {
      failed++

      // Если подписка больше не активна (410 Gone), удалить её
      if (error.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('endpoint', sub.endpoint)

        console.log(`Removed inactive subscription: ${sub.endpoint}`)
      }

      errors.push({
        endpoint: sub.endpoint,
        error: error.message,
      })

      console.error(`Error sending push to ${sub.endpoint}:`, error.message)
    }
  }

  console.log(`Push broadcast complete: ${success} sent, ${failed} failed`)

  return { success, failed, errors }
}

/**
 * Отправить уведомление о новом заказе
 */
export async function notifyNewOrder(orderId: string, clientName: string, total: number) {
  return broadcastPushNotification(
    {
      title: `📦 Новое заказание #${orderId}`,
      body: `${clientName} · ${total} ₴`,
      icon: '/logo.svg',
      tag: 'order-notification',
    },
    {
      tag: 'new-order',
    }
  )
}

/**
 * Отправить уведомление о статусе доставки
 */
export async function notifyOrderStatusChange(
  orderId: string,
  status: 'shipped' | 'delivered' | 'cancelled',
  message?: string
) {
  const statusMessages: Record<string, string> = {
    shipped: '🚚 Заказание в пути',
    delivered: '✅ Заказание доставлено',
    cancelled: '❌ Заказание отменено',
  }

  return broadcastPushNotification(
    {
      title: `${statusMessages[status]} #${orderId}`,
      body: message || 'Спасибо за доверие!',
      icon: '/logo.svg',
      tag: 'order-status',
    },
    {
      tag: `order-${orderId}`,
    }
  )
}

/**
 * Отправить промо-уведомление
 */
export async function notifyPromotion(title: string, description: string, iconUrl?: string) {
  return broadcastPushNotification(
    {
      title,
      body: description,
      icon: iconUrl || '/logo.svg',
      tag: 'promotion',
    }
  )
}

/**
 * Удалить неактивные подписки (старше 30 дней)
 */
export async function cleanupInactiveSubscriptions() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('push_subscriptions')
    .delete()
    .lt('updated_at', thirtyDaysAgo.toISOString())

  if (error) {
    console.error('Error cleaning up subscriptions:', error)
    return { deleted: 0 }
  }

  return { deleted: data?.length || 0 }
}

/**
 * Получить количество активных подписок
 */
export async function getPushSubscriptionCount(): Promise<number> {
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  if (error) {
    console.error('Error counting subscriptions:', error)
    return 0
  }

  return count || 0
}

/**
 * Отписать пользователя от push-уведомлений
 */
export async function unsubscribeUser(userId: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ active: false })
    .eq('user_id', userId)

  if (error) {
    console.error('Error unsubscribing user:', error)
    return { error }
  }

  return { success: true }
}

/**
 * Для использования на фронтенде с админ-панелью:
 * 
 * import { PushNotificationManager } from '@/components/admin/PushNotificationManager'
 * 
 * <PushNotificationManager
 *   onSend={async (notification) => {
 *     const response = await fetch('/api/admin/push', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(notification),
 *     })
 *     return response.ok
 *   }}
 * />
 */

export default {
  savePushSubscription,
  getAllPushSubscriptions,
  broadcastPushNotification,
  notifyNewOrder,
  notifyOrderStatusChange,
  notifyPromotion,
  cleanupInactiveSubscriptions,
  getPushSubscriptionCount,
  unsubscribeUser,
}
