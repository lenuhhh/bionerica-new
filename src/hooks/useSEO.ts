import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
  schema?: Record<string, unknown>
}

const BASE = 'Bionerica — Свіжі ягоди, фрукти та овочі з ферми'
const BASE_DESC = 'Органічна ферма Bionerica. Свіжі ягоди, фрукти, овочі, зелень та розсада з доставкою в день збору.'
const BASE_URL = 'https://bionerica.ua'
const BASE_IMG = 'https://bionerica.ua/og-image.jpg'

export function useSEO({
  title, description, keywords, image, url, type = 'website', noindex, schema
}: SEOProps = {}) {
  const fullTitle = title
    ? (title.toLowerCase().includes('bionerica') ? title : `${title} | Bionerica`)
    : BASE
  const desc = description || BASE_DESC
  const img  = image || BASE_IMG
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Helper to set/create meta
    const setMeta = (sel: string, val: string, attr = 'name') => {
      let el = document.querySelector(sel) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        const [a, v] = sel.replace('meta[', '').replace(']', '').split('=')
        el.setAttribute(a, v.replace(/"/g, ''))
        document.head.appendChild(el)
      }
      el.setAttribute('content', val)
    }
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement
      if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el) }
      el.href = href
    }

    // Standard meta
    setMeta('meta[name="description"]', desc)
    setMeta('meta[name="keywords"]', keywords || 'ягоди, фрукти, овочі, органічна ферма, bionerica, доставка продуктів')
    setMeta('meta[name="robots"]', noindex ? 'noindex,nofollow' : 'index,follow')
    setMeta('meta[name="author"]', 'Bionerica')
    setMeta('meta[name="language"]', 'uk')
    setMeta('meta[name="geo.region"]', 'UA-53')
    setMeta('meta[name="geo.placename"]', 'Полтава')

    // Open Graph
    setMeta('meta[property="og:title"]',       fullTitle,  'property')
    setMeta('meta[property="og:description"]', desc,       'property')
    setMeta('meta[property="og:image"]',       img,        'property')
    setMeta('meta[property="og:url"]',         canonical,  'property')
    setMeta('meta[property="og:type"]',        type,       'property')
    setMeta('meta[property="og:locale"]',      'uk_UA',    'property')
    setMeta('meta[property="og:site_name"]',   'Bionerica','property')

    // Twitter Card
    setMeta('meta[name="twitter:card"]',        'summary_large_image')
    setMeta('meta[name="twitter:title"]',       fullTitle)
    setMeta('meta[name="twitter:description"]', desc)
    setMeta('meta[name="twitter:image"]',       img)
    setMeta('meta[name="twitter:site"]',        '@bionerica_ua')

    // Canonical
    setLink('canonical', canonical)

    // JSON-LD schema
    if (schema) {
      let schemaEl = document.getElementById('page-schema') as HTMLScriptElement
      if (!schemaEl) {
        schemaEl = document.createElement('script')
        schemaEl.id = 'page-schema'
        schemaEl.type = 'application/ld+json'
        document.head.appendChild(schemaEl)
      }
      schemaEl.textContent = JSON.stringify(schema)
    }
  }, [fullTitle, desc, img, canonical, type, noindex, keywords])
}

// Helpers to build common schemas
export const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bionerica',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: BASE_DESC,
  telephone: '+380505557799',
  email: 'hello@bionerica.ua',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'вул. Набережна, 34',
    addressLocality: 'Полтава',
    addressRegion: 'Полтавська область',
    postalCode: '36000',
    addressCountry: 'UA',
  },
  sameAs: [
    'https://instagram.com/bionerica_ua',
    'https://facebook.com/bionerica',
    'https://youtube.com/@bionerica',
  ],
}

export function productSchema(p: {
  name: string; description: string; price: number; images: string[];
  rating: number; reviewCount: number; inStock: boolean; slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images,
    url: `${BASE_URL}/product/${p.slug}`,
    brand: { '@type': 'Brand', name: 'Bionerica' },
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'UAH',
      availability: p.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Bionerica' },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  }
}

export function articleSchema(post: {
  title: string; excerpt: string; image: string; author: string;
  created_at: string; slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    url: `${BASE_URL}/blog/${post.slug}`,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Bionerica',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    datePublished: post.created_at,
    dateModified: post.created_at,
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  }
}

export function breadcrumbSchema(items: { label: string; to?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.to ? `${BASE_URL}${item.to}` : undefined,
    })),
  }
}

/** Будує FAQPage JSON-LD schema для сторінки FAQ */
export function buildFAQSchema(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

/** Будує Product JSON-LD schema (розширена версія для Schema.org) */
export function buildProductSchema(p: {
  name: string
  description: string
  price: number
  images: string[]
  rating?: number
  reviewCount?: number
  inStock: boolean
  slug: string
}): Record<string, unknown> {
  return productSchema({
    name: p.name,
    description: p.description,
    price: p.price,
    images: p.images,
    rating: p.rating ?? 5,
    reviewCount: p.reviewCount ?? 1,
    inStock: p.inStock,
    slug: p.slug,
  })
}
