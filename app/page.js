'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0f1e',
  bgCard:    '#0f1629',
  bgCardHov: '#141d35',
  border:    'rgba(255,255,255,0.07)',
  borderHov: 'rgba(255,255,255,0.15)',
  blue:      '#2a6fdb',
  blueLight: '#93b4f7',
  purple:    '#7c3aed',
  purpleLight:'#c4b5fd',
  text:      '#f0f4ff',
  textMid:   'rgba(240,244,255,0.65)',
  textDim:   'rgba(240,244,255,0.35)',
}

// ─── Hero slide definitions ────────────────────────────────────────────────────

const SLIDES = [
  {
    eyebrow:   'Pharmacokinetics · Academic Tools',
    headline:  'Pharmacokinetics',
    accent:    'made tangible.',
    sub:       'Twelve PK/PD models, RK4 numerical integration, population simulation — the same maths your textbook uses, interactive.',
    cta:       { label: 'Open PK Calculator', href: '/calculator' },
    ctaSecond: { label: 'All Tools', href: '/tools' },
    accentColor: C.blue,
    accentGrad: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
    animation: 'pk',
  },
  {
    eyebrow:   'Lab Prep · Image Analysis',
    headline:  'Lab work,',
    accent:    'demystified.',
    sub:       'Colony counters, gel analysers, protein assays, spectrophotometry — tools built for the bench, not the textbook.',
    cta:       { label: 'Open Lab Toolbox', href: '/lab' },
    ctaSecond: { label: 'Colony Counter', href: '/lab/colonies' },
    accentColor: '#16a34a',
    accentGrad: 'linear-gradient(135deg, #16a34a, #0891b2)',
    animation: 'colony',
  },
  {
    eyebrow:   'Harm Reduction · Evidence-Based',
    headline:  'Harm reduction,',
    accent:    'scientifically.',
    sub:       'Accurate pharmacokinetic models for real substances. What your body actually does — not approximations, not scare tactics.',
    cta:       { label: 'Harm Reduction Tools', href: '/harm-reduction' },
    ctaSecond: { label: 'Interaction Checker', href: '/harm-reduction/interactions' },
    accentColor: C.purple,
    accentGrad: `linear-gradient(135deg, ${C.purple}, #ec4899)`,
    animation: 'hr',
  },
]

// ─── Canvas animations ─────────────────────────────────────────────────────────

// PK: scrolling concentration-time curve (blue→purple gradient, glowing)
function usePKAnimation(canvasRef, active) {
  const frameRef  = useRef(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return

    function concentration(t, F=0.85, D=500, Vd=35, ka=1.2, ke=0.115) {
      if (Math.abs(ka - ke) < 1e-10) return 0
      return Math.max(0, (F * D * ka) / (Vd * (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t)))
    }

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (!W || !H) return
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr; canvas.height = H * dpr
      }
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const tWin = 24, off = offsetRef.current % tWin
      const maxC = concentration(Math.log(1.2 / 0.115) / (1.2 - 0.115)) * 1.35
      const xS = t => ((t % tWin) / tWin) * W
      const yS = c => H * 0.85 - (Math.min(c, maxC) / maxC) * (H * 0.72)

      // Faint grid
      ctx.strokeStyle = 'rgba(42,111,219,0.07)'
      ctx.lineWidth = 1
      for (let i = 1; i <= 5; i++) {
        const y = H * 0.85 - (i / 5) * H * 0.72
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      for (let i = 1; i <= 7; i++) {
        const x = (i / 8) * W
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }

      // Multiple curves at different doses for depth
      const doses = [
        { D: 500, alpha: 1.0, width: 2.5 },
        { D: 300, alpha: 0.4, width: 1.5 },
        { D: 750, alpha: 0.25, width: 1.5 },
      ]

      for (const { D, alpha, width } of doses) {
        const mC = concentration(Math.log(1.2 / 0.115) / (1.2 - 0.115), 0.85, D) * 1.35
        for (let cycle = -1; cycle <= 1; cycle++) {
          ctx.beginPath()
          let started = false
          for (let i = 0; i <= 500; i++) {
            const t = (i / 500) * tWin * 2
            const ts = t - off + cycle * tWin
            if (ts < -2 || ts > tWin + 2) continue
            const c = concentration(t, 0.85, D)
            const x = (ts / tWin) * W
            const y = H * 0.85 - (Math.min(c, mC) / mC) * (H * 0.72)
            if (!started) { ctx.moveTo(x, y); started = true } else ctx.lineTo(x, y)
          }
          const grad = ctx.createLinearGradient(0, 0, W, 0)
          grad.addColorStop(0,   `rgba(42,111,219,0)`)
          grad.addColorStop(0.15,`rgba(42,111,219,${alpha})`)
          grad.addColorStop(0.6, `rgba(42,111,219,${alpha})`)
          grad.addColorStop(0.85,`rgba(124,58,237,${alpha})`)
          grad.addColorStop(1,   `rgba(124,58,237,0)`)
          ctx.strokeStyle = grad
          ctx.lineWidth = width
          ctx.lineJoin = 'round'
          ctx.stroke()
        }
      }

      // Glow on main curve
      ctx.save()
      ctx.filter = 'blur(10px)'
      ctx.globalAlpha = 0.25
      for (let cycle = -1; cycle <= 1; cycle++) {
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= 200; i++) {
          const t = (i / 200) * tWin * 2
          const ts = t - off + cycle * tWin
          if (ts < -2 || ts > tWin + 2) continue
          const c = concentration(t)
          const x = (ts / tWin) * W
          const y = H * 0.85 - (Math.min(c, maxC) / maxC) * (H * 0.72)
          if (!started) { ctx.moveTo(x, y); started = true } else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = C.blue
        ctx.lineWidth = 8
        ctx.stroke()
      }
      ctx.restore()

      offsetRef.current += 0.015
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frameRef.current) }
  }, [active, canvasRef])
}

