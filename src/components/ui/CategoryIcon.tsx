type CategoryIconId = 'all' | 'berries' | 'fruits' | 'vegetables' | 'greens' | 'plants' | 'baskets'

type CategoryIconProps = {
  id: CategoryIconId
  size?: number
  mode?: 'solid' | 'line'
}

export type { CategoryIconId }

export default function CategoryIcon({ id, size = 38, mode = 'solid' }: CategoryIconProps) {
  const s = { width: size, height: size, display: 'block' } as const
  const isLine = mode === 'line'

  if (id === 'all') {
    if (isLine) {
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    }
    return (
      <svg {...s} viewBox="0 0 38 38" fill="none" aria-hidden>
        <circle cx="19" cy="19" r="3" fill="var(--gold)" opacity="0.8" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1="19"
            y1="19"
            x2={19 + 10 * Math.cos((a * Math.PI) / 180)}
            y2={19 + 10 * Math.sin((a * Math.PI) / 180)}
            stroke="var(--gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        ))}
      </svg>
    )
  }

  if (id === 'berries') {
    return (
      <svg {...s} viewBox="0 0 38 38" fill="none" aria-hidden>
        <path d="M19 8 C14 8 10 12 10 17 C10 24 19 31 19 31 C19 31 28 24 28 17 C28 12 24 8 19 8Z" fill="#e8534a" opacity="0.9" />
        <circle cx="16" cy="17" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="20" cy="19" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="18" cy="22" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="22" cy="16" r="1" fill="rgba(255,255,255,0.6)" />
        <path d="M15 9 C15 6 17 4 19 5" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 8 C16 5 13 4 12 6" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M21 8 C22 5 25 4 26 6" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (id === 'fruits') {
    return (
      <svg {...s} viewBox="0 0 38 38" fill="none" aria-hidden>
        <path d="M19 10 C13 10 9 15 9 21 C9 26 13 30 19 30 C25 30 29 26 29 21 C29 15 25 10 19 10Z" fill="#e8534a" opacity="0.85" />
        <path d="M19 10 C19 7 21 5 23 5" stroke="#5a3e28" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M21 8 C23 5 27 5 27 8" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M13 19 C13 16 15 13 19 13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="19" cy="30" rx="4" ry="1" fill="rgba(0,0,0,0.08)" />
      </svg>
    )
  }

  if (id === 'vegetables') {
    return (
      <svg {...s} viewBox="0 0 38 38" fill="none" aria-hidden>
        <circle cx="19" cy="18" r="6" fill="#4a8c3f" opacity="0.9" />
        <circle cx="12" cy="20" r="4.5" fill="#4a8c3f" opacity="0.8" />
        <circle cx="26" cy="20" r="4.5" fill="#4a8c3f" opacity="0.8" />
        <circle cx="19" cy="27" r="4" fill="#5a9e50" opacity="0.75" />
        <path d="M19 12 L19 8" stroke="#5a3e28" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 15 C12 12 9 10 8 12" stroke="#4a8c3f" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M25 15 C26 12 29 10 30 12" stroke="#4a8c3f" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }

  if (id === 'greens') {
    return (
      <svg {...s} viewBox="0 0 38 38" fill="none" aria-hidden>
        <path d="M19 30 L19 14" stroke="#5a3e28" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 22 C15 20 11 14 13 9 C16 11 19 16 19 22Z" fill="#4a8c3f" opacity="0.9" />
        <path d="M19 18 C23 16 27 10 25 5 C22 7 19 12 19 18Z" fill="#6ab05e" opacity="0.85" />
        <path d="M19 26 C16 25 13 21 14 17 C17 18 19 22 19 26Z" fill="#4a8c3f" opacity="0.7" />
      </svg>
    )
  }

  if (id === 'plants') {
    return (
      <svg {...s} viewBox="0 0 38 38" fill="none" aria-hidden>
        <path d="M19 30 L19 20" stroke="#5a3e28" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 20 C17 16 13 14 11 16 C12 20 16 22 19 20Z" fill="#4a8c3f" opacity="0.9" />
        <path d="M19 17 C21 13 25 11 27 13 C26 17 22 19 19 17Z" fill="#6ab05e" opacity="0.88" />
        <path d="M15 30 C15 27 17 25 19 25 C21 25 23 27 23 30" stroke="#8a6a4a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M16 30 C15 28 13 27 11 28" stroke="#8a6a4a" strokeWidth="1" strokeLinecap="round" />
        <path d="M22 30 C23 28 25 27 27 28" stroke="#8a6a4a" strokeWidth="1" strokeLinecap="round" />
      </svg>
    )
  }

  if (id === 'baskets') {
    return (
      <svg {...s} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 10h12l-1.2 8H7.2Z" fill="#c08a52" opacity="0.78" />
        <path d="M4 10h16" stroke="#8a6a4a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10 10 5" stroke="#8a6a4a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10 14 5" stroke="#8a6a4a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 13h10M8 16h8" stroke="#fff7ed" strokeOpacity="0.72" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg {...s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="5" stroke={isLine ? 'currentColor' : 'var(--gold)'} strokeWidth="1.6" />
    </svg>
  )
}