import { useState, useEffect, useCallback } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
  formatted: string
}

export function useCountdown(targetDate: Date | string | number): CountdownResult {
  const target = new Date(targetDate).getTime()

  const calc = useCallback((): CountdownResult => {
    const diff = target - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, formatted: '00:00:00' }
    const days    = Math.floor(diff / 86_400_000)
    const hours   = Math.floor((diff % 86_400_000) / 3_600_000)
    const minutes = Math.floor((diff % 3_600_000) / 60_000)
    const seconds = Math.floor((diff % 60_000) / 1_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatted = days > 0
      ? `${days}д ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return { days, hours, minutes, seconds, expired: false, formatted }
  }, [target])

  const [state, setState] = useState<CountdownResult>(calc)

  useEffect(() => {
    if (state.expired) return
    const id = setInterval(() => setState(calc()), 1000)
    return () => clearInterval(id)
  }, [calc, state.expired])

  return state
}

/* Pre-built countdown targets */
export function endOfDay()  { const d = new Date(); d.setHours(23, 59, 59, 999); return d }
export function endOfWeek() { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); d.setHours(23,59,59,999); return d }
export function hoursFromNow(h: number) { return new Date(Date.now() + h * 3_600_000) }
