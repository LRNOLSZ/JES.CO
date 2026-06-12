import { useRef, useEffect } from 'react'

export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export function Reveal({ children, delay = 0, style, className = '', as: Tag = 'div', ...rest }) {
  const ref = useReveal()
  return (
    <Tag ref={ref} className={'reveal ' + className} style={{ transitionDelay: delay + 's', ...style }} {...rest}>
      {children}
    </Tag>
  )
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function SectionHead({ index, eyebrow, title, sub, align = 'left' }) {
  const centered = align === 'center'
  return (
    <div style={{ textAlign: align, maxWidth: centered ? '40rem' : 'none', margin: centered ? '0 auto' : 0 }}>
      <Reveal style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: centered ? 'center' : 'flex-start', marginBottom: '1.1rem' }}>
        {index && <span className="index-num" style={{ fontSize: '1.05rem' }}>{index}</span>}
        <span style={{ width: '26px', height: '1px', background: 'var(--champ)', opacity: 0.6 }} />
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.06} as="h2" style={{ fontSize: 'clamp(2.1rem,5vw,3.6rem)', fontWeight: 500 }}>{title}</Reveal>
      {sub && (
        <Reveal delay={0.12} as="p" style={{
          fontFamily: 'var(--sans)', fontSize: '0.92rem', fontWeight: 300,
          color: 'var(--taupe)', marginTop: '1rem', lineHeight: 1.7,
          maxWidth: '30rem',
          marginLeft: centered ? 'auto' : 0,
          marginRight: centered ? 'auto' : 0,
        }}>
          {sub}
        </Reveal>
      )}
    </div>
  )
}
