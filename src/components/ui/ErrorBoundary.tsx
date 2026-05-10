import React from 'react'

interface State { error: Error | null; info: React.ErrorInfo | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info })
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children
    return <ErrorScreen error={error} info={info} onReset={() => this.setState({ error: null, info: null })} />
  }
}

/* ── Stateless error screen ─────────────────────────────────────────── */
function ErrorScreen({
  error,
  info,
  onReset,
}: {
  error: Error
  info: React.ErrorInfo | null
  onReset: () => void
}) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: '#f7faf5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Background botanical decoration */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(192,57,43,0.04) 0%, transparent 70%)',
          }}
        />
        {/* Dot grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(74,140,63,0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Large faded leaf — left */}
        <svg
          style={{ position: 'absolute', top: -60, left: -80, width: 380, opacity: 0.04 }}
          viewBox="0 0 380 360"
          fill="none"
        >
          <path
            d="M40 340 C80 200 180 60 340 20 C300 120 260 200 180 260 C120 300 80 320 40 340Z"
            fill="#3a6b33"
          />
          <path d="M40 340 C100 280 200 200 340 20" stroke="#3a6b33" strokeWidth="2" />
          <path d="M100 300 C140 240 210 170 300 80" stroke="#3a6b33" strokeWidth="1.2" />
        </svg>
        {/* Large faded leaf — right */}
        <svg
          style={{
            position: 'absolute',
            bottom: -60,
            right: -80,
            width: 380,
            opacity: 0.04,
            transform: 'rotate(180deg)',
          }}
          viewBox="0 0 380 360"
          fill="none"
        >
          <path
            d="M40 340 C80 200 180 60 340 20 C300 120 260 200 180 260 C120 300 80 320 40 340Z"
            fill="#3a6b33"
          />
          <path d="M40 340 C100 280 200 200 340 20" stroke="#3a6b33" strokeWidth="2" />
        </svg>
      </div>

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 560,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Broken branch icon */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="33" stroke="rgba(192,57,43,.2)" strokeWidth=".8" />
            <circle cx="36" cy="36" r="22" stroke="rgba(192,57,43,.12)" strokeWidth=".8" />
            {/* broken branch */}
            <g stroke="#c0392b" strokeLinecap="round" fill="none" opacity=".7">
              <path d="M36 62 L36 42" strokeWidth="1.5" />
              <path d="M36 42 L28 28" strokeWidth="1.5" />
              <path d="M36 42 L44 30" strokeWidth="1.4" strokeDasharray="3 2" />
              {/* leaves wilting */}
              <path d="M36 52 C29 48 24 42 26 36 C33 39 37 46 36 52Z" strokeWidth="1.1" />
              <path d="M28 32 C22 28 20 21 23 16 C29 20 30 27 28 32Z" strokeWidth="1" />
            </g>
            {/* break point */}
            <circle cx="36" cy="42" r="2.5" fill="rgba(192,57,43,.4)" />
          </svg>
        </div>

        <p
          style={{
            fontSize: 9,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: '#c0392b',
            marginBottom: 12,
            fontFamily: 'Jost, sans-serif',
          }}
        >
          Щось пішло не так
        </p>

        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 300,
            color: '#182614',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Сторінка<br />
          <em style={{ fontStyle: 'italic', color: '#3a6b33' }}>не відповідає</em>
        </h1>

        <p
          style={{
            fontSize: 14,
            color: '#6b8f61',
            lineHeight: 1.7,
            maxWidth: 400,
            margin: '0 auto 36px',
          }}
        >
          Щось зламалось у застосунку. Спробуйте перезавантажити сторінку — зазвичай це вирішує проблему.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              background: '#3a6b33',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: 'Jost, sans-serif',
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            </svg>
            Перезавантажити
          </button>
          <button
            onClick={() => { window.location.href = '/' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              background: 'transparent',
              color: '#3a6b33',
              border: '1px solid rgba(74,140,63,.4)',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: 'Jost, sans-serif',
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            На головну
          </button>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 28px',
                background: 'transparent',
                color: '#6b8f61',
                border: '1px solid rgba(74,140,63,.2)',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: 'Jost, sans-serif',
                fontWeight: 400,
              }}
            >
              Спробувати знову
            </button>
          )}
        </div>

        {/* Technical details toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'rgba(107,143,97,0.6)',
            fontFamily: 'Jost, sans-serif',
            marginBottom: 12,
          }}
        >
          {expanded ? '▲' : '▼'} &nbsp;Деталі помилки
        </button>

        {expanded && (
          <div
            style={{
              textAlign: 'left',
              background: 'rgba(24,38,20,0.03)',
              border: '1px solid rgba(74,140,63,.12)',
              borderRadius: 4,
              padding: '14px 18px',
              maxHeight: 220,
              overflow: 'auto',
            }}
          >
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#c0392b',
                marginBottom: 8,
                wordBreak: 'break-word',
              }}
            >
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: '#6b8f61',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {error.stack.split('\n').slice(1, 8).join('\n')}
              </pre>
            )}
            {info?.componentStack && (
              <pre
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: 'rgba(107,143,97,0.7)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '8px 0 0',
                }}
              >
                {info.componentStack.trim().split('\n').slice(0, 5).join('\n')}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
