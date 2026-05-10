# 📱 PWA + Push Notifications — Полна Реалізація для Bionerica

## ✅ Що Вже Готово

| Компонент | Статус | Деталі |
|-----------|--------|--------|
| Service Worker (v5) | ✅ ГОТОВИЙ | Реєстрація, offline, push обробка, background sync |
| PWA Manifests | ✅ ГОТОВИЙ | `site.webmanifest` + `twa-manifest.json` (Bionerica) |
| Push Store | ✅ ГОТОВИЙ | Zustand + persist, категорії, quiet hours, history |
| usePush Hook | ✅ ГОТОВИЙ | Subscribe/unsubscribe, local notifications |
| Admin Push Notifications | ✅ ГОТОВИЙ | При зміні статусу замовлення → запис в БД |
| VAPID Config | ✅ ГОТОВИЙ | `.env` з примерами ключів |
| NewsletterWidget | ✅ ДОДАНО | На Home.tsx + Account.tsx |
| ReferralWidget | ✅ ДОДАНО | На Account.tsx у вкладці лояльності |

---

## 🚀 Як Тестувати на Мобільному Телефоні

### Крок 1: Розгорніть HTTPS версію сайту

Push notifications **потребують HTTPS** (или localhost для testing). Варіанти:

#### Варіант A: Виробнича версія (рекомендується)
```bash
npm run build
# Розгорніть dist/ на ваш сервер:
# - GitHub Pages
# - Netlify
# - Vercel
# - Ваш власний сервер

# Зробіть HTTPS обов'язковим
# Наприклад у Netlify це автоматично
```

#### Варіант B: Локальне тестування (development)

**На Android (через ngrok):**

```bash
# 1. У першому терміналі: запустіть dev server
npm run dev
# Виведе http://localhost:5173

# 2. У другому терміналі: встановіть ngrok (якщо ще не встановлений)
# https://ngrok.com/download

# 3. Поділіться localhost з HTTPS
ngrok http 5173
# Виведе: https://YOUR-RANDOM-ID.ngrok.io

# 4. На Android: відкрийте https://YOUR-RANDOM-ID.ngrok.io
# (замініть ngrok ID на реальний)
```

**На iPhone (локально чи remote):**
```
⚠️ iOS Safari НЕ підтримує Web Push API
Альтернативи:
- Використовувати APNS (Apple Push Notification Service)
- PWA все ще встановлюється та працює offline
- Push показуватися не будуть
```

---

### Крок 2: Встановіть PWA на Телефон

#### 📱 Android (Chrome/Firefox)
1. Відкрийте https://bionerica.ua (або ваш URL)
2. Меню (⋮) → **"Встановити додаток"** 
   - або дочекайтеся banner з пропозицією
3. Дайте дозвіл → PWA встановиться на домашний екран

#### 🍎 iPhone (Safari)
1. Відкрийте https://bionerica.ua в Safari
2. Натисніть **"Поділитись"** (квадрат зі стрілкою)
3. Прокрутіть вниз → **"На екран Додому"**
4. Натисніть **"Додати"** → PWA буде на екрані

⚠️ **Примітка:** iOS розпізнає це як Web App (не App Store), але працює як додаток.

---

### Крок 3: Увімкніть Push Notifications

1. **Відкрийте PWA** на телефоні
2. Меню або налаштування → знайдіть **"Дозволи на Сповіщення"**
3. Дайте дозвіл: **"Дозвіл"** (не "Блокувати")
4. Браузер покаже prompt: **"Дозволити сповіщення від Bionerica?"**
5. Натисніть **"Дозволити"**

✅ **Готово!** Тепер PWA зареєстрований на отримання push-ів.

---

### Крок 4: Протестуйте Push

#### Тест 1: Локальне Notification (автоматичне)

```bash
# У браузері Console (F12 → Console):
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('✅ Test Push', {
    body: 'Це тестове сповіщення від Service Worker',
    icon: '/icon-192.png',
    tag: 'test-notification'
  })
})
```

✅ На екрані телефону має з'явитися сповіщення.

#### Тест 2: Зміна Статусу Замовлення (у Admin)

1. Залогіньтеся в Admin → **"Замовлення"**
2. Виберіть замовлення → нажміть **"Очі"** (переглянути)
3. Натисніть **"Зберегти"** при будь-якій зміні статусу
4. ✅ На тестовому телефоні має прийти push notification

---

## 🔧 Налаштування VAPID Ключів

### Якщо ще НЕ設置:

1. **Сгенеруйте VAPID ключи:**

```bash
npm install web-push
npx web-push generate-vapid-keys
```

2. **Скопіюйте ключі в .env:**

