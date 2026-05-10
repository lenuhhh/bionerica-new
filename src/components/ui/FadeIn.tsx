/**
 * FadeIn — scroll-triggered animation wrapper.
 * Wraps children in a motion.div that animates when scrolled into view.
 *
 * Usage:
 *   <FadeIn>          — fade up (default)
 *   <FadeIn dir="left" delay={0.1}>
 *   <FadeIn dir="none"> — just fade, no movement
 *   <StaggerGrid>       — staggered grid of children
 */
import { motion, type MotionProps } from 'framer-motion'
import type { ReactNode, CSSProperties } from 'react'
import {
  staggerContainer,
  staggerFadeUp,
  staggerScaleIn,
} from '@/lib/motion'

type Dir = 'up' | 'down' | 'left' | 'right' | 'none' | 'scale'

interface FadeInProps {
  children: ReactNode
  dir?: Dir
  delay?: number
  duration?: number
  distance?: number
  /** How far from viewport edge to trigger (e.g. '-80px' = 80px before entering) */
  margin?: string
  className?: string
  style?: CSSProperties
  /** Pass-through for any motion props */
  motionProps?: MotionProps
}

const dirMap: Record<Dir, { x?: number; y?: number; scale?: number }> = {
  up:    { y: 16 },
  down:  { y: -12 },
  left:  { x: -18 },
  right: { x: 18 },
  none:  {},
  scale: { scale: 0.95 },
}

export function FadeIn({
  children,
  dir = 'up',
  delay = 0,
  duration = 0.5,
  distance,
  margin = '-70px',
  className,
  style,
  motionProps,
}: FadeInProps) {
  const offset = dirMap[dir]
  // Allow overriding distance for up/down
  const initial: Record<string, number> = { opacity: 0 }
  if (offset.y !== undefined) initial.y = distance ?? offset.y
  if (offset.x !== undefined) initial.x = distance ?? offset.x
  if (offset.scale !== undefined) initial.scale = offset.scale

  const animate: Record<string, number> = { opacity: 1 }
  if (offset.y !== undefined) animate.y = 0
  if (offset.x !== undefined) animate.x = 0
  if (offset.scale !== undefined) animate.scale = 1

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

/* ── StaggerGrid — staggered children (for grids) ── */
interface StaggerGridProps {
  children: ReactNode
  variant?: 'fadeUp' | 'scale'
  className?: string
  style?: CSSProperties
  margin?: string
  delayChildren?: number
  staggerDelay?: number
}

export function StaggerGrid({
  children,
  variant = 'fadeUp',
  className,
  style,
  margin = '-60px',
  delayChildren = 0.05,
  staggerDelay = 0.07,
}: StaggerGridProps) {
  const container = {
    hidden:  {},
    visible: { transition: { staggerChildren: staggerDelay, delayChildren } },
  }
  const child = variant === 'scale' ? staggerScaleIn : staggerFadeUp

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      className={className}
      style={style}
    >
      {/* Wrap each direct child in a motion.div with the child variant */}
      {Array.isArray(children)
        ? children.map((c, i) => (
            <motion.div key={i} variants={child}>
              {c}
            </motion.div>
          ))
        : <motion.div variants={child}>{children}</motion.div>
      }
    </motion.div>
  )
}

/* ── SlideReveal — horizontal reveal (e.g. section titles) ── */
export function SlideReveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