// Colony: floating particle field — dots drift and occasionally cluster
function useColonyAnimation(canvasRef, active) {
  const frameRef = useRef(null)
  const particles = useRef([])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return

    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr; canvas.height = H * dpr

    // Initialise particles
    const N = 120
    particles.current = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.5 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      alpha: 0.2 + Math.random() * 0.6,
      color: Math.random() > 0.6 ? '#16a34a' : Math.random() > 0.5 ? '#0891b2' : '#2a6fdb',
      pulse: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const pts = particles.current
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
      })

      // Draw connections between nearby particles
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 80) {
            ctx.strokeStyle = `rgba(42,111,219,${0.12 * (1 - dist/80)})`
            ctx.lineWidth = 0.8
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke()
          }
        }
      }

      // Draw particles
      pts.forEach(p => {
        const pulse = 0.85 + 0.15 * Math.sin(p.pulse)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * pulse
        ctx.fill()
        ctx.globalAlpha = 1
      })

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frameRef.current) }
  }, [active, canvasRef])
}

// HR: slow plasma wave — flowing purple sinusoids
function useHRAnimation(canvasRef, active) {
  const frameRef = useRef(null)
  const tRef = useRef(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (!W || !H) return
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr; canvas.height = H * dpr
      }
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const t = tRef.current

      const waves = [
        { amp: H * 0.12, freq: 0.012, speed: 0.005, phase: 0,          y: H * 0.4, color: '#7c3aed', alpha: 0.7, width: 2 },
        { amp: H * 0.08, freq: 0.018, speed: 0.007, phase: Math.PI/3,   y: H * 0.5, color: '#a855f7', alpha: 0.5, width: 1.5 },
        { amp: H * 0.15, freq: 0.008, speed: 0.004, phase: Math.PI*0.7, y: H * 0.6, color: '#6d28d9', alpha: 0.4, width: 2.5 },
        { amp: H * 0.06, freq: 0.022, speed: 0.008, phase: Math.PI*1.2, y: H * 0.35,color: '#ec4899', alpha: 0.3, width: 1 },
      ]

      waves.forEach(w => {
        ctx.beginPath()
        for (let x = 0; x <= W; x += 3) {
          const y = w.y + w.amp * Math.sin(w.freq * x + t * w.speed + w.phase)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        const grad = ctx.createLinearGradient(0, 0, W, 0)
        grad.addColorStop(0,   `${w.color}00`)
        grad.addColorStop(0.1, `${w.color}${Math.round(w.alpha*255).toString(16).padStart(2,'0')}`)
        grad.addColorStop(0.9, `${w.color}${Math.round(w.alpha*255).toString(16).padStart(2,'0')}`)
        grad.addColorStop(1,   `${w.color}00`)
        ctx.strokeStyle = grad
        ctx.lineWidth = w.width
        ctx.lineJoin = 'round'
        ctx.stroke()

        // Glow
        ctx.save()
        ctx.filter = 'blur(6px)'
        ctx.globalAlpha = 0.15
        ctx.beginPath()
        for (let x = 0; x <= W; x += 6) {
          const y = w.y + w.amp * Math.sin(w.freq * x + t * w.speed + w.phase)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = w.color
        ctx.lineWidth = w.width * 3
        ctx.stroke()
        ctx.restore()
      })

      tRef.current += 1
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frameRef.current) }
  }, [active, canvasRef])
}

