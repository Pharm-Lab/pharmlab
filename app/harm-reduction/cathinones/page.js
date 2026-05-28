'use client'
import { useState, useEffect, useRef } from 'react'
import {
  MEPHEDRONE_PK, CATHINONE_MARKET_DATA, CATHINONE_COMPOUNDS,
  CATHINONE_INTERACTIONS, simulateMephedrone, calcMephedroneMetrics,
} from '../../../lib/bacmath.js'

function formatHours(h) {
  if (h == null) return '—'
  const hours = Math.floor(h)
  const mins  = Math.round((h - hours) * 60)
  return `${hours}h ${mins.toString().padStart(2, '0')}m`
}

let doseIdCounter = 1
function makeDose(timeh = 0) {
  return { id: doseIdCounter++, doseMg: 75, timeh }
}

const STATUS_STYLE = {
  historical:        { bg: '#f9fafb', border: '#e5e7eb',  badge: '#6b7280',  text: 'Historical' },
  common_label:      { bg: '#fef2f2', border: '#fecaca',  badge: '#dc2626',  text: 'Common label — rarely genuine' },
  common_actual:     { bg: '#fff7ed', border: '#fed7aa',  badge: '#f97316',  text: 'Most common actual substance' },
  dangerous_adulterant: { bg: '#fef2f2', border: '#fca5a5', badge: '#991b1b', text: '⚠ Dangerous adulterant' },
}

