import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ── Platform detection ─────────────────────────────────────────── */
export type OSType = 'ios' | 'android' | 'desktop'

export function getOS(): OSType {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !(ua as any).MSStream) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/* ── Persistent store ───────────────────────────────────────────── */
interface PWAStore {
  dismissed: boolean
  dismissedAt: number
  installed: boolean
  setDismissed: () => void
  setInstalled: () => void
  reset: () => void
}

export const usePWAStore = create<PWAStore>()(
  persist(
    set => ({
      dismissed:   false,
      dismissedAt: 0,
      installed:   false,
      setDismissed: () => set({ dismissed: true, dismissedAt: Date.now() }),
      setInstalled: () => set({ installed: true }),
      reset:        () => set({ dismissed: false, dismissedAt: 0 }),
    }),
    { name: 'broiderie-pwa-v2' }
  )
)

/* ── BeforeInstallPromptEvent ───────────────────────────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/* ══════════════════════════════════════════════════════════════════
   usePWAInstall — Universal hook, all platforms
   
   Android Chrome:  fires beforeinstallprompt → native prompt
   iOS Safari:      no event → show manual guide after delay
   Desktop Chrome:  fires beforeinstallprompt → native prompt
   Desktop Edge:    same as Chrome
   Firefox/Others:  show manual guide
══════════════════════════════════════════════════════════════════ */
export function usePWAInstall() {
  const [prompt, setPrompt]       = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [iosReady, setIosReady]   = useState(false)
  const { dismissed, dismissedAt, installed, setDismissed, setInstalled } = usePWAStore()
  const os = getOS()

  // Re-show after 72 hours
  const isSnoozed = dismissed && dismissedAt > 0
    ? (Date.now() - dismissedAt) < 72 * 60 * 60 * 1000
    : false

  const alreadyInstalled = installed || isStandalone()

  useEffect(() => {
    if (alreadyInstalled) return

    // Android / Desktop — Chrome fires this event
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    const onInstalled = () => {
      setInstalled()
      setCanInstall(false)
      setPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled',        onInstalled)

    // iOS Safari — show guide after 4 seconds on page
    let t: ReturnType<typeof setTimeout> | undefined
    if (os === 'ios' && !isSnoozed) {
      t = setTimeout(() => setIosReady(true), 4000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled',        onInstalled)
      if (t) clearTimeout(t)
    }
  }, [os, isSnoozed, alreadyInstalled])

  // Trigger native install prompt (Android/Desktop)
  const installNative = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!prompt) return 'unavailable'
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled()
      setCanInstall(false)
      setPrompt(null)
    }
    return outcome
  }

  const snooze = () => setDismissed()

  const showBanner =
    !alreadyInstalled &&
    !isSnoozed &&
    (canInstall || (os === 'ios' && iosReady))

  return {
    os,
    canInstall,           // Android/Desktop: native prompt ready
    iosReady,             // iOS: time to show manual guide
    showBanner,           // whether to show install UI at all
    alreadyInstalled,
    installNative,
    snooze,
  }
}
