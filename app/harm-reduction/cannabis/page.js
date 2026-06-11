'use client'
import { useState, useEffect, useRef } from 'react'
import {
  CANNABIS_PK, CANNABIS_ZONES, CANNABIS_INTERACTIONS,
  CANNABIS_DRIVING_LIMITS, simulateCannabis, calcCannabisMetrics,
} from '../../../lib/bacmath.js'

function formatHours(h) {
  if (h == null) return '—'
  const hours = Math.floor(h)
  const mins  = Math.round((h - hours) * 60)
  return `${hours}h ${mins.toString().padStart(2, '0')}m`
}

let doseIdCounter = 1
function makeDose(route = 'smoked') {
  return {
    id:     doseIdCounter++,
    route,
    thcMg:  route === 'smoked' ? 15 : 10,
    timeh:  0,
  }
}

export default function CannabisCalculator() {
  const [weightKg,    setWeightKg]    = useState(70)
  const [rawWeight,   setRawWeight]   = useState('70')
  const [country,     setCountry]     = useState('NL')
  const [driverType,  setDriverType]  = useState('standard')
  const [withFood,    setWithFood]    = useState(false)
  const [doses,       setDoses]       = useState([makeDose('smoked')])
  const [timeScale,   setTimeScale]   = useState(12)
  const [pts,         setPts]         = useState([])
  const [metrics,     setMetrics]     = useState(null)

  const canvasRef = useRef(null)
  const ptsRef    = useRef([])
  const metRef    = useRef(null)
  const stateRef  = useRef({})

  const totalThcMg = doses.reduce((s, d) => s + d.thcMg, 0)
  const hasOral    = doses.some(d => d.route === 'oral')
  const hasSmoked  = doses.some(d => d.route === 'smoked')

  useEffect(() => {
    stateRef.current = { timeScale, doses, country, driverType }
  }, [timeScale, doses, country, driverType])

  useEffect(() => {
    if (!doses.length) { setPts([]); setMetrics(null); return }
    const limit    = driverType !== 'none' ? (CANNABIS_DRIVING_LIMITS[country]?.limit ?? null) : null
    const simPts   = simulateCannabis({ doses, weightKg, withFood, tEnd: 48 })
    const m        = calcCannabisMetrics(simPts, limit)
    ptsRef.current = simPts
    metRef.current = m
    setPts(simPts)
    setMetrics(m)
    setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
  }, [doses, weightKg, withFood, country, driverType])

  useEffect(() => {
    if (ptsRef.current.length && canvasRef.current) drawCanvas()
  }, [pts, timeScale])

  function drawCanvas(exportCtx = null, exportW = 0, exportH = 0) {
    const simPts   = ptsRef.current
    const m        = metRef.current
    const st       = stateRef.current
    const ts       = st.timeScale  ?? timeScale
    const dEntries = st.doses      ?? doses
    const cntry    = st.country    ?? country
    const drvType  = st.driverType ?? driverType
    if (!simPts || !simPts.length) return

    let ctx, W, H
    if (exportCtx) {
      ctx = exportCtx; W = exportW; H = exportH
    } else {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      W = canvas.offsetWidth; H = canvas.offsetHeight
      if (!W || !H) return
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
    }

    const pad     = { top: 28, right: 24, bottom: 52, left: 72 }
    const cW      = W - pad.left - pad.right
    const cH      = H - pad.top  - pad.bottom
    const maxC    = Math.max(...simPts.map(p => p.c), 5) * 1.2
    const dispMax = Math.ceil(maxC / 5) * 5
    const maxT    = ts

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const xS = t => pad.left + (Math.min(t, maxT) / maxT) * cW
    const yS = c => pad.top  + cH - (Math.min(Math.max(c, 0), dispMax) / dispMax) * cH

    // Effect zones
    CANNABIS_ZONES.forEach(zone => {
      const y0 = yS(Math.min(zone.max, dispMax))
      const y1 = yS(zone.min)
      if (y1 <= pad.top || y0 >= pad.top + cH) return
      ctx.fillStyle   = zone.color
      ctx.globalAlpha = zone.alpha
      ctx.fillRect(pad.left, Math.max(y0, pad.top), cW, Math.min(y1, pad.top + cH) - Math.max(y0, pad.top))
      ctx.globalAlpha = 1
      const midY = (Math.max(y0, pad.top) + Math.min(y1, pad.top + cH)) / 2
      if (Math.min(y1, pad.top + cH) - Math.max(y0, pad.top) > 12) {
        ctx.fillStyle = zone.color; ctx.globalAlpha = 0.75
        ctx.font = '9px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(zone.label, pad.left + cW - 3, midY + 3)
        ctx.globalAlpha = 1
      }
    })

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
    const yStep  = dispMax <= 20 ? 5 : dispMax <= 50 ? 10 : 25
    const yLines = Array.from({ length: Math.floor(dispMax / yStep) + 1 }, (_, i) => i * yStep).filter(v => v <= dispMax)
    yLines.forEach(v => {
      const y = yS(v)
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    })
    const nX = Math.min(ts, 12)
    for (let i = 0; i <= nX; i++) {
      const x = pad.left + (i / nX) * cW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    }

    // Axis labels
    ctx.fillStyle = '#374151'; ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    yLines.forEach(v => ctx.fillText(v + ' ng/mL', pad.left - 4, yS(v) + 4))
    ctx.textAlign = 'center'
    for (let i = 0; i <= nX; i++) {
      ctx.fillText((ts * i / nX).toFixed(0) + 'h', pad.left + (i / nX) * cW, pad.top + cH + 18)
    }
    ctx.save()
    ctx.translate(12, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'; ctx.font = '10px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('THC plasma (ng/mL)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.fillStyle = '#374151'; ctx.font = '11px sans-serif'
    ctx.fillText('Time after first dose (h)', pad.left + cW / 2, H - 8)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Driving limit line
    const limitBlood = drvType !== 'none' ? (CANNABIS_DRIVING_LIMITS[cntry]?.limit ?? null) : null
    const limitPlasma = limitBlood != null && limitBlood > 0 ? limitBlood * 2 : null
    if (limitPlasma != null && limitPlasma <= dispMax) {
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(limitPlasma)); ctx.lineTo(pad.left + cW, yS(limitPlasma)); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#dc2626'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(`Legal limit (plasma ~${limitPlasma} ng/mL)`, pad.left + 4, yS(limitPlasma) - 4)
    }

    // Safe to drive marker
    if (m?.safeToDriveTime != null && m.safeToDriveTime <= maxT && drvType !== 'none') {
      const sx = xS(m.safeToDriveTime)
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + cH); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#16a34a'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Safe to drive', sx, pad.top + 12)
    }

    // Sub-threshold marker
    if (m?.subThresholdTime != null && m.subThresholdTime <= maxT) {
      const sx = xS(m.subThresholdTime)
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + cH); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#22c55e'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Sub-threshold', sx, pad.top + 22)
    }

    // Dose event markers
    dEntries.forEach((d, idx) => {
      if (d.timeh > maxT) return
      const x = xS(d.timeh)
      if (idx > 0) {
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(d.route === 'smoked' ? '🚬' : '🍫', x, pad.top + cH + 40)
      ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'
      ctx.fillText(d.timeh === 0 ? 't=0' : '+' + d.timeh + 'h', x, pad.top + cH + 50)
    })

    // Main curve
    const filtered = simPts.filter(p => p.t <= maxT)
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    filtered.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Peak dot
    if (m && m.tmax <= maxT) {
      ctx.fillStyle = '#16a34a'
      ctx.beginPath(); ctx.arc(xS(m.tmax), yS(m.cmax), 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#111827'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Peak ' + m.cmax + ' ng/mL', xS(m.tmax), yS(m.cmax) - 10)
    }
  }

  function exportGraph() {
    const src = canvasRef.current; if (!src) return
    const scale = 3; const W = src.offsetWidth; const H = src.offsetHeight
    const off = document.createElement('canvas')
    off.width = W * scale; off.height = H * scale
    const ctx = off.getContext('2d'); ctx.scale(scale, scale)
    drawCanvas(ctx, W, H)
    const link = document.createElement('a')
    link.download = 'pharmlab-thc-curve.png'; link.href = off.toDataURL('image/png', 1.0); link.click()
  }

  function updateDose(id, field, value) {
    setDoses(prev => prev.map(d => {
        if (d.id !== id) return d
        const updated = { ...d, [field]: value }
        // When switching route, reset thcMg to a sensible default for that route
        if (field === 'route') {
            updated.thcMg = value === 'smoked' ? 15 : 10
        }
    return updated
    }))
    }

  function removeDose(id) { setDoses(prev => prev.filter(d => d.id !== id)) }

  function addDose(route) {
    const lastTime = Math.max(...doses.map(d => d.timeh), 0)
    setDoses(prev => [...prev, { ...makeDose(route), timeh: route === 'oral' ? Math.min(lastTime + 1, 12) : Math.min(lastTime + 0.5, 12) }])
  }

  const btn = (active, color = '#16a34a') => ({
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
    fontWeight: active ? '600' : '400',
    border: active ? `2px solid ${color}` : '1px solid #d1d5db',
    background: active ? color + '18' : 'rgba(255,255,255,0.05)',
    color: active ? color : 'rgba(240,244,255,0.65)',
  })

  const drivingLimit = CANNABIS_DRIVING_LIMITS[country]

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } select option { background:#0f1629; }`}</style>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '1rem 0 4px' }}>Cannabis Pharmacokinetics</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        THC plasma concentration model for smoked and oral (edible) routes. The difference between the two curves is the most important harm reduction message for cannabis — especially for edibles.
      </p>

      {/* Key edible warning */}
      <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', fontSize: '13px', color: '#fca5a5' }}>
        <strong>⚠ The edible delay is the most common cause of accidental cannabis overconsumption.</strong> Oral THC takes 30–120 minutes to feel. Many people redose because "it's not working" — then both doses hit simultaneously. Add an oral dose and a second oral dose below to see this modelled exactly.
      </div>

      <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '12px', color: '#fdba74' }}>
        Cannabis PK is among the most variable of any drug. Tolerance, product potency, inhalation technique, individual metabolism, and body fat percentage all substantially affect results. These are population means — treat them as illustrative, not predictive.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Personal + settings */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal details</p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>Body weight</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" value={rawWeight} min={40} max={150}
                  onChange={e => { setRawWeight(e.target.value); const n = parseFloat(e.target.value); if (n >= 40 && n <= 150) setWeightKg(n) }}
                  onBlur={() => { const n = parseFloat(rawWeight); if (isNaN(n) || n < 40 || n > 150) { setWeightKg(70); setRawWeight('70') } }}
                  style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontWeight: '600', color: '#f0f4ff', textAlign: 'right', background: 'rgba(255,255,255,0.04)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>kg</span>
                <input type="range" min={40} max={150} step={1} value={weightKg}
                  onChange={e => { setWeightKg(parseInt(e.target.value)); setRawWeight(e.target.value) }}
                  style={{ flex: 1, accentColor: '#16a34a' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>For oral doses — taken with food?</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setWithFood(false)} style={btn(!withFood, '#16a34a')}>Empty stomach</button>
                <button onClick={() => setWithFood(true)}  style={btn(withFood,  '#16a34a')}>With food (~2.5× higher peak)</button>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginTop: '4px' }}>
                Fatty food dramatically increases oral THC bioavailability. This is why edibles from a restaurant hit harder than homemade ones.
              </p>
            </div>
          </div>

          {/* Country + driving */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driving limits</p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>Country</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.keys(CANNABIS_DRIVING_LIMITS).map(k => (
                  <button key={k} onClick={() => setCountry(k)}
                    style={btn(country === k, '#16a34a')}>
                    {k === 'NL' ? '🇳🇱 NL' : k === 'DE' ? '🇩🇪 DE' : k === 'BE' ? '🇧🇪 BE' : '🇫🇷 FR'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>Driver type</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => setDriverType('standard')} style={btn(driverType === 'standard', '#16a34a')}>
                  Driving ({drivingLimit.limit === 0 ? 'zero tolerance' : drivingLimit.limit + ' ng/mL blood'})
                </button>
                <button onClick={() => setDriverType('none')} style={btn(driverType === 'none', '#16a34a')}>
                  Not driving
                </button>
              </div>
            </div>

            {drivingLimit.note && driverType !== 'none' && (
              <div style={{ padding: '7px 10px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '6px', fontSize: '11px', color: '#fdba74' }}>
                ⚠ {drivingLimit.note}
              </div>
            )}
            {driverType === 'none' && (
              <div style={{ padding: '7px 10px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '6px', fontSize: '11px', color: '#86efac' }}>
                ✓ Not driving — no legal limit shown.
              </div>
            )}
            <div style={{ marginTop: '8px', padding: '7px 10px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: '6px', fontSize: '11px', color: '#fde047' }}>
              ⚠ Legal limits are in blood THC. This graph shows plasma THC (approximately 2× blood). Regular users may be above the legal limit for days after last use without acute impairment — tolerance is not a legal defence.
            </div>
          </div>

          {/* Doses */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dose schedule</p>

            {doses.map((d, idx) => (
              <div key={d.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.75)' }}>
                    {idx === 0 ? 'First dose' : `Dose ${idx + 1}`}
                    <span style={{ marginLeft: '6px', fontSize: '11px', color: d.route === 'smoked' ? 'rgba(240,244,255,0.4)' : '#fdba74', fontWeight: '400' }}>
                      {d.route === 'smoked' ? '🚬 smoked/vaped' : '🍫 oral/edible'}
                    </span>
                  </span>
                  {doses.length > 1 && (
                    <button onClick={() => removeDose(d.id)}
                      style={{ fontSize: '18px', color: 'rgba(240,244,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                  )}
                </div>

                {/* Route toggle */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button onClick={() => updateDose(d.id, 'route', 'smoked')} style={btn(d.route === 'smoked', '#16a34a')}>🚬 Smoked / vaped</button>
                  <button onClick={() => updateDose(d.id, 'route', 'oral')}   style={btn(d.route === 'oral',   '#92400e')}>🍫 Oral / edible</button>
                </div>

                {/* THC amount */}
                <div style={{ marginBottom: idx === 0 ? 0 : '8px' }}>
                    <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', display: 'block', marginBottom: '3px' }}>
                        THC dose: {d.thcMg} mg
                        <span style={{ color: 'rgba(240,244,255,0.3)', marginLeft: '4px' }}>
                            {d.route === 'smoked' ? '(absorbed amount)' : '(total in edible)'}
                        </span>
                    </label>
                    <input type="range" min={1} max={d.route === 'smoked' ? 80 : 200} step={0.5} value={d.thcMg}
                        onChange={e => updateDose(d.id, 'thcMg', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#16a34a' }} />
                    <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginTop: '3px', lineHeight: '1.5' }}>
                        {d.route === 'smoked'
                            ? 'Absorbed THC — typically 20–37% of total in joint. A 0.5g joint at 20% THC contains ~100mg total, ~20–37mg absorbed. Strong strains (25–30%) or larger joints push this higher.'
                            : 'Total THC in the edible. Standard commercial dose = 5–10mg. Home edibles are highly variable. The model applies ~10% oral bioavailability (higher with food).'}
                    </div>
                </div>

                {/* Timing */}
                {idx > 0 && (
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', display: 'block', marginBottom: '3px' }}>
                      Time: +{d.timeh}h after first dose
                    </label>
                    <input type="range" min={0} max={12} step={0.25} value={d.timeh}
                      onChange={e => updateDose(d.id, 'timeh', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#16a34a' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(240,244,255,0.2)' }}>
                      <span>0h</span><span>+12h</span>
                    </div>
                  </div>
                )}

                {d.route === 'oral' && (
                  <div style={{ marginTop: '6px', padding: '5px 8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '6px', fontSize: '10px', color: '#fdba74' }}>
                    Onset: 30–120 min. Effects peak 1–3h. Do not redose before 2h.
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => addDose('smoked')}
                style={{ flex: 1, padding: '8px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px', background: 'transparent', fontSize: '12px', color: 'rgba(240,244,255,0.45)', cursor: 'pointer' }}>
                + Add smoked dose
              </button>
              <button onClick={() => addDose('oral')}
                style={{ flex: 1, padding: '8px', border: '1px dashed rgba(249,115,22,0.35)', borderRadius: '8px', background: 'transparent', fontSize: '12px', color: '#fdba74', cursor: 'pointer' }}>
                + Add oral dose
              </button>
            </div>

            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '8px', fontSize: '12px', color: '#86efac' }}>
              Total THC: <strong>{totalThcMg.toFixed(1)} mg</strong>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '360px' }}>
            <canvas ref={canvasRef}
              style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }} />
          </div>

          {/* Graph controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(240,244,255,0.3)', whiteSpace: 'nowrap' }}>SHOW</span>
            <input type="range" min={4} max={48} step={4} value={timeScale}
              onChange={e => setTimeScale(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: '#16a34a' }} />
            <span style={{ fontWeight: '600', color: 'rgba(240,244,255,0.75)', minWidth: '28px' }}>{timeScale}h</span>
            <button onClick={exportGraph}
              style={{ padding: '5px 12px', background: '#2a6fdb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ↓ Export PNG
            </button>
          </div>

          {/* Zone legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {CANNABIS_ZONES.slice(0, 5).map(z => (
              <span key={z.label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: z.color + '22', color: z.color, border: `1px solid ${z.color}44` }}>
                {z.min}–{z.max === 9999 ? '50+' : z.max} ng/mL {z.label}
              </span>
            ))}
          </div>

          {/* Metrics */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Peak THC',        value: metrics.cmax + ' ng/mL',  sub: metrics.peakZone?.label ?? '', color: metrics.peakZone?.color },
                { label: 'Time to peak',    value: formatHours(metrics.tmax), sub: 'after first dose' },
                { label: 'Sub-threshold at',value: metrics.subThresholdTime != null ? formatHours(metrics.subThresholdTime) : '>48h', sub: 'below 1 ng/mL plasma' },
                { label: 'Safe to drive',   value: driverType === 'none' ? 'Not driving' : metrics.safeToDriveTime != null ? formatHours(metrics.safeToDriveTime) : '>48h', sub: driverType === 'none' ? 'No limit applied' : `Below legal limit` },
              ].map(m => (
                <div key={m.label} style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: m.color ?? '#f0f4ff' }}>{m.value}</div>
                  {m.sub && <div style={{ fontSize: '10px', color: m.color ?? 'rgba(240,244,255,0.35)' }}>{m.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Edible warning if oral dose present */}
          {hasOral && (
            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#fdba74' }}>
              <strong>You have oral doses in your schedule.</strong> Notice the delayed peak compared to smoked. The plateau can last 4–8 hours. Many people feel "nothing is happening" at 45 minutes and take more — the curve shows why this leads to overconsumption.
            </div>
          )}

          {/* PK education */}
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#86efac' }}>
            <p style={{ margin: '0 0 6px' }}>
              <strong>Smoked vs oral — why they feel so different:</strong> Smoked THC reaches the brain in seconds and peaks in minutes. Oral THC undergoes extensive first-pass metabolism, converting to 11-OH-THC — an active metabolite that is more potent and crosses the blood-brain barrier more readily. This is why edibles produce a qualitatively different, more intense, and longer-lasting effect.
            </p>
            <p style={{ margin: '0 0 6px' }}>
              <strong>The long tail matters for driving:</strong> THC is highly lipophilic and accumulates in fat tissue. Regular users can test positive for THC days after last use. The driving limit can be exceeded without any acute impairment, but also — impairment can persist after THC drops below the legal limit.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Tolerance significantly affects the curve:</strong> Regular users have substantially different PK and PD responses. The concentration zones are calibrated for occasional users — regular users may feel little at concentrations that would overwhelm a first-time user.
            </p>
          </div>

          {/* Dangerous interactions */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff', margin: '0 0 10px' }}>Dangerous combinations</p>
            {CANNABIS_INTERACTIONS.map(inter => (
              <div key={inter.substance} style={{ marginBottom: '8px', padding: '8px 10px', background: inter.color + '11', border: `1px solid ${inter.color}33`, borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#f0f4ff' }}>{inter.substance}</span>
                  <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 8px', borderRadius: '999px', background: inter.color, color: 'white' }}>{inter.severity}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', margin: 0, lineHeight: '1.5' }}>{inter.mechanism}</p>
              </div>
            ))}
          </div>

          {/* Support */}
          <div style={{ padding: '10px 14px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>
            Concerned about cannabis use? <a href="https://www.jellinek.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#86efac' }}>Jellinek.nl</a> and <a href="https://www.trimbos.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#86efac' }}>Trimbos.nl</a> offer free, confidential support.
          </div>
        </div>
      </div>
    </main>
  )
}