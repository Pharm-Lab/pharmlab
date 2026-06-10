'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

// Oral 1-compartment PK curve — same math as the calculator
function concentration(t, F, D, Vd, ka, ke) {
  if (Math.abs(ka - ke) < 1e-10) return 0
  return Math.max(0, (F * D * ka) / (Vd * (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t)))
}

function HeroCurve() {
  const canvasRef = useRef(null)
  const frameRef  = useRef(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W   = canvas.offsetWidth
      const H   = canvas.offsetHeight
      if (!W || !H) return
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width  = W * dpr
        canvas.height = H * dpr
      }
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, W, H)

      const tWindow = 24   // hours shown
      const tOffset = offsetRef.current % tWindow
      const params  = { F: 0.8, D: 500, Vd: 35, ka: 1.2, ke: 0.115 }
      const maxC    = concentration(
        Math.log(params.ka / params.ke) / (params.ka - params.ke),
        params.F, params.D, params.Vd, params.ka, params.ke
      ) * 1.3

      const xS = t => ((t % tWindow) / tWindow) * W
      const yS = c => H - 40 - (Math.min(c, maxC) / maxC) * (H - 80)

      // Effect zones — very subtle
      const zones = [
        { min: 0,       max: 0.15, color: 'rgba(34,197,94,0.04)' },
        { min: 0.15,    max: 0.4,  color: 'rgba(132,204,22,0.05)' },
        { min: 0.4,     max: 0.7,  color: 'rgba(245,158,11,0.06)' },
        { min: 0.7,     max: 1.0,  color: 'rgba(239,68,68,0.07)' },
      ]
      zones.forEach(z => {
        const y0 = yS(z.max * maxC)
        const y1 = yS(z.min * maxC)
        ctx.fillStyle = z.color
        ctx.fillRect(0, Math.max(y0, 0), W, Math.min(y1, H) - Math.max(y0, 0))
      })

      // Grid lines — very faint
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth   = 1
      for (let i = 0; i <= 6; i++) {
        const y = 40 + (i / 6) * (H - 80)
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * W
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }

      // Draw two cycles of the curve for seamless scroll
      for (let cycle = -1; cycle <= 1; cycle++) {
        const nPts = 600
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= nPts; i++) {
          const t = (i / nPts) * tWindow * 2
          const tShifted = t - tOffset + cycle * tWindow
          if (tShifted < -2 || tShifted > tWindow + 2) continue
          const c = concentration(t, params.F, params.D, params.Vd, params.ka, params.ke)
          const x = ((tShifted) / tWindow) * W
          const y = yS(c)
          if (!started) { ctx.moveTo(x, y); started = true }
          else ctx.lineTo(x, y)
        }

        // Gradient stroke
        const grad = ctx.createLinearGradient(0, 0, W, 0)
        grad.addColorStop(0,    'rgba(42,111,219,0)')
        grad.addColorStop(0.1,  'rgba(42,111,219,0.8)')
        grad.addColorStop(0.5,  'rgba(42,111,219,1)')
        grad.addColorStop(0.9,  'rgba(124,58,237,0.8)')
        grad.addColorStop(1,    'rgba(124,58,237,0)')
        ctx.strokeStyle = grad
        ctx.lineWidth   = 2.5
        ctx.lineJoin    = 'round'
        ctx.stroke()
      }

      // Glow effect — second pass with blur simulation
      ctx.save()
      ctx.filter = 'blur(8px)'
      ctx.globalAlpha = 0.3
      for (let cycle = -1; cycle <= 1; cycle++) {
        const nPts = 200
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= nPts; i++) {
          const t = (i / nPts) * tWindow * 2
          const tShifted = t - tOffset + cycle * tWindow
          if (tShifted < -2 || tShifted > tWindow + 2) continue
          const c = concentration(t, params.F, params.D, params.Vd, params.ka, params.ke)
          const x = ((tShifted) / tWindow) * W
          const y = yS(c)
          if (!started) { ctx.moveTo(x, y); started = true }
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = '#2a6fdb'
        ctx.lineWidth   = 6
        ctx.stroke()
      }
      ctx.restore()

      offsetRef.current += 0.012
      ctx.scale(1/dpr, 1/dpr)
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [])

  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 }} />
  )
}

const TOOLS = [
  {
    emoji: '📈',
    title: 'PK/PD Calculator',
    desc: '1 and 2-compartment models, linear and Michaelis-Menten clearance, population simulation.',
    href: '/calculator',
    accent: '#2a6fdb',
  },
  {
    emoji: '🫘',
    title: 'Dosage Adjustment',
    desc: 'Renal (Cockcroft-Gault) and hepatic (Child-Pugh) dose adjustment with curve comparison.',
    href: '/tools/dosage-adjustment',
    accent: '#2a6fdb',
  },
  {
    emoji: '✏️',
    title: 'Exercise Helper',
    desc: 'Step-by-step solutions to PK/PD problems with exam tips and follow-up questions.',
    href: '/exercises',
    accent: '#2a6fdb',
  },
  {
    emoji: '⚗️',
    title: 'Drug Interactions',
    desc: 'AI-powered interaction checker — mechanism, enzyme pathway, clinical significance.',
    href: '/interactions',
    accent: '#2a6fdb',
  },
]

