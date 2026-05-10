import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'

/**
 * Тонка смужка прогресу вгорі сторінки під час переходу між роутами.
 * Сумісна з BrowserRouter (без Data Router).
 */
export function NavigationProgress() {
  const location = useLocation()
  const progress = useMotionValue(0)
  const scaleX = useSpring(progress, { stiffness: 260, damping: 28, mass: 0.4 })
  const [opacity, setOpacity] = useState(0)
  const animRef = useRef<ReturnType<typeof animate> | null>(null)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip on first mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (animRef.current) animRef.current.stop()

    progress.set(0)
    setOpacity(1)

    // Animate to 80% (indeterminate feel)
    animRef.current = animate(progress, 0.8, {
      duration: 0.55,
      ease: [0.1, 0.4, 0.4, 1],
    })

    // Complete after page render
    completeTimerRef.current = setTimeout(() => {
      if (animRef.current) animRef.current.stop()
      animRef.current = animate(progress, 1, {
        duration: 0.22,
        ease: 'easeOut',
        onComplete: () => {
          hideTimerRef.current = setTimeout(() => setOpacity(0), 150)
        },
      })
    }, 320)

    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return (
    <motion.div
      animate={{ opacity }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        originX: 0,
        scaleX,
        background: 'linear-gradient(90deg, var(--gold, #4a8c3f) 0%, #8fcc88 55%, var(--gold, #4a8c3f) 100%)',
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: '0 0 6px 0 rgba(74,140,63,0.4)',
      }}
    />
  )
}
