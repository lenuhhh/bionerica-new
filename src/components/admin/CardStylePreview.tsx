import { useState } from 'react'
import { Heart, Eye, Star } from 'lucide-react'

export type CardStyle = {
  backgroundColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  shadowSize: string
  titleColor: string
  priceColor: string
  badgeBackground: string
  badgeBorderColor: string
  hoverScale: string
}

const defaultCardStyle: CardStyle = {
  backgroundColor: 'linear-gradient(180deg, rgba(34,29,23,0.94) 0%, rgba(29,25,20,0.98) 100%)',
  borderColor: 'rgba(122,93,52,0.34)',
  borderWidth: '1px',
  borderRadius: '12px',
  shadowSize: '0 20px 46px rgba(0,0,0,0.2)',
  titleColor: 'rgba(245,240,232,0.93)',
  priceColor: 'rgba(245,240,232,0.93)',
  badgeBackground: 'rgba(192,208,172,0.2)',
  badgeBorderColor: 'rgba(192,208,172,0.4)',
  hoverScale: '1.02',
}

type CardStyleEditorProps = {
  style: CardStyle
  onChange: (style: CardStyle) => void
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--b0)',
          border: '1px solid var(--bd)',
          padding: '6px 10px',
          color: 'var(--t0)',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      />
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (val: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{label}</label>
      <input
        type="range"
        min={min ?? 0}
        max={max ?? 100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <span style={{ fontSize: 11, color: 'var(--t1)', gridColumn: '2' }}>{value}</span>
    </div>
  )
}

export function CardStyleEditor({ style, onChange }: CardStyleEditorProps) {
  const handleStyleChange = (key: keyof CardStyle, value: string) => {
    onChange({ ...style, [key]: value })
  }

  const handleNumericChange = (key: keyof CardStyle, value: number) => {
    const suffixMap: Record<string, string> = {
      borderWidth: 'px',
      borderRadius: 'px',
      hoverScale: '',
    }
    const suffix = suffixMap[key] ?? ''
    handleStyleChange(key, value + suffix)
  }

  return (
    <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 16, borderRadius: 8 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Редактор стилів карточки</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: Controls */}
        <div>
          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>Фон</p>
          <ColorInput label="Background" value={style.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)} />

          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600, marginTop: 16 }}>Межі</p>
          <ColorInput label="Border color" value={style.borderColor} onChange={v => handleStyleChange('borderColor', v)} />
          <NumberInput
            label="Border width"
            value={parseInt(style.borderWidth)}
            onChange={v => handleNumericChange('borderWidth', v)}
            min={0}
            max={8}
          />
          <NumberInput
            label="Border radius"
            value={parseInt(style.borderRadius)}
            onChange={v => handleNumericChange('borderRadius', v)}
            min={0}
            max={32}
          />

          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600, marginTop: 16 }}>Тінь</p>
          <ColorInput label="Shadow" value={style.shadowSize} onChange={v => handleStyleChange('shadowSize', v)} />

          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600, marginTop: 16 }}>Текст</p>
          <ColorInput label="Title color" value={style.titleColor} onChange={v => handleStyleChange('titleColor', v)} />
          <ColorInput label="Price color" value={style.priceColor} onChange={v => handleStyleChange('priceColor', v)} />

          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600, marginTop: 16 }}>Значки/Бейджи</p>
          <ColorInput label="Badge background" value={style.badgeBackground} onChange={v => handleStyleChange('badgeBackground', v)} />
          <ColorInput label="Badge border" value={style.badgeBorderColor} onChange={v => handleStyleChange('badgeBorderColor', v)} />

          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600, marginTop: 16 }}>Анімація</p>
          <ColorInput label="Hover scale" value={style.hoverScale} onChange={v => handleStyleChange('hoverScale', v)} />
        </div>

        {/* Right: Live Preview */}
        <div>
          <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>Предпросмотр</p>
          <div
            style={{
              background: style.backgroundColor,
              border: `${style.borderWidth} solid ${style.borderColor}`,
              borderRadius: style.borderRadius,
              boxShadow: style.shadowSize,
              padding: 16,
              transition: 'transform 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = `scale(${style.hoverScale})`
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            }}
          >
            {/* Image placeholder */}
            <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg, rgba(122,93,52,0.2), rgba(192,208,172,0.1))', borderRadius: 8, marginBottom: 12 }} />

            {/* NEW badge */}
            <div
              style={{
                display: 'inline-block',
                background: style.badgeBackground,
                border: `1px solid ${style.badgeBorderColor}`,
                color: '#fff',
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                marginBottom: 10,
                borderRadius: 4,
              }}
            >
              NEW
            </div>

            {/* Title */}
            <h3 style={{ color: style.titleColor, fontSize: 18, fontWeight: 500, marginBottom: 8, lineHeight: 1.2 }}>Персик свіжий</h3>

            {/* Subtitle */}
            <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: 12, marginBottom: 12 }}>Сорт Редхевен — ароматний, соковитий</p>

            {/* Rating */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} fill="var(--gold)" stroke="none" />
              ))}
              <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginLeft: 4 }}>(76)</span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ color: style.priceColor, fontSize: 24, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif' }}>140</span>
              <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: 12 }}>₴</span>
            </div>

            {/* Status */}
            <div style={{ padding: '8px 12px', background: 'rgba(192,208,172,0.15)', borderRadius: 6, marginBottom: 12, fontSize: 12, color: 'rgba(192,208,172,0.8)' }}>
              ● В наявності
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  background: 'var(--gold)',
                  border: 'none',
                  color: '#1a1612',
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Eye size={12} /> Вибрати
              </button>
              <button
                style={{
                  width: 40,
                  height: 40,
                  background: 'transparent',
                  border: `1px solid ${style.borderColor}`,
                  color: 'var(--gold)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={14} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: 10, color: 'var(--t2)', marginTop: 12 }}>Наведіть курсор для перегляду эфекту hover</p>
        </div>
      </div>
    </div>
  )
}

