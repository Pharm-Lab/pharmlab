'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Math ─────────────────────────────────────────────────────────

function noyesWhitney({ D, A, Cs, h, V, t }) {
  // dC/dt = D·A·Cs / (h·V) — first-order approach to saturation
  // C(t) = Cs × (1 − e^(−k·t))  where k = D·A / (h·V)
  const k = (D * A) / (h * V)
  return Cs * (1 - Math.exp(-k * t))
}

function weibullRelease({ F, k, b, t }) {
  // Weibull: F(t) = 1 - e^(-(t/k)^b)
  return F * (1 - Math.exp(-Math.pow(t / k, b)))
}

function zeroOrderRelease({ rate, t, maxF }) {
  return Math.min(rate * t, maxF)
}

function firstOrderRelease({ k, t, maxF }) {
  return maxF * (1 - Math.exp(-k * t))
}

function hixsonCrowell({ D, rho, Cs, t, r0, V }) {
  // r(t) = r0 - (D·Cs·t)/(rho·r0)  simplified
  const r = Math.max(0, r0 - (D * Cs * t) / (rho * r0 * V * 1e6))
  const fractionRemaining = Math.pow(r / r0, 3)
  return Math.min(1, 1 - fractionRemaining)
}

const BCS_CLASSES = [
  { cls: 'I',   solubility: 'High',   permeability: 'High',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    description: 'Well absorbed. Dissolution rarely rate-limiting — gastric emptying determines rate.',
    examples: 'Metoprolol, verapamil, propranolol', logP: '0–3' },
  { cls: 'II',  solubility: 'Low',    permeability: 'High',  color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    description: 'Dissolution rate-limiting. Particle size reduction, amorphous forms, solid dispersions dramatically improve absorption.',
    examples: 'Ibuprofen, carbamazepine, danazol', logP: '>3' },
  { cls: 'III', solubility: 'High',   permeability: 'Low',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    description: 'Permeability is the barrier. Dissolution fast; absorption depends on membrane transport.',
    examples: 'Metformin, cimetidine, ranitidine', logP: '<0' },
  { cls: 'IV',  solubility: 'Low',    permeability: 'Low',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    description: 'Poorly absorbed. Difficult oral formulation. Often requires alternative delivery.',
    examples: 'Hydrochlorothiazide, furosemide, taxol', logP: 'variable' },
]

const RELEASE_PROFILES = [
  { id: 'immediate',  label: 'Immediate release',  color: '#2563eb' },
  { id: 'extended',   label: 'Extended release',   color: '#7c3aed' },
  { id: 'zero_order', label: 'Zero-order',         color: '#16a34a' },
]

// ─── Canvas ────────────────────────────────────────────────────────

function DissolutionCanvas({ curves, yLabel, xLabel, xMax, yMax, threshold }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !curves?.length) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    if (!W || !H) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad  = { top: 20, right: 24, bottom: 44, left: 56 }
    const cW   = W - pad.left - pad.right
    const cH   = H - pad.top  - pad.bottom

    const xS = x => pad.left + (x / xMax) * cW
    const yS = y => pad.top  + cH - (Math.min(y, yMax) / yMax) * cH

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0f1e'; ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(pad.left, pad.top + (i / 5) * cH); ctx.lineTo(pad.left + cW, pad.top + (i / 5) * cH); ctx.stroke()
    }
    const nX = 6
    for (let i = 0; i <= nX; i++) {
      ctx.beginPath(); ctx.moveTo(xS(xMax * i / nX), pad.top); ctx.lineTo(xS(xMax * i / nX), pad.top + cH); ctx.stroke()
    }

    // Threshold line
    if (threshold && threshold <= yMax) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(threshold)); ctx.lineTo(pad.left + cW, yS(threshold)); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f59e0b'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText('85% threshold', pad.left + cW - 2, yS(threshold) - 3)
    }

    // Axis labels
    ctx.fillStyle = 'rgba(240,244,255,0.5)'; ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const v = yMax * (1 - i / 5)
      ctx.fillText(v.toFixed(v < 1 ? 2 : 0), pad.left - 3, pad.top + (i / 5) * cH + 3)
    }
    ctx.textAlign = 'center'
    for (let i = 0; i <= nX; i++) {
      ctx.fillText((xMax * i / nX).toFixed(0), xS(xMax * i / nX), pad.top + cH + 14)
    }

    ctx.save(); ctx.translate(12, pad.top + cH / 2); ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(240,244,255,0.3)'
    ctx.fillText(yLabel, 0, 0); ctx.restore()
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(240,244,255,0.3)'
    ctx.fillText(xLabel, pad.left + cW / 2, H - 6)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Curves
    curves.forEach(curve => {
      ctx.strokeStyle = curve.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
      ctx.beginPath()
      curve.pts.forEach((p, i) => {
        const x = xS(p.t)
        const y = yS(p.v)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Label at end of curve
      const last = curve.pts[curve.pts.length - 1]
      if (last) {
        ctx.fillStyle = curve.color; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
        ctx.fillText(curve.label, xS(last.t) + 3, yS(last.v) + 3)
      }
    })

  }, [curves, xMax, yMax, threshold])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '240px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: '#0a0f1e' }} />
  )
}

