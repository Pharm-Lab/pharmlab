'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Known ladder sizes (common options) ────────────────────────────────────

const LADDER_PRESETS = {
  'PageRuler 10–200 kDa': [200, 150, 120, 100, 85, 70, 60, 50, 40, 30, 25, 20, 15, 10],
  'PageRuler 3.5–500 kDa': [500, 250, 150, 100, 70, 55, 40, 35, 25, 15, 10, 3.5],
  'NEB Broad Range 10–260 kDa': [260, 160, 110, 80, 60, 50, 40, 30, 20, 10],
  'GeneRuler 1kb DNA': [10000, 8000, 6000, 5000, 4000, 3500, 3000, 2500, 2000, 1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
  'GeneRuler 100bp DNA': [3000, 2000, 1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
  'Custom': [],
}

// ─── Maths ────────────────────────────────────────────────────────────────────

// Standard curve: log(MW) vs Rf (relative migration from well)
// Rf = (distance of band from well) / (distance of dye front from well)
// Linear regression on log(MW) vs Rf

function linReg(xs, ys) {
  const n = xs.length
  if (n < 2) return null
  const sx = xs.reduce((a, b) => a + b, 0)
  const sy = ys.reduce((a, b) => a + b, 0)
  const sxy = xs.reduce((acc, x, i) => acc + x * ys[i], 0)
  const sxx = xs.reduce((acc, x) => acc + x * x, 0)
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const b = (sy - m * sx) / n
  const yMean = sy / n
  const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0)
  const ssRes = xs.reduce((acc, x, i) => acc + Math.pow(ys[i] - (m * x + b), 2), 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  return { m, b, r2 }
}

function estimateSize(rf, reg) {
  // log(MW) = m*Rf + b  →  MW = 10^((Rf - b) / m)
  if (!reg || reg.m === 0) return null
  const logMW = reg.m * rf + reg.b
  return Math.pow(10, logMW)
}

function rfFromY(yBand, yWell, yFront) {
  if (yFront <= yWell) return null
  return (yBand - yWell) / (yFront - yWell)
}

// ─── Standard curve canvas ───────────────────────────────────────────────────

function CurveCanvas({ ladderBands, reg, unknownBands }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    if (!W || !H) return
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 20, bottom: 44, left: 60 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    const validLadder = ladderBands.filter(b => b.rf !== null && b.sizeKda > 0)
    if (validLadder.length < 2) {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Add ≥2 ladder bands to see standard curve', W / 2, H / 2)
      return
    }

    const allRf = validLadder.map(b => b.rf)
    const allLogMW = validLadder.map(b => Math.log10(b.sizeKda))
    const rfMin = Math.min(...allRf) - 0.05
    const rfMax = Math.max(...allRf) + 0.05
    const logMin = Math.min(...allLogMW) - 0.1
    const logMax = Math.max(...allLogMW) + 0.1

    const xS = rf => pad.left + ((rf - rfMin) / (rfMax - rfMin)) * cW
    const yS = logMW => pad.top + cH - ((logMW - logMin) / (logMax - logMin)) * cH

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (i / 5) * cW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    }

    // Regression line
    if (reg) {
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      const x0 = rfMin, x1 = rfMax
      ctx.moveTo(xS(x0), yS(reg.m * x0 + reg.b))
      ctx.lineTo(xS(x1), yS(reg.m * x1 + reg.b))
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Ladder points
    validLadder.forEach(b => {
      const x = xS(b.rf)
      const y = yS(Math.log10(b.sizeKda))
      ctx.fillStyle = '#111827'
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#374151'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(b.sizeKda + ' kDa', x + 5, y + 3)
    })

    // Unknown band projections
    unknownBands.filter(b => b.rf !== null && b.estimatedSize).forEach((b, i) => {
      const colors = ['#ef4444', '#f97316', '#8b5cf6', '#16a34a', '#0891b2']
      const col = colors[i % colors.length]
      const x = xS(b.rf)
      const logMW = Math.log10(b.estimatedSize)
      const y = yS(logMW)

      // Dashed drop lines
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x, pad.top + cH); ctx.lineTo(x, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(x, y); ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'white'
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
    })

    // Axes
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Y axis labels (log MW)
    ctx.fillStyle = '#374151'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    for (let lmw = Math.ceil(logMin * 2) / 2; lmw <= logMax; lmw += 0.5) {
      const y = yS(lmw)
      if (y < pad.top || y > pad.top + cH) continue
      ctx.fillText(Math.round(Math.pow(10, lmw)), pad.left - 4, y + 3)
    }

    // X axis labels
    ctx.textAlign = 'center'
    for (let i = 0; i <= 5; i++) {
      const rf = rfMin + (i / 5) * (rfMax - rfMin)
      ctx.fillText(rf.toFixed(2), xS(rf), pad.top + cH + 14)
    }

    // Axis titles
    ctx.save()
    ctx.translate(12, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('MW (kDa)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('Rf (relative migration)', pad.left + cW / 2, H - 6)

    // R² label
    if (reg) {
      ctx.fillStyle = '#2563eb'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`R² = ${reg.r2.toFixed(4)}`, pad.left + cW - 4, pad.top + 14)
    }
  }, [ladderBands, reg, unknownBands])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '260px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: '#0f1629' }} />
  )
}

