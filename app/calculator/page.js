'use client'
import { useState, useEffect, useRef } from 'react'
import { calcKe, calcMetrics, generateCurve } from '../../lib/pkmath.js'

const MODELS = {
  oral:          { label: '1-compartment oral',      params: ['D','F','Vd','CL','ka'] },
  iv_bolus:      { label: 'IV bolus',                params: ['D','Vd','CL'] },
  iv_infusion:   { label: 'IV infusion',             params: ['D','Vd','CL','Tinf'] },
  multiple_oral: { label: 'Multiple oral doses',     params: ['D','F','Vd','CL','ka','tau'] },
  '2comp_iv':    { label: '2-compartment IV bolus',  params: ['D','Vc','k12','k21','k10'] },
}

const PARAM_META = {
  D:    { label: 'Dose (D)',              unit: 'mg',   min: 10,   max: 2000, step: 10,  default: 500  },
  F:    { label: 'Bioavailability (F)',   unit: '',     min: 0.05, max: 1.0,  step: 0.05,default: 0.8  },
  Vd:   { label: 'Volume of dist. (Vd)', unit: 'L',    min: 1,    max: 300,  step: 1,   default: 35   },
  CL:   { label: 'Clearance (CL)',        unit: 'L/h',  min: 0.1,  max: 30,   step: 0.1, default: 4    },
  ka:   { label: 'Absorption rate (ka)', unit: 'h⁻¹',  min: 0.1,  max: 5,    step: 0.1, default: 1.2  },
  Tinf: { label: 'Infusion duration',    unit: 'h',    min: 0.5,  max: 24,   step: 0.5, default: 1    },
  tau:  { label: 'Dosing interval (τ)',  unit: 'h',    min: 4,    max: 24,   step: 4,   default: 8    },
  Vc:   { label: 'Central volume (Vc)',  unit: 'L',    min: 1,    max: 100,  step: 1,   default: 10   },
  k12:  { label: 'k12',                  unit: 'h⁻¹',  min: 0.01, max: 2,    step: 0.01,default: 0.5  },
  k21:  { label: 'k21',                  unit: 'h⁻¹',  min: 0.01, max: 2,    step: 0.01,default: 0.3  },
  k10:  { label: 'k10',                  unit: 'h⁻¹',  min: 0.01, max: 2,    step: 0.01,default: 0.2  },
}

const MEC = 5
const MTC = 25

function buildParams(modelType, overrides = {}) {
  const base = {}
  MODELS[modelType].params.forEach(p => {
    base[p] = overrides[p] ?? PARAM_META[p].default
  })
  return base
}

function getFullParams(modelType, params) {
  const full = { ...params }
  if (!full.ke && full.CL && full.Vd) full.ke = calcKe(full.CL, full.Vd)
  if (modelType === 'iv_infusion') full.R0 = full.D / full.Tinf
  const ke = full.ke ?? calcKe(full.CL, full.Vd)
  const thalf = Math.LN2 / ke
  full.tEnd = modelType === 'multiple_oral'
    ? Math.max(full.tau * 7, thalf * 5)
    : thalf * 7
  return full
}