export function CardStylePreset() {
  const [style, setStyle] = useState<CardStyle>(defaultCardStyle)
  const [presets] = useState([
    { name: 'Premium Dark', style: defaultCardStyle },
    {
      name: 'Minimal Light',
      style: {
        ...defaultCardStyle,
        backgroundColor: 'linear-gradient(180deg, rgba(248,247,245,0.98), rgba(245,243,240,0.98))',
        borderColor: 'rgba(192,208,172,0.2)',
        titleColor: 'rgba(26,22,18,0.95)',
        priceColor: 'rgba(26,22,18,0.95)',
        shadowSize: '0 8px 24px rgba(0,0,0,0.08)',
      },
    },
    {
      name: 'Energetic Green',
      style: {
        ...defaultCardStyle,
        backgroundColor: 'linear-gradient(180deg, rgba(74,140,63,0.08), rgba(192,208,172,0.04))',
        borderColor: 'rgba(74,140,63,0.3)',
        badgeBackground: 'rgba(74,140,63,0.2)',
        badgeBorderColor: 'rgba(74,140,63,0.4)',
        shadowSize: '0 16px 32px rgba(74,140,63,0.1)',
      },
    },
  ])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => setStyle(preset.style)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--bd)',
              background: 'var(--b1)',
              color: 'var(--t0)',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--b0)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--b1)')}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <CardStyleEditor style={style} onChange={setStyle} />

      <div
        style={{
          background: 'var(--b1)',
          border: '1px solid var(--bd)',
          padding: 12,
          marginTop: 16,
          borderRadius: 8,
          fontSize: 11,
          color: 'var(--t2)',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}
      >
        <p style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>JSON експорт</p>
        <pre style={{ margin: 0 }}>{JSON.stringify(style, null, 2)}</pre>
      </div>
    </div>
  )
}
