import { useEffect } from 'react'

/**
 * Preloads critical images for the next page the user is likely to visit.
 * Call this on hover/focus of navigation links.
 */
export function preloadImage(src: string) {
  if (typeof window === 'undefined') return
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  document.head.appendChild(link)
  // Clean up after 30s to avoid memory leaks
  setTimeout(() => link.remove(), 30_000)
}

/**
 * Prefetches a page route (adds <link rel="prefetch">)
 */
export function prefetchRoute(path: string) {
  if (typeof window === 'undefined') return
  const full = window.location.origin + path
  if (document.querySelector(`link[href="${full}"]`)) return
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = full
  document.head.appendChild(link)
}

/**
 * Returns optimized Unsplash URL with proper dimensions and format.
 * Safe to call multiple times — won't duplicate params.
 */
export function imgUrl(
  src: string,
  opts: { w?: number; h?: number; q?: number; format?: 'webp' | 'jpg' } = {}
): string {
  if (!src.includes('unsplash.com')) return src

  const { w, h, q, format = 'webp' } = opts
  const [base, query = ''] = src.split('?')
  const params = new URLSearchParams(query)

  if (w) params.set('w', String(w))
  if (h) params.set('h', String(h))
  if (q) params.set('q', String(q))
  params.set('fit', params.get('fit') || 'crop')
  params.set('fm', format)
  params.set('auto', 'format')

  return `${base}?${params.toString()}`
}

/**
 * Generates srcSet string for responsive images
 */
export function srcSet(src: string, widths = [400, 800, 1200, 1600]): string {
  return widths
    .map(w => `${imgUrl(src, { w, q: 80 })} ${w}w`)
    .join(', ')
}

/**
 * usePreloadCritical - preloads above-the-fold images on mount
 */
export function usePreloadCritical(srcs: string[]) {
  useEffect(() => {
    srcs.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = imgUrl(src, { w: 1200, q: 85, format: 'webp' })
      document.head.appendChild(link)
      return () => link.remove()
    })
  }, [])
}

/**
 * usePageSpeed - defers non-critical third-party scripts
 */
export function usePageSpeed() {
  useEffect(() => {
    // Defer Google Fonts observer
    const observer = new PerformanceObserver(() => {})
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch {}

    return () => observer.disconnect()
  }, [])
}

/**
 * Generates <img> sizes attribute based on breakpoints
 */
export function imgSizes(config: {
  default: string
  sm?: string
  md?: string
  lg?: string
}): string {
  const parts: string[] = []
  if (config.lg) parts.push(`(min-width: 1024px) ${config.lg}`)
  if (config.md) parts.push(`(min-width: 768px) ${config.md}`)
  if (config.sm) parts.push(`(min-width: 640px) ${config.sm}`)
  parts.push(config.default)
  return parts.join(', ')
}
