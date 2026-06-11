'use client'
import { useState, useEffect, useRef } from 'react'
import {
  AMPHETAMINE_PK, AMPHETAMINE_ZONES, AMPHETAMINE_INTERACTIONS,
  simulateAmphetamine, calcAmphetamineMetrics,
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

export default function AmphetaminesCalculator() {
  const [weightKg,    setWeightKg]    = useState(70)
  const [rawWeight,   setRawWeight]   = useState('70')
  const [compound,    setCompound]    = useState('amphetamine')
  const [acidicUrine, setAcidicUrine] = useState(false)
  const [doses,       setDoses]       = useState([makeDose(0)])
  const [timeScale,   setTimeScale]   = useState(36)
  const [pts,         setPts]         = useState([])
  const [ptsAcidic,   setPtsAcidic]   = useState([])
  const [metrics,     setMetrics]     = useState(null)

  const canvasRef = useRef(null)
  const ptsRef    = useRef([])
  const acidRef   = useRef([])
  const metRef    = useRef(null)
  const stateRef  = useRef({})

  const pk         = AMPHETAMINE_PK[compound]
  const zones      = AMPHETAMINE_ZONES[compound]
  const totalDose  = doses.reduce((s, d) => s + d.doseMg, 0)

  useEffect(() => {
    stateRef.current = { timeScale, doses, compound, acidicUrine }
  }, [timeScale, doses, compound, acidicUrine])

  useEffect(() => {
    if (!doses.length) { setPts([]); setMetrics(null); return }
    const common = { doses, weightKg, compound, tEnd: 72 }
    const simPts      = simulateAmphetamine({ ...common, acidicUrine: false })
    const simPtsAcid  = simulateAmphetamine({ ...common, acidicUrine: true })
    const m           = calcAmphetamineMetrics(simPts, compound)
    ptsRef.current    = simPts
    acidRef.current   = simPtsAcid
    metRef.current    = m
    setPts(simPts)
    setPtsAcidic(simPtsAcid)
    setMetrics(m)
    setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
  }, [doses, weightKg, compound])

  useEffect(() => {
    if (ptsRef.current.length && canvasRef.current) drawCanvas()
  }, [pts, timeScale, acidicUrine])

  function drawCanvas(exportCtx = null, exportW = 0, exportH = 0) {
    const simPts   = ptsRef.current
    const acidPts  = acidRef.current
    const m        = metRef.current
    const st       = stateRef.current
    const ts       = st.timeScale   ?? timeScale
    const dEntries = st.doses       ?? doses
    const comp     = st.compound    ?? compound
    const acidic   = st.acidicUrine ?? acidicUrine
    const zns      = AMPHETAMINE_ZONES[comp]
    const cpk      = AMPHETAMINE_PK[comp]
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
    const maxC    = Math.max(...simPts.map(p => p.c), 50) * 1.15
    const dispMax = Math.ceil(maxC / 50) * 50
    const maxT    = ts

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const xS = t => pad.left + (Math.min(t, maxT) / maxT) * cW
    const yS = c => pad.top  + cH - (Math.min(Math.max(c, 0), dispMax) / dispMax) * cH

    // Effect zones
    zns.forEach(zone => {
      const y0 = yS(Math.min(zone.max, dispMax))
      const y1 = yS(zone.min)
      if (y1 <= pad.top || y0 >= pad.top + cH) return
      ctx.fillStyle = zone.color; ctx.globalAlpha = zone.alpha
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
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1
    const yStep  = dispMax <= 200 ? 50 : 100
    const yLines = Array.from({ length: Math.floor(dispMax / yStep) + 1 }, (_, i) => i * yStep).filter(v => v <= dispMax)
    yLines.forEach(v => {
      ctx.beginPath(); ctx.moveTo(pad.left, yS(v)); ctx.lineTo(pad.left + cW, yS(v)); ctx.stroke()
    })
    const nX = Math.min(Math.floor(ts / 4), 12)
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
    ctx.fillText('Plasma (ng/mL)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.fillStyle = '#374151'; ctx.font = '11px sans-serif'
    ctx.fillText('Time after first dose (h)', pad.left + cW / 2, H - 8)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // 8h / 24h / 48h reference lines
    const refLines = [
        [8,  'bedtime?', 'rgba(240,244,255,0.4)'],
        [24, '24h later', 'rgba(240,244,255,0.25)'],
        [48, '48h',      '#d1d5db'],
    ]
    refLines.forEach(([t, label, color]) => {
        if (t > maxT) return
        ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([2, 4])
        ctx.beginPath(); ctx.moveTo(xS(t), pad.top); ctx.lineTo(xS(t), pad.top + cH); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = color; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(label, xS(t), pad.top + cH - 6)
    })

    // Acidic urine comparison curve
    if (acidPts.length && acidic) {
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
      ctx.globalAlpha = 0.7
      const acidFiltered = acidPts.filter(p => p.t <= maxT)
      ctx.beginPath()
      acidFiltered.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
      ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
      ctx.fillStyle = '#3b82f6'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('With vitamin C', xS(1) + 4, yS(acidPts[Math.floor(acidPts.length * 0.15)]?.c ?? 0) - 6)
    }

    // Dose markers
    dEntries.forEach((d, idx) => {
      if (d.timeh > maxT) return
      const x = xS(d.timeh)
      if (idx > 0) {
        ctx.strokeStyle = cpk.color; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
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
    ctx.strokeStyle = cpk.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    filtered.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Peak dot
    if (m && m.tmax <= maxT) {
      ctx.fillStyle = cpk.color
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
    link.download = `pharmlab-${compound}-curve.png`
    link.href = off.toDataURL('image/png', 1.0); link.click()
  }

  function updateDose(id, field, value) {
    setDoses(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }
  function removeDose(id) { setDoses(prev => prev.filter(d => d.id !== id)) }
  function addDose() {
    const lastTime = Math.max(...doses.map(d => d.timeh), 0)
    setDoses(prev => [...prev, makeDose(Math.min(lastTime + 4, 24))])
  }

  const btn = (active, color = '#f97316') => ({
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
    fontWeight: active ? '600' : '400',
    border: active ? `2px solid ${color}` : '1px solid #d1d5db',
    background: active ? color + '18' : 'rgba(255,255,255,0.05)',
    color: active ? color : 'rgba(240,244,255,0.65)',
  })

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } select option { background:#0f1629; }`}</style>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', color: 'rgba(240,244,255,0.4)' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '1rem 0 4px' }}>Amphetamine Pharmacokinetics</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        The long half-life (~10–11h) is the central harm reduction message. Set the time axis to 36h and see exactly what is still in your system the next morning, afternoon, and evening.
      </p>

      <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#fdba74' }}>
        ⚠ <strong>Test your substance.</strong> Speed sold in Europe varies enormously in purity (often 5–30% amphetamine sulfate). Cutting agents include caffeine, paracetamol, and increasingly cathinones. Reagent test kits confirm amphetamine presence.
      </div>

      <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '12px', color: '#fdba74' }}>
        Population-average PK. Amphetamine elimination is pH-dependent — individual diet, kidney function, and urinary pH all affect duration substantially.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Compound + personal */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compound</p>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <button onClick={() => setCompound('amphetamine')}     style={btn(compound === 'amphetamine',     '#f97316')}>⚡ Amphetamine (Speed)</button>
              <button onClick={() => setCompound('methamphetamine')} style={btn(compound === 'methamphetamine', '#dc2626')}>🔴 Methamphetamine (Crystal)</button>
            </div>

            {compound === 'methamphetamine' && (
              <div style={{ marginBottom: '12px', padding: '8px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', fontSize: '11px', color: '#fca5a5' }}>
                Methamphetamine has similar PK to amphetamine but substantially greater CNS potency — more dopamine release per unit plasma concentration. The effect zones are scaled accordingly. Neurotoxicity risk with repeated use is significantly higher.
              </div>
            )}

            <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>Body weight</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input type="number" value={rawWeight} min={40} max={150}
                onChange={e => { setRawWeight(e.target.value); const n = parseFloat(e.target.value); if (n >= 40 && n <= 150) setWeightKg(n) }}
                onBlur={() => { const n = parseFloat(rawWeight); if (isNaN(n) || n < 40 || n > 150) { setWeightKg(70); setRawWeight('70') } }}
                style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontWeight: '600', color: '#f0f4ff', textAlign: 'right', background: '#0f1629' }} />
              <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>kg</span>
              <input type="range" min={40} max={150} step={1} value={weightKg}
                onChange={e => { setWeightKg(parseInt(e.target.value)); setRawWeight(e.target.value) }}
                style={{ flex: 1, accentColor: pk.color }} />
            </div>

            {/* Vitamin C toggle */}
            <div style={{ padding: '10px 12px', background: 'rgba(42,111,219,0.12)', border: '1px solid rgba(42,111,219,0.35)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input type="checkbox" id="acidic-check" checked={acidicUrine}
                  onChange={e => setAcidicUrine(e.target.checked)}
                  style={{ accentColor: '#2563eb', width: '14px', height: '14px' }} />
                <label htmlFor="acidic-check" style={{ fontSize: '12px', color: '#1e40af', cursor: 'pointer', fontWeight: '500' }}>
                  Show vitamin C (acidified urine) comparison
                </label>
              </div>
              <p style={{ fontSize: '11px', color: '#3b82f6', margin: 0 }}>
                Vitamin C acidifies urine and speeds amphetamine elimination by ~50% (methamphetamine elimination by ~20%). The blue dashed line shows the curve with vitamin C supplementation. This is a documented harm reduction strategy — it does not eliminate risk but reduces duration.
              </p>
            </div>
          </div>

          {/* Dose schedule */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dose schedule</p>

            {doses.map((d, idx) => (
              <div key={d.id} style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.75)' }}>
                    {idx === 0 ? 'First dose' : `Dose ${idx + 1}`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)' }}>{d.doseMg}mg</span>
                    {doses.length > 1 && (
                      <button onClick={() => removeDose(d.id)}
                        style={{ fontSize: '18px', color: 'rgba(240,244,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: idx === 0 ? 0 : '8px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', display: 'block', marginBottom: '3px' }}>
                    Amount: {d.doseMg}mg
                    <span style={{ color: 'rgba(240,244,255,0.3)', marginLeft: '4px' }}>
                      {compound === 'amphetamine'
                        ? '(pure amphetamine — street speed ~5-30% purity)'
                        : '(pure methamphetamine)'}
                    </span>
                  </label>
                  <input type="range" min={10} max={200} step={5} value={d.doseMg}
                    onChange={e => updateDose(d.id, 'doseMg', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: pk.color }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(240,244,255,0.2)' }}>
                    <span>10mg</span><span>200mg</span>
                  </div>
                </div>

                {idx > 0 && (
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', display: 'block', marginBottom: '3px' }}>
                      Time: +{d.timeh}h after first dose
                    </label>
                    <input type="range" min={0.5} max={24} step={0.5} value={d.timeh}
                      onChange={e => updateDose(d.id, 'timeh', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: pk.color }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(240,244,255,0.2)' }}>
                      <span>+0.5h</span><span>+24h</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button onClick={addDose}
              style={{ width: '100%', padding: '8px', border: `1px dashed ${pk.color}66`, borderRadius: '8px', background: 'transparent', fontSize: '13px', color: pk.color, cursor: 'pointer' }}>
              + Add another dose
            </button>

            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px', color: 'rgba(240,244,255,0.75)' }}>
              Total: <strong>{totalDose}mg</strong>
              <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginLeft: '6px' }}>
                ({(totalDose / weightKg).toFixed(2)} mg/kg)
              </span>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '360px' }}>
            <canvas ref={canvasRef}
              style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f1629' }} />
          </div>

          {/* Graph controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(240,244,255,0.3)', whiteSpace: 'nowrap' }}>SHOW</span>
            <input type="range" min={8} max={72} step={4} value={timeScale}
              onChange={e => setTimeScale(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: pk.color }} />
            <span style={{ fontWeight: '600', color: 'rgba(240,244,255,0.75)', minWidth: '28px' }}>{timeScale}h</span>
            <button onClick={exportGraph}
              style={{ padding: '5px 12px', background: '#2a6fdb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ↓ Export PNG
            </button>
          </div>

          {/* Zone legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {zones.slice(0, 5).map(z => (
              <span key={z.label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: z.color + '22', color: z.color, border: `1px solid ${z.color}44` }}>
                {z.min}–{z.max === 99999 ? '+' : z.max} {z.label}
              </span>
            ))}
          </div>

          {/* Metrics */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Peak concentration', value: metrics.cmax + ' ng/mL', sub: metrics.peakZone?.label ?? '', color: metrics.peakZone?.color },
                { label: 'Time to peak',        value: formatHours(metrics.tmax), sub: 'after first dose' },
                { label: 'Sub-threshold at',    value: metrics.clearTime != null ? formatHours(metrics.clearTime) : '>72h', sub: `below ${AMPHETAMINE_ZONES[compound][0].max} ng/mL` },
                { label: 'Half-life',            value: pk.thalf + 'h', sub: acidicUrine ? `~${(pk.thalf * (compound === 'amphetamine' ? 0.67 : 0.83)).toFixed(1)}h with vitamin C` : 'population mean' },
              ].map(m => (
                <div key={m.label} style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: m.color ?? '#f0f4ff' }}>{m.value}</div>
                  {m.sub && <div style={{ fontSize: '10px', color: m.color ?? 'rgba(240,244,255,0.35)' }}>{m.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Sleep deprivation warning */}
          <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#fde047' }}>
            <strong>The next morning problem:</strong> With t½ ~{pk.thalf}h, a dose taken at 10pm Saturday still has {Math.round(100 * Math.pow(0.5, 10/pk.thalf))}% of its peak concentration at 8am Sunday and {Math.round(100 * Math.pow(0.5, 22/pk.thalf))}% at 8am Monday. Set the time axis to 48h and take a dose at t=0 to see exactly what is in your system when Monday morning lectures start.
          </div>

          {/* PK education */}
          <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#fdba74' }}>
            <p style={{ margin: '0 0 6px' }}>
              <strong>pH-dependent elimination:</strong> Amphetamine is a weak base (pKa 9.9). In acidic urine, more is in the ionised form and cannot be reabsorbed — elimination rate increases substantially. Vitamin C (ascorbic acid) acidifies urine and can reduce t½ by ~30–50%. Alkaline urine (baking soda, antacids) does the opposite — extending duration and increasing plasma levels. The blue dashed curve shows the vitamin C effect.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Methamphetamine vs amphetamine:</strong> Similar t½ but meth produces roughly 3× more dopamine release per unit plasma concentration and has greater CNS penetration. This means greater euphoria, greater cardiovascular strain, and greater neurotoxicity risk at equivalent plasma levels. The effect zones are scaled accordingly.
            </p>
          </div>

          {/* Interactions */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff', margin: '0 0 10px' }}>Dangerous combinations</p>
            {AMPHETAMINE_INTERACTIONS.map(inter => (
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
            Concerned about stimulant use? <a href="https://www.jellinek.nl" target="_blank" rel="noopener noreferrer" style={{ color: pk.color }}>Jellinek.nl</a> and <a href="https://www.trimbos.nl" target="_blank" rel="noopener noreferrer" style={{ color: pk.color }}>Trimbos.nl</a> offer free, confidential support.
          </div>
        </div>
      </div>
    </main>
  )
}