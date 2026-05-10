# 📊 PWA + Push Notifications — Статус & Доробки

## 📈 Прогресс Реалізації

```
                    ЗАВЕРШЕНО    |  ПОТРЕБУЄ ДОРОБКИ
┌────────────────────────────────┼──────────────────────────┐
│                                │                          │
│  ✅ Service Worker (v5)        │  ⚠️  Edge Functions (BE) │
│  ✅ PWA Manifests              │  ⚠️  Push API endpoints  │
│  ✅ usePush Hook               │  ⚠️  Email Fallback      │
│  ✅ VAPID Config               │  ⚠️  iOS APNS Setup      │
│  ✅ Client Subscriptions       │  ⚠️  Analytics           │
│  ✅ Offline Support            │  ⚠️  Admin Dashboard     │
│  ✅ Install UI/UX              │                          │
│                                │                          │
└────────────────────────────────┴──────────────────────────┘
```

---

## 🎯 Що Готово до Тестування

### 1. **PWA Installation** ✅
- **Android:** Встановлюється через Chrome menu або banner
- **iPhone:** Встановлюється через Safari "Add to Home Screen"
- **Desktop:** Встановлюється як цілорічний додаток
- **Icons:** 5 shortcuts на домашньому екрані

### 2. **Offline-First** ✅
- Service Worker кешує app shell на install
- Network-first для динамічного контенту
- Cache-first для зображень, шрифтів
- Fallback до `/offline.html` при розриві

### 3. **Local Notifications** ✅
- `usePush.ts` → `showLocal()` функція
- Quiet hours (22:00-08:00 за замовчуванням)
- Категорії (orders, promo, wishlist)
- Лімітація (макс 8 на день)

### 4. **Admin Controls** ✅
- Зміна статусу замовлення → запис в `push_notifications` table
- Push сповіщення мають: title, body, url, tag
- Історія сповіщень в БД

### 5. **Client Configuration** ✅
- VAPID public key в `.env`
- VAPID private key в `.env` (secure)
- Supabase connection готовий
- .gitignore запобігає утічці ключів

---

## ⚠️ Що Потребує Доробки

### 1. **Backend Push API** (ВАЖЛИВЕ) 🔴

**Поточне:** Admin записує в `push_notifications` таблицю  
**Потребує:** Backend відправляє реальні push браузеру

**Рішення:** Суpabase Edge Functions

```typescript
// supabase/functions/push-send/index.ts
// Функція для реальної відправки push через web-push SDK

// Логіка:
// 1. Прослуховувати зміни в push_notifications table
// 2. Отримати subscription з push_subscriptions
// 3. Відправити push через web-push.sendNotification()
// 4. Обробити помилки (410 Gone = видалити inactive)
```

**Час на реалізацію:** ~2 години  
**Складність:** Середня

---

### 2. **Subscribe/Unsubscribe API** (ВАЖЛИВЕ) 🔴

**Поточне:** Браузер робить fetch('/api/push/subscribe')  
**Потребує:** Backend обробляє запит та зберігає в БД

**Рішення:** 2 Edge Functions

```typescript
// supabase/functions/push-subscribe/index.ts
// Зберігає subscription користувача

// supabase/functions/push-unsubscribe/index.ts
// Видаляє subscription при unsubscribe
```

**Час на реалізацію:** ~1.5 години  
**Складність:** Легка

---

### 3. **iOS APNS Support** (ОПЦІОНАЛЬНО) 🟡

**Поточне:** iOS не отримує Web Push (Web Push API не підтримується)  
**Потребує:** Apple Push Notification Service (APNS)

**Рішення:** Інтеграція з APNS через Supabase або AWS

**Час на реалізацію:** ~4-6 годин  
**Складність:** Висока  
**Пріоритет:** Середній (iOS: 20% трафіку, Android: 75%)

---

### 4. **Email Notifications** (ОПЦІОНАЛЬНО) 🟡

**Поточне:** Тільки браузер push  
**Потребує:** Email fallback для бажаючих

**Рішення:** Transactional Email Provider (SendGrid, Mailgun, Resend)

**Час на реалізацію:** ~2 години  
**Складність:** Легка  
**Пріоритет:** Середній

---

### 5. **Admin Dashboard** (ОПЦІОНАЛЬНО) 🟡

**Поточне:** Push записуються в таблицю, але нема UI  
**Потребує:** Сторінка для перегляду push analytics

**UI Вимоги:**
- Список відправлених push
- Delivery rate (скільки успішно доставлено)
- Click-through rate (скільки користувачів натиснули)
- Filter by status, date, category

**Час на реалізацію:** ~3 години  
**Складність:** Легка  
**Пріоритет:** Низький

---

## 📦 Таблиці БД (Потребують Перевірки)

