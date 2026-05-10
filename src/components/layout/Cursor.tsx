import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Hide on touch devices — no cursor needed
    if (window.matchMedia('(pointer: coarse)').matches) {
      root.classList.remove('custom-cursor')
      return
    }

    root.classList.add('custom-cursor')

    let mx = -100, my = -100   // start off-screen
    let rx = -100, ry = -100
    let raf = 0
    let needsUpdate = false    // only rAF when mouse actually moved

    // ── Use transform (GPU-composited) instead of top/left (triggers layout)
    const moveDot = (x: number, y: number) =>
      dot.style.transform  = `translate(${x}px, ${y}px) translate(-50%, -50%)`
    const moveRing = (x: number, y: number) =>
      ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`

    // Initialise off-screen
    moveDot(mx, my); moveRing(rx, ry)

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      // Dot snaps immediately
      moveDot(mx, my)
      needsUpdate = true
    }

    const onWindowLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }

    const onWindowEnter = () => {
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      needsUpdate = true
    }

    // Ring follows with easing — runs at screen refresh rate
    const tick = () => {
      if (needsUpdate) {
        const dx = mx - rx
        const dy = my - ry
        // Stop easing when close enough (saves GPU work)
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
          rx += dx * 0.12
          ry += dy * 0.12
          moveRing(rx, ry)
        } else {
          needsUpdate = false
        }
      }
      raf = requestAnimationFrame(tick)
    }

    // ── Hover state
    const setHover = (on: boolean) => {
      dot.classList.toggle('hover',  on)
      ring.classList.toggle('hover', on)
    }

    // Use event delegation on document — far cheaper than binding to every element
    const onEnter = (e: MouseEvent) => {
      const t = e.target as Element
      if (t.closest('a, button, [data-hover], [role="button"]')) setHover(true)
    }
    const onLeave = (e: MouseEvent) => {
      const t = e.relatedTarget as Element | null
      if (!t?.closest('a, button, [data-hover], [role="button"]')) setHover(false)
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseover',  onEnter,    { passive: true })
    document.addEventListener('mouseout',   onLeave,    { passive: true })
    window.addEventListener('mouseout', onWindowLeave)
    window.addEventListener('mouseover', onWindowEnter)

    raf = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover',  onEnter)
      document.removeEventListener('mouseout',   onLeave)
      window.removeEventListener('mouseout', onWindowLeave)
      window.removeEventListener('mouseover', onWindowEnter)
      cancelAnimationFrame(raf)
      root.classList.remove('custom-cursor')
    }
  }, [])

  return (
    <>
      <div id="cur-dot"  ref={dotRef}  />
      <div id="cur-ring" ref={ringRef} />
    </>
  )
}
