'use client'
import { useState, useEffect, useRef } from 'react'
import {
  COCAINE_PK, COCAINE_ZONES, COCAINE_INTERACTIONS,
  simulateCocaine, calcCocaineMetrics,
} from '../../../lib/bacmath.js'

function formatHours(h) {
  if (h == null) return '—'
  const hours = Math.floor(h)
  const mins  = Math.round((h - hours) * 60)
  return `${hours}h ${mins.toString().padStart(2, '0')}m`
}

let doseIdCounter = 1
function makeDose(timeh = 0) {
  return { id: doseIdCounter++, doseMg: 50, timeh }
}

export default function CocaineCalculator() {
  const [weightKg,   setWeightKg]   = useState(70)
  const [rawWeight,  setRawWeight]  = useState('70')
  const [doses,      setDoses]      = useState([makeDose(0)])
  const [timeScale,  setTimeScale]  = useState(8)
  const [pts,        setPts]        = useState([])
  const [metrics,    setMetrics]    = useState(null)

  const canvasRef = useRef(null)
  const ptsRef    = useRef([])
  const metRef    = useRef(null)
  const stateRef  = useRef({})

  const totalDoseMg = doses.reduce((s, d) => s + d.doseMg, 0)

  useEffect(() => {
    stateRef.current = { timeScale, doses }
  }, [timeScale, doses])

  useEffect(() => {
    if (!doses.length) { setPts([]); setMetrics(null); return }
    const simPts   = simulateCocaine({ doses, weightKg, tEnd: Math.max(timeScale, 12) })
    const m        = calcCocaineMetrics(simPts)
    ptsRef.current = simPts
    metRef.current = m
    setPts(simPts)
    setMetrics(m)
    setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
  }, [doses, weightKg, timeScale])

  useEffect(() => {
    if (ptsRef.current.length && canvasRef.current) drawCanvas()
  }, [pts, timeScale])

  function drawCanvas(exportCtx = null, exportW = 0, exportH = 0) {
    const simPts   = ptsRef.current
    const m        = metRef.current
    const st       = stateRef.current
    const ts       = st.timeScale ?? timeScale
    const dEntries = st.doses     ?? doses
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
    const maxC    = Math.max(...simPts.map(p => p.c), 100) * 1.15
    const dispMax = Math.ceil(maxC / 100) * 100
    const maxT    = ts

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const xS = t => pad.left + (Math.min(t, maxT) / maxT) * cW
    const yS = c => pad.top  + cH - (Math.min(Math.max(c, 0), dispMax) / dispMax) * cH

    // Risk zones
    COCAINE_ZONES.forEach(zone => {
      const y0 = yS(Math.min(zone.max, dispMax))
      const y1 = yS(zone.min)
      if (y1 <= pad.top || y0 >= pad.top + cH) return
      ctx.fillStyle   = zone.color
      ctx.globalAlpha = zone.alpha
      ctx.fillRect(pad.left, Math.max(y0, pad.top), cW, Math.min(y1, pad.top + cH) - Math.max(y0, pad.top))
      ctx.globalAlpha = 1
      const midY = (Math.max(y0, pad.top) + Math.min(y1, pad.top + cH)) / 2
      if (Math.min(y1, pad.top + cH) - Math.max(y0, pad.top) > 14) {
        ctx.fillStyle = zone.color; ctx.globalAlpha = 0.75
        ctx.font = '9px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(zone.label, pad.left + cW - 3, midY + 3)
        ctx.globalAlpha = 1
      }
    })

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
    const yLines = Array.from({ length: Math.floor(dispMax / 100) + 1 }, (_, i) => i * 100).filter(v => v <= dispMax)
    yLines.forEach(v => {
      ctx.beginPath(); ctx.moveTo(pad.left, yS(v)); ctx.lineTo(pad.left + cW, yS(v)); ctx.stroke()
    })
    const nX = Math.min(ts, 8)
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
      ctx.fillText((ts * i / nX).toFixed(1) + 'h', pad.left + (i / nX) * cW, pad.top + cH + 18)
    }
    ctx.save()
    ctx.translate(12, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'; ctx.font = '10px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('Cocaine plasma (ng/mL)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.fillStyle = '#374151'; ctx.font = '11px sans-serif'
    ctx.fillText('Time after first dose (h)', pad.left + cW / 2, H - 8)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Dose markers
    dEntries.forEach((d, idx) => {
      if (d.timeh > maxT) return
      const x = xS(d.timeh)
      if (idx > 0) {
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('💊', x, pad.top + cH + 40)
      ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'
      ctx.fillText(d.timeh === 0 ? 't=0' : '+' + d.timeh + 'h', x, pad.top + cH + 50)
    })

    // Main curve
    const filtered = simPts.filter(p => p.t <= maxT)
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    filtered.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Peak dot
    if (m && m.tmax <= maxT) {
      ctx.fillStyle = '#dc2626'
      ctx.beginPath(); ctx.arc(xS(m.tmax), yS(m.cmax), 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#111827'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Peak ' + m.cmax.toFixed(0) + ' ng/mL', xS(m.tmax), yS(m.cmax) - 10)
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
    link.download = 'pharmlab-cocaine-curve.png'; link.href = off.toDataURL('image/png', 1.0); link.click()
  }

  function updateDose(id, field, value) {
    setDoses(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  function removeDose(id) { setDoses(prev => prev.filter(d => d.id !== id)) }

  function addDose() {
    const lastTime = Math.max(...doses.map(d => d.timeh), 0)
    setDoses(prev => [...prev, makeDose(Math.min(lastTime + 1, 10))])
  }

  const btn = active => ({
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
    fontWeight: active ? '600' : '400',
    border: active ? '2px solid #dc2626' : '1px solid #d1d5db',
    background: active ? '#fef2f2' : 'white',
    color: active ? '#dc2626' : '#374151',
  })

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Cocaine Pharmacokinetics</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        Plasma concentration model for intranasal cocaine. The short half-life (~1.25h) is the pharmacological basis of the compulsion to redose — add multiple doses to see exactly why.
      </p>

      {/* Test kit warning */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', fontSize: '13px', color: '#991b1b' }}>
        <strong>⚠ Test your substance.</strong> The majority of European cocaine samples contain levamisole (a veterinary antiparasitic associated with dangerous immune suppression with repeated use) and/or caffeine, phenacetin, or other cutting agents. Fentanyl contamination, while less common in Europe than North America, has been detected. A reagent test and fentanyl test strips are the minimum. Available from <a href="https://dancesafe.org" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}>DanceSafe</a>.
      </div>

      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '12px', color: '#92400e' }}>
        Population-average PK model. Individual variation in cocaine metabolism (via plasma cholinesterase and liver esterases) is significant. Cardiovascular risk zones are indicative — underlying heart conditions, stimulant tolerance, and concurrent substance use all shift risk substantially.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Body weight */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal details</p>
            <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Body weight</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" value={rawWeight} min={40} max={150}
                onChange={e => { setRawWeight(e.target.value); const n = parseFloat(e.target.value); if (n >= 40 && n <= 150) setWeightKg(n) }}
                onBlur={() => { const n = parseFloat(rawWeight); if (isNaN(n) || n < 40 || n > 150) { setWeightKg(70); setRawWeight('70') } }}
                style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', textAlign: 'right', background: 'white' }} />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>kg</span>
              <input type="range" min={40} max={150} step={1} value={weightKg}
                onChange={e => { setWeightKg(parseInt(e.target.value)); setRawWeight(e.target.value) }}
                style={{ flex: 1, accentColor: '#dc2626' }} />
            </div>
          </div>

          {/* Dose schedule */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dose schedule</p>

            {doses.map((d, idx) => (
              <div key={d.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    {idx === 0 ? 'First line' : `Line ${idx + 1}`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{d.doseMg}mg</span>
                    {doses.length > 1 && (
                      <button onClick={() => removeDose(d.id)}
                        style={{ fontSize: '18px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                    )}
                  </div>
                </div>

                {/* Dose amount */}
                <div style={{ marginBottom: idx === 0 ? 0 : '8px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>
                    Amount: {d.doseMg}mg
                    <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                      (a typical line ~25–75mg)
                    </span>
                  </label>
                  <input type="range" min={10} max={200} step={5} value={d.doseMg}
                    onChange={e => updateDose(d.id, 'doseMg', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#dc2626' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db' }}>
                    <span>10mg</span><span>200mg</span>
                  </div>
                </div>

                {/* Timing */}
                {idx > 0 && (
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>
                      Time: +{d.timeh}h after first line
                    </label>
                    <input type="range" min={0.25} max={10} step={0.25} value={d.timeh}
                      onChange={e => updateDose(d.id, 'timeh', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#dc2626' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db' }}>
                      <span>+0.25h</span><span>+10h</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button onClick={addDose}
              style={{ width: '100%', padding: '8px', border: '1px dashed #fecaca', borderRadius: '8px', background: 'transparent', fontSize: '13px', color: '#dc2626', cursor: 'pointer' }}>
              + Add another line
            </button>

            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', color: '#991b1b' }}>
              Total: <strong>{totalDoseMg}mg</strong>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>
                ({(totalDoseMg / weightKg).toFixed(2)} mg/kg)
              </span>
            </div>

            {doses.length >= 3 && (
              <div style={{ marginTop: '8px', padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', color: '#991b1b' }}>
                ⚠ The curve shows cumulative cardiac load. Notice how the concentration never fully drops to zero between lines — this is the pharmacological basis of a binge session. Cardiovascular risk is not just about peak concentration but time spent at elevated levels.
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '360px' }}>
            <canvas ref={canvasRef}
              style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white' }} />
          </div>

          {/* Graph controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', whiteSpace: 'nowrap' }}>SHOW</span>
            <input type="range" min={2} max={24} step={1} value={timeScale}
              onChange={e => setTimeScale(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: '#dc2626' }} />
            <span style={{ fontWeight: '600', color: '#374151', minWidth: '28px' }}>{timeScale}h</span>
            <button onClick={exportGraph}
              style={{ padding: '5px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ↓ Export PNG
            </button>
          </div>

          {/* Zone legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {COCAINE_ZONES.map(z => (
              <span key={z.label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: z.color + '22', color: z.color, border: `1px solid ${z.color}44` }}>
                {z.min}–{z.max === 99999 ? '600+' : z.max} ng/mL {z.label}
              </span>
            ))}
          </div>

          {/* Metrics */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Peak concentration', value: metrics.cmax.toFixed(0) + ' ng/mL', sub: metrics.peakZone?.label ?? '', color: metrics.peakZone?.color },
                { label: 'Time to peak',        value: formatHours(metrics.tmax), sub: 'after first line' },
                { label: 'Essentially clear',   value: metrics.clearTime != null ? formatHours(metrics.clearTime) : '>12h', sub: 'below 10 ng/mL' },
                { label: 'Total dose',          value: totalDoseMg + 'mg', sub: (totalDoseMg / weightKg).toFixed(2) + ' mg/kg' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: m.color ?? '#111827' }}>{m.value}</div>
                  {m.sub && <div style={{ fontSize: '10px', color: m.color ?? '#9ca3af' }}>{m.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {/* PK education */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#991b1b' }}>
            <p style={{ margin: '0 0 6px' }}>
              <strong>Why cocaine is so compulsive — it's in the PK:</strong> With a half-life of ~1.25 hours, plasma concentration drops sharply within 1–2 hours. The rapid dopamine release followed by rapid crash creates a powerful neurobiological urge to redose before the previous line has cleared. Each additional line adds to cumulative cardiac load. Add 3–4 lines at realistic intervals and watch the curve — the heart is under continuous elevated stress.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Cardiovascular risk is cumulative:</strong> It is not just about peak concentration. Time spent above 100–300 ng/mL means sustained elevated heart rate and blood pressure. Cocaine-associated cardiac events occur across the full range of users, including young people with no known heart disease.
            </p>
          </div>

          {/* Dangerous interactions */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>Dangerous combinations</p>
            {COCAINE_INTERACTIONS.map(inter => (
              <div key={inter.substance} style={{ marginBottom: '8px', padding: '8px 10px', background: inter.color + '11', border: `1px solid ${inter.color}33`, borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{inter.substance}</span>
                  <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 8px', borderRadius: '999px', background: inter.color, color: 'white' }}>{inter.severity}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{inter.mechanism}</p>
              </div>
            ))}
          </div>

          {/* Support */}
          <div style={{ padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', color: '#6b7280' }}>
            Concerned about cocaine use? <a href="https://www.jellinek.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}>Jellinek.nl</a> and <a href="https://www.trimbos.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}>Trimbos.nl</a> offer free, confidential support.
          </div>
        </div>
      </div>
    </main>
  )
}