import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(URL, KEY)

/* ── AUTH ── */
export const signInGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/account`,   // ← was /profile (404)
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

export const signInEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const resendSignupConfirmation = (email: string) =>
  supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/account`,
    },
  })

export const signUpEmail = (email: string, password: string, name: string) =>
  supabase.auth.signUp({
    email, password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/account`,
    },
  })

export const signOut = () => supabase.auth.signOut()
export const getSession = () => supabase.auth.getSession()

/* ── FORGOT PASSWORD ── */
export const resetPassword = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth`,
  })

export const updatePassword = (newPassword: string) =>
  supabase.auth.updateUser({ password: newPassword })

/* ── PROFILE ── */
export const getProfile = (id: string) =>
  supabase.from('profiles').select('*').eq('id', id).single()

export const updateProfile = (id: string, data: Record<string, unknown>) =>
  supabase.from('profiles').update(data).eq('id', id)

export const getAllProfiles = () =>
  supabase.from('profiles').select('*').order('created_at', { ascending: false })

// Ensure profile row exists and contains latest public identity data.
// Password is never stored here; Supabase Auth stores only secure hashes internally.
export const ensureProfile = (user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}) => {
  const fullName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    null

  return supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: fullName,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()
}

/* ── ORDERS ── */
export const createOrder = (order: Record<string, unknown>) =>
  supabase.from('orders').insert([order]).select().single()

/**
 * Atomically adjust loyalty_points for a user.
 * Pass a positive delta to earn, negative to spend.
 * Uses RPC if available; falls back to read-then-write.
 */
export const adjustLoyaltyPoints = async (userId: string, delta: number): Promise<void> => {
  // Try RPC first (if defined in DB)
  const { error: rpcError } = await supabase.rpc('increment_loyalty_points', {
    p_user_id: userId,
    p_delta: delta,
  })
  if (!rpcError) return

  // Fallback: optimistic read-then-write (safe for low-concurrency)
  const { data } = await supabase
    .from('profiles')
    .select('loyalty_points')
    .eq('id', userId)
    .single()
  const current = (data as { loyalty_points?: number } | null)?.loyalty_points ?? 0
  const next = Math.max(0, current + delta)
  await supabase.from('profiles').update({ loyalty_points: next }).eq('id', userId)
}

export const getOrders = (userId: string) =>
  supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })

export const getAllOrders = () =>
  supabase.from('orders').select('*').order('created_at', { ascending: false })

export const updateOrderStatus = (orderId: string, status: string) =>
  supabase.from('orders').update({ status }).eq('id', orderId)

/* ── REVIEWS ── */
export const addReview = (review: Record<string, unknown>, signal?: AbortSignal) => {
  const query = supabase.from('reviews').insert([review])
  return signal ? query.abortSignal(signal) : query
}

export const getProductReviews = (productId: number) =>
  supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false })

export const getAllReviews = () =>
  supabase.from('reviews').select('*').order('created_at', { ascending: false })

export const setReviewApproved = (reviewId: number, approved: boolean) =>
  supabase.from('reviews').update({ approved }).eq('id', reviewId)

export const removeReview = (reviewId: number) =>
  supabase.from('reviews').delete().eq('id', reviewId)

/* ── WISHLIST ── */
export const getWishlist = (userId: string) =>
  supabase.from('wishlist').select('product_id').eq('user_id', userId)

export const addWishlist = (userId: string, productId: number) =>
  supabase.from('wishlist').insert([{ user_id: userId, product_id: productId }])

export const removeWishlist = (userId: string, productId: number) =>
  supabase.from('wishlist').delete().eq('user_id', userId).eq('product_id', productId)

/* ── PRODUCTS (from DB, not mock) ── */
export const getProducts = (opts?: { category?: string; limit?: number }) => {
  let q = supabase.from('products').select('*').eq('in_stock', true)
  if (opts?.category) q = q.eq('category', opts.category)
  if (opts?.limit)    q = q.limit(opts.limit)
  return q.order('created_at', { ascending: false })
}

