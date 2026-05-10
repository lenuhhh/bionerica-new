import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PresenceMeta = {
  online_at: string
  path: string
  user_id?: string | null
}

export function useSitePresence(userId?: string | null) {
  const [onlineNow, setOnlineNow] = useState(1)
  const [connected, setConnected] = useState(false)

  const presenceKey = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 8)
    return `${userId || 'guest'}-${suffix}`
  }, [userId])

  useEffect(() => {
    const channel = supabase.channel('site-presence-live', {
      config: { presence: { key: presenceKey } },
    })

    const syncCount = () => {
      const state = channel.presenceState<PresenceMeta>()
      const count = Object.keys(state || {}).length
      setOnlineNow(Math.max(1, count))
    }

    channel
      .on('presence', { event: 'sync' }, syncCount)
      .on('presence', { event: 'join' }, syncCount)
      .on('presence', { event: 'leave' }, syncCount)
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          await channel.track({
            online_at: new Date().toISOString(),
            path: typeof window !== 'undefined' ? window.location.pathname : '/',
            user_id: userId || null,
          })
        }
      })

    const onVisibility = async () => {
      if (document.visibilityState === 'visible') {
        await channel.track({
          online_at: new Date().toISOString(),
          path: window.location.pathname,
          user_id: userId || null,
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      channel.untrack()
      supabase.removeChannel(channel)
      setConnected(false)
    }
  }, [presenceKey, userId])

  return { onlineNow, connected }
}
