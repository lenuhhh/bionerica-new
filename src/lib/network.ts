export type RetryOptions = {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

export function isLikelyNetworkError(error: unknown): boolean {
  if (!error) return false
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true

  const msg = String((error as { message?: string }).message || '').toLowerCase()
  return msg.includes('network') || msg.includes('failed to fetch') || msg.includes('timeout')
}

export async function retryWithBackoff<T>(
  fn: () => PromiseLike<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3
  const baseDelayMs = options.baseDelayMs ?? 350
  const maxDelayMs = options.maxDelayMs ?? 3000

  let attempt = 0
  let lastError: unknown

  while (attempt <= retries) {
    try {
      return await Promise.resolve(fn())
    } catch (error) {
      lastError = error
      if (attempt === retries) break

      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt))
      await new Promise(resolve => setTimeout(resolve, delay))
      attempt += 1
    }
  }

  throw lastError
}
