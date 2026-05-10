# PWA + Push Notifications Setup для Bionerica

## 🎯 Текущее Состояние

✅ **Готово:**
- Service Worker (`public/sw.js`) — регистрируется и обрабатывает push-события
- PWA конфиги (`site.webmanifest`, `twa-manifest.json`) — обновлены на Bionerica
- Client-side логика (`src/hooks/usePush.ts`) — полна и готова к push
- Push notification display логика в Admin (`src/pages/Admin.tsx`) — сохраняет в `push_notifications` таблицу
- UI компоненты (`src/components/ui/PWA.tsx`) — готовы к установке

⚠️ **Требует доработки:**
1. VAPID ключи не сгенерированы (нужны для Web Push API)
2. Нет API endpoint для подписания на push (`/api/push/subscribe`)
3. Нет backend функции отправки push в реальное время
4. Нет обработки push-событий на сервере

---

## 🔑 Шаг 1: Генерирование VAPID Ключей

### Вариант A: Локально (Node.js)

```bash
# Установите web-push если ещё не установлен
npm install web-push

# Сгенерируйте VAPID ключи
npx web-push generate-vapid-keys

# Вы получите вывод вроде:
# Public Key: BEl62iUYgUivxIkv69yViEu...
# Private Key: OlFPdN-YGrUL2d...
```

### Вариант B: Онлайн генератор
https://vapidkeygenerator.appspot.com/

---

## 📝 Шаг 2: Добавьте VAPID Ключи в .env

```env
# В конец вашего .env добавьте:
VITE_VAPID_PUBLIC_KEY=<YOUR_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
VITE_CONTACT_EMAIL=info@bionerica.ua
```

**Важно:**
- `VITE_` префикс — доступны в браузере
- Без префикса — только на сервере
- **Не коммитьте эти ключи в git!** (.env уже в .gitignore)

---

## 3️⃣ Шаг 3: Обновите usePush.ts

Замените hardcoded VAPID key на переменную из .env:

```typescript
// src/hooks/usePush.ts
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBuyAjqh2bNFMUqwU'
```

---

## 🔌 Шаг 4: Создайте API Endpoints

### A) Supabase Edge Function для `/api/push/subscribe`

Создайте файл `supabase/functions/push-subscribe/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { subscription, userId, categories } = await req.json()

    if (!subscription?.endpoint || !userId) {
      return new Response('Missing subscription or userId', { status: 400 })
    }

    // Збережіть підписку в таблицю push_subscriptions
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        categories: categories,
        user_agent: req.headers.get('user-agent'),
        active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint',
      })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### B) Supabase Edge Function для відправки push

Створіть `supabase/functions/push-send/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { userId, title, body, url, tag } = await req.json()

    // Збережіть notification в push_notifications таблицю
    const { error } = await supabase
      .from('push_notifications')
      .insert({
        user_id: userId,
        title,
        body,
        url: url || '/',
        tag: tag || 'notification',
        read: false,
      })

    if (error) throw error

    // TODO: Інтегруйте web-push для реальної відправки браузеру
    // На даний момент notifications зберігаються в БД
    // і відправляються через polling з клієнта

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

## 📲 Шаг 5: Тестування на Мобільному

### iPhone (iOS Safari)

1. Відкрийте сайт `https://bionerica.ua` (не localhost!)
2. Натисніть **"Поділитись"** → **"На екран Додому"**
3. Виберіть **"Додати"**
4. PWA встановиться як додаток

**Push на iOS:**
- ⚠️ iOS не підтримує Web Push API нативно
- Альтернатива: использовать push через APNS (Apple Push Notification Service)

### Android (Chrome / Firefox)

1. Відкрийте сайт на Android
2. Натисніть меню → **"Встановити додаток"** або дочекайтеся prompt
3. PWA встановиться на домашний экран

**Тестування push:**
```bash
# 1. В console браузера (DevTools F12)
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub)
  })
})

# 2. Запросите permission
Notification.requestPermission()

# 3. В Admin: змініть статус замовлення → пуш має відправитися
```

---

## 🧪 Локальне Тестування Push

### За допомогою ngrok (для localhost тестування)

```bash
# 1. Встановіть ngrok
# https://ngrok.com/download

# 2. Запустіть development сервер
npm run dev

# 3. У новому терміналі, поділіться з ngrok
ngrok http 5173

# 4. Откройте https://YOUR-NGROK-URL
```

### Вручну відправити test push (Node.js)

```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:info@bionerica.ua',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Отримайте subscription з браузера console (див. вище)
const subscription = { /* ... */ };

const payload = JSON.stringify({
  title: '✅ Test Push from Bionerica!',
  body: 'Це тестове push-повідомлення',
  icon: '/icon-192.png',
  url: '/account',
});

webpush.sendNotification(subscription, payload)
  .catch(err => console.error('Push failed:', err));
```

---

## 📊 Таблиця Supabase: push_subscriptions

Проверьте що таблиця створена:

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  categories JSONB DEFAULT '{"orders":true,"promo":true,"wishlist":true}',
  user_agent TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT endpoint_unique UNIQUE (endpoint)
);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
```

---

## ✅ Чек-лист для PROD

- [ ] VAPID ключи сгенеровані та додані в .env
- [ ] .env додан в .gitignore (ніколи не коммитьте ключі!)
- [ ] API endpoints `/api/push/subscribe` та `/api/push/unsubscribe` готові
- [ ] Supabase таблиця `push_subscriptions` створена
- [ ] Service Worker (`sw.js`) оновлений та перевірений
- [ ] usePush.ts використовує .env VAPID key
- [ ] Tested на реальному мобільному пристрої (Android + iPhone)
- [ ] Push notifications відправляються при зміні статусу замовлення
- [ ] Користувач може вімкнути/вимкнути категорії уведомлень

---

## 🐛 Troubleshooting

### Push subscription fails
```
❌ "Notification permission denied"
→ Перевірьте що сайт на HTTPS (push потребує безпеки)
→ На localhost використовуйте http://127.0.0.1

❌ "VAPID key invalid"
→ Перевірьте VAPID ключі в .env
→ Переінстальте пакет: npm install web-push
```

### Service Worker не реєструється
```
❌ "SW registration failed"
→ Перевірьте що /public/sw.js існує та доступний
→ На localhost: clear cache та hard refresh (Ctrl+Shift+R)
→ DevTools → Application → Service Workers
```

### Notifications не приходять
```
1. Перевірьте DevTools → Application → Manifest (status: OK)
2. Перевірьте Service Worker status: "activated"
3. Дайте permission на notifications
4. Перевірьте subscription в браузері console:
   navigator.serviceWorker.ready.then(reg =>
     reg.pushManager.getSubscription().then(console.log)
   )
```

---

## 📚 Посилання

- [Web Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [PWA Install guide](https://web.dev/installable-web-apps/)

---

**Автор:** AI Assistant  
**Дата:** 2026-05-10  
**Проект:** Bionerica Organic Farm E-commerce
