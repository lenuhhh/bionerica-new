# 🎨 Новые компоненты администратора

## Обзор

В этом обновлении добавлены два новых мощных компонента для админ-панели:

### 1️⃣ Редактор стилей карточек товаров (`CardStylePreview.tsx`)

**Местоположение:** `src/components/admin/CardStylePreview.tsx`

**Функции:**
- 🎨 Визуальный редактор CSS стилей для карточек товаров
- 🎯 Предустановки дизайна (Premium Dark, Minimal Light, Energetic Green)
- 👁️ Живой предпросмотр изменений
- 📋 Экспорт/импорт конфигурации в JSON
- ✨ Полный контроль над:
  - Фоном и градиентами
  - Границами и скругленностью
  - Тенями и эффектами
  - Цветами текста
  - Стилями бейджей
  - Анимацией наведения

**Использование:**
```tsx
import { CardStylePreset } from '@/components/admin/CardStylePreview'

<CardStylePreset />
```

**Параметры стиля:**
```typescript
type CardStyle = {
  backgroundColor: string      // Фон карточки (может быть градиент)
  borderColor: string          // Цвет границы
  borderWidth: string          // Толщина границы (px)
  borderRadius: string         // Скругленность углов (px)
  shadowSize: string           // CSS box-shadow
  titleColor: string           // Цвет заголовка
  priceColor: string           // Цвет цены
  badgeBackground: string      // Фон значков/бейджей
  badgeBorderColor: string     // Граница значков
  hoverScale: string           // Масштаб при наведении (1.02 = +2%)
}
```

**Примеры использования:**

#### Premium Dark (Стандарт)
```json
{
  "backgroundColor": "linear-gradient(180deg, rgba(34,29,23,0.94) 0%, rgba(29,25,20,0.98) 100%)",
  "borderColor": "rgba(122,93,52,0.34)",
  "borderWidth": "1px",
  "borderRadius": "12px",
  "shadowSize": "0 20px 46px rgba(0,0,0,0.2)",
  "titleColor": "rgba(245,240,232,0.93)",
  "priceColor": "rgba(245,240,232,0.93)",
  "badgeBackground": "rgba(192,208,172,0.2)",
  "badgeBorderColor": "rgba(192,208,172,0.4)",
  "hoverScale": "1.02"
}
```

#### Minimal Light
```json
{
  "backgroundColor": "linear-gradient(180deg, rgba(248,247,245,0.98), rgba(245,243,240,0.98))",
  "borderColor": "rgba(192,208,172,0.2)",
  "borderWidth": "1px",
  "borderRadius": "12px",
  "shadowSize": "0 8px 24px rgba(0,0,0,0.08)",
  "titleColor": "rgba(26,22,18,0.95)",
  "priceColor": "rgba(26,22,18,0.95)",
  "badgeBackground": "rgba(192,208,172,0.1)",
  "badgeBorderColor": "rgba(192,208,172,0.2)",
  "hoverScale": "1.02"
}
```

### 2️⃣ Менеджер Push-уведомлений (`PushNotificationManager.tsx`)

**Местоположение:** `src/components/admin/PushNotificationManager.tsx`

**Функции:**
- 🔔 Отправка web push-уведомлений пользователям
- 📅 Планирование отправки (опционально)
- 🧪 Тестирование перед отправкой
- 📝 История отправленных уведомлений
- ✅ Проверка прав доступа браузера
- 📱 Service Worker интеграция

**Использование:**
```tsx
import { PushNotificationManager } from '@/components/admin/PushNotificationManager'

<PushNotificationManager 
  onSend={async (notification) => {
    // Ваша логика отправки на сервер
    const response = await fetch('/api/push', {
      method: 'POST',
      body: JSON.stringify(notification)
    })
    return response.ok
  }}
/>
```

**API:**
```typescript
type PushNotification = {
  id: string                  // Автогенерируется
  title: string              // Заголовок уведомления
  body: string               // Текст сообщения
  icon?: string              // URL иконки (опционально)
  tag: string                // Тег для группировки (по умолчанию 'bionerica-notification')
  scheduledAt?: string       // Дата планирования ISO формат (опционально)
  sent: boolean              // Статус отправки
  sentAt?: string            // Время отправки ISO формат
}
```