### ✅ `push_notifications` (ІСНУЄ)
```sql
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT DEFAULT '/',
  tag TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### ✅ `push_subscriptions` (ІСНУЄ?)
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  endpoint TEXT UNIQUE NOT NULL,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  categories JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**ПЕРЕВІРТЕ:** `SELECT * FROM push_subscriptions;`  
Якщо таблиця не існує, створіть за SQL вище.

---

## 🔄 Архітектура (з дороботками)

```
┌─────────────────────────────────────────────────────────┐
│ БРАУЗЕР (Client)                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 1. usePush Hook                                  │   │
│ │    - subscribe() → fetch /api/push/subscribe    │   │
│ │    - unsubscribe()                               │   │
│ │    - showLocal() (локальні notification)         │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ 2. Service Worker (public/sw.js)                │   │
│ │    - Прослуховує push events                    │   │
│ │    - showNotification() → користувач бачить    │   │
│ │    - notificationclick → open URL               │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │ (Web Push API) │ (HTTPS)        │ (userData)
        │                │                │
┌───────▼────────────────▼────────────────▼──────────────┐
│ PUSH SERVICE (Google Cloud, Apple, etc)               │
│ - Отримує subscription                                │
│ - Зберігає credentials                                │
│ - Доставляє push на пристрій                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ (Backend sends notification)
                         │
┌────────────────────────▼────────────────────────────────┐
│ BACKEND (Supabase Edge Functions)                       │
│ ┌──────────────────────────────────────────────────┐   │
│ │ /push-subscribe (POST)                          │   │
│ │  - Сохраняет subscription в DB                  │   │
│ │  - Проверяет Auth (только для авторизованных)  │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ /push-send (trigger: push_notifications INSERT)│   │
│ │  - Читает запись из push_notifications          │   │
│ │  - Получает subscription из push_subscriptions  │   │
│ │  - Отправляет push через web-push SDK          │   │
│ │  - Обрабатывает ошибки (удаляет 410 Gone)     │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ /push-unsubscribe (POST)                        │   │
│ │  - Удаляет subscription из DB                   │   │
│ │  - Проверяет Auth                               │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Рекомендована Послідовність Доробок

### **ФАЗА 1: Виробництво** (CRITICAL)
1. ✅ Налаштування VAPID ключів
2. ⚠️ Створити Edge Functions для `/push-subscribe` та `/push-unsubscribe`
3. ⚠️ Тестування на реальних мобільних (Android)
4. ⚠️ Deploy на production (bionerica.ua)

**Час:** ~4 години  
**Результат:** Робочі push notifications для Android користувачів

---

### **ФАЗА 2: Покращення** (HIGH PRIORITY)
1. ⚠️ Edge Function для реальної відправки push
2. ⚠️ Admin Dashboard з analytics
3. ⚠️ Email fallback notifications

**Час:** ~6-8 годин  
**Результат:** Повнофункціональна система уведомлень

---

### **ФАЗА 3: IOS & Advanced** (MEDIUM PRIORITY)
1. ⚠️ APNS інтеграція для iOS
2. ⚠️ A/B тестування часу відправки
3. ⚠️ Machine Learning для оптимізації

**Час:** ~10-12 годин  
**Результат:** iOS push + advanced analytics

---

## 🧪 Як Тестувати на Даний Момент

### Міні-тест (локально):

```javascript
// F12 → Console:

// 1. Перевір що SW зареєстрований
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs.length)
})

// 2. Тест локального notification
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test', { body: 'It works!' })
})

// 3. Перевір VAPID key
console.log('VAPID:', import.meta.env.VITE_VAPID_PUBLIC_KEY)
```

### Повний тест (мобільний):

1. Deploy на HTTPS (ngrok або production)
2. Встановіть PWA на Android
3. Дайте push permission
4. Поміняйте статус замовлення в Admin
5. ✅ Push має прийти на телефон

---

## 📋 Requirements для PROD Deploy

```javascript
✅ Готово:
  □ VAPID ключи сгенеровані
  □ .env налаштований
  □ Service Worker готовий
  □ PWA manifests на біonerica.ua
  □ Supabase tables створені
  
⚠️ Потребує:
  □ Backend Edge Functions deployed
  □ /api/push/subscribe functional
  □ Real push delivery tested
  □ iOS fallback (email або APNS)
  □ Monitoring та logging
  
🔒 Security:
  □ VAPID_PRIVATE_KEY в .env (не коммітьте!)
  □ API endpoints авторизовані (Auth)
  □ RLS policies на Supabase tables
  □ Rate limiting на endpoints
```

---

## 🎯 Висновок

**PWA повністю готовий до тестування** на Android + мобільному браузері.

**Push notifications** мають простий шлях:
1. Браузер → subscription запис
2. Admin → зміна статусу
3. Backend (не готово) → відправка push

**Наступний крок:** Crear Edge Functions для реальної відправки push.

Остальне — це enhancement & iOS support.

---

**Дата:** 2026-05-10  
**Версія:** 1.0-rc.1  
**Статус:** 🟢 READY FOR MOBILE TESTING