// ─── Main page ─────────────────────────────────────────────────────

export default function DissolutionPage() {
  const [tab, setTab] = useState('dissolution')

  // Noyes-Whitney params
  const [particleSize, setParticleSize] = useState(50)    // μm radius
  const [solubility,   setSolubility]   = useState(0.5)   // mg/mL
  const [stirring,     setStirring]     = useState(50)    // RPM proxy → affects h
  const [volume,       setVolume]       = useState(900)   // mL dissolution medium
  const [dose,         setDose]         = useState(500)   // mg
  const [bcsClass,     setBcsClass]     = useState('II')

  // Release profile params
  const [showProfiles, setShowProfiles] = useState({ immediate: true, extended: true, zero_order: true })

  // Compute Noyes-Whitney curves
  const nw = (() => {
    const D    = 5e-6        // cm²/s (diffusion coefficient, ~typical)
    const rho  = 1.2e-3      // g/mm³
    const r0   = particleSize * 1e-4  // convert μm to cm
    const A    = (3 / (rho * r0)) * (dose / 1000)  // total surface area (cm²) for dose
    const Cs   = solubility   // mg/mL = mg/cm³
    const h    = 50 / stirring * 30e-4  // diffusion layer (cm) — decreases with stirring
    const V    = volume       // mL = cm³
    const pts  = []
    const tMax = 120          // minutes
    for (let t = 0; t <= tMax; t += 2) {
      const tSec = t * 60
      const C    = noyesWhitney({ D, A, Cs, h, V, t: tSec })
      const pct  = Math.min(100, (C * V / dose) * 100)
      pts.push({ t, v: pct })
    }
    return pts
  })()

  // Particle size comparison curves
  const particleCurves = [10, 50, 100, 200].map(size => {
    const D    = 5e-6
    const rho  = 1.2e-3
    const r0   = size * 1e-4
    const A    = (3 / (rho * r0)) * (dose / 1000)
    const Cs   = solubility
    const h    = 50 / stirring * 30e-4
    const V    = volume
    const pts  = []
    for (let t = 0; t <= 120; t += 2) {
      const C   = noyesWhitney({ D, A, Cs, h, V, t: t * 60 })
      const pct = Math.min(100, (C * V / dose) * 100)
      pts.push({ t, v: pct })
    }
    return {
      label: size + 'μm',
      color: size === 10 ? '#16a34a' : size === 50 ? '#2563eb' : size === 100 ? '#f97316' : '#dc2626',
      pts,
    }
  })

  // Release profiles
  const releaseCurves = []
  const tMax = 24
  const tPts = Array.from({ length: 49 }, (_, i) => i * tMax / 48)

  if (showProfiles.immediate) {
    const k = 0.5 // fast first-order
    releaseCurves.push({
      label: 'Immediate release', color: '#2563eb',
      pts: tPts.map(t => ({ t, v: firstOrderRelease({ k, t, maxF: 100 }) })),
    })
  }
  if (showProfiles.extended) {
    releaseCurves.push({
      label: 'Extended release (Weibull)', color: '#7c3aed',
      pts: tPts.map(t => ({ t, v: weibullRelease({ F: 100, k: 8, b: 0.7, t }) })),
    })
  }
  if (showProfiles.zero_order) {
    releaseCurves.push({
      label: 'Zero-order', color: '#16a34a',
      pts: tPts.map(t => ({ t, v: zeroOrderRelease({ rate: 100 / 12, t, maxF: 100 }) })),
    })
  }

  const bcs = BCS_CLASSES.find(b => b.cls === bcsClass)

  const tabBtn = active => ({
    padding: '8px 20px', cursor: 'pointer', fontSize: '13px',
    fontWeight: tab === active ? '600' : '400',
    border: 'none', borderBottom: tab === active ? '2px solid #2a6fdb' : '2px solid transparent',
    background: 'transparent', color: tab === active ? '#93b4f7' : 'rgba(240,244,255,0.4)', marginBottom: '-1px',
  })

  const sliderRow = (label, value, setValue, min, max, step, unit, hint) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.7)', fontWeight: '500' }}>{label}</label>
        <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: '#93b4f7', fontWeight: '600' }}>{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setValue(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#2563eb' }} />
      {hint && <p style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', margin: '2px 0 0' }}>{hint}</p>}
    </div>
  )

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input[type=range] { accent-color: #2a6fdb; }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Dissolution & Drug Release</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Simulate how drugs dissolve and are released from formulations. The key insight: for BCS Class II drugs (the majority of new chemical entities), dissolution rate — not membrane permeability — is the bottleneck for absorption. Formulation decisions like particle size, crystallinity, and dosage form design directly determine bioavailability.
    </p>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.5rem', display: 'flex' }}>
        <button onClick={() => setTab('dissolution')} style={tabBtn('dissolution')}>Dissolution simulator</button>
        <button onClick={() => setTab('release')}     style={tabBtn('release')}>Release profiles</button>
        <button onClick={() => setTab('bcs')}         style={tabBtn('bcs')}>BCS classification</button>
      </div>

      {/* ── Tab 1: Dissolution simulator ── */}
      {tab === 'dissolution' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Noyes-Whitney parameters</p>
              {sliderRow('Particle radius', particleSize, setParticleSize, 1, 500, 1, 'μm', 'Smaller = faster dissolution. Micronised = ~1–10μm, conventional = 50–200μm.')}
              {sliderRow('Saturation solubility Cs', solubility, setSolubility, 0.01, 10, 0.01, 'mg/mL', 'Intrinsic solubility at dissolution pH. BCS Class II = typically < 0.1 mg/mL.')}
              {sliderRow('Stirring speed', stirring, setStirring, 10, 200, 10, 'RPM', 'Higher stirring = thinner diffusion layer (h) = faster dissolution.')}
              {sliderRow('Dissolution medium', volume, setVolume, 100, 1000, 50, 'mL', 'USP: 900 mL for most dissolution tests.')}
              {sliderRow('Dose', dose, setDose, 50, 2000, 50, 'mg', 'Total drug dose in tablet/capsule.')}
            </div>

            <div style={{ background: '#0a0f1e', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: '#93b4f7', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Noyes-Whitney equation</p>
              <p style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: '#93b4f7', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{'dC/dt = (D × A × Cs) / (h × V)\nC(t) = Cs × (1 − e^(−k·t))\nwhere k = D·A / (h·V)'}</p>
            </div>

            <div style={{ background: 'rgba(42,111,219,0.1)', border: '1px solid rgba(42,111,219,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'rgba(240,244,255,0.65)', lineHeight: 1.65 }}>
              <strong style={{ color: '#93b4f7' }}>Key insight:</strong> Dissolution rate is proportional to surface area. Halving particle radius → 8× smaller volume per particle → 2× more particles → 2× surface area for the same mass. This is the pharmacokinetic rationale for micronisation.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DissolutionCanvas
              curves={[{ label: particleSize + 'μm', color: '#2563eb', pts: nw.map(p => ({ t: p.t, v: p.v })) }]}
              yLabel="% dissolved" xLabel="Time (min)" xMax={120} yMax={100} threshold={85}
            />
            <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', margin: 0 }}>
              The 85% dissolution threshold (dashed line) is the USP criterion for BCS-based biowaivers — if a formulation dissolves ≥85% in 30 minutes, in-vivo bioequivalence is generally inferred without a clinical PK study.
            </p>

            <div>
              <p style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(240,244,255,0.65)', marginBottom: '8px' }}>Particle size comparison (all other parameters fixed):</p>
              <DissolutionCanvas
                curves={particleCurves}
                yLabel="% dissolved" xLabel="Time (min)" xMax={120} yMax={100} threshold={85}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Release profiles ── */}
      {tab === 'release' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Show profiles</p>
              {RELEASE_PROFILES.map(rp => (
                <label key={rp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showProfiles[rp.id]}
                    onChange={e => setShowProfiles(p => ({ ...p, [rp.id]: e.target.checked }))}
                    style={{ accentColor: rp.color, width: '14px', height: '14px' }} />
                  <div style={{ width: '20px', height: '2.5px', background: rp.color, borderRadius: '2px' }} />
                  <span style={{ fontSize: '13px', color: 'rgba(240,244,255,0.7)' }}>{rp.label}</span>
                </label>
              ))}
            </div>

            {[
              {
                title: 'Immediate release',
                color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
                model: 'First-order: F(t) = 1 − e^(−k·t)',
                body: 'Drug releases rapidly as tablet disintegrates. Peak plasma concentration high, duration short. Requires multiple daily doses for chronic conditions.',
              },
              {
                title: 'Extended release (Weibull)',
                color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
                model: 'F(t) = 1 − e^(−(t/k)^b)',
                body: 'Controlled matrix or membrane system. Weibull model describes complex release kinetics empirically. β < 1: decreasing rate. β = 1: first-order. β > 1: sigmoid (lag followed by burst).',
              },
              {
                title: 'Zero-order',
                color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
                model: 'F(t) = rate × t',
                body: 'Constant release rate regardless of concentration. Ideal for chronic dosing — maintains near-constant plasma levels. Achieved by membrane-controlled systems (osmotic pumps, reservoir devices).',
              },
            ].map(item => (
              <div key={item.title} style={{ background: `${item.color}12`, border: `1px solid ${item.color}33`, borderRadius: '10px', padding: '10px 12px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: item.color, margin: '0 0 4px' }}>{item.title}</p>
                <p style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace', color: item.color, margin: '0 0 5px', opacity: 0.8 }}>{item.model}</p>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.65)', margin: 0, lineHeight: 1.55 }}>{item.body}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DissolutionCanvas
              curves={releaseCurves}
              yLabel="% released" xLabel="Time (h)" xMax={tMax} yMax={100} threshold={null}
            />
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: 'rgba(240,244,255,0.65)', lineHeight: 1.7 }}>
              <strong>Clinical relevance of release kinetics:</strong> Extended-release formulations reduce dosing frequency (once daily vs 3× daily), smooth plasma concentration peaks and troughs, reduce side effects (e.g. metformin XR causes less GI upset than IR), and can target specific GI sites. Zero-order release is the pharmacokinetic ideal for chronic conditions — constant Css without fluctuation.
            </div>
          </div>
        </div>
      )}

      {tab === 'bcs' && (
        <div>
            <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                The Biopharmaceutics Classification System (BCS) categorises drugs by aqueous solubility and intestinal permeability. It determines the rate-limiting step for oral absorption and guides formulation strategy and biowaiver decisions. Click a class to see its formulation strategies.
            </p>

            {/* 2×2 selector grid — I II / III IV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                {[
                    BCS_CLASSES.find(b => b.cls === 'I'),
                    BCS_CLASSES.find(b => b.cls === 'II'),
                    BCS_CLASSES.find(b => b.cls === 'III'),
                    BCS_CLASSES.find(b => b.cls === 'IV'),
                ].map(b => (
                    <div key={b.cls} onClick={() => setBcsClass(b.cls)}
                    style={{
                        background: bcsClass === b.cls ? `${b.color}18` : 'rgba(255,255,255,0.03)',
                        border: `${bcsClass === b.cls ? 2 : 1}px solid ${bcsClass === b.cls ? b.color : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', padding: '2px 12px', borderRadius: '8px', background: b.color, color: 'white', flexShrink: 0 }}>
                        Class {b.cls}
                        </span>
                        <span style={{ fontSize: '11px', color: b.color, fontWeight: '600' }}>
                        {b.solubility} solubility · {b.permeability} permeability
                        </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.65)', margin: '0 0 5px', lineHeight: 1.55 }}>{b.description}</p>
                    <p style={{ fontSize: '11px', color: b.color, margin: '0 0 2px', fontWeight: '500' }}>e.g. {b.examples}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', margin: 0 }}>Typical log P: {b.logP}</p>
                    </div>
                ))}
            </div>

            {/* Formulation strategy — shows for selected class */}
            {(() => {
                const strategies = {
                    I: {
                    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
                    items: [
                        'Standard immediate-release tablet or capsule — no special formulation needed',
                        'Biowaivers available: if ≥85% dissolves in 30 min, no clinical PK study needed for generic approval',
                        'Extended-release feasible without solubility challenges',
                        'Focus on chemical stability, excipient compatibility, and manufacturing consistency',
                    ],
                    },
                    II: {
                    color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
                    items: [
                        'Micronisation or nanosizing — reduces particle radius → ↑ surface area → ↑ dissolution rate (Noyes-Whitney)',
                        'Amorphous solid dispersions — drug dispersed in polymer matrix in amorphous (higher energy) state → higher apparent solubility',
                        'Lipid-based drug delivery systems (SEDDS/SMEDDS) — drug pre-dissolved in lipid; bypasses dissolution step',
                        'Salt formation — ionic form has higher aqueous solubility (e.g. sodium salt of a carboxylic acid)',
                        'Cyclodextrin complexation — hydrophilic cyclodextrin cavity hosts lipophilic drug',
                    ],
                    },
                    III: {
                    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
                    items: [
                        'Prodrugs with increased lipophilicity — ester or carbamate prodrug crosses membrane; cleaved by esterases in vivo',
                        'Permeation enhancers — fatty acids, bile salts, or surfactants transiently increase membrane fluidity',
                        'Tight junction modulators — experimental; open paracellular pathway (safety concerns)',
                        'Exploit active transporters if drug is a substrate (PepT1, OATP)',
                        'Extended-release NOT useful — slowing release prolongs GI transit in low-permeability region',
                    ],
                    },
                    IV: {
                    color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
                    items: [
                        'Often unavoidable: consider non-oral route (IV, inhalation, transdermal)',
                        'Simultaneous improvement of both solubility and permeability required — much harder than fixing one',
                        'Prodrug strategy targeting one parameter (e.g. phosphate prodrug for solubility)',
                        'Nanoparticle formulations can improve both parameters if designed carefully',
                        'High commercial risk — disproportionate development cost; many Class IV candidates are deprioritised',
                    ],
                    },
                }
                const s = strategies[bcsClass]
                const b = BCS_CLASSES.find(x => x.cls === bcsClass)
                return (
                    <div style={{ background: `${s.color}12`, border: `1.5px solid ${s.color}44`, borderRadius: '12px', padding: '14px 16px', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: s.color, margin: '0 0 10px' }}>
                        Class {bcsClass} — formulation strategies
                    </p>
                    {s.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: s.color, fontWeight: '700', flexShrink: 0, marginTop: '1px' }}>→</span>
                        <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.7)', margin: 0, lineHeight: 1.6 }}>{item}</p>
                        </div>
                    ))}
                    </div>
                )
            })()}

          <div style={{ background: 'rgba(42,111,219,0.1)', border: '1px solid rgba(42,111,219,0.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#93b4f7', lineHeight: 1.65 }}>
            <strong>BCS biowaivers (FDA/EMA):</strong> For Class I and some Class III drugs, in-vivo bioequivalence studies can be waived if the formulation dissolves ≥85% in 30 minutes in multiple pH media. This saves significant time and cost in generic drug development — a pure dissolution test replaces a clinical PK study in healthy volunteers.
          </div>
        </div>
      )}
    </main>
  )
}