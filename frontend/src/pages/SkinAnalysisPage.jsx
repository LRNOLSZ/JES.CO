import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import QuizStep from '../components/QuizStep'
import { useExchangeRate } from '../hooks/useExchangeRate'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

// ── Minimal line icons, matching the site's gold/champagne stroke-icon style ──
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const IconDroplet   = () => <Icon><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /></Icon>
const IconSun       = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
const IconTwoTone   = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" /></Icon>
const IconLeaf      = () => <Icon><path d="M5 21c0-9 4-15 14-15 0 10-6 14-14 15z" /></Icon>
const IconShield    = () => <Icon><path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6z" /></Icon>
const IconSpark     = () => <Icon><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" /></Icon>
const IconDots      = () => <Icon><circle cx="7" cy="8" r="1.4" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="10" cy="14" r="1.6" fill="currentColor" stroke="none" /><circle cx="17" cy="16" r="1" fill="currentColor" stroke="none" /></Icon>
const IconHourglass = () => <Icon><path d="M6 3h12M6 21h12M6 3c0 6 12 6 12 0M6 21c0-6 12-6 12 0" /></Icon>
const IconGrid      = () => <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon>
const IconQuestion  = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" /><circle cx="12" cy="17" r="0.3" fill="currentColor" /></Icon>
const IconStarBurst = () => <Icon><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" /></Icon>
const IconSlash     = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M5 5l14 14" /></Icon>
const IconCalendar  = () => <Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Icon>
const IconRing      = () => <Icon><circle cx="12" cy="15" r="6" /><path d="M12 9l-2-6h4z" /></Icon>
const IconCamera    = () => <Icon><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8 7l1.5-2h5L16 7" /></Icon>
const IconPartySpark= () => <Icon><path d="M12 2v4M4 8l3 2M20 8l-3 2" /><circle cx="12" cy="15" r="6" /></Icon>
const IconHeart     = () => <Icon><path d="M12 20s-7-4.4-9.3-8.6C1 8 2.5 4.5 6 4c2-.3 4 .8 6 3 2-2.2 4-3.3 6-3 3.5.5 5 4 3.3 7.4C19 15.6 12 20 12 20z" /></Icon>
const IconTag       = () => <Icon><path d="M3 11l8-8h6a2 2 0 0 1 2 2v6l-8 8a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8z" /><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" /></Icon>
const IconLayers    = () => <Icon><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></Icon>
const IconDiamond   = () => <Icon><path d="M3 9h18M9 3l-3 6 6 12 6-12-3-6z" /></Icon>
const IconInfinity  = () => <Icon><path d="M8.5 9a3.5 3.5 0 1 0 0 6c2.5 0 3.5-2 3.5-3s1-3 3.5-3a3.5 3.5 0 1 1 0 6 3.5 3.5 0 0 1-3.5-3" /></Icon>

