import { useState, useEffect, useRef } from 'react'

export function useReadingProgress(containerRef?: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = containerRef?.current || document.documentElement
      const scrollTop    = window.scrollY
      const docHeight    = el.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      setProgress(Math.round(pct))
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [containerRef])

  return progress
}

/* Reading time estimator */
export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200)) // 200 wpm average
}
