import { retryWithBackoff } from '@/lib/network'

export type OfflineActionType = 'create-order' | 'send-chat-message'

export type OfflineAction = {
  id: string
  type: OfflineActionType
  payload: Record<string, unknown>
  createdAt: number
}

const QUEUE_KEY = 'bionerica_offline_queue_v1'
const MAX_ITEMS = 120

function loadQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    const parsed = raw ? (JSON.parse(raw) as OfflineAction[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveQueue(items: OfflineAction[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)))
  } catch {
    // ignore localStorage errors
  }
}

export function enqueueOfflineAction(type: OfflineActionType, payload: Record<string, unknown>) {
  const next: OfflineAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
  }
  const queue = loadQueue()
  queue.push(next)
  saveQueue(queue)
}

export function getOfflineQueueSize() {
  return loadQueue().length
}

export async function flushOfflineQueue(handlers: {
  'create-order'?: (payload: Record<string, unknown>) => PromiseLike<unknown>
  'send-chat-message'?: (payload: Record<string, unknown>) => PromiseLike<unknown>
}): Promise<{ processed: number; failed: number }> {
  const queue = loadQueue()
  if (!queue.length) return { processed: 0, failed: 0 }

  const rest: OfflineAction[] = []
  let processed = 0

  for (const action of queue) {
    const handler = handlers[action.type]
    if (!handler) {
      rest.push(action)
      continue
    }

    try {
      await retryWithBackoff(() => handler(action.payload), { retries: 2, baseDelayMs: 300 })
      processed += 1
    } catch {
      rest.push(action)
    }
  }

  saveQueue(rest)
  return { processed, failed: rest.length }
}
