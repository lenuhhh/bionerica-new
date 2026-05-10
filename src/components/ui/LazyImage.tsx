import { useState, useRef, useEffect, memo } from 'react'
import { useInView } from 'react-intersection-observer'
import clsx from 'clsx'
import { imgUrl, srcSet as buildSrcSet } from '@/hooks/usePerformance'

interface Props {
  src: string
  alt: string
  className?: string
  aspectRatio?: string
  objectFit?: 'cover' | 'contain'
  priority?: boolean
  onLoad?: () => void
  overlay?: boolean
  overlayStrength?: 'light' | 'medium' | 'strong'
  sizes?: string
  width?: number
  height?: number
}

// Blurred 20px thumb for blur-up effect (loads in ~200 bytes)
function thumbSrc(src: string): string {
  if (!src.includes('unsplash.com')) return ''
  return imgUrl(src, { w: 40, q: 20, format: 'jpg' }) + '&blur=200'
}

const overlayGradients = {
  light:  'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 60%)',
  medium: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
  strong: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 100%)',
}

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[3/4]',
  objectFit = 'cover',
  priority = false,
  onLoad,
  overlay = false,
  overlayStrength = 'medium',
  sizes = '(min-width:1024px) 400px, (min-width:640px) 50vw, 100vw',
  width,
  height,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loaded' | 'error'>('idle')
  const imgRef = useRef<HTMLImageElement>(null)
  const thumb  = thumbSrc(src)

  // Start loading 400px before viewport (especially important for below-fold)
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '400px 0px',
    skip: priority,
  })

  const shouldLoad = priority || inView

  // Detect already-cached images
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setStatus('loaded')
    }
  }, [])

  const optimizedSrc = imgUrl(src, { w: 900, q: 82, format: 'webp' })
  const srcSetStr = buildSrcSet(src, [400, 800, 1200, 1600])

  return (
    <div
      ref={ref}
      className={clsx('relative overflow-hidden', aspectRatio, className)}
      aria-label={alt}
    >
      {/* ① Shimmer skeleton — visible while loading */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: status === 'loaded' ? 0 : 1,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, var(--b2) 25%, var(--b3) 50%, var(--b2) 75%)',
          backgroundSize: '200% 100%',
          animation: status !== 'error' ? 'shimmer 1.6s ease-in-out infinite' : 'none',
        }}
      />

      {/* ② Blurred thumbnail — visible while full image loads */}
      {thumb && status !== 'loaded' && status !== 'error' && shouldLoad && (
        <img
          src={thumb}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: objectFit === 'cover' ? 'cover' : 'contain',
            objectPosition: 'center center',
            filter: 'blur(16px)',
            transform: 'scale(1.08)',
            opacity: 0.7,
          }}
          loading="eager"
          decoding="sync"
        />
      )}

      {/* ③ Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: 'var(--b2)' }}>
          <span style={{ fontSize: 32 }}>🧵</span>
          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--t2)', textAlign: 'center', lineHeight: 1.6 }}>
            Фото<br />недоступне
          </p>
        </div>
      )}

      {/* ④ Full-resolution image with srcSet for responsive + WebP */}
      {shouldLoad && status !== 'error' && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSetStr}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => { setStatus('loaded'); onLoad?.() }}
          onError={() => setStatus('error')}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: objectFit === 'cover' ? 'cover' : 'contain',
            objectPosition: 'center center',
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 0.55s ease',
            // Prevents FOUC in Safari
            backfaceVisibility: 'hidden',
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
        />
      )}

      {/* ⑤ Text overlay gradient (optional) */}
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: overlayGradients[overlayStrength],
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 0.55s ease',
          }}
        />
      )}
    </div>
  )
})

export default LazyImage