// ─── Hero canvas wrapper ───────────────────────────────────────────────────────

function HeroCanvas({ type }) {
  const canvasRef = useRef(null)
  usePKAnimation(canvasRef,     type === 'pk')
  useColonyAnimation(canvasRef, type === 'colony')
  useHRAnimation(canvasRef,     type === 'hr')

  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9 }} />
  )
}

// ─── Spotlight tool cards ─────────────────────────────────────────────────────

const SPOTLIGHTS = [
  {
    size: 'large',
    icon: '📈',
    tag: 'Academic · PK/PD',
    title: 'PK/PD Calculator',
    desc: 'Twelve pharmacokinetic models including 1- and 2-compartment, Michaelis-Menten nonlinear clearance, and population simulation with RK4 integration. The closest thing to a full clinical PK workbench in a browser.',
    href: '/calculator',
    color: C.blue,
    grad: `linear-gradient(135deg, ${C.blue}22, ${C.purple}11)`,
  },
  {
    size: 'large',
    icon: '🔬',
    tag: 'Lab Prep · Image Analysis',
    title: 'Colony Counter',
    desc: 'Upload a plate photograph and count colonies with one click. Manual marking plus automatic Otsu threshold detection — with crop, mask preview, and live count. Built for the bench.',
    href: '/lab/colonies',
    color: '#16a34a',
    grad: 'linear-gradient(135deg, #16a34a22, #0891b211)',
  },
  {
    size: 'small',
    icon: '🫀',
    tag: 'Academic · ADME',
    title: 'Interactive ADME',
    desc: 'Click organs on an anatomical diagram to explore absorption, first-pass metabolism, distribution, the BBB, and renal excretion.',
    href: '/tools/adme',
    color: '#f97316',
    grad: 'linear-gradient(135deg, #f9731622, #dc262611)',
  },
  {
    size: 'small',
    icon: '⚗️',
    tag: 'Academic · AI-assisted',
    title: 'Drug Interaction Checker',
    desc: 'Enter any two drugs and get a mechanism-level interaction analysis — enzyme pathway, severity, and clinical management.',
    href: '/interactions',
    color: C.purple,
    grad: `linear-gradient(135deg, ${C.purple}22, #ec489911)`,
  },
]

// ─── Stats strip ──────────────────────────────────────────────────────────────

const STATS = [
  { value: '12',  label: 'PK models' },
  { value: '9',   label: 'Lab tools' },
  { value: '7',   label: 'HR calculators' },
  { value: 'RK4', label: 'Numerical solver' },
  { value: '0',   label: 'AI in the maths' },
]

// ─── Harm reduction substances ────────────────────────────────────────────────

