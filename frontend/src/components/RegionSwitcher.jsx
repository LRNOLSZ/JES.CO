import { useRegion } from '../context/RegionContext'

export default function RegionSwitcher({ light = false }) {
  const { region, setRegion } = useRegion()

  const baseColor = light ? 'rgba(243,237,227,0.82)' : 'var(--taupe)'
  const borderColor = light ? 'rgba(243,237,227,0.25)' : 'var(--hair)'

  return (
    <div
      role="group"
      aria-label="Region and currency"
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        border:       `1px solid ${borderColor}`,
        borderRadius: '9999px',
        padding:      '2px',
        gap:          '2px',
        flexShrink:   0,
      }}
    >
      {[
        { key: 'ghana', label: 'GHS' },
        { key: 'usa',   label: 'USD' },
      ].map(opt => {
        const active = region === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setRegion(opt.key)}
            style={{
              padding:       '0.32rem 0.7rem',
              borderRadius:  '9999px',
              border:        'none',
              background:    active ? 'var(--metal)' : 'transparent',
              color:         active ? '#1a130a' : baseColor,
              fontFamily:    'var(--sans)',
              fontSize:      '0.6rem',
              fontWeight:    600,
              letterSpacing: '0.1em',
              cursor:        'pointer',
              transition:    'all 0.25s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
