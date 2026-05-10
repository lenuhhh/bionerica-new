# 🪡 Broiderie v3 — Запуск за 30 хвилин

## Крок 1: Встановлення
```bash
npm install && cp .env.example .env && npm run dev
```

## Крок 2: Змінити дані бренду
`src/data/index.ts` → назва, контакти, товари
`src/components/layout/Footer.tsx` → адреса, email
`index.html` → мета-теги, назва сайту

## Supabase (база даних)
1. supabase.com → New Project
2. .env → VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY
3. SQL Editor → supabase-schema.sql → Run
4. `UPDATE profiles SET role='admin' WHERE email='your@email.com';`

## Google OAuth
- Google Cloud Console → OAuth 2.0 → redirect: https://YOUR.supabase.co/auth/v1/callback
- Supabase → Authentication → Providers → Google

## Платежі
- **LiqPay**: liqpay.ua → Бізнес → ключі у .env
- **WayForPay**: wayforpay.com → merchant account
- **Monobank**: api.monobank.ua

## Push-сповіщення
```bash
npx web-push generate-vapid-keys
```
Публічний ключ → `src/hooks/usePush.ts` → `VAPID_PUBLIC`

## Деплой
```bash
npm install -g vercel && vercel --prod
# ENV: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

## Аналітика
- Google Analytics 4: вставте `G-XXXXXXXXXX` в index.html
- Facebook Pixel: вставте Pixel ID в index.html

## Чек-лист перед запуском
- [ ] Замінити товари та фото
- [ ] Підключити Supabase
- [ ] Google OAuth
- [ ] Платіжна система
- [ ] Реальні PWA-іконки (public/icon-192.png, icon-512.png)
- [ ] Google Analytics
- [ ] Оновити Privacy Policy / Terms з реальними даними
- [ ] sitemap.xml з реальними URL
- [ ] Налаштувати домен