// ── Question data ──────────────────────────────────────────────────────────────
const SKIN_TONE_OPTIONS = [
  { value: 'fair',      label: 'Fair',      color: '#f3ddc9' },
  { value: 'light',     label: 'Light',     color: '#e6c19c' },
  { value: 'medium',    label: 'Medium',    color: '#c68a5f' },
  { value: 'tan',       label: 'Tan',       color: '#a06a42' },
  { value: 'deep',      label: 'Deep',      color: '#6b4128' },
  { value: 'very_deep', label: 'Very Deep', color: '#3c2415' },
]
const UNDERTONE_OPTIONS = [
  { value: 'warm',     label: 'Warm',     color: '#e0a458' },
  { value: 'cool',     label: 'Cool',     color: '#d68ea3' },
  { value: 'neutral',  label: 'Neutral',  color: '#c9ae8c' },
  { value: 'not_sure', label: 'Not sure', color: '#8a8a8a' },
]
const SKIN_TYPE_OPTIONS = [
  { value: 'oily',        label: 'Oily',        icon: <IconDroplet /> },
  { value: 'dry',         label: 'Dry',         icon: <IconSun /> },
  { value: 'combination', label: 'Combination', icon: <IconTwoTone /> },
  { value: 'normal',      label: 'Normal',      icon: <IconLeaf /> },
  { value: 'sensitive',   label: 'Sensitive',   icon: <IconShield /> },
]
const CONCERN_OPTIONS = [
  { value: 'acne',              label: 'Acne/breakouts',    icon: <IconSpark /> },
  { value: 'hyperpigmentation', label: 'Hyperpigmentation', icon: <IconDots /> },
  { value: 'dryness',           label: 'Dryness',           icon: <IconDroplet /> },
  { value: 'aging',             label: 'Fine lines/aging',  icon: <IconHourglass /> },
  { value: 'uneven_texture',    label: 'Uneven texture',    icon: <IconGrid /> },
  { value: 'other',             label: 'Other',             icon: <IconQuestion /> },
]
const ALLERGIES_OPTIONS = [
  { value: 'yes', label: 'Yes', text: 'Yes' },
  { value: 'no',  label: 'No',  text: 'No' },
]
const ROUTINE_OPTIONS = [
  { value: 'full_glam',         label: 'Full glam',              icon: <IconStarBurst /> },
  { value: 'natural_everyday',  label: 'Natural everyday',       icon: <IconLeaf /> },
  { value: 'special_occasions', label: 'Special occasions only', icon: <IconCalendar /> },
  { value: 'none',              label: "Don't wear makeup",      icon: <IconSlash /> },
]
const FINISH_OPTIONS = [
  { value: 'matte',         label: 'Matte',         gradient: 'linear-gradient(135deg, #7d6f60, #5c5147)' },
  { value: 'dewy',          label: 'Dewy',          gradient: 'linear-gradient(135deg, #fdf1cf, #f3dfa0 60%, #ffffff)' },
  { value: 'natural_satin', label: 'Natural-satin', gradient: 'linear-gradient(135deg, #e8d9b8, #cdb98e)' },
  { value: 'not_sure',      label: 'Not sure',      icon: <IconQuestion /> },
]
const OCCASION_OPTIONS = [
  { value: 'everyday',         label: 'Everyday wear',            icon: <IconLeaf /> },
  { value: 'bridal',           label: 'Bridal',                   icon: <IconRing /> },
  { value: 'photoshoot',       label: 'Photoshoot/editorial',     icon: <IconCamera /> },
  { value: 'event',            label: 'Event/party',              icon: <IconPartySpark /> },
  { value: 'skincare_routine', label: 'General skincare routine', icon: <IconHeart /> },
]
const BUDGET_OPTIONS = [
  { value: 'budget_friendly', label: 'Budget-friendly', icon: <IconTag /> },
  { value: 'mid_range',       label: 'Mid-range',       icon: <IconLayers /> },
  { value: 'luxury',          label: 'Luxury',          icon: <IconDiamond /> },
  { value: 'no_preference',   label: 'No preference',   icon: <IconInfinity /> },
]

const QUESTIONS = [
  { key: 'skin_tone',         text: 'What is your natural skin tone?',                   options: SKIN_TONE_OPTIONS },
  { key: 'undertone',         text: 'What is your skin undertone?',                       options: UNDERTONE_OPTIONS },
  { key: 'skin_type',         text: 'How would you describe your skin type?',             options: SKIN_TYPE_OPTIONS },
  { key: 'skin_concern',      text: "What's your biggest skin concern right now?",        options: CONCERN_OPTIONS },
  { key: 'allergies',         text: 'Do you have any known allergies or sensitivities?',   options: ALLERGIES_OPTIONS, hasDetail: true },
  { key: 'makeup_routine',    text: "What's your typical makeup routine like?",           options: ROUTINE_OPTIONS },
  { key: 'foundation_finish', text: 'Which finish do you usually prefer for foundation?',  options: FINISH_OPTIONS },
  { key: 'occasion',          text: 'Is this for a specific occasion?',                    options: OCCASION_OPTIONS },
  { key: 'budget',            text: "What's your approximate budget range for products?",  options: BUDGET_OPTIONS },
  { key: 'additional_notes',  text: "Anything else you'd like Maame Ama to know?", freeText: true, optional: true,
    placeholder: 'Optional — share anything that would help her tailor her recommendation.' },
]