export default function Calculator() {
  const [modelType, setModelType] = useState('oral')
  const [params, setParams] = useState(buildParams('oral'))
  const [metrics, setMetrics] = useState(null)
  const [curve, setCurve] = useState([])
  const [explanation, setExplanation] = useState(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    try {
      const full = getFullParams(modelType, params)
      const points = generateCurve(modelType, full)
      const m = calcMetrics(modelType, full)
      setCurve(points)
      setMetrics(m)
      setExplanation(null)
    } catch (e) {
      console.error(e)
    }
  }, [modelType, params])

  useEffect(() => {
    if (curve.length === 0 || !canvasRef.current) return
    drawCanvas(canvasRef.current, curve)
  }, [curve])

  function drawCanvas(canvas, points) {
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 20, bottom: 40, left: 55 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    const maxC = Math.max(...points.map(p => p.c), MTC * 1.2)
    const maxT = points[points.length - 1].t

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDark ? '#9ca3af' : '#6b7280'
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    ctx.clearRect(0, 0, W, H)

    // grid
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }
    for (let i = 0; i <= 6; i++) {
      const x = pad.left + (i / 6) * cW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    }

    // axis labels
    ctx.fillStyle = textColor
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = (maxC * (1 - i / 4)).toFixed(1)
      const y = pad.top + (i / 4) * cH
      ctx.fillText(val, pad.left - 6, y + 4)
    }
    ctx.textAlign = 'center'
    for (let i = 0; i <= 6; i++) {
      const val = (maxT * i / 6).toFixed(0)
      const x = pad.left + (i / 6) * cW
      ctx.fillText(val + 'h', x, pad.top + cH + 18)
    }

    // axis titles
    ctx.save()
    ctx.translate(14, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('Concentration (mg/L)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.fillText('Time (h)', pad.left + cW / 2, H - 4)

    const xScale = x => pad.left + (x / maxT) * cW
    const yScale = y => pad.top + cH - (y / maxC) * cH

    // MEC line
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(pad.left, yScale(MEC))
    ctx.lineTo(pad.left + cW, yScale(MEC))
    ctx.stroke()
    ctx.fillStyle = '#f59e0b'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('MEC', pad.left + 4, yScale(MEC) - 4)

    // MTC line
    ctx.strokeStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(pad.left, yScale(MTC))
    ctx.lineTo(pad.left + cW, yScale(MTC))
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.fillText('MTC', pad.left + 4, yScale(MTC) - 4)

    ctx.setLineDash([])

    // curve
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = xScale(p.t)
      const y = yScale(Math.min(p.c, maxC))
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  function handleModelChange(m) {
    setModelType(m)
    setParams(buildParams(m))
    setExplanation(null)
    setExtractedParams(null)
  }

  function handleParamChange(key, val) {
    setParams(prev => ({ ...prev, [key]: parseFloat(val) }))
  }

  async function getExplanation() {
    setLoadingExplanation(true)
    try {
      const full = getFullParams(modelType, params)
      const res = await fetch('/api/explain-pk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelType, params: full, metrics })
      })
      const data = await res.json()
      setExplanation(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingExplanation(false)
    }
  }

  const statusColor = () => {
    if (!metrics) return '#6b7280'
    if (metrics.cmax > MTC) return '#ef4444'
    if (metrics.cmax < MEC) return '#f59e0b'
    return '#22c55e'
  }

  const statusText = () => {
    if (!metrics) return ''
    if (metrics.cmax > MTC) return 'Toxic — Cmax exceeds MTC'
    if (metrics.cmax < MEC) return 'Sub-therapeutic — Cmax below MEC'
    return 'Therapeutic window maintained'
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>← Back to home</a>
      <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '1rem 0 0.25rem' }}>PK/PD Calculator</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>Mathematically exact — all calculations use closed-form pharmacokinetic equations.</p>

      {/* Model selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>PK model</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(MODELS).map(([key, { label }]) => (
            <button key={key} onClick={() => handleModelChange(key)} style={{ padding: '7px 14px', borderRadius: '8px', border: modelType === key ? '2px solid #2563eb' : '1px solid #d1d5db', background: modelType === key ? '#eff6ff' : 'transparent', color: modelType === key ? '#1d4ed8' : '#374151', fontWeight: modelType === key ? '600' : '400', cursor: 'pointer', fontSize: '13px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
        {MODELS[modelType].params.map(key => {
          const meta = PARAM_META[key]
          return (
            <div key={key} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{meta.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{params[key]} {meta.unit}</span>
              </div>
              <input type="range" min={meta.min} max={meta.max} step={meta.step} value={params[key]} onChange={e => handleParamChange(key, e.target.value)} style={{ width: '100%' }} />
            </div>
          )
        })}
      </div>

      {/* Canvas chart */}
      <div style={{ position: 'relative', width: '100%', height: '300px', marginBottom: '1rem' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
      </div>

      {/* Status */}
      {metrics && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor(), flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: statusColor(), fontWeight: '500' }}>{statusText()}</span>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '1.5rem' }}>
          {[
            ['t½', metrics.thalf, 'h'],
            ['Cmax', metrics.cmax, 'mg/L'],
            ['Tmax', metrics.tmax, 'h'],
            ['AUC∞', metrics.auc, 'mg·h/L'],
            ...(metrics.css != null ? [['Css', metrics.css, 'mg/L']] : []),
            ['ke', metrics.ke, 'h⁻¹'],
          ].filter(([, val]) => val != null && !isNaN(val)).map(([label, val, unit]) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* Explain button */}
      <button onClick={getExplanation} disabled={loadingExplanation} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: '1.5rem' }}>
        {loadingExplanation ? 'Generating explanation...' : 'Explain these results →'}
      </button>

      {/* Explanation */}
      {explanation && (
        <div style={{ border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem', background: '#eff6ff' }}>
          <p style={{ fontWeight: '600', color: '#1d4ed8', marginBottom: '1rem' }}>{explanation.headline}</p>
          {explanation.parameters?.map((p, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{p.name}</span>
                <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '500' }}>{p.value}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 4px' }}>{p.meaning}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontStyle: 'italic' }}>Exam tip: {p.exam_tip}</p>
            </div>
          ))}
          {explanation.clinical_insight && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Clinical insight</p>
              <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{explanation.clinical_insight}</p>
            </div>
          )}
          {explanation.watch_out && (
            <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '10px 12px', border: '1px solid #fed7aa' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Watch out</p>
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>{explanation.watch_out}</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}