// ─── Gel image canvas (click to mark bands) ──────────────────────────────────

function GelCanvas({ imgSrc, marks, onMark, mode, yWell, yFront, onSetWell, onSetFront }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!imgSrc) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgLoaded(true)
    }
    img.src = imgSrc
  }, [imgSrc])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current || !imgLoaded) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    if (!W) return
    const img = imgRef.current
    const H = Math.round(W * img.naturalHeight / img.naturalWidth)
    canvas.style.height = H + 'px'
    canvas.width = W * dpr
    canvas.height = H * dpr
    setCanvasSize({ w: W, h: H })
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Draw image
    ctx.drawImage(img, 0, 0, W, H)

    // Draw well line
    if (yWell !== null) {
      const yw = yWell * H
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3])
      ctx.beginPath(); ctx.moveTo(0, yw); ctx.lineTo(W, yw); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#22c55e'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('WELL', 4, yw - 3)
    }

    // Draw front line
    if (yFront !== null) {
      const yf = yFront * H
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3])
      ctx.beginPath(); ctx.moveTo(0, yf); ctx.lineTo(W, yf); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f97316'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('FRONT', 4, yf + 12)
    }

    // Draw band marks
    marks.forEach((m, i) => {
      const y = m.yFrac * H
      const col = m.type === 'ladder' ? '#2563eb' : m.color || '#ef4444'
      ctx.strokeStyle = col; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      // Label
      ctx.fillStyle = col
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(m.label || (m.type === 'ladder' ? `L${i + 1}` : `U${i + 1}`), W - 4, y - 3)
    })
  }, [imgSrc, imgLoaded, marks, yWell, yFront])

  function handleClick(e) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const yFrac = (e.clientY - rect.top) / rect.height
    if (mode === 'well') { onSetWell(yFrac); return }
    if (mode === 'front') { onSetFront(yFrac); return }
    onMark(yFrac)
  }

  if (!imgSrc) return null

  const cursors = { well: 'crosshair', front: 'crosshair', ladder: 'crosshair', unknown: 'crosshair' }

  return (
    <canvas ref={canvasRef}
      onClick={handleClick}
      style={{ width: '100%', display: 'block', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', cursor: cursors[mode] || 'crosshair' }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GelAnalyserPage() {
  const [imgSrc, setImgSrc] = useState(null)
  const [step, setStep] = useState(0) // 0=upload, 1=well/front, 2=ladder, 3=unknowns, 4=results
  const [mode, setMode] = useState('well') // well | front | ladder | unknown

  const [yWell, setYWell] = useState(null)   // 0–1 fraction of image height
  const [yFront, setYFront] = useState(null)

  const [selectedPreset, setSelectedPreset] = useState('PageRuler 10–200 kDa')
  const [ladderSizes, setLadderSizes] = useState(LADDER_PRESETS['PageRuler 10–200 kDa'])
  const [customSizeInput, setCustomSizeInput] = useState('')

  const [ladderMarks, setLadderMarks] = useState([])    // { yFrac, sizeKda, rf }
  const [unknownMarks, setUnknownMarks] = useState([])  // { yFrac, rf, estimatedSize, label }

  const [editingLadderIdx, setEditingLadderIdx] = useState(null)
  const [unknownLabels, setUnknownLabels] = useState([])

  const fileRef = useRef(null)

  // Compute Rf for all marks whenever well/front change
  const ladderBands = ladderMarks.map((m, i) => ({
    ...m,
    rf: (yWell !== null && yFront !== null) ? rfFromY(m.yFrac, yWell, yFront) : null,
    sizeKda: ladderSizes[i] || 0,
  }))

  const validLadder = ladderBands.filter(b => b.rf !== null && b.sizeKda > 0 && b.rf > 0 && b.rf <= 1.5)
  const reg = validLadder.length >= 2
    ? linReg(validLadder.map(b => b.rf), validLadder.map(b => Math.log10(b.sizeKda)))
    : null

  const unknownBands = unknownMarks.map((m, i) => {
    const rf = (yWell !== null && yFront !== null) ? rfFromY(m.yFrac, yWell, yFront) : null
    const estimatedSize = rf !== null && reg ? estimateSize(rf, reg) : null
    return { ...m, rf, estimatedSize, label: unknownLabels[i] || `Sample ${i + 1}`, color: ['#ef4444', '#f97316', '#8b5cf6', '#16a34a', '#0891b2'][i % 5] }
  })

  // All marks for drawing
  const allMarks = [
    ...ladderBands.map(b => ({ ...b, type: 'ladder', label: b.sizeKda ? `${b.sizeKda}` : '?' })),
    ...unknownBands.map(b => ({ ...b, type: 'unknown' })),
  ]

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    setStep(1)
    setMode('well')
    setYWell(null); setYFront(null)
    setLadderMarks([]); setUnknownMarks([])
    setUnknownLabels([])
  }

  function handleMark(yFrac) {
    if (mode === 'ladder') {
      if (ladderMarks.length >= ladderSizes.length) return
      setLadderMarks(prev => [...prev, { yFrac }])
    } else if (mode === 'unknown') {
      setUnknownMarks(prev => [...prev, { yFrac }])
      setUnknownLabels(prev => [...prev, `Sample ${prev.length + 1}`])
    }
  }

  function removeLadderMark(i) {
    setLadderMarks(prev => prev.filter((_, idx) => idx !== i))
  }

  function removeUnknownMark(i) {
    setUnknownMarks(prev => prev.filter((_, idx) => idx !== i))
    setUnknownLabels(prev => prev.filter((_, idx) => idx !== i))
  }

  function handlePresetChange(preset) {
    setSelectedPreset(preset)
    setLadderSizes(LADDER_PRESETS[preset] || [])
    setLadderMarks([])
  }

  const steps = ['Upload', 'Well & front', 'Ladder bands', 'Unknown bands', 'Results']

  const canProceedStep1 = yWell !== null && yFront !== null && yFront > yWell
  const canProceedStep2 = validLadder.length >= 2 && reg !== null
  const canProceedStep3 = unknownBands.length > 0

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <a href="/lab" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', textDecoration: 'none' }}>← Lab Prep</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '1rem 0 4px' }}>Gel Image Analyser</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Upload a gel photo, mark your ladder bands and unknowns, and get estimated molecular weights from a standard curve. Works for SDS-PAGE (protein) and agarose (DNA) gels.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {steps.map((s, i) => (
          <button key={s} onClick={() => i <= step && setStep(i)}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: step === i ? '600' : '400', border: 'none', cursor: i <= step ? 'pointer' : 'default', background: step === i ? '#111827' : 'transparent', color: step === i ? 'white' : i < step ? '#2563eb' : '#9ca3af' }}>
            {i < step ? '✓ ' : ''}{s}
          </button>
        ))}
      </div>

      {/* ── STEP 0: Upload ── */}
      {step === 0 && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', background: '#0f1629' }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const u = URL.createObjectURL(f); setImgSrc(u); setStep(1); setMode('well') } }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔬</div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(240,244,255,0.75)', margin: '0 0 6px' }}>Drop your gel image here</p>
          <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.3)', margin: 0 }}>or click to browse · PNG, JPG, TIFF</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {/* ── STEPS 1–4: Main layout ── */}
      {step >= 1 && imgSrc && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left: gel image */}
          <div>
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.75)', margin: 0 }}>
                  {mode === 'well' && '↓ Click to mark the well line (top of gel)'}
                  {mode === 'front' && '↓ Click to mark the dye front (bottom of gel)'}
                  {mode === 'ladder' && `↓ Click each ladder band top-to-bottom (${ladderMarks.length}/${ladderSizes.length} marked)`}
                  {mode === 'unknown' && `↓ Click each unknown band (${unknownMarks.length} marked)`}
                </p>
                <button onClick={() => fileRef.current?.click()}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f1629', cursor: 'pointer', color: 'rgba(240,244,255,0.45)' }}>
                  Change image
                </button>
              </div>
              <GelCanvas
                imgSrc={imgSrc}
                marks={allMarks}
                onMark={handleMark}
                mode={mode}
                yWell={yWell}
                yFront={yFront}
                onSetWell={y => { setYWell(y) }}
                onSetFront={y => { setYFront(y) }}
              />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>

            {/* Standard curve — show once we have ≥2 ladder bands */}
            {step >= 3 && (
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.75)', margin: '0 0 8px' }}>Standard curve</p>
                <CurveCanvas ladderBands={ladderBands} reg={reg} unknownBands={unknownBands} />
                {reg && (
                  <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', margin: '6px 0 0' }}>
                    log(MW) = {reg.m.toFixed(3)} × Rf + {reg.b.toFixed(3)} · R² = {reg.r2.toFixed(4)}
                    {reg.r2 < 0.97 && <span style={{ color: '#f97316', marginLeft: '8px' }}>⚠ Low R² — check band positions</span>}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: control panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* ── Step 1: Well & front ── */}
            {step === 1 && (
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 — Reference lines</p>
                <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', marginBottom: '12px', lineHeight: '1.6' }}>
                  Set two horizontal reference lines so band positions can be converted to Rf values. The well is where samples loaded; the dye front is the farthest the dye migrated.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={() => setMode('well')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: mode === 'well' ? '2px solid #22c55e' : '1px solid #e5e7eb', background: mode === 'well' ? '#f0fdf4' : 'white', color: mode === 'well' ? '#15803d' : '#374151', fontSize: '12px', fontWeight: mode === 'well' ? '600' : '400', cursor: 'pointer' }}>
                    {yWell !== null ? '✓ ' : ''}Well line
                  </button>
                  <button onClick={() => setMode('front')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: mode === 'front' ? '2px solid #f97316' : '1px solid #e5e7eb', background: mode === 'front' ? '#fff7ed' : 'white', color: mode === 'front' ? '#c2410c' : '#374151', fontSize: '12px', fontWeight: mode === 'front' ? '600' : '400', cursor: 'pointer' }}>
                    {yFront !== null ? '✓ ' : ''}Dye front
                  </button>
                </div>

                {yWell !== null && yFront !== null && yFront <= yWell && (
                  <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', fontSize: '12px', color: '#fca5a5', marginBottom: '10px' }}>
                    Dye front must be below the well. Re-click the front line.
                  </div>
                )}

                <button onClick={() => { setStep(2); setMode('ladder') }} disabled={!canProceedStep1}
                  style={{ width: '100%', padding: '10px', background: canProceedStep1 ? '#111827' : '#e5e7eb', color: canProceedStep1 ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: canProceedStep1 ? 'pointer' : 'default' }}>
                  Continue → Mark ladder
                </button>
              </div>
            )}

            {/* ── Step 2: Ladder bands ── */}
            {step === 2 && (
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 — Ladder bands</p>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>Ladder preset</label>
                  <select value={selectedPreset} onChange={e => handlePresetChange(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', background: '#0f1629' }}>
                    {Object.keys(LADDER_PRESETS).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                {selectedPreset === 'Custom' && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '4px' }}>Band sizes (kDa, comma-separated, largest first)</label>
                    <input value={customSizeInput} onChange={e => { setCustomSizeInput(e.target.value); setLadderSizes(e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))) }}
                      placeholder="200, 150, 100, 75, 50, 37, 25, 20"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', boxSizing: 'border-box' }} />
                  </div>
                )}

                <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', marginBottom: '8px', lineHeight: '1.5' }}>
                  Click each visible ladder band on the gel image from <strong>top to bottom</strong>. The sizes are assigned in order.
                </p>

                {/* Ladder band list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {ladderSizes.map((size, i) => {
                    const marked = ladderMarks[i]
                    const rf = marked && yWell !== null && yFront !== null ? rfFromY(marked.yFrac, yWell, yFront) : null
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', background: marked ? '#eff6ff' : '#f9fafb', border: `1px solid ${marked ? '#bfdbfe' : '#e5e7eb'}` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: marked ? '#2563eb' : '#d1d5db', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#f0f4ff', minWidth: '55px' }}>{size} kDa</span>
                        {marked
                          ? <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', flex: 1 }}>Rf = {rf !== null ? rf.toFixed(3) : '—'}</span>
                          : <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', flex: 1 }}>not marked</span>}
                        {marked && (
                          <button onClick={() => removeLadderMark(i)}
                            style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {reg && (
                  <div style={{ padding: '8px 10px', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.35)', borderRadius: '8px', fontSize: '12px', color: '#86efac', marginBottom: '10px' }}>
                    ✓ Standard curve ready · R² = {reg.r2.toFixed(4)}
                    {reg.r2 < 0.97 && ' — consider re-marking bands'}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setStep(1); setMode('well') }}
                    style={{ flex: 1, padding: '8px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: 'rgba(240,244,255,0.75)' }}>
                    ← Back
                  </button>
                  <button onClick={() => { setStep(3); setMode('unknown') }} disabled={!canProceedStep2}
                    style={{ flex: 2, padding: '10px', background: canProceedStep2 ? '#111827' : '#e5e7eb', color: canProceedStep2 ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: canProceedStep2 ? 'pointer' : 'default' }}>
                    Continue → Mark unknowns
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Unknown bands ── */}
            {step === 3 && (
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 — Unknown bands</p>
                <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', marginBottom: '10px', lineHeight: '1.5' }}>
                  Click each band you want to estimate. You can label them below.
                </p>

                {unknownBands.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {unknownBands.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                        <input value={unknownLabels[i] || ''} onChange={e => setUnknownLabels(prev => prev.map((l, j) => j === i ? e.target.value : l))}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', background: '#0f1629' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: b.color, minWidth: '65px', textAlign: 'right' }}>
                          {b.estimatedSize ? (b.estimatedSize >= 1 ? b.estimatedSize.toFixed(1) + ' kDa' : (b.estimatedSize * 1000).toFixed(0) + ' Da') : '—'}
                        </span>
                        <button onClick={() => removeUnknownMark(i)}
                          style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setStep(2); setMode('ladder') }}
                    style={{ flex: 1, padding: '8px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: 'rgba(240,244,255,0.75)' }}>
                    ← Back
                  </button>
                  <button onClick={() => setStep(4)} disabled={!canProceedStep3}
                    style={{ flex: 2, padding: '10px', background: canProceedStep3 ? '#111827' : '#e5e7eb', color: canProceedStep3 ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: canProceedStep3 ? 'pointer' : 'default' }}>
                    See results →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Results ── */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Results</p>

                  {unknownBands.map((b, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: '10px', background: '#0f1629', border: `1px solid ${b.color}44`, marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff' }}>{b.label}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        {[
                          { label: 'Estimated MW', value: b.estimatedSize ? (b.estimatedSize >= 1 ? b.estimatedSize.toFixed(1) + ' kDa' : (b.estimatedSize * 1000).toFixed(0) + ' Da') : '—' },
                          { label: 'Rf value', value: b.rf !== null ? b.rf.toFixed(3) : '—' },
                          { label: 'From curve', value: reg ? `R² ${reg.r2.toFixed(3)}` : '—' },
                        ].map(m => (
                          <div key={m.label} style={{ background: '#0f1629', borderRadius: '6px', padding: '6px 8px' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)' }}>{m.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f0f4ff' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {reg && (
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(42,111,219,0.18)', border: '1px solid rgba(42,111,219,0.35)', borderRadius: '8px', fontSize: '11px', color: '#1e40af', lineHeight: '1.6' }}>
                      <strong>Standard curve:</strong> log(MW) = {reg.m.toFixed(3)} × Rf + {reg.b.toFixed(3)} · R² = {reg.r2.toFixed(4)} · {validLadder.length} ladder points
                      {reg.r2 < 0.97 && <span style={{ color: '#f97316', display: 'block', marginTop: '3px' }}>⚠ R² below 0.97 — results may be less accurate. Check that band positions are correctly marked.</span>}
                    </div>
                  )}
                </div>

                {/* Ladder summary */}
                <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ladder points used</p>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '5px 8px', textAlign: 'left', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>Band</th>
                        <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>Size</th>
                        <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>Rf</th>
                        <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>Predicted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validLadder.map((b, i) => {
                        const predicted = reg ? Math.pow(10, reg.m * b.rf + reg.b) : null
                        const err = predicted ? Math.abs((predicted - b.sizeKda) / b.sizeKda * 100) : null
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '5px 8px', color: 'rgba(240,244,255,0.75)' }}>Band {i + 1}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{b.sizeKda} kDa</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{b.rf.toFixed(3)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: err && err > 10 ? '#f97316' : '#16a34a' }}>
                              {predicted ? predicted.toFixed(1) : '—'} {err ? `(${err.toFixed(1)}%)` : ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <button onClick={() => { setStep(3); setMode('unknown') }}
                  style={{ padding: '9px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: 'rgba(240,244,255,0.75)' }}>
                  ← Add more bands
                </button>
              </div>
            )}

            {/* Mode switcher (steps 2–3) */}
            {(step === 2 || step === 3) && (
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active tool</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { m: 'ladder', label: 'Ladder', col: '#2563eb' },
                    { m: 'unknown', label: 'Unknown', col: '#ef4444' },
                  ].map(opt => (
                    <button key={opt.m} onClick={() => setMode(opt.m)}
                      style={{ flex: 1, padding: '7px', borderRadius: '7px', border: mode === opt.m ? `2px solid ${opt.col}` : '1px solid #e5e7eb', background: mode === opt.m ? opt.col + '15' : 'white', color: mode === opt.m ? opt.col : '#374151', fontSize: '12px', fontWeight: mode === opt.m ? '600' : '400', cursor: 'pointer' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}