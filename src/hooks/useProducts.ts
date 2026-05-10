/**
 * useProducts — universal data hook
 *
 * Priority:
 * 1. Supabase (when VITE_SUPABASE_URL is a real project URL)
 * 2. Mock data from @/data (when Supabase is not yet connected)
 *
 * This means the site works immediately with demo data AND
 * automatically switches to real data once Supabase is configured.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { products as mockProducts, blogPosts as mockPosts } from '@/data'
import type { Product, BlogPost } from '@/types'

const ADMIN_POSTS_KEY = 'bionerica_admin_posts_v1'
const ADMIN_DELETED_PRODUCTS_KEY = 'bionerica_admin_deleted_products_v1'

const IS_REAL_SUPABASE = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project')
)

const BIONERICA_CATEGORY_IDS = new Set([
  'berries',
  'fruits',
  'vegetables',
  'greens',
  'plants',
  'baskets',
])

function isBionericaProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false
  const product = value as Partial<Product>
  return Boolean(
    typeof product.id === 'number' &&
    typeof product.slug === 'string' &&
    typeof product.name_uk === 'string' &&
    typeof product.unit === 'string' &&
    typeof product.price === 'number' &&
    typeof product.category === 'string' &&
    BIONERICA_CATEGORY_IDS.has(product.category) &&
    Array.isArray(product.images)
  )
}

function isBionericaPost(value: unknown): value is BlogPost {
  if (!value || typeof value !== 'object') return false
  const post = value as Partial<BlogPost>
  return Boolean(
    typeof post.id === 'number' &&
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.content === 'string' &&
    typeof post.image === 'string' &&
    typeof post.excerpt === 'string' &&
    typeof post.category === 'string' &&
    Array.isArray(post.tags) &&
    typeof post.author === 'string' &&
    typeof post.read_time === 'string' &&
    typeof post.published === 'boolean'
  )
}

function loadLocalPosts(): BlogPost[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(ADMIN_POSTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBionericaPost)
  } catch {
    return []
  }
}

function applyLimit(posts: BlogPost[], limit?: number) {
  return limit ? posts.slice(0, limit) : posts
}

function loadDeletedProductSlugs(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(ADMIN_DELETED_PRODUCTS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    return new Set()
  }
}

function buildCatalogProducts(remoteProducts: Product[]): Product[] {
  const deletedSlugs = loadDeletedProductSlugs()
  const map = new Map<string, Product>()

  for (const baseProduct of mockProducts as Product[]) {
    if (!deletedSlugs.has(baseProduct.slug)) {
      map.set(baseProduct.slug, baseProduct)
    }
  }

  for (const remoteProduct of remoteProducts) {
    const key = remoteProduct.slug || String(remoteProduct.id)
    if (!deletedSlugs.has(key)) {
      map.set(key, remoteProduct)
    }
  }

  return Array.from(map.values())
}

function applyProductFilters(
  list: Product[],
  options?: {
    category?: string
    search?: string
    sort?: string
    filter?: string
    maxPrice?: number
    limit?: number
  },
): Product[] {
  let filtered = [...list]
  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter(p => p.category === options.category)
  }
  if (options?.search) {
    const q = options.search.toLowerCase()
    filtered = filtered.filter(p =>
      p.name_uk.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      (p.description || '').toLowerCase().includes(q),
    )
  }
  if (options?.filter === 'bestseller') filtered = filtered.filter(p => p.is_bestseller)
  if (options?.filter === 'new') filtered = filtered.filter(p => p.is_new)
  if (options?.maxPrice) filtered = filtered.filter(p => p.price <= options.maxPrice)
  if (options?.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price)
  if (options?.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price)
  if (options?.sort === 'rating') filtered.sort((a, b) => b.rating - a.rating)
  if (options?.sort === 'newest') {
    filtered = [...filtered.filter(p => p.is_new), ...filtered.filter(p => !p.is_new)]
  }
  if (options?.limit) filtered = filtered.slice(0, options.limit)
  return filtered
}

/* ── Products ──────────────────────────────────────────────────────── */
export function useProducts(options?: {
  category?: string
  search?: string
  sort?: string
  filter?: string
  maxPrice?: number
  limit?: number
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      if (!IS_REAL_SUPABASE) {
        // Mock catalog with admin deletion overrides applied.
        const list = applyProductFilters(buildCatalogProducts([]), options)
        if (!cancelled) { setProducts(list); setLoading(false) }
        return
      }

      // Real Supabase query
      try {
        let query = supabase.from('products').select('*')
        if (options?.category && options.category !== 'all') {
          query = query.eq('category', options.category)
        }
        if (options?.search) {
          query = query.or(`name_uk.ilike.%${options.search}%,description.ilike.%${options.search}%`)
        }
        if (options?.filter === 'bestseller') query = query.eq('is_bestseller', true)
        if (options?.filter === 'new')        query = query.eq('is_new', true)
        if (options?.maxPrice) query = query.lte('price', options.maxPrice)
        if (options?.sort === 'price-asc')  query = query.order('price', { ascending: true })
        if (options?.sort === 'price-desc') query = query.order('price', { ascending: false })
        if (options?.sort === 'rating')     query = query.order('rating', { ascending: false })
        else                                query = query.order('created_at', { ascending: false })
        if (options?.limit) query = query.limit(options.limit)

        const { data, error: err } = await query
        if (!cancelled) {
          if (err) {
            setError(err.message)
            setProducts(applyProductFilters(buildCatalogProducts([]), options))
          } else {
            const remoteProducts = (data || []) as unknown[]
            const validRemoteProducts = remoteProducts.filter(isBionericaProduct)
            setProducts(applyProductFilters(buildCatalogProducts(validRemoteProducts), options))
          }
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e))
          setProducts(applyProductFilters(buildCatalogProducts([]), options))
          setLoading(false)
        }
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [
    options?.category, options?.search, options?.sort,
    options?.filter, options?.maxPrice, options?.limit,
  ])

  return { products, loading, error }
}