const HR_TOOLS = [
  { emoji: '🍺', title: 'Alcohol',       href: '/harm-reduction/alcohol',      accent: '#2563eb' },
  { emoji: '💊', title: 'MDMA',          href: '/harm-reduction/mdma',         accent: '#7c3aed' },
  { emoji: '🌿', title: 'Cannabis',      href: '/harm-reduction/cannabis',     accent: '#16a34a' },
  { emoji: '🤧', title: 'Cocaine',       href: '/harm-reduction/cocaine',      accent: '#dc2626' },
  { emoji: '⚡', title: 'Amphetamines',  href: '/harm-reduction/amphetamines', accent: '#f97316' },
  { emoji: '🔮', title: 'Ketamine',      href: '/harm-reduction/ketamine',     accent: '#6366f1' },
  { emoji: '🧪', title: 'Cathinones',    href: '/harm-reduction/cathinones',   accent: '#f97316' },
  { emoji: '⚗️', title: 'Interactions',  href: '/harm-reduction/interactions', accent: '#dc2626' },
  { emoji: '📖', title: 'Guide',         href: '/harm-reduction/guide',        accent: '#2563eb' },
]

const STAT = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '32px', fontWeight: '800', color: '#f0f4ff', fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em' }}>
      {value}
    </div>
    <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.5)', marginTop: '2px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {label}
    </div>
  </div>
)

export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f9fafb', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', background: '#0a0f1e', minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <HeroCurve />

        {/* Gradient overlay — bottom fade to content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, transparent, #0a0f1e)', pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: '0 2rem', paddingTop: '6rem' }}>

          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(42,111,219,0.15)', border: '1px solid rgba(42,111,219,0.3)', borderRadius: '999px', padding: '4px 12px', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2a6fdb', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', color: '#93b4f7', letterSpacing: '0.08em', fontWeight: '500' }}>
              BIOPHARMACEUTICAL SCIENCES · LEIDEN UNIVERSITY
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '800', color: '#f0f4ff', lineHeight: '1.05', letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            Pharmacokinetics<br />
            <span style={{ background: 'linear-gradient(135deg, #2a6fdb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              made tangible.
            </span>
          </h1>

          {/* Subhead */}
          <p style={{ fontSize: '18px', color: 'rgba(240,244,255,0.65)', lineHeight: '1.6', margin: '0 0 36px', maxWidth: '540px' }}>
            Academic tools and harm reduction calculators built on real PK math — not approximations, not AI guesses.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/calculator"
              style={{ padding: '13px 28px', background: '#2a6fdb', color: 'white', borderRadius: '10px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}>
              Open PK Calculator
            </Link>
            <Link href="/harm-reduction"
              style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.08)', color: '#f0f4ff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontWeight: '500', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}>
              Harm Reduction Tools
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '48px', marginTop: '64px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
            <STAT value="12"  label="PK models" />
            <STAT value="7"   label="Harm reduction calculators" />
            <STAT value="RK4" label="Numerical solver" />
            <STAT value="0"   label="AI in the maths" />
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: 0.4 }}>
          <span style={{ fontSize: '11px', color: '#f0f4ff', letterSpacing: '0.1em' }}>SCROLL</span>
          <div style={{ width: '1px', height: '32px', background: 'linear-gradient(to bottom, #f0f4ff, transparent)' }} />
        </div>
      </section>

      {/* ── Academic tools ── */}
      <section style={{ background: '#f9fafb', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '11px', color: '#2a6fdb', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>Academic tools</p>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Built for the curriculum
            </h2>
            <p style={{ fontSize: '15px', color: '#6b7280', margin: 0, maxWidth: '480px', lineHeight: '1.6' }}>
              Every calculator uses closed-form equations or RK4 numerical integration — the same methods your textbook uses.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', height: '100%', boxSizing: 'border-box', transition: 'box-shadow 0.15s', cursor: 'pointer' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{tool.emoji}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>{tool.title}</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px', lineHeight: '1.5' }}>{tool.desc}</p>
                  <span style={{ fontSize: '12px', color: tool.accent, fontWeight: '600' }}>Open →</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '12px' }}>
            <Link href="/tools" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              View all tools including dosage adjustment, NCA, and bioequivalence →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Harm reduction ── */}
      <section style={{ background: 'white', padding: '5rem 2rem', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>Harm reduction</p>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Real PK for real decisions
            </h2>
            <p style={{ fontSize: '15px', color: '#6b7280', margin: 0, maxWidth: '520px', lineHeight: '1.6' }}>
              Accurate information reduces harm more effectively than abstinence messaging. These tools show what your body actually does with a substance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {HR_TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{tool.emoji}</div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{tool.title}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '12px' }}>
            <Link href="/harm-reduction" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              View all harm reduction tools including interaction checker and graph guide →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Lab prep strip ── */}
      <section style={{ background: '#0a0f1e', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.4)', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>Lab Prep Toolbox</p>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Dilutions, molarity, buffers, unit conversion
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(240,244,255,0.5)', margin: 0 }}>
              C₁V₁ = C₂V₂, Henderson-Hasselbalch, serial dilutions, and every unit you'll need in practical.
            </p>
          </div>
          <Link href="/lab"
            style={{ padding: '12px 24px', background: 'rgba(42,111,219,0.15)', color: '#93b4f7', border: '1px solid rgba(42,111,219,0.3)', borderRadius: '10px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Open Lab Prep →
          </Link>
        </div>
      </section>

      {/* ── Footer disclaimer ── */}
      <section style={{ background: '#f9fafb', padding: '2rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', maxWidth: '560px' }}>
            <strong style={{ color: '#6b7280' }}>PharmLab</strong> is an educational tool for biopharmaceutical sciences students.
            It is not a clinical decision support system and should not be used for medical advice.
            Harm reduction information is for educational purposes only.
          </div>
          <Link href="/sources" style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'none' }}>
            Sources & citations →
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}