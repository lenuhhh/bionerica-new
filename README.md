# 🪡 Broiderie v3 — Production-Ready Ukrainian E-Commerce

React + Vite + TypeScript + Supabase + Google OAuth  
**SEO-оптимізований · Lazy Loading · Code Splitting · PWA-ready**

---

## ⚡ Швидкий старт

```bash
cd broiderie-v3
npm install
cp .env.example .env   # заповніть Supabase ключі
npm run dev
# → http://localhost:5173
```

---

## 🗄️ Supabase + Google OAuth

```bash
# 1. Створіть проект на supabase.com
# 2. Скопіюйте URL та anon key → .env
# 3. SQL Editor → вставте supabase-schema.sql
# 4. Authentication → Providers → Google → Enable
#    Додайте redirect: https://YOUR.supabase.co/auth/v1/callback
# 5. Зробіть себе адміном:
```
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 📈 SEO — що зроблено

### Технічне SEO
| Що | Де |
|---|---|
| `<title>` + `<meta description>` на кожну сторінку | `useSEO` hook |
| Open Graph теги (Facebook, Telegram) | `useSEO` hook |
| Twitter Card | `useSEO` hook |
| `<link rel="canonical">` | `useSEO` hook |
| `robots.txt` з правилами індексування | `public/robots.txt` |
| `sitemap.xml` — 20+ сторінок з пріоритетами | `public/sitemap.xml` |
| `site.webmanifest` (PWA) | `public/site.webmanifest` |
| Preconnect до Fonts, Unsplash | `index.html` |

### Structured Data (JSON-LD)
| Тип | Сторінка |
|---|---|
| `Organization` + `LocalBusiness` | Усі сторінки (`index.html`) |
| `WebSite` + `SearchAction` (Google Sitelinks Search) | `index.html` |
| `Product` + `AggregateRating` + `Offer` | `/product/:slug` |
| `Article` | `/blog/:slug` |
| `BreadcrumbList` | `/product/:slug`, `/catalog` |
| `LocalBusiness` з `OpeningHours` | `/contact` |
| `FAQPage` | `/contact` (можна додати) |

### Мета-дані на кожній сторінці
```
/ → "Вишивка ручної роботи — Колекція 2025"
/catalog → "Каталог вишитих виробів"
/product/[slug] → назва товару + матеріал + ціна
/blog → "Журнал — Про вишивку, культуру та традиції"
/blog/[slug] → заголовок статті + excerpt
/story → "Наша Історія — Broiderie з 2018"
/contact → "Контакти — Написати нам"
/auth → noindex (не індексується)
/account → noindex
/admin → noindex
```

---

## 🚀 Продуктивність

### Bundle splitting (Vite)
```
vendor-react      ~150KB  │ React, Router — рідко змінюється
vendor-motion     ~120KB  │ Framer Motion
vendor-supabase   ~85KB   │ Supabase client
vendor-ui         ~95KB   │ Lucide, hooks, toast
vendor-state      ~15KB   │ Zustand
pages/*           ~10-30KB│ Кожна сторінка окремо
```

### Lazy Loading зображень (`LazyImage`)
- **Blur-up**: завантажує 40px thumbnail → фейдить до повного
- **srcSet**: 400/800/1200/1600px + WebP формат (Unsplash API)
- **rootMargin 400px**: починає завантажувати до скролу
- **`fetchPriority="high"`** для above-fold зображень
- **Shimmer skeleton** поки зображення не готове

### React.lazy + Suspense
- Кожна сторінка — окремий JS chunk
- Завантажується тільки при відвідуванні маршруту
- Fallback — анімований орнамент (не порожній екран)

### Інші оптимізації
- `usePreloadCritical()` — preload hero-зображень
- `prefetchRoute()` — prefetch JS chunks при hover на посилання
- `imgUrl()` — генерує WebP URL з правильним розміром та якістю
- Шрифти: `display=swap` (немає FOUT блокування рендеру)
- Theme flash prevention — в `<head>` до React

---

## 📁 Структура

```
src/
├── hooks/
│   ├── useSEO.ts          ← meta, OG, JSON-LD per page
│   └── usePerformance.ts  ← imgUrl, srcSet, prefetch, preload
├── components/
│   ├── ui/
│   │   ├── LazyImage.tsx  ← blur-up + srcSet + WebP
│   │   ├── ProductCard.tsx
│   │   └── index.tsx      ← ThemeToggle, StarRating, SectionTitle, Breadcrumb
│   └── layout/
│       ├── Navbar.tsx     ← sticky + dropdown + search
│       ├── CartDrawer.tsx ← slide-in cart panel
│       ├── Footer.tsx
│       ├── Cursor.tsx
│       └── Layout.tsx
├── pages/
│   ├── Home.tsx           ← SEO + canvas hero + parallax
│   ├── Catalog.tsx        ← SEO + filters + grid/list
│   ├── ProductPage.tsx    ← SEO + JSON-LD Product + gallery
│   ├── Contact.tsx        ← SEO + redesigned blocks + FAQ
│   ├── Auth.tsx           ← noindex + Google OAuth
│   ├── Account.tsx        ← noindex + 6 tabs
│   ├── Blog.tsx + BlogPost.tsx ← SEO + Article schema
│   ├── Story.tsx          ← SEO + timeline
│   └── ...
├── store/index.ts         ← Zustand (cart, auth, wishlist, theme, ui)
├── lib/supabase.ts        ← Supabase + Google OAuth
├── data/index.ts          ← Mock data (12 products, reviews, blog)
├── types/index.ts
└── styles/app.css         ← Design tokens + utilities
public/
├── robots.txt             ← SEO crawl rules
├── sitemap.xml            ← 20+ URLs with priorities
└── site.webmanifest       ← PWA manifest
```

---

## 🏗️ Build

```bash
npm run build    # → dist/
npm run preview  # preview production build locally
```

### Деплой

**Vercel (рекомендовано для SPA):**
```bash
vercel --prod
# ENV vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

**Netlify:**
```bash
netlify deploy --prod --dir=dist
# + додайте public/_redirects: /* /index.html 200
```

---

## 🔍 Core Web Vitals checklist

- ✅ LCP: hero image preloaded + `fetchPriority="high"`
- ✅ CLS: LazyImage має fixed aspect ratio — немає layout shift
- ✅ FID/INP: event handlers lightweight, no blocking JS
- ✅ TTFB: статичний hosting (Vercel/Netlify edge)
- ✅ FCP: fonts `display=swap`, theme anti-flash script

---

Зроблено з ❤️ та вишитим орнаментом 🪡