export default function CathinonesPage() {
  const [weightKg,   setWeightKg]   = useState(70)
  const [rawWeight,  setRawWeight]  = useState('70')
  const [doses,      setDoses]      = useState([makeDose(0)])
  const [timeScale,  setTimeScale]  = useState(12)
  const [simResult,  setSimResult]  = useState(null)
  const [metrics,    setMetrics]    = useState(null)

  const canvasRef = useRef(null)
  const simRef    = useRef(null)
  const metRef    = useRef(null)
  const stateRef  = useRef({})

  const totalDose = doses.reduce((s, d) => s + d.doseMg, 0)

  useEffect(() => {
    stateRef.current = { timeScale, doses }
  }, [timeScale, doses])

  useEffect(() => {
    if (!doses.length) { setSimResult(null); setMetrics(null); return }
    const result = simulateMephedrone({ doses, weightKg, tEnd: 24 })
    const m      = calcMephedroneMetrics(result.mean)
    simRef.current = result
    metRef.current = m
    setSimResult(result)
    setMetrics(m)
    setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
  }, [doses, weightKg])

  useEffect(() => {
    if (simRef.current && canvasRef.current) drawCanvas()
  }, [simResult, timeScale])

  function drawCanvas(exportCtx = null, exportW = 0, exportH = 0) {
    const result   = simRef.current
    const m        = metRef.current
    const ts       = stateRef.current.timeScale ?? timeScale
    const dEntries = stateRef.current.doses     ?? doses
    if (!result || !result.mean.length) return

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
    const maxC    = Math.max(...result.low.map(p => p.c), 50) * 1.2
    const dispMax = Math.ceil(maxC / 50) * 50
    const maxT    = ts

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const xS = t => pad.left + (Math.min(t, maxT) / maxT) * cW
    const yS = c => pad.top  + cH - (Math.min(Math.max(c, 0), dispMax) / dispMax) * cH

    // Simple background zones (no labels — too uncertain to be authoritative)
    const bgZones = [
      { min: 0,   max: 50,  color: '#22c55e', alpha: 0.05 },
      { min: 50,  max: 150, color: '#f59e0b', alpha: 0.07 },
      { min: 150, max: 400, color: '#ef4444', alpha: 0.09 },
      { min: 400, max: 9999,color: '#7f1d1d', alpha: 0.12 },
    ]
    bgZones.forEach(zone => {
      const y0 = yS(Math.min(zone.max, dispMax))
      const y1 = yS(zone.min)
      if (y1 <= pad.top || y0 >= pad.top + cH) return
      ctx.fillStyle = zone.color; ctx.globalAlpha = zone.alpha
      ctx.fillRect(pad.left, Math.max(y0, pad.top), cW, Math.min(y1, pad.top + cH) - Math.max(y0, pad.top))
      ctx.globalAlpha = 1
    })

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
    const yLines = Array.from({ length: Math.floor(dispMax / 50) + 1 }, (_, i) => i * 50).filter(v => v <= dispMax)
    yLines.forEach(v => {
      ctx.beginPath(); ctx.moveTo(pad.left, yS(v)); ctx.lineTo(pad.left + cW, yS(v)); ctx.stroke()
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
    ctx.fillText('Mephedrone plasma (ng/mL) — estimated', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.fillStyle = '#374151'; ctx.font = '11px sans-serif'
    ctx.fillText('Time after dose (h)', pad.left + cW / 2, H - 8)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Wide uncertainty band (low to high ke)
    const lo = result.low.filter(p  => p.t <= maxT)
    const hi = result.high.filter(p => p.t <= maxT)
    ctx.globalAlpha = 0.18
    ctx.fillStyle   = '#f97316'
    ctx.beginPath()
    lo.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ;[...hi].reverse().forEach(p => ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1

    // Uncertainty band label
    ctx.fillStyle = '#f97316'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText('Uncertainty range (t½ 1.5–3.6h)', pad.left + 4, pad.top + 14)

    // Dose markers
    dEntries.forEach((d, idx) => {
      if (d.timeh > maxT) return
      const x = xS(d.timeh)
      if (idx > 0) {
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('💊', x, pad.top + cH + 40)
      ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'
      ctx.fillText(d.timeh === 0 ? 't=0' : '+' + d.timeh + 'h', x, pad.top + cH + 50)
    })

    // Mean curve
    const filtered = result.mean.filter(p => p.t <= maxT)
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    filtered.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Peak dot
    if (m && m.tmax <= maxT) {
      ctx.fillStyle = '#f97316'
      ctx.beginPath(); ctx.arc(xS(m.tmax), yS(m.cmax), 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#111827'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Peak ~' + m.cmax + ' ng/mL', xS(m.tmax), yS(m.cmax) - 10)
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
    link.download = 'pharmlab-cathinone-curve.png'
    link.href = off.toDataURL('image/png', 1.0); link.click()
  }

  function updateDose(id, field, value) {
    setDoses(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }
  function removeDose(id) { setDoses(prev => prev.filter(d => d.id !== id)) }
  function addDose() {
    const lastTime = Math.max(...doses.map(d => d.timeh), 0)
    setDoses(prev => [...prev, { ...makeDose(Math.min(lastTime + 1.5, 12)), doseMg: 50 }])
  }

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Synthetic Cathinones</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        The cathinone market in the Netherlands and Germany is currently one of the most unreliable drug markets in Europe. The PK model below applies to mephedrone only — for everything else, the honest answer is we do not have reliable human data.
      </p>

      {/* Critical market warning */}
      <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px', fontSize: '13px', color: '#991b1b' }}>
        <strong>⚠ Critical market warning — Netherlands and Germany (2025):</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Only <strong>3%</strong> of samples sold as 3-MMC in the Netherlands actually contain 3-MMC (Trimbos DIMS 2025 — down from 30% in 2023)</li>
          <li><strong>76%</strong> contain 2-MMC instead — different compound, essentially unknown long-term safety profile</li>
          <li><strong>5%</strong> contain NEP (N-Ethylnorpentedron) — significantly more potent, longer duration, overdose risk when dosed like 3-MMC</li>
          <li>Berlin harm reduction services actively warn about NEP in samples sold as 3-MMC and 4-MMC</li>
          <li>Drug checking is not optional here — it is the only way to know what you actually have</li>
        </ul>
      </div>

      {/* PK disclaimer */}
      <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '12px', color: '#854d0e' }}>
        <strong>PK data disclaimer:</strong> The curve below models mephedrone (4-MMC) only, using limited human data. The uncertainty band is intentionally wide — individual variation is larger here than for any other substance on this page. For 2-MMC, 3-MMC, and NEP there is essentially no published human pharmacokinetic data. Do not use this model for those compounds.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Personal */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mephedrone (4-MMC) model</p>
            <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Body weight</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <input type="number" value={rawWeight} min={40} max={150}
                onChange={e => { setRawWeight(e.target.value); const n = parseFloat(e.target.value); if (n >= 40 && n <= 150) setWeightKg(n) }}
                onBlur={() => { const n = parseFloat(rawWeight); if (isNaN(n) || n < 40 || n > 150) { setWeightKg(70); setRawWeight('70') } }}
                style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', textAlign: 'right', background: 'white' }} />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>kg</span>
              <input type="range" min={40} max={150} step={1} value={weightKg}
                onChange={e => { setWeightKg(parseInt(e.target.value)); setRawWeight(e.target.value) }}
                style={{ flex: 1, accentColor: '#f97316' }} />
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              Curve models mephedrone only. t½ ~2.5h (range 1.5–3.6h). Wide uncertainty band reflects limited human data.
            </p>
          </div>

          {/* Dose schedule */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dose schedule (mephedrone model)</p>

            {doses.map((d, idx) => (
              <div key={d.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                    {idx === 0 ? 'First dose' : `Dose ${idx + 1}`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{d.doseMg}mg</span>
                    {doses.length > 1 && (
                      <button onClick={() => removeDose(d.id)}
                        style={{ fontSize: '18px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: idx === 0 ? 0 : '8px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>
                    Amount: {d.doseMg}mg (mephedrone model only)
                  </label>
                  <input type="range" min={25} max={300} step={5} value={d.doseMg}
                    onChange={e => updateDose(d.id, 'doseMg', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#f97316' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db' }}>
                    <span>25mg</span><span>300mg</span>
                  </div>
                </div>

                {idx > 0 && (
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>
                      +{d.timeh}h after first dose
                    </label>
                    <input type="range" min={0.5} max={12} step={0.5} value={d.timeh}
                      onChange={e => updateDose(d.id, 'timeh', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#f97316' }} />
                  </div>
                )}
              </div>
            ))}

            <button onClick={addDose}
              style={{ width: '100%', padding: '8px', border: '1px dashed #fed7aa', borderRadius: '8px', background: 'transparent', fontSize: '13px', color: '#f97316', cursor: 'pointer' }}>
              + Add another dose
            </button>

            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '12px', color: '#92400e' }}>
              Total: <strong>{totalDose}mg</strong>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>
                ({(totalDose / weightKg).toFixed(2)} mg/kg) — mephedrone model
              </span>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '300px' }}>
            <canvas ref={canvasRef}
              style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white' }} />
          </div>

          {/* Graph controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', whiteSpace: 'nowrap' }}>SHOW</span>
            <input type="range" min={4} max={24} step={2} value={timeScale}
              onChange={e => setTimeScale(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: '#f97316' }} />
            <span style={{ fontWeight: '600', color: '#374151', minWidth: '28px' }}>{timeScale}h</span>
            <button onClick={exportGraph}
              style={{ padding: '5px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ↓ Export PNG
            </button>
          </div>

          {/* Metrics */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Peak (estimated)', value: '~' + metrics.cmax + ' ng/mL', sub: 'mephedrone model only' },
                { label: 'Time to peak',     value: formatHours(metrics.tmax),      sub: 'estimated' },
                { label: 'Sub-threshold at', value: metrics.clearTime != null ? formatHours(metrics.clearTime) : '>24h', sub: 'mean estimate' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{m.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compound information cards */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
          What is actually in the NL/DE market
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>
          The following compounds are what drug checking services actually find — not what products are sold as.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
          {CATHINONE_COMPOUNDS.map(c => {
            const st = STATUS_STYLE[c.status]
            return (
              <div key={c.id} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{c.name}</h3>
                  <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', background: st.badge, color: 'white', whiteSpace: 'nowrap', marginLeft: '8px' }}>{st.text}</span>
                </div>
                {c.aka && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px' }}>Also known as: {c.aka}</p>}
                <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 6px', lineHeight: '1.5' }}>{c.note}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', fontSize: '11px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ color: '#9ca3af', marginBottom: '2px' }}>t½</div>
                    <div style={{ color: '#374151', fontWeight: '500' }}>{c.halflife}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ color: '#9ca3af', marginBottom: '2px' }}>PK data quality</div>
                    <div style={{ color: '#374151', fontWeight: '500' }}>{c.pkQuality === 'none' ? '❌ No human data' : c.pkQuality === 'minimal' ? '⚠ Minimal' : '⚠ Limited'}</div>
                  </div>
                </div>
                {c.warning && (
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', color: '#991b1b' }}>
                    ⚠ <strong>Overdose risk:</strong> Dosing NEP based on experience with 2-MMC or 3-MMC will likely result in overdose. Significantly more potent.
                  </div>
                )}
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Effects</div>
                  <div style={{ fontSize: '11px', color: '#374151' }}>{c.effects}</div>
                </div>
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Key risks</div>
                  <div style={{ fontSize: '11px', color: '#374151' }}>{c.risks}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Market data visualisation */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
            What is actually in samples sold as "3-MMC" in the Netherlands
          </h3>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 12px' }}>
            Source: Trimbos DIMS Jaarbericht 2025 — {CATHINONE_MARKET_DATA.year}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
                { label: '3-MMC (actual)', pct: CATHINONE_MARKET_DATA.percentage3MMC, color: '#22c55e' },
                { label: '2-MMC',          pct: CATHINONE_MARKET_DATA.percentage2MMC, color: '#f97316' },
                { label: 'NEP',            pct: CATHINONE_MARKET_DATA.percentageNEP,  color: '#dc2626' },
                { label: 'Other / unknown',pct: 100 - CATHINONE_MARKET_DATA.percentage3MMC - CATHINONE_MARKET_DATA.percentage2MMC - CATHINONE_MARKET_DATA.percentageNEP, color: '#9ca3af' },
            ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', width: '130px', flexShrink: 0 }}>{item.label}</span>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '22px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                        <span style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: item.pct > 85 ? 'white' : '#374151',
                         }}>
                            {item.pct}%
                        </span>
                    </div>
                </div>
            ))}
          </div>
        </div>

        {/* Dangerous combinations */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>Dangerous combinations</p>
          {CATHINONE_INTERACTIONS.map(inter => (
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
          Concerned about cathinone use? <a href="https://www.jellinek.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>Jellinek.nl</a>, <a href="https://www.trimbos.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>Trimbos.nl</a>, and <a href="https://www.drugsinfo.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>Drugsinfo.nl</a> offer free, confidential support and up-to-date drug safety information.
        </div>
      </div>
    </main>
  )
}