export const getAllProducts = () =>
  supabase.from('products').select('*').order('created_at', { ascending: false })

export const getProduct = (slug: string) =>
  supabase.from('products').select('*').eq('slug', slug).single()

export const createProduct = (product: Record<string, unknown>) =>
  supabase.from('products').insert([product]).select('*').maybeSingle()

export const updateProduct = (productId: number, patch: Record<string, unknown>) =>
  supabase.from('products').update(patch).eq('id', productId).select('*').maybeSingle()

export const upsertProduct = (product: Record<string, unknown>) =>
  supabase.from('products').upsert([product], { onConflict: 'slug' }).select('*').maybeSingle()

export const deleteProduct = (productId: number) =>
  supabase.from('products').delete().eq('id', productId)

/* ── CONVERSATIONS & MESSAGES ── */
export const createConversation = (conversation: Record<string, unknown>) =>
  supabase.from('conversations').insert([conversation]).select('*').single()

export const getConversations = (userId?: string) => {
  let q = supabase.from('conversations').select('*').order('updated_at', { ascending: false })
  if (userId) q = q.eq('user_id', userId)
  return q
}

export const getAllConversations = () =>
  supabase.from('conversations').select('*').order('updated_at', { ascending: false })

export const getConversationMessages = (conversationId: number) =>
  supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })

export const addMessage = (message: Record<string, unknown>) =>
  supabase.from('messages').insert([message]).select('*').single()

export const updateConversation = (conversationId: number, patch: Record<string, unknown>) =>
  supabase.from('conversations').update(patch).eq('id', conversationId).select('*').single()

export const getPosts = () =>
  supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false })

export const getAllPosts = () =>
  supabase.from('posts').select('*').order('created_at', { ascending: false })

export const getPost = (slug: string) =>
  supabase.from('posts').select('*').eq('slug', slug).single()

export const createPost = (post: Record<string, unknown>) =>
  supabase.from('posts').insert([post]).select('*').single()

export const updatePost = (postId: number, patch: Record<string, unknown>) =>
  supabase.from('posts').update(patch).eq('id', postId).select('*').single()

export const deletePost = (postId: number) =>
  supabase.from('posts').delete().eq('id', postId)

/* ── NEWSLETTER / SUBSCRIBERS ── */
export const subscribeNewsletter = (email: string, telegram?: string) =>
  supabase.from('subscribers').upsert(
    [{ email: email.trim().toLowerCase(), telegram: telegram?.trim() || null, subscribed_at: new Date().toISOString() }],
    { onConflict: 'email' }
  )

/* ── PUBLIC ORDER TRACKING ── */
/** Отримати замовлення за ID без авторизації (обмежений набір полів) */
export const getPublicOrderById = (orderId: string) =>
  supabase
    .from('orders')
    .select('id, status, created_at, updated_at, estimated_delivery, tracking, items, total, delivery_method')
    .eq('id', orderId)
    .maybeSingle()

/* ── ORDER ADMIN NOTE ── */
export const addOrderAdminNote = (orderId: string, adminNote: string) =>
  supabase.from('orders').update({ admin_note: adminNote }).eq('id', orderId)

/* ── PARTNER APPLICATIONS ── */
export const submitPartnerApplication = (data: {
  company: string; contact: string; email: string; phone?: string;
  type: string; volume: string; message?: string
}) =>
  supabase.from('partner_applications').insert([{ ...data, status: 'new' }])

export const getAllPartnerApplications = () =>
  supabase.from('partner_applications')
    .select('id, company, contact, email, phone, type, volume, message, status, created_at')
    .order('created_at', { ascending: false })

export const updatePartnerApplicationStatus = (id: string, status: string) =>
  supabase.from('partner_applications').update({ status }).eq('id', id)

/* ── STORAGE ── */
export const uploadAvatar = async (userId: string, file: File) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export const uploadProductImage = async (file: File, productSlug: string) => {
  const ext = file.name.split('.').pop()
  const path = `${productSlug}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}
