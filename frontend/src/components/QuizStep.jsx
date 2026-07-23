function Circle({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '64px', height: '64px', borderRadius: '50%',
        border: `2px solid ${selected ? 'var(--champ)' : 'var(--hair)'}`,
        boxShadow: selected ? '0 0 0 3px color-mix(in srgb, var(--champ) 20%, transparent)' : 'none',
        background: 'var(--ink-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0,
        transition: 'all 0.25s var(--ease)',
      }}
    >
      {children}
    </button>
  )
}

export default function QuizStep({
  step, totalSteps, question, options,
  value, onChange,
  freeText, freeTextPlaceholder,
  hasDetail, detailValue, onDetailChange,
  onNext, onBack, canGoNext, isLast,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      {/* Progress bar */}
      <div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--taupe-mut)', marginBottom: '0.5rem' }}>
          Question {step} of {totalSteps}
        </p>
        <div style={{ height: '3px', borderRadius: '9999px', background: 'var(--hair)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(step / totalSteps) * 100}%`, background: 'var(--metal)', transition: 'width 0.4s var(--ease)' }} />
        </div>
      </div>

      <h2 className="serif" style={{ fontSize: 'clamp(1.4rem,3.5vw,2rem)', color: 'var(--bone)', margin: 0 }}>{question}</h2>

      {freeText ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={freeTextPlaceholder}
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', borderRadius: '10px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 5%, transparent)', color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.9rem', resize: 'vertical', outline: 'none' }}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {options.map(opt => {
              const isSelected = value === opt.value
              return (
                <div key={opt.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '84px' }}>
                  <Circle selected={isSelected} onClick={() => onChange(opt.value)}>
                    {opt.color && <div style={{ width: '100%', height: '100%', background: opt.color }} />}
                    {opt.gradient && <div style={{ width: '100%', height: '100%', background: opt.gradient }} />}
                    {opt.icon && <span style={{ color: isSelected ? 'var(--champ)' : 'var(--taupe)' }}>{opt.icon}</span>}
                    {opt.text && <span className="serif" style={{ color: isSelected ? 'var(--champ)' : 'var(--taupe)', fontSize: '1rem' }}>{opt.text}</span>}
                  </Circle>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '0.68rem', textAlign: 'center', color: isSelected ? 'var(--champ)' : 'var(--taupe-mut)', lineHeight: 1.3 }}>
                    {opt.label}
                  </span>
                </div>
              )
            })}
          </div>

          {hasDetail && value === 'yes' && (
            <input
              type="text"
              value={detailValue || ''}
              onChange={e => onDetailChange(e.target.value)}
              placeholder="Please describe briefly (optional)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 5%, transparent)', color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.85rem', outline: 'none' }}
            />
          )}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        {step > 1 ? (
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'none', border: '1px solid var(--hair)', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', borderRadius: '9999px', cursor: 'pointer' }}
          >
            ← Back
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="btn btn-gold"
          style={{ opacity: canGoNext ? 1 : 0.4, cursor: canGoNext ? 'pointer' : 'not-allowed' }}
        >
          {isLast ? 'Continue →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
