'use client'
import { useState, useEffect, useRef } from 'react'
import {
  COUNTRIES, BAC_ZONES, DRINK_TYPES, DRINK_VOLUMES,
  simulateBAC, calcBACMetrics, formatHours,
  calcEthanolGrams, KA_FASTING, KA_FED,
  BETA_MEAN, BETA_LOW, BETA_HIGH, calcWidmarkPeak,
} from '../../../lib/bacmath.js'

const CATEGORIES = ['Beer', 'Wine', 'Spirits', 'Mixed', 'Custom']
let drinkIdCounter = 1

function makeDrink() {
  const type = DRINK_TYPES[0]
  return {
    id:           drinkIdCounter++,
    typeId:       type.id,
    category:     type.category,
    name:         type.name,
    volumeMl:     330,
    abv:          type.defaultAbv,
    timeh:        0,
    qty:          1,
    customVolume: 330,
    customAbv:    5.0,
  }
}

export default function AlcoholCalculator() {
  const [sex,        setSex]        = useState('male')
  const [weightKg,   setWeightKg]   = useState(75)
  const [rawWeight,  setRawWeight]  = useState('75')
  const [country,    setCountry]    = useState('NL')
  const [driverType, setDriverType] = useState('standard')
  const [withFood,   setWithFood]   = useState(false)
  const [drinks,     setDrinks]     = useState([makeDrink()])
  const [tEnd,       setTEnd]       = useState(24)
  const [timeScale,  setTimeScale]  = useState(12)
  const [bacPts,     setBacPts]     = useState([])
  const [bacPtsLow,  setBacPtsLow]  = useState([])
  const [bacPtsHigh, setBacPtsHigh] = useState([])
  const [metrics,    setMetrics]    = useState(null)

  const canvasRef = useRef(null)
  const bacRef    = useRef([])
  const lowRef    = useRef([])
  const highRef   = useRef([])
  const metRef    = useRef(null)
  const stateRef  = useRef({})

  // Keep stateRef in sync for drawCanvas
  useEffect(() => {
    stateRef.current = { timeScale, country, driverType, drinks }
  }, [timeScale, country, driverType, drinks])

  // Recompute BAC whenever inputs change
  useEffect(() => {
    if (!drinks.length) { setBacPts([]); setMetrics(null); return }

    const ka = withFood ? KA_FED : KA_FASTING

    const drinkInputs = drinks.flatMap(d => {
      const vol = d.typeId === 'custom' ? d.customVolume : d.volumeMl
      const abv = d.typeId === 'custom' ? d.customAbv    : d.abv
      const eg  = calcEthanolGrams(vol, abv / 100)
      return Array.from({ length: d.qty }, () => ({
        timeh:    d.timeh,
        ethanolG: eg,
        ka,
      }))
    })

    if (!drinkInputs.length) { setBacPts([]); setMetrics(null); return }

    const common = { drinks: drinkInputs, weightKg, sex, tEnd: Math.max(tEnd, 24) }
    const pts    = simulateBAC({ ...common, betaRate: BETA_MEAN })
    const ptsLow = simulateBAC({ ...common, betaRate: BETA_LOW  })
    const ptsHigh= simulateBAC({ ...common, betaRate: BETA_HIGH })

    const limit = driverType !== 'none'
      ? (COUNTRIES[country][driverType] ?? COUNTRIES[country].standard)
      : null
    const totalEthanolG = drinkInputs.reduce((sum, d) => sum + d.ethanolG, 0)
    const widmarkPeak   = calcWidmarkPeak(totalEthanolG, weightKg, sex)
    const m             = { ...calcBACMetrics(pts, limit), widmarkPeak: +widmarkPeak.toFixed(3) }

    bacRef.current  = pts
    lowRef.current  = ptsLow
    highRef.current = ptsHigh
    metRef.current  = m

    setBacPts(pts)
    setBacPtsLow(ptsLow)
    setBacPtsHigh(ptsHigh)
    setMetrics(m)
    setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
  }, [drinks, sex, weightKg, withFood, country, driverType, tEnd])

  useEffect(() => {
    if (bacRef.current.length && canvasRef.current) drawCanvas()
  }, [bacPts, timeScale, country, driverType])

  function drawCanvas(exportCtx = null, exportW = 0, exportH = 0) {
  const pts    = bacRef.current
  const ptsLow = lowRef.current
  const ptsHigh= highRef.current
  const m      = metRef.current
  const st     = stateRef.current
  const ts     = st.timeScale  ?? timeScale
  const cntry  = st.country    ?? country
  const drvType= st.driverType ?? driverType
  const drnks  = st.drinks     ?? drinks
  if (!pts || !pts.length) return

  let ctx, W, H
  if (exportCtx) {
    ctx = exportCtx
    W   = exportW
    H   = exportH
  } else {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    W = canvas.offsetWidth
    H = canvas.offsetHeight
    if (!W || !H) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
  }

    const pad = { top: 28, right: 24, bottom: 48, left: 52 }
    const cW  = W - pad.left - pad.right
    const cH  = H - pad.top  - pad.bottom

    const maxBAC  = Math.max(...pts.map(p => p.bac), ...ptsLow.map(p => p.bac), 0.1) * 1.15
    const dispMax = Math.ceil(maxBAC / 0.5) * 0.5
    const maxT    = ts

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const xS = t   => pad.left + (Math.min(t, maxT) / maxT) * cW
    const yS = bac => pad.top + cH - (Math.min(Math.max(bac, 0), dispMax) / dispMax) * cH

    // Effect zone bands
    BAC_ZONES.forEach(zone => {
      const y0 = yS(Math.min(zone.max, dispMax))
      const y1 = yS(zone.min)
      if (y1 <= pad.top || y0 >= pad.top + cH) return
      ctx.fillStyle   = zone.color
      ctx.globalAlpha = zone.alpha
      ctx.fillRect(pad.left, Math.max(y0, pad.top), cW, Math.min(y1, pad.top + cH) - Math.max(y0, pad.top))
      ctx.globalAlpha = 1
      const midY = (Math.max(y0, pad.top) + Math.min(y1, pad.top + cH)) / 2
      if (Math.min(y1, pad.top + cH) - Math.max(y0, pad.top) > 14) {
        ctx.fillStyle   = zone.color
        ctx.globalAlpha = 0.75
        ctx.font        = '9px sans-serif'
        ctx.textAlign   = 'right'
        ctx.fillText(zone.label, pad.left + cW - 3, midY + 3)
        ctx.globalAlpha = 1
      }
    })

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    const yLines = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].filter(v => v <= dispMax)
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
    ctx.fillStyle = '#374151'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    yLines.forEach(v => {
      ctx.fillText(v.toFixed(1) + '‰', pad.left - 4, yS(v) + 4)
    })
    ctx.textAlign = 'center'
    for (let i = 0; i <= nX; i++) {
      ctx.fillText((ts * i / nX).toFixed(0) + 'h', pad.left + (i / nX) * cW, pad.top + cH + 18)
    }
    ctx.save()
    ctx.translate(14, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('BAC (‰ g/L)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.fillText('Time after first drink (h)', pad.left + cW / 2, H - 8)
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Uncertainty band
    if (ptsLow.length && ptsHigh.length) {
      ctx.globalAlpha = 0.15
      ctx.fillStyle   = '#2563eb'
      ctx.beginPath()
      const lo = ptsLow.filter(p  => p.t <= maxT)
      const hi = ptsHigh.filter(p => p.t <= maxT)
      lo.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.bac)) : ctx.lineTo(xS(p.t), yS(p.bac)))
      ;[...hi].reverse().forEach(p => ctx.lineTo(xS(p.t), yS(p.bac)))
      ctx.closePath(); ctx.fill()
      ctx.globalAlpha = 1
    }

    // Legal limit line — only when driving
    const limitVal = drvType !== 'none'
      ? (COUNTRIES[cntry][drvType] ?? COUNTRIES[cntry].standard)
      : null

    if (limitVal != null && limitVal >= 0 && limitVal <= dispMax) {
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth   = 1.5
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(pad.left, yS(limitVal)); ctx.lineTo(pad.left + cW, yS(limitVal))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle  = '#dc2626'
      ctx.font       = '10px sans-serif'
      ctx.textAlign  = 'left'
      ctx.fillText(`Legal limit ${limitVal}‰ (${COUNTRIES[cntry].name.replace(/^\S+\s/, '')})`, pad.left + 4, yS(limitVal) - 4)
    }

    // Germany 0.3‰ criminal threshold
    if (cntry === 'DE' && drvType !== 'none' && 0.3 <= dispMax) {
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth   = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(pad.left, yS(0.3)); ctx.lineTo(pad.left + cW, yS(0.3))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle  = '#f97316'
      ctx.font       = '9px sans-serif'
      ctx.textAlign  = 'left'
      ctx.fillText('0.3‰ criminal threshold (DE accident)', pad.left + 4, yS(0.3) - 3)
    }

    // Safe to drive marker
    if (m?.safeToDriveTime != null && m.safeToDriveTime <= maxT && drvType !== 'none') {
      const sx = xS(m.safeToDriveTime)
      ctx.strokeStyle = '#16a34a'
      ctx.lineWidth   = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + cH); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle  = '#16a34a'
      ctx.font       = '10px sans-serif'
      ctx.textAlign  = 'center'
      ctx.fillText('Safe to drive', sx, pad.top + 12)
    }

    // Sober marker
    if (m?.soberTime != null && m.soberTime <= maxT) {
      const sx = xS(m.soberTime)
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth   = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(sx, pad.top); ctx.lineTo(sx, pad.top + cH); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle  = '#22c55e'
      ctx.font       = '10px sans-serif'
      ctx.textAlign  = 'center'
      ctx.fillText('Sober', sx, pad.top + 22)
    }

    // Steady state annotation
    if (m?.steadyState) {
      ctx.fillStyle  = '#f59e0b'
      ctx.font       = '10px sans-serif'
      ctx.textAlign  = 'right'
      ctx.fillText('⚠ Approaching steady state', pad.left + cW - 4, pad.top + cH - 6)
    }

    // Drink time markers
    const uniqueTimes = [...new Set(drnks.map(d => d.timeh))].sort((a, b) => a - b)
    uniqueTimes.forEach(t => {
      if (t > maxT) return
      ctx.font      = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🍺', xS(t), pad.top + cH + 38)
    })

    // Main BAC curve
    const filtered = pts.filter(p => p.t <= maxT)
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth   = 2.5
    ctx.lineJoin    = 'round'
    ctx.beginPath()
    filtered.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.bac)) : ctx.lineTo(xS(p.t), yS(p.bac)))
    ctx.stroke()

    // Peak dot
    if (m && m.peakTime <= maxT) {
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(xS(m.peakTime), yS(m.peakBAC), 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle  = '#111827'
      ctx.font       = 'bold 11px sans-serif'
      ctx.textAlign  = 'center'
      ctx.fillText('Peak ' + m.peakBAC + '‰', xS(m.peakTime), yS(m.peakBAC) - 10)
    }
  }

  function exportGraph() {
    const src = canvasRef.current
    if (!src) return
    const scale = 3
    const W     = src.offsetWidth
    const H     = src.offsetHeight
    const off   = document.createElement('canvas')
    off.width   = W * scale
    off.height  = H * scale
    const ctx   = off.getContext('2d')
    ctx.scale(scale, scale)
    drawCanvas(ctx, W, H)
    const link    = document.createElement('a')
    link.download = 'pharmlab-bac-curve.png'
    link.href     = off.toDataURL('image/png', 1.0)
    link.click()
  }

  function updateDrink(id, field, value) {
    setDrinks(prev => prev.map(d => {
      if (d.id !== id) return d
      const updated = { ...d, [field]: value }
      if (field === 'typeId') {
        const type = DRINK_TYPES.find(t => t.id === value)
        if (type) {
          updated.category = type.category
          updated.name     = type.name
          updated.abv      = type.defaultAbv
          const vols       = DRINK_VOLUMES[type.category]
          updated.volumeMl = vols?.[1]?.ml ?? vols?.[0]?.ml ?? 330
        }
      }
      return updated
    }))
  }

  function removeDrink(id) { setDrinks(prev => prev.filter(d => d.id !== id)) }
  function addDrink()      { setDrinks(prev => [...prev, makeDrink()]) }

  const limit        = driverType !== 'none' ? (COUNTRIES[country][driverType] ?? COUNTRIES[country].standard) : null
  const peakZone     = metrics ? BAC_ZONES.slice().reverse().find(z => metrics.peakBAC >= z.min) : null
  const totalEthanol = drinks.reduce((sum, d) => {
    const vol = d.typeId === 'custom' ? d.customVolume : d.volumeMl
    const abv = d.typeId === 'custom' ? d.customAbv    : d.abv
    return sum + calcEthanolGrams(vol, abv / 100) * d.qty
  }, 0)
  const totalUnits = totalEthanol / 10

  const btn = active => ({
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
    fontWeight: active ? '600' : '400',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    background: active ? '#eff6ff' : 'white',
    color: active ? '#1d4ed8' : '#374151',
  })

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Alcohol Calculator</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        Based on the Widmark model — the forensic pharmacokinetic standard. The shaded band shows the range between slow and fast ethanol eliminators. Individual variation is real and significant.
      </p>

      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.25rem', fontSize: '12px', color: '#92400e' }}>
        ⚠ <strong>Never drink and drive.</strong> This tool models population averages — your actual BAC may be higher or lower. Do not use this to decide whether you are safe to drive. When in doubt, don't drive.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Personal details */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal details</p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Biological sex</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setSex('male')}   style={btn(sex === 'male')}>Male (r = 0.68)</button>
                <button onClick={() => setSex('female')} style={btn(sex === 'female')}>Female (r = 0.55)</button>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Body weight</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" value={rawWeight} min={30} max={200}
                  onChange={e => { setRawWeight(e.target.value); const n = parseFloat(e.target.value); if (n >= 30 && n <= 200) setWeightKg(n) }}
                  onBlur={() => { const n = parseFloat(rawWeight); if (isNaN(n) || n < 30 || n > 200) { setWeightKg(75); setRawWeight('75') } }}
                  style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', textAlign: 'right', background: 'white' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>kg</span>
                <input type="range" min={30} max={200} step={1} value={weightKg}
                  onChange={e => { setWeightKg(parseInt(e.target.value)); setRawWeight(e.target.value) }}
                  style={{ flex: 1, accentColor: '#2563eb' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Stomach contents</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setWithFood(false)} style={btn(!withFood)}>Empty stomach</button>
                <button onClick={() => setWithFood(true)}  style={btn(withFood)}>With food (~30% lower peak)</button>
              </div>
            </div>
          </div>

          {/* Country + driver type */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driving limits</p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Country</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(COUNTRIES).map(([k, v]) => (
                  <button key={k} onClick={() => { setCountry(k); setDriverType('standard') }} style={btn(country === k)}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Driver type</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => setDriverType('standard')}
                  style={btn(driverType === 'standard')}>
                  Standard ({COUNTRIES[country].standard}‰)
                </button>
                <button onClick={() => setDriverType('novice')}
                  style={btn(driverType === 'novice')}>
                  {COUNTRIES[country].noviceLabel} ({COUNTRIES[country].novice}‰)
                </button>
                <button onClick={() => setDriverType('professional')}
                  style={btn(driverType === 'professional')}>
                  {COUNTRIES[country].proLabel} ({COUNTRIES[country].professional}‰)
                </button>
                <button onClick={() => setDriverType('none')}
                  style={btn(driverType === 'none')}>
                  Not driving
                </button>
              </div>

              {/* Germany criminal threshold note */}
              {COUNTRIES[country].note && driverType !== 'none' && (
                <div style={{ marginTop: '8px', padding: '7px 10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '11px', color: '#92400e' }}>
                  ⚠ {COUNTRIES[country].note}
                </div>
              )}

              {/* Not driving confirmation */}
              {driverType === 'none' && (
                <div style={{ marginTop: '8px', padding: '7px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', color: '#15803d' }}>
                  ✓ Not driving selected — no legal limit line shown.
                </div>
              )}
            </div>
          </div>

          {/* Drinks */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Drinks</p>

            {drinks.map((d, idx) => {
              const volumes  = DRINK_VOLUMES[d.category] ?? DRINK_VOLUMES['Mixed']
              const isCustom = d.typeId === 'custom'
              const vol      = isCustom ? d.customVolume : d.volumeMl
              const abv      = isCustom ? d.customAbv    : d.abv
              const eg       = calcEthanolGrams(vol, abv / 100)

              return (
                <div key={d.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Drink {idx + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{eg.toFixed(1)}g ethanol / {(eg/10).toFixed(2)} units</span>
                      {drinks.length > 1 && (
                        <button onClick={() => removeDrink(d.id)}
                          style={{ fontSize: '18px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Type</label>
                    <select value={d.typeId} onChange={e => updateDrink(d.id, 'typeId', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', color: '#111827', background: 'white' }}>
                      {CATEGORIES.map(cat => (
                        <optgroup key={cat} label={cat}>
                          {DRINK_TYPES.filter(t => t.category === cat).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {isCustom ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Volume (mL)</label>
                        <input type="number" value={d.customVolume} min={10} max={2000}
                          onChange={e => updateDrink(d.id, 'customVolume', parseFloat(e.target.value) || 250)}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>ABV (%)</label>
                        <input type="number" value={d.customAbv} min={0.1} max={96} step={0.1}
                          onChange={e => updateDrink(d.id, 'customAbv', parseFloat(e.target.value) || 5)}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px', gap: '6px', marginBottom: '6px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Volume</label>
                          <select value={d.volumeMl} onChange={e => updateDrink(d.id, 'volumeMl', parseInt(e.target.value))}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', color: '#111827', background: 'white' }}>
                            {volumes.map(v => (
                              <option key={v.label} value={v.ml}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Qty</label>
                          <select value={d.qty} onChange={e => updateDrink(d.id, 'qty', parseInt(e.target.value))}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', color: '#111827', background: 'white' }}>
                            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>ABV: {d.abv.toFixed(1)}%</label>
                      <input type="range" min={0.5} max={70} step={0.5} value={d.abv}
                        onChange={e => updateDrink(d.id, 'abv', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#2563eb' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db' }}>
                        <span>0.5%</span><span>70%</span>
                      </div>
                    </div>
                  )}

                  {/* Timing */}
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>
                      Time: {d.timeh === 0 ? 'Start (t=0)' : `+${d.timeh}h after start`}
                    </label>
                    <input type="range" min={0} max={12} step={0.25} value={d.timeh}
                      onChange={e => updateDrink(d.id, 'timeh', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#2563eb' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db' }}>
                      <span>Start</span><span>+12h</span>
                    </div>
                  </div>
                </div>
              )
            })}

            <button onClick={addDrink}
              style={{ width: '100%', padding: '8px', border: '1px dashed #d1d5db', borderRadius: '8px', background: 'transparent', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>
              + Add another drink
            </button>

            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#374151', border: '1px solid #e5e7eb' }}>
              Total: <strong>{totalEthanol.toFixed(1)}g ethanol</strong> — <strong>{totalUnits.toFixed(1)}</strong> Dutch units (1 unit = 10g)
            </div>
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
            <input type="range" min={4} max={24} step={1} value={timeScale}
              onChange={e => setTimeScale(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: '#2563eb' }} />
            <span style={{ fontWeight: '600', color: '#374151', minWidth: '28px' }}>{timeScale}h</span>
            <button onClick={exportGraph}
              style={{ padding: '5px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ↓ Export PNG
            </button>
          </div>

          {/* Zone legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {BAC_ZONES.slice(0, 6).map(z => (
              <span key={z.label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: z.color + '22', color: z.color, border: `1px solid ${z.color}44` }}>
                {z.min}–{z.max === 10 ? '3.0+' : z.max}‰ {z.label}
              </span>
            ))}
          </div>

          {/* Metrics */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                {
                  label: 'Simulated peak BAC',
                  value: metrics.peakBAC + '‰',
                  sub:   peakZone?.label ?? '',
                  color: peakZone?.color ?? '#111827',
                },
                {
                  label: 'Peak time',
                  value: formatHours(metrics.peakTime),
                  sub:   'after first drink',
                },
                {
                  label: 'Safe to drive',
                  value: driverType === 'none'
                    ? 'Not driving'
                    : metrics.safeToDriveTime != null
                      ? formatHours(metrics.safeToDriveTime)
                      : `> ${tEnd}h`,
                  sub: driverType === 'none'
                    ? 'No limit applied'
                    : limit != null ? `Below ${limit}‰ limit` : '',
                  color: driverType === 'none' ? '#22c55e' : undefined,
                },
                {
                  label: 'Fully sober',
                  value: metrics.soberTime != null ? formatHours(metrics.soberTime) : `> ${tEnd}h`,
                  sub:   'BAC returns to 0',
                },
                {
                  label: 'Widmark peak (max)',
                  value: metrics.widmarkPeak + '‰',
                  sub:   'Theoretical max — instantaneous absorption',
                  color: '#6b7280',
                },
              ].map(m => (
                <div key={m.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: m.color ?? '#111827' }}>{m.value}</div>
                  {m.sub && <div style={{ fontSize: '10px', color: m.color ?? '#9ca3af' }}>{m.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {/* PK education note */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#1e40af' }}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Why water doesn't speed sobering up:</strong> Ethanol elimination is enzyme-limited — alcohol dehydrogenase works at maximum capacity at typical BAC levels (zero-order / Michaelis-Menten saturation). Water hydrates you and reduces nausea but does not increase elimination rate. Only time sobers you up. This is the same MM kinetics shown in the PK calculator.
            </p>
           <p style={{ margin: 0 }}>
              <strong>Widmark vs simulated peak:</strong> The Widmark value above assumes instantaneous absorption — the theoretical maximum used by forensic labs and courts. The simulated peak is lower because absorption and elimination happen simultaneously in reality. Your actual peak will be somewhere between the two depending on how quickly you drink.
            </p>
          </div>

          {/* Steady state warning */}
          {metrics?.steadyState && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400e' }}>
              ⚠ <strong>Steady state approaching</strong> — your drinking rate is close to your elimination rate. BAC will plateau rather than fall. Adding more drinks will continue to raise BAC. This is how people unknowingly drink to dangerous levels over long sessions.
            </div>
          )}

          {/* Support footer */}
          <div style={{ padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', color: '#6b7280' }}>
            Concerned about alcohol use? <a href="https://www.jellinek.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Jellinek.nl</a> and <a href="https://www.trimbos.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Trimbos.nl</a> offer free, confidential support.
          </div>
        </div>
      </div>
    </main>
  )
}