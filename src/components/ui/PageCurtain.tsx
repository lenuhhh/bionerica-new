import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * PageCurtain — full-screen transition overlay.
 *
 * On every route change:
 *   1. Curtain sweeps DOWN (covers old page)         0–220ms
 *   2. Page content has already changed underneath   ~220ms
 *   3. Curtain sweeps UP (reveals new page)          220–480ms
 *
 * The div is always in the DOM (hidden via CSS) so that adding
 * the animation class on an EXISTING element reliably triggers the animation.
 */
export function PageCurtain() {
  const location = useLocation()
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle')
  const prevPathname = useRef(location.pathname)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (prevPathname.current === location.pathname) return
    prevPathname.current = location.pathname

    // Clear any in-flight timers from the last transition
    timers.current.forEach(clearTimeout)
    timers.current = []

    setPhase('cover')

    timers.current.push(
      setTimeout(() => setPhase('reveal'), 220),
      setTimeout(() => setPhase('idle'), 500),
    )
  }, [location.pathname])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  // Always render the div so animation starts on an existing element.
  // When idle: hidden via CSS (no visual impact, no layout cost).
  return (
    <div
      className={`page-curtain${phase !== 'idle' ? ` page-curtain--${phase}` : ' page-curtain--idle'}`}
      aria-hidden="true"
    />
  )
}