export default function SkinAnalysisPage() {
  const [step,     setStep]     = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [allergiesDetail, setAllergiesDetail] = useState('')
  const [phase,    setPhase]    = useState('quiz') // quiz | contact | submitting | success
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [price,    setPrice]    = useState(null) // USD, quoted to every visitor

  // Paystack (Ghana account) can only ever charge in GHS — $100 is shown
  // throughout, but converted to its GHS equivalent right before payment.
  const rate = useExchangeRate() // USD per 1 GHS
  const ghsChargeAmount = price && rate ? price / rate : null

  useEffect(() => {
    axios.get('/api/skin-analysis/price/').then(r => setPrice(parseFloat(r.data.price_usd))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!PAYSTACK_KEY) return
    if (document.getElementById('paystack-js')) return
    const script = document.createElement('script')
    script.id    = 'paystack-js'
    script.src   = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const current      = QUESTIONS[step]
  const currentValue = answers[current?.key]
  const canGoNext    = current?.optional || (current?.freeText ? true : !!currentValue)

  function handleAnswer(val) {
    setAnswers(prev => ({ ...prev, [current.key]: val }))
  }
  function handleNext() {
    if (step < QUESTIONS.length - 1) setStep(s => s + 1)
    else setPhase('contact')
  }
  function handleBack() {
    if (step === 0) return
    setStep(s => s - 1)
  }

  async function handlePay(e) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Please enter your name and email.')
      return
    }
    if (!PAYSTACK_KEY || !window.PaystackPop) {
      setErrorMsg('Payment not available yet. Please try again later.')
      return
    }
    if (!ghsChargeAmount) {
      setErrorMsg("Still loading today's exchange rate — please try again in a moment.")
      return
    }
    setErrorMsg('')
    setPhase('submitting')
    try {
      const { data } = await axios.post('/api/skin-analysis/submit/', {
        full_name: fullName.trim(),
        email:     email.trim().toLowerCase(),
        ...answers,
        allergies_detail: answers.allergies === 'yes' ? allergiesDetail : '',
      })
      // Paystack only ever charges in GHS — pesewas here, even though $100 is quoted.
      const handler = window.PaystackPop.setup({
        key:      PAYSTACK_KEY,
        email:    email.trim().toLowerCase(),
        amount:   Math.round(ghsChargeAmount * 100),
        currency: 'GHS',
        metadata: { skin_analysis_submission_id: data.id },
        callback: () => setPhase('success'),
        onClose:  () => setPhase('contact'),
      })
      handler.openIframe()
    } catch {
      setPhase('contact')
      setErrorMsg('Something went wrong submitting your answers. Please try again.')
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--ink)', color: 'var(--bone)' }}>
      <JescoNavbar />

      <main style={{ paddingTop: 'clamp(7rem,14vw,9rem)', paddingBottom: 'clamp(4rem,8vw,7rem)' }}>
        <div className="wrap" style={{ maxWidth: '820px' }}>

          {phase === 'quiz' && current && (
            <>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', textAlign: 'center', marginBottom: '0.6rem' }}>
                Skin Analysis
              </p>
              <QuizStep
                step={step + 1}
                totalSteps={QUESTIONS.length}
                question={current.text}
                options={current.options}
                value={currentValue}
                onChange={handleAnswer}
                freeText={current.freeText}
                freeTextPlaceholder={current.placeholder}
                hasDetail={current.hasDetail}
                detailValue={allergiesDetail}
                onDetailChange={setAllergiesDetail}
                onNext={handleNext}
                onBack={handleBack}
                canGoNext={canGoNext}
                isLast={step === QUESTIONS.length - 1}
              />
            </>
          )}

          {(phase === 'contact' || phase === 'submitting') && (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.6rem' }}>
                Almost There
              </p>
              <h2 className="serif" style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: 'var(--bone)', marginBottom: '0.75rem' }}>
                Your Personalized <span className="ital metal-text">Analysis</span>
              </h2>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, marginBottom: '0.5rem' }}>
                Maame Ama personally reviews every answer. Pay {price ? `$${price.toFixed(2)}` : '…'} to have your
                answers sent to her — she'll follow up by email with your custom recommendation.
              </p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--taupe-mut)', marginBottom: '2rem' }}>
                {ghsChargeAmount ? `Charged as GHS ${ghsChargeAmount.toFixed(2)} — today's rate` : "Loading today's rate…"}
              </p>
              <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1.1rem', borderRadius: '10px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 5%, transparent)', color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.9rem', outline: 'none' }}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1.1rem', borderRadius: '10px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 5%, transparent)', color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.9rem', outline: 'none' }}
                />
                {errorMsg && (
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(220,80,80,0.85)', margin: 0 }}>{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={phase === 'submitting'}
                  className="btn btn-gold"
                  style={{ justifyContent: 'center', opacity: phase === 'submitting' ? 0.7 : 1 }}
                >
                  {phase === 'submitting' ? 'Processing…' : `Pay ${price ? `$${price.toFixed(2)}${ghsChargeAmount ? ` (charged as GHS ${ghsChargeAmount.toFixed(2)})` : ''}` : ''} →`}
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('quiz')}
                  style={{ background: 'none', border: 'none', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer', alignSelf: 'center' }}
                >
                  ← Back to edit answers
                </button>
              </form>
            </div>
          )}

          {phase === 'success' && (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem', border: '1px solid color-mix(in srgb, var(--champ) 30%, transparent)', borderRadius: '16px', background: 'color-mix(in srgb, var(--champ) 4%, transparent)' }}>
              <div className="serif ital metal-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
              <h2 className="serif" style={{ fontSize: '1.8rem', color: 'var(--bone)', marginBottom: '0.75rem' }}>Payment Received</h2>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--taupe)', lineHeight: 1.7, marginBottom: '2rem' }}>
                Maame Ama will personally review your answers and email you your custom recommendation soon.
              </p>
              <Link to="/studio" className="btn btn-ghost">Back to JES.CO</Link>
            </div>
          )}

        </div>
      </main>

      <JescoFooter />
    </div>
  )
}