const HR_SUBSTANCES = [
  { emoji: '🍺', label: 'Alcohol',      href: '/harm-reduction/alcohol' },
  { emoji: '💊', label: 'MDMA',         href: '/harm-reduction/mdma' },
  { emoji: '🌿', label: 'Cannabis',     href: '/harm-reduction/cannabis' },
  { emoji: '❄️', label: 'Cocaine',      href: '/harm-reduction/cocaine' },
  { emoji: '⚡', label: 'Amphetamines', href: '/harm-reduction/amphetamines' },
  { emoji: '🔮', label: 'Ketamine',     href: '/harm-reduction/ketamine' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)
  const current = SLIDES[slide]

  const goTo = useCallback((idx) => {
    setFading(true)
    setTimeout(() => {
      setSlide(idx)
      setFading(false)
    }, 280)
  }, [])

  const prev = () => goTo((slide + SLIDES.length - 1) % SLIDES.length)
  const next = () => goTo((slide + 1) % SLIDES.length)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes scrollHint {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
          50%       { transform: translateX(-50%) translateY(6px); opacity: 0.7; }
        }
        .hero-content { animation: fadeSlide 0.35s ease forwards; }
        .hero-content.fading { opacity: 0; transform: translateY(-8px); transition: opacity 0.28s ease, transform 0.28s ease; animation: none; }
        .tool-card { transition: background 0.2s, border-color 0.2s, transform 0.2s; }
        .tool-card:hover { border-color: rgba(255,255,255,0.18) !important; transform: translateY(-2px); }
        .nav-dot { transition: all 0.2s; cursor: pointer; }
        .hr-pill { transition: background 0.15s, border-color 0.15s; }
        .hr-pill:hover { background: rgba(124,58,237,0.25) !important; border-color: rgba(124,58,237,0.5) !important; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '96vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', background: C.bg }}>

        {/* Animated canvas background */}
        <HeroCanvas type={current.animation} />

        {/* Dark vignette edges */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10,15,30,0.7) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px', background: `linear-gradient(to bottom, transparent, ${C.bg})`, pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', padding: '0 2rem', paddingTop: '7rem' }}>

          {/* Eyebrow */}
          <div className={`hero-content${fading ? ' fading' : ''}`} key={`eyebrow-${slide}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: `${current.accentColor}1a`, border: `1px solid ${current.accentColor}44`, borderRadius: '999px', padding: '5px 14px', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: current.accentColor, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', color: current.accentColor, letterSpacing: '0.1em', fontWeight: '600', textTransform: 'uppercase' }}>
              {current.eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h1 className={`hero-content${fading ? ' fading' : ''}`} key={`headline-${slide}`}
            style={{ fontSize: 'clamp(44px, 6.5vw, 80px)', fontWeight: '900', color: C.text, lineHeight: '1.02', letterSpacing: '-0.035em', marginBottom: '22px' }}>
            {current.headline}<br />
            <span style={{ background: current.accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {current.accent}
            </span>
          </h1>

          {/* Subheadline */}
          <p className={`hero-content${fading ? ' fading' : ''}`} key={`sub-${slide}`}
            style={{ fontSize: '17px', color: C.textMid, lineHeight: '1.65', marginBottom: '40px', maxWidth: '520px' }}>
            {current.sub}
          </p>

          {/* CTAs */}
          <div className={`hero-content${fading ? ' fading' : ''}`} key={`cta-${slide}`}
            style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '56px' }}>
            <Link href={current.cta.href} style={{
              padding: '13px 28px', background: current.accentColor, color: 'white',
              borderRadius: '10px', fontWeight: '700', fontSize: '15px', textDecoration: 'none',
              letterSpacing: '-0.01em', boxShadow: `0 0 32px ${current.accentColor}44`,
            }}>
              {current.cta.label}
            </Link>
            <Link href={current.ctaSecond.href} style={{
              padding: '13px 28px', background: 'rgba(255,255,255,0.07)', color: C.text,
              border: `1px solid ${C.border}`, borderRadius: '10px', fontWeight: '500',
              fontSize: '15px', textDecoration: 'none',
            }}>
              {current.ctaSecond.label}
            </Link>

            {/* Prev / Next */}
            <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
              {[
                { fn: prev, icon: '←', label: 'Previous' },
                { fn: next, icon: '→', label: 'Next' },
              ].map(({ fn, icon, label }) => (
                <button key={icon} onClick={fn} aria-label={label} style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)',
                  color: C.textMid, fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Slide dots */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '56px' }}>
            {SLIDES.map((_, i) => (
              <button key={i} className="nav-dot" onClick={() => goTo(i)} aria-label={`Slide ${i+1}`} style={{
                width: i === slide ? '24px' : '7px', height: '7px', borderRadius: '999px',
                background: i === slide ? current.accentColor : C.textDim,
                border: 'none', cursor: 'pointer', padding: 0,
              }} />
            ))}
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '40px', paddingTop: '28px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: C.textDim, marginTop: '3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '28px', left: '50%', animation: 'scrollHint 2s ease-in-out infinite', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px', color: C.textDim, letterSpacing: '0.12em' }}>SCROLL</span>
            <div style={{ width: '1px', height: '28px', background: `linear-gradient(to bottom, ${C.textDim}, transparent)` }} />
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT TOOLS ── */}
      <section style={{ padding: '6rem 2rem', background: C.bg }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ marginBottom: '3rem' }}>
            <p style={{ fontSize: '11px', color: C.blueLight, fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Built for the curriculum
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '12px' }}>
              The tools you'll actually use.
            </h2>
            <p style={{ fontSize: '15px', color: C.textMid, maxWidth: '480px', lineHeight: '1.65' }}>
              Every calculator runs on real equations — closed-form solutions or RK4 numerical integration. No black boxes.
            </p>
          </div>

          {/* 2 large + 2 small grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: '14px' }}>
            {SPOTLIGHTS.map((tool, i) => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none', gridRow: tool.size === 'large' ? 1 : 2 }}>
                <div className="tool-card" style={{
                  background: tool.grad, border: `1px solid ${C.border}`,
                  borderRadius: '16px', padding: tool.size === 'large' ? '2rem' : '1.5rem',
                  height: '100%', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ fontSize: tool.size === 'large' ? '36px' : '28px' }}>{tool.icon}</div>
                    <span style={{ fontSize: '10px', color: tool.color, fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', background: `${tool.color}18`, padding: '3px 10px', borderRadius: '999px', border: `1px solid ${tool.color}33` }}>
                      {tool.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: tool.size === 'large' ? '22px' : '17px', fontWeight: '700', color: C.text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {tool.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: C.textMid, lineHeight: '1.65', marginBottom: '20px' }}>
                    {tool.desc}
                  </p>
                  <span style={{ fontSize: '12px', color: tool.color, fontWeight: '600', letterSpacing: '0.02em' }}>
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* View all */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '24px' }}>
            <Link href="/tools" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>
              All academic tools →
            </Link>
            <Link href="/lab" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>
              Lab Prep Toolbox →
            </Link>
            <Link href="/formulas" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>
              Formula Reference →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HARM REDUCTION ── */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(180deg, #0a0f1e 0%, #110a1e 40%, #0d0a1e 100%)', borderTop: `1px solid ${C.purple}22`, borderBottom: `1px solid ${C.purple}22`, position: 'relative', overflow: 'hidden' }}>

        {/* Purple glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', background: `radial-gradient(ellipse, ${C.purple}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

            {/* Left: copy */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: `${C.purple}1a`, border: `1px solid ${C.purple}44`, borderRadius: '999px', padding: '5px 14px', marginBottom: '24px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.purple, display: 'inline-block', animation: 'pulse 2.5s infinite' }} />
                <span style={{ fontSize: '11px', color: C.purpleLight, letterSpacing: '0.1em', fontWeight: '600', textTransform: 'uppercase' }}>
                  Harm Reduction
                </span>
              </div>

              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
                Real PK for<br />
                <span style={{ background: `linear-gradient(135deg, ${C.purple}, #ec4899)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  real decisions.
                </span>
              </h2>

              <p style={{ fontSize: '15px', color: C.textMid, lineHeight: '1.7', marginBottom: '32px', maxWidth: '400px' }}>
                Accurate information reduces harm more effectively than abstinence messaging. These calculators model what your body actually does with a substance — based on published pharmacokinetic data.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/harm-reduction" style={{
                  padding: '12px 24px', background: C.purple, color: 'white',
                  borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none',
                  boxShadow: `0 0 28px ${C.purple}44`,
                }}>
                  Explore harm reduction →
                </Link>
                <Link href="/harm-reduction/interactions" style={{
                  padding: '12px 24px', background: `${C.purple}18`, color: C.purpleLight,
                  border: `1px solid ${C.purple}44`, borderRadius: '10px',
                  fontWeight: '500', fontSize: '14px', textDecoration: 'none',
                }}>
                  Interaction checker
                </Link>
              </div>
            </div>

            {/* Right: substance pills */}
            <div>
              <p style={{ fontSize: '11px', color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '600' }}>
                Calculators available
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {HR_SUBSTANCES.map(s => (
                  <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
                    <div className="hr-pill" style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px', borderRadius: '10px',
                      background: `${C.purple}0f`, border: `1px solid ${C.purple}28`,
                      cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: '20px' }}>{s.emoji}</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: C.text }}>{s.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/harm-reduction" style={{ fontSize: '12px', color: C.textDim, textDecoration: 'none', display: 'block', marginTop: '12px' }}>
                + interactions checker, PK guide →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER STRIP ── */}
      <footer style={{ padding: '2.5rem 2rem', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: C.text, letterSpacing: '-0.03em' }}>PharmLab</span>
            <span style={{ fontSize: '12px', color: C.textDim }}>Made by a BPS student · Not officially affiliated with Leiden University</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[['Tools', '/tools'], ['Lab Prep', '/lab'], ['Harm Reduction', '/harm-reduction'], ['Sources', '/sources']].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}