/* ── Single product by slug ────────────────────────────────────────── */
export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    if (!IS_REAL_SUPABASE) {
      const p = buildCatalogProducts([]).find(p => p.slug === slug)
      setProduct(p || null)
      setLoading(false)
      return
    }

    supabase.from('products').select('*').eq('slug', slug).single()
      .then(({ data }) => {
        const fallback = buildCatalogProducts([]).find(p => p.slug === slug) || null
        setProduct(isBionericaProduct(data) ? data : fallback)
        setLoading(false)
      })
  }, [slug])

  return { product, loading }
}

/* ── Blog posts ────────────────────────────────────────────────────── */
export function usePosts(limit?: number) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localPosts = loadLocalPosts()
    const fallbackPosts = localPosts.length > 0 ? localPosts : (mockPosts as BlogPost[])

    if (!IS_REAL_SUPABASE) {
      setPosts(applyLimit(fallbackPosts, limit))
      setLoading(false)
      return
    }

    let query = supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)
    query.then(({ data, error }) => {
      if (error) {
        setPosts(applyLimit(fallbackPosts, limit))
        setLoading(false)
        return
      }
      const remotePosts = (data || []) as unknown[]
      const validRemotePosts = remotePosts.filter(isBionericaPost)
      setPosts(validRemotePosts.length > 0 ? validRemotePosts : applyLimit(fallbackPosts, limit))
      setLoading(false)
    })
  }, [limit])

  return { posts, loading }
}

/* ── Single post by slug ───────────────────────────────────────────── */
export function usePost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    const localPosts = loadLocalPosts()
    const localMatch = localPosts.find(p => p.slug === slug) || null

    if (!IS_REAL_SUPABASE) {
      const p = localMatch || (mockPosts.find(p => p.slug === slug) as BlogPost | undefined) || null
      setPost(p)
      setLoading(false)
      return
    }

    supabase.from('posts').select('*').eq('slug', slug).eq('published', true).single()
      .then(({ data }) => {
        const fallback = localMatch || (mockPosts.find(p => p.slug === slug) || null)
        setPost(isBionericaPost(data) ? data : fallback)
        setLoading(false)
      })
  }, [slug])

  return { post, loading }
}

export { IS_REAL_SUPABASE }
