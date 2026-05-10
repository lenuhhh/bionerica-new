/**
 * Shared Framer Motion animation variants for Bionerica.
 * Use these everywhere to keep transitions consistent.
 */
import type { Variants, Transition } from 'framer-motion'

/* ── Eases ── */
export const ease = {
  smooth:  [0.25, 0.1, 0.25, 1]   as const,
  spring:  [0.34, 1.2,  0.64, 1]  as const,
  out:     [0.0,  0.0,  0.2,  1]  as const,
  in:      [0.4,  0.0,  1.0,  1]  as const,
  inOut:   [0.4,  0.0,  0.2,  1]  as const,
}

/* ── Base transition ── */
export const baseTransition: Transition = {
  duration: 0.48,
  ease: ease.inOut,
}

/* ── Variants factory ── */
export function fadeUpVariants(delay = 0, distance = 24): Variants {
  return {
    hidden:  { opacity: 0, y: distance },
    visible: { opacity: 1, y: 0, transition: { duration: 0.52, delay, ease: ease.inOut } },
  }
}

export function fadeDownVariants(delay = 0, distance = 20): Variants {
  return {
    hidden:  { opacity: 0, y: -distance },
    visible: { opacity: 1, y: 0, transition: { duration: 0.48, delay, ease: ease.inOut } },
  }
}

export function fadeLeftVariants(delay = 0, distance = 30): Variants {
  return {
    hidden:  { opacity: 0, x: -distance },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay, ease: ease.out } },
  }
}

export function fadeRightVariants(delay = 0, distance = 30): Variants {
  return {
    hidden:  { opacity: 0, x: distance },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay, ease: ease.out } },
  }
}

export function scaleInVariants(delay = 0): Variants {
  return {
    hidden:  { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.45, delay, ease: ease.spring } },
  }
}

export function fadeVariants(delay = 0): Variants {
  return {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, delay } },
  }
}

/* ── Stagger container ── */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerContainerFast: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0 } },
}

/* ── Stagger children (used inside staggerContainer) ── */
export const staggerFadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.44, ease: ease.inOut } },
}

export const staggerFadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.38 } },
}

export const staggerScaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: ease.spring } },
}

/* ── Page-level transition (used in Layout) ── */
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  enter:   { opacity: 1, transition: { duration: 0.3, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: 0.16, ease: ease.in } },
}
