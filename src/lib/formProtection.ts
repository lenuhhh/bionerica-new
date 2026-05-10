/**
 * formProtection.ts
 * Клієнтський захист форм:
 *  - Rate limiting через localStorage (ковзаюче вікно)
 *  - Honeypot-поле для фільтрації ботів
 *  - Базова валідація полів
 */

const RATE_LIMIT_KEY = 'bionerica_form_submissions'
const WINDOW_MS      = 60_000   // 1 хвилина
const MAX_PER_WINDOW = 5        // не більше 5 відправок за хвилину

type Submission = { ts: number }

/** Перевіряє і реєструє нову спробу. Повертає true якщо дозволено. */
export function checkRateLimit(formKey = 'default'): boolean {
  try {
    const storageKey = `${RATE_LIMIT_KEY}_${formKey}`
    const now = Date.now()
    const raw = sessionStorage.getItem(storageKey)
    const subs: Submission[] = raw ? (JSON.parse(raw) as Submission[]) : []

    // Видаляємо застарілі записи
    const recent = subs.filter(s => now - s.ts < WINDOW_MS)

    if (recent.length >= MAX_PER_WINDOW) return false

    recent.push({ ts: now })
    sessionStorage.setItem(storageKey, JSON.stringify(recent))
    return true
  } catch {
    // sessionStorage недоступний — пропускаємо
    return true
  }
}

/** Перевіряє honeypot-поле. Якщо воно заповнене — це бот. */
export function isHoneypotFilled(value: string): boolean {
  return value.trim().length > 0
}

/** Стандартні валідатори */
export const validators = {
  /** Перевіряє email (базовий RFC-сумісний regex) */
  email(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
  },

  /** Перевіряє телефон (UA / загальний формат) */
  phone(value: string): boolean {
    const digits = value.replace(/\D/g, '')
    return digits.length >= 9 && digits.length <= 15
  },

  /** Мінімальна довжина */
  minLength(value: string, min: number): boolean {
    return value.trim().length >= min
  },

  /** Максимальна довжина (захист від переповнення) */
  maxLength(value: string, max: number): boolean {
    return value.trim().length <= max
  },

  /** Тільки безпечні символи (без HTML/script тегів) */
  noHtml(value: string): boolean {
    return !/<[^>]*>/.test(value)
  },
}

/** Валідує контактну форму — повертає об'єкт з помилками */
export function validateContactForm(data: {
  name: string
  email: string
  phone?: string
  message: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!validators.minLength(data.name, 2)) {
    errors.name = "Ім'я має містити щонайменше 2 символи"
  }
  if (!validators.maxLength(data.name, 100)) {
    errors.name = "Ім'я занадто довге"
  }
  if (!validators.noHtml(data.name)) {
    errors.name = 'Недопустимі символи'
  }

  if (!validators.email(data.email)) {
    errors.email = 'Введіть коректний email'
  }

  if (data.phone && !validators.phone(data.phone)) {
    errors.phone = 'Введіть коректний номер телефону'
  }

  if (!validators.minLength(data.message, 10)) {
    errors.message = 'Повідомлення має містити щонайменше 10 символів'
  }
  if (!validators.maxLength(data.message, 2000)) {
    errors.message = 'Повідомлення занадто довге (макс. 2000 символів)'
  }
  if (!validators.noHtml(data.message)) {
    errors.message = 'Недопустимі символи у повідомленні'
  }

  return errors
}