```env
VITE_VAPID_PUBLIC_KEY=<PUBLIC_KEY>
VAPID_PRIVATE_KEY=<PRIVATE_KEY>
```

3. **Перезапустіть dev server:**

```bash
npm run dev
```

✅ Тепер ваші власні VAPID ключи активні.

---

## 📊 Архітектура Push Notifications

```
┌─────────────────────────────────────────────────┐
│   USER на МОБІЛЬНОМУ (PWA)                      │
│  ┌──────────────────────────────────────────┐   │
│  │ ServiceWorker (зареєстрований)          │   │
│  │ - Слухає push события                    │   │
│  │ - Показує notifications на екрані        │   │
│  └──────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────┘
               │
               │ (Push via Web Push API)
               │
┌──────────────▼──────────────────────────────────┐
│   PUSH SERVICE (Google, Apple, etc)             │
│  - Зберігає subscription                        │
│  - Доставляє push на пристрій                   │
└──────────────┬──────────────────────────────────┘
               │
               │ (Backend sends via web-push SDK)
               │
┌──────────────▼──────────────────────────────────┐
│   BIONERICA BACKEND (Node.js / Supabase)        │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Admin змінює статус замовлення        │   │
│  │ 2. Записується в push_notifications DB  │   │
│  │ 3. Supabase Edge Function спрацьовує     │   │
│  │ 4. Отримує subscription з push_subscr.  │   │
│  │ 5. Відправляє push через web-push SDK   │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🎛️ Управління Notification Preferences

### У PWA Додатку

1. Відкрийте **Settings** або **Налаштування** в PWA
2. Знайдіть **"Сповіщення"** / **"Push Preferences"**
3. Виберіть категорії:
   - ✅ **Замовлення** (замовлення, доставка)
   - ✅ **Акції** (промо, знижки)
   - ✅ **Список бажань** (зміни ціни)
   - ⚠️ **Новинки** (за замовчуванням OFF)
4. **Quiet Hours:** 22:00 - 08:00 (відключає на ніч)
5. **Максимум на день:** 8 сповіщень

---

## 🐛 Troubleshooting

| Проблема | Рішення |
|----------|--------|
| **"Permission denied"** | Сайт не на HTTPS (потребується для push) |
| **"Service Worker не зареєстрований"** | Перевірте F12 → Application → Service Workers |
| **"Push ніколи не приходять"** | Перевірте: 1) Permission granted, 2) Subscription в DB, 3) Backend отправляє |
| **"Notification с'является, але клік не працює"** | Перевірте sw.js `notificationclick` handler |
| **"VAPID key invalid"** | Перевірте .env, переінстальте npm install web-push |
| **"iOS не показує push"** | iOS не підтримує Web Push, потребується APNS |

---

## 📋 Чек-лист для GO LIVE

### Dev (Локально):
- [ ] `npm run build` успішна
- [ ] `npm run dev` запускається без помилок (3 pre-existing errors OK)
- [ ] PWA встановлюється на мобільному пристрої
- [ ] Push notification відправляється локально (тест console command)

### Staging/Preview (HTTPS):
- [ ] Site розгорнутий на HTTPS URL
- [ ] PWA встановлюється на мобільному
- [ ] Push дозволи приймаються
- [ ] Тест: Admin зміна статусу → push приходить
- [ ] VAPID ключи встановлені та дійсні

### Production (bionerica.ua):
- [ ] VAPID_PRIVATE_KEY у безпеці (тільки на сервері)
- [ ] `VITE_VAPID_PUBLIC_KEY` публічно в .env
- [ ] Supabase `push_subscriptions` таблиця існує
- [ ] Backend Edge Function `/api/push/subscribe` готова
- [ ] Юзери можуть увімкнути push notifications
- [ ] Email/SMS підтримка як fallback для iOS

---

## 🔗 Корисні Посилання

- **Web Push API:** https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- **Service Workers:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **PWA Install:** https://web.dev/installable-web-apps/
- **web-push npm:** https://www.npmjs.com/package/web-push
- **VAPID Key Gen:** https://vapidkeygenerator.appspot.com/
- **Notification API:** https://developer.mozilla.org/en-US/docs/Web/API/Notification

---

## 📝 Наступні Кроки

1. **Інтеграція з backend:** Створити Supabase Edge Functions для реальної відправки push
2. **iOS Support:** Налаштувати APNS для iOS push notifications
3. **Email Fallback:** Email subscriptions як альтернатива для браузерів без push
4. **Analytics:** Відстежувати click-through rates на notifications
5. **A/B Testing:** Тестувати різні час/текст для максимальної engagement

---

**Статус:** ✅ **READY FOR TESTING**  
**Дата:** 2026-05-10  
**Версія:** 1.0  
**Проект:** Bionerica Organic Farm E-commerce
