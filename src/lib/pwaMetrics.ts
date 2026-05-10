type MetricName =
  | 'pwa_install_prompt_shown'
  | 'pwa_install_accepted'
  | 'pwa_install_dismissed'
  | 'push_permission_granted'
  | 'push_permission_denied'
  | 'push_notification_shown'

const KEY = 'bionerica_pwa_metrics_v1'

type MetricsState = {
  counts: Record<MetricName, number>
  lastUpdatedAt: number
}

const emptyState = (): MetricsState => ({
  counts: {
    pwa_install_prompt_shown: 0,
    pwa_install_accepted: 0,
    pwa_install_dismissed: 0,
    push_permission_granted: 0,
    push_permission_denied: 0,
    push_notification_shown: 0,
  },
  lastUpdatedAt: Date.now(),
})

function loadMetrics(): MetricsState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as MetricsState
    return parsed?.counts ? parsed : emptyState()
  } catch {
    return emptyState()
  }
}

function saveMetrics(state: MetricsState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function recordPwaMetric(name: MetricName, inc = 1) {
  const state = loadMetrics()
  state.counts[name] = (state.counts[name] || 0) + inc
  state.lastUpdatedAt = Date.now()
  saveMetrics(state)
}

export function getPwaMetrics() {
  return loadMetrics()
}
