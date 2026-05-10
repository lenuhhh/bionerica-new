export interface Product {
  id: number
  slug: string
  name: string       // EN
  name_uk: string    // UA
  subtitle?: string
  price: number                      // price per base unit (UAH)
  old_price?: number
  category: string
  subcategory?: string
  tags: string[]
  description: string
  description_long?: string
  benefits?: string[]                // health / nutritional benefits
  storage?: string[]                 // storage instructions
  unit: string                       // e.g. "кг", "шт", "ящик", "пучок"
  weight_options?: string[]          // e.g. ["0.5 кг","1 кг","3 кг","5 кг"]
  min_order?: string                 // e.g. "1 кг"
  origin?: string                    // farm / region
  harvest_date?: string              // e.g. "25 квітня 2026"
  shelf_life?: string                // e.g. "5–7 днів"
  season?: string[]                  // e.g. ["червень","липень","серпень"]
  is_seasonal?: boolean
  is_organic?: boolean
  calories?: string                  // e.g. "52 ккал / 100г"
  images: string[]
  video?: string
  in_stock: boolean
  stock_count?: number
  is_new?: boolean
  is_bestseller?: boolean
  is_limited?: boolean
  rating: number
  review_count: number
  related_ids?: number[]
}

export interface Review {
  id: number
  product_id: number
  user_id?: string
  author: string
  avatar?: string
  rating: number
  title: string
  text: string
  images?: string[]
  approved?: boolean
  verified_purchase: boolean
  helpful: number
  created_at: string
}

export interface BlogPost {
  id: number
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  content: string
  image: string
  gallery?: string[]
  category: string
  tags: string[]
  author: string
  author_avatar?: string
  read_time: string
  published: boolean
  created_at: string
}

export interface CartItem {
  product: Product
  qty: number
  weight_option?: string
}

export interface Order {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: { product_id: number; name: string; qty: number; price: number; image: string }[]
  total: number
  delivery_method: string
  address: string
  phone: string
  notes?: string
  tracking?: string
  estimated_delivery?: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  role: 'customer' | 'admin'
  birthday?: string
  city?: string
  total_orders: number
  total_spent: number
  loyalty_points: number
  created_at: string
}

export type Theme = 'light' | 'dark' | 'system'

export interface Category {
  id: string
  label: string
  label_uk: string
  icon?: string
  description?: string
  image?: string
  count?: number
  season_peak?: string              // e.g. "Червень — Вересень"
}
