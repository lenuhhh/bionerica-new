import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PromoCode {
  code: string
  type: 'percent' | 'fixed' | 'free_shipping'
  value: number           // % or ₴
  min_order?: number      // minimum order for the code to apply
  max_uses?: number
  used_count: number
  expires_at?: string     // ISO date
  description: string
  active: boolean
}

export interface Referral {
  code: string            // user's personal referral code
  referred_by?: string    // code used when they registered
  referral_count: number  // how many people they've referred
  bonus_earned: number    // ₴ earned from referrals
  bonus_pending: number   // waiting for referred user's first purchase
}

/* Mock promo codes (replace with Supabase fetch in production) */
export const PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    description: '10% знижки для нових клієнтів',
    used_count: 0,
    active: true,
  },
  {
    code: 'BROIDERIE15',
    type: 'percent',
    value: 15,
    min_order: 3000,
    description: '15% при замовленні від 3000₴',
    used_count: 0,
    active: true,
  },
  {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    description: 'Безкоштовна доставка',
    used_count: 0,
    active: true,
  },
  {
    code: 'SPRING500',
    type: 'fixed',
    value: 500,
    min_order: 2000,
    description: '500₴ знижки на весняну колекцію',
    expires_at: '2025-06-01',
    used_count: 0,
    active: true,
  },
  {
    code: 'REF10',
    type: 'percent',
    value: 10,
    description: '10% знижки для запрошених друзів',
    used_count: 0,
    active: true,
  },
]

interface DiscountStore {
  appliedCode: PromoCode | null
  referral: Referral | null
  loyaltyDiscount: number   // ₴ from loyalty points
  applyCode:    (code: string) => { success: boolean; message: string }
  removeCode:   () => void
  applyLoyalty: (points: number, orderTotal: number) => number
  setReferral:  (r: Referral) => void
  getDiscount:  (orderTotal: number) => number
  getFreeShipping: () => boolean
}

export const useDiscount = create<DiscountStore>()(
  persist(
    (set, get) => ({
      appliedCode:     null,
      referral:        null,
      loyaltyDiscount: 0,

      applyCode: (rawCode: string) => {
        const code = rawCode.trim().toUpperCase()
        const promo = PROMO_CODES.find(p => p.code === code)

        if (!promo)        return { success: false, message: 'Промокод не знайдено' }
        if (!promo.active) return { success: false, message: 'Промокод неактивний' }
        if (promo.expires_at && new Date(promo.expires_at) < new Date())
          return { success: false, message: 'Термін дії промокоду минув' }

        set({ appliedCode: promo })
        return { success: true, message: `Промокод «${code}» застосовано! ${promo.description}` }
      },

      removeCode: () => set({ appliedCode: null }),

      applyLoyalty: (points: number, orderTotal: number) => {
        // 1 point = 0.5₴, max 30% of order
        const maxDiscount = orderTotal * 0.30
        const discount    = Math.min(points * 0.5, maxDiscount)
        const rounded     = Math.floor(discount)
        set({ loyaltyDiscount: rounded })
        return rounded
      },

      setReferral: (referral) => set({ referral }),

      getDiscount: (orderTotal: number) => {
        const { appliedCode, loyaltyDiscount } = get()
        let total = loyaltyDiscount

        if (appliedCode) {
          if (appliedCode.min_order && orderTotal < appliedCode.min_order) return total
          if (appliedCode.type === 'percent') {
            total += Math.round(orderTotal * appliedCode.value / 100)
          } else if (appliedCode.type === 'fixed') {
            total += appliedCode.value
          }
        }

        return Math.min(total, orderTotal) // can't discount more than total
      },

      getFreeShipping: () => {
        const { appliedCode } = get()
        return appliedCode?.type === 'free_shipping'
      },
    }),
    { name: 'broiderie-discount' }
  )
)

/* Generate referral code from user ID */
export function generateReferralCode(userId: string): string {
  const base = userId.slice(0, 6).toUpperCase().replace(/-/g, '')
  return `REF${base}`
}

/* Calculate referral bonus */
export function calcReferralBonus(orderTotal: number): number {
  return Math.floor(orderTotal * 0.05) // 5% of referred user's first order
}