**Типичный рабочий процесс:**

1. **Запрос прав доступа** - пользователь видит запрос браузера на push-уведомления
2. **Создание уведомления** - админ заполняет форму (заголовок, текст, иконка)
3. **Тестирование** - кнопка "Тест" показывает уведомление локально
4. **Отправка** - отправляет уведомление всем пользователям с включенными push

**Требования:**
- Зарегистрированный Service Worker (`public/sw.js`)
- HTTPS на продакшене
- Дозвол пользователя на push-уведомления

## Интеграция в админ-панель

Оба компонента интегрированы в основную админ-панель:

### Вкладка "Дизайн карточек" 
- Путь: **Админ > Дизайн** 
- Иконка: 🎨 Palette
- Доступна все версиям админа

### Пуш-уведомлений
- Путь: **Админ > Настройки > Push-уведомления**
- Иконка: 🔔 Bell
- В панели настроек админ-интерфейса

## Установка и интеграция

### Шаг 1: Убедитесь что Service Worker зарегистрирован

`public/sw.js` должен содержать:
```javascript
self.addEventListener('push', event => {
  const data = event.data.json()
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/logo.svg',
    tag: data.tag || 'notification',
    badge: '/badge.svg'
  })
})
```

### Шаг 2: Создайте обработчик на сервере

```typescript
// API/push.ts
export async function sendPushNotification(notification: PushNotification) {
  // Получить подписки пользователей из БД
  const subscriptions = await db.pushSubscriptions.findMany({
    where: { active: true }
  })
  
  // Отправить уведомление каждому
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub.endpoint, {
        title: notification.title,
        body: notification.body,
        icon: notification.icon
      })
    } catch (error) {
      console.error('Push failed:', error)
    }
  }
}
```

### Шаг 3: Зарегистрируйте подписку клиента

```typescript
// В компоненте клиента
if ('serviceWorker' in navigator) {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.REACT_APP_PUBLIC_VAPID_KEY
  })
  
  // Отправить подписку на сервер
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(sub)
  })
}
```

## Переменные окружения

```env
REACT_APP_PUBLIC_VAPID_KEY=your-public-vapid-key
VITE_PUBLIC_VAPID_KEY=your-public-vapid-key
```

## Примеры интеграции

### Отправка push при новом заказе

```tsx
const handleOrderCreated = async (order: Order) => {
  // Существующий код...
  
  // Отправить push
  await pushManager.sendNotification({
    title: `Новое заказание #${order.id}`,
    body: `Сумма: ${order.total} ₴ · ${order.client}`,
    tag: 'new-order',
    icon: '/logo.svg'
  })
}
```

### Планирование промо-кампаний

```tsx
// Отправить уведомление через 24 часа
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

await pushManager.sendNotification({
  title: '🎉 Специальное предложение',
  body: 'Скидка 20% на все товары',
  scheduledAt: tomorrow.toISOString(),
  tag: 'promo'
})
```

## Интернационализация

Текст компонентов уже переведен на украинский. Для использования на других языках обновите строки в компонентах.

## Производительность

- ✅ Компонент `CardStylePreview` использует `useState` для локальной работы
- ✅ Предпросмотр обновляется в реальном времени
- ✅ JSON экспорт позволяет сохранить конфигурацию
- ✅ Push уведомления обрабатываются асинхронно Service Worker
- ✅ История уведомлений хранится локально (опционально в БД)

## Безопасность

- 🔐 Проверка разрешений браузера перед отправкой push
- 🔐 Проверка HTTPS на продакшене
- 🔐 Валидация входных данных
- 🔐 CORS и CSP правила должны быть настроены

## Помощь и поддержка

Для вопросов по интеграции смотрите:
- [Web Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- Примеры в `src/hooks/usePush.ts`

---

**Версия:** 1.0.0  
**Обновлено:** 2025  
**Автор:** Bionerica Admin Team
