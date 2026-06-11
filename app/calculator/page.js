'use client'
import { useState, useEffect, useRef } from 'react'
import { calcKe, calcMetrics, generateCurve } from '../../lib/pkmath.js'

// ─── Model definitions ────────────────────────────────────────────

const ROUTES = [
  { key: 'oral',       label: '💊 Oral' },
  { key: 'iv_bolus',   label: '💉 IV Bolus' },
  { key: 'iv_inf',     label: '🩺 IV Infusion' },
  { key: 'oral_multi', label: '🔄 Oral Multiple' },
]

const COMPARTMENTS = [
  { key: '1comp', label: '1-Compartment' },
  { key: '2comp', label: '2-Compartment' },
]

const CLEARANCE_MODES = [
  { key: 'linear', label: 'Linear (CL)' },
  { key: 'mm',     label: 'Non-linear (Vmax/Km)' },
]

// Which compartments are valid per route
const VALID_COMPARTMENTS = {
  oral:       ['1comp', '2comp'],
  iv_bolus:   ['1comp', '2comp'],
  iv_inf:     ['1comp', '2comp'],
  oral_multi: ['1comp'],
}

// All valid model keys — if a key is not here, that combo is disabled
const VALID_MODELS = new Set([
  'oral_1comp_linear',
  'oral_1comp_mm',
  'iv_bolus_1comp_linear',
  'iv_bolus_1comp_mm',
  'iv_inf_1comp_linear',
  'iv_inf_1comp_mm',
  'oral_multi_1comp_linear',
  'oral_multi_1comp_mm',
  'oral_2comp_linear',
  'oral_2comp_mm',
  'iv_bolus_2comp_linear',
  'iv_bolus_2comp_mm',
  'iv_inf_2comp_linear',
  'iv_inf_2comp_mm',
])

function buildModelKey(route, comp, cl) {
  return `${route}_${comp}_${cl}`
}

// Parameters per model key
const MODEL_PARAMS = {
  oral_1comp_linear:       ['D','F','Vd','CL','ka'],
  oral_1comp_mm:           ['D','F','Vd','Vmax','Km','ka'],
  iv_bolus_1comp_linear:   ['D','Vd','CL'],
  iv_bolus_1comp_mm:       ['D','Vd','Vmax','Km'],
  iv_inf_1comp_linear:     ['D','Vd','CL','Tinf'],
  iv_inf_1comp_mm:         ['D','Vd','Vmax','Km','Tinf'],
  oral_multi_1comp_linear: ['D','F','Vd','CL','ka','tau'],
  oral_multi_1comp_mm:     ['D','F','Vd','Vmax','Km','ka','tau'],
  oral_2comp_linear:       ['D','F','Vc','Vp','CL','Q','ka'],
  oral_2comp_mm:           ['D','F','Vc','Vp','Vmax','Km','Q','ka'],
  iv_bolus_2comp_linear:   ['D','Vc','Vp','CL','Q'],
  iv_bolus_2comp_mm:       ['D','Vc','Vp','Vmax','Km','Q'],
  iv_inf_2comp_linear:     ['D','Vc','Vp','CL','Q','Tinf'],
  iv_inf_2comp_mm:         ['D','Vc','Vp','Vmax','Km','Q','Tinf'],
}

const PARAM_META = {
  D:    { label: 'Dose (D)',              unit: 'mg',   min: 0.001, max: 5000, step: 0.001, default: 500,  hint: '0.001 – 5000 mg' },
  F:    { label: 'Bioavailability (F)',  unit: '',     min: 0.01,  max: 1.0,  step: 0.01,  default: 0.8,  hint: '0.01 – 1.0' },
  Vd:   { label: 'Volume of dist (Vd)', unit: 'L',    min: 0.1,   max: 1000, step: 0.1,   default: 35,   hint: '0.1 – 1000 L' },
  CL:   { label: 'Clearance (CL)',       unit: 'L/h',  min: 0.001, max: 300,  step: 0.001, default: 4,    hint: '0.001 – 300 L/h' },
  ka:   { label: 'Absorption rate (ka)', unit: 'h⁻¹',  min: 0.01,  max: 10,   step: 0.01,  default: 1.2,  hint: '0.01 – 10 h⁻¹' },
  Tinf: { label: 'Infusion duration',    unit: 'h',    min: 0.01,  max: 48,   step: 0.01,  default: 1,    hint: '0.01 – 48 h' },
  tau:  { label: 'Dosing interval (τ)',  unit: 'h',    min: 0.5,   max: 168,  step: 0.5,   default: 8,    hint: '0.5 – 168 h' },
  Vc:   { label: 'Central volume (Vc)', unit: 'L',    min: 0.1,   max: 500,  step: 0.1,   default: 10,   hint: '0.1 – 500 L' },
  Vp:   { label: 'Peripheral vol (Vp)', unit: 'L',    min: 0.1,   max: 1000, step: 0.1,   default: 40,   hint: '0.1 – 1000 L' },
  Q:    { label: 'Intercomp CL (Q)',     unit: 'L/h',  min: 0.001, max: 100,  step: 0.001, default: 2,    hint: '0.001 – 100 L/h' },
  Vmax: { label: 'Vmax',                 unit: 'mg/h', min: 0.001, max: 1000, step: 0.001, default: 20,   hint: 'Max elimination rate' },
  Km:   { label: 'Km',                   unit: 'mg/L', min: 0.001, max: 500,  step: 0.001, default: 10,   hint: 'Conc at ½ Vmax' },
}

const SLIDER_META = {
  D:    { min: 0.1,   max: 2000, step: 0.1   },
  F:    { min: 0.01,  max: 1.0,  step: 0.01  },
  Vd:   { min: 0.1,   max: 300,  step: 0.1   },
  CL:   { min: 0.001, max: 30,   step: 0.001 },
  ka:   { min: 0.01,  max: 5,    step: 0.01  },
  Tinf: { min: 0.01,  max: 24,   step: 0.01  },
  tau:  { min: 0.5,   max: 48,   step: 0.5   },
  Vc:   { min: 0.1,   max: 100,  step: 0.1   },
  Vp:   { min: 0.1,   max: 300,  step: 0.1   },
  Q:    { min: 0.001, max: 50,   step: 0.001 },
  Vmax: { min: 0.1,   max: 500,  step: 0.1   },
  Km:   { min: 0.01,  max: 100,  step: 0.01  },
}

function buildParams(modelKey, overrides = {}) {
  const keys = MODEL_PARAMS[modelKey] ?? []
  const base = {}
  keys.forEach(p => { base[p] = overrides[p] ?? PARAM_META[p].default })
  return base
}

function getFullParams(modelKey, params) {
  const full  = { ...params }
  const isMM  = modelKey.endsWith('_mm')
  const isInf = modelKey.includes('inf')
  const isMulti = modelKey.includes('multi')

  if (!isMM) {
    if (full.CL && full.Vd && !full.ke) full.ke = calcKe(full.CL, full.Vd)
    if (full.CL && full.Vc && !full.ke) full.ke = calcKe(full.CL, full.Vc)
  }
  if (isInf) full.R0 = full.D / full.Tinf

  // Estimate tEnd
  let thalf
  if (isMM) {
    const Vd  = full.Vd ?? full.Vc ?? 35
    const ke0 = (full.Vmax ?? 20) / ((full.Km ?? 10) * Vd)
    thalf = Math.LN2 / Math.max(ke0, 0.01)
  } else {
    const ke = full.ke ?? full.k10 ?? 0.1
    thalf = Math.LN2 / ke
  }
  full.tEnd = isMulti
    ? Math.max((full.tau ?? 8) * 7, thalf * 5)
    : Math.max(thalf * 7, 1)

  return full
}

function sampleLogNormal(mean, cvPercent) {
  const cv     = cvPercent / 100
  const omega2 = Math.log(cv * cv + 1)
  const u1     = Math.max(Math.random(), 1e-10)
  const u2     = Math.random()
  const eta    = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean * Math.exp(eta * Math.sqrt(omega2) - omega2 / 2)
}

function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)]
}

function Section({ title, enabled, onToggle, children }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '12px 16px', background: enabled ? 'rgba(42,111,219,0.15)' : '#0f1629', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: enabled ? '#93b4f7' : 'rgba(240,244,255,0.7)' }}>
        <span>{title}</span>
        <span style={{ fontSize: '18px', color: 'rgba(240,244,255,0.3)', display: 'inline-block', transform: enabled ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>›</span>
      </button>
      {enabled && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0f1629' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function PopSlider({ label, value, setValue, min, max, step, suffix }) {
  const [raw, setRaw] = useState(String(value))
  useEffect(() => { setRaw(String(value)) }, [value])
  return (
    <div style={{ background: '#0f1629', borderRadius: '8px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.8)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <input type="number" value={raw} min={min} max={max} step={step}
          onChange={e => { setRaw(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) setValue(n) }}
          onBlur={() => { const n = parseFloat(raw); if (isNaN(n)) { setRaw(String(value)); return } const c = Math.min(Math.max(n, min), max); setValue(c); setRaw(String(c)) }}
          style={{ width: '72px', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: '600', color: '#f0f4ff', textAlign: 'right', background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.3)' }}>{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={e => setValue(suffix === '' ? parseInt(e.target.value) : parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#2563eb' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(240,244,255,0.2)', marginTop: '2px' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

export default function Calculator() {
  const [route,     setRoute]     = useState('oral')
  const [comp,      setComp]      = useState('1comp')
  const [clMode,    setClMode]    = useState('linear')
  const [params,    setParams]    = useState(() => buildParams('oral_1comp_linear'))
  const [metrics,   setMetrics]   = useState(null)
  const [curve,     setCurve]     = useState([])
  const [timeScale, setTimeScale] = useState(8)
  const [computing, setComputing] = useState(false)

  const [showTW,  setShowTW]  = useState(false)
  const [showPop, setShowPop] = useState(false)
  const [mec, setMec]         = useState('')
  const [mtc, setMtc]         = useState('')

  const [showCmax,     setShowCmax]     = useState(false)
  const [showTmax,     setShowTmax]     = useState(false)
  const [showAUC,      setShowAUC]      = useState(false)
  const [showCss,      setShowCss]      = useState(false)
  const [showHalfLife, setShowHalfLife] = useState(false)

  const [cvVd,      setCvVd]      = useState(30)
  const [cvCL,      setCvCL]      = useState(30)
  const [cvKa,      setCvKa]      = useState(40)
  const [nSubjects, setNSubjects] = useState(50)
  const [popCurves, setPopCurves] = useState([])

  const [explanation,        setExplanation]        = useState(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  const [rawParams, setRawParams] = useState(() => {
    const r = {}
    MODEL_PARAMS['oral_1comp_linear'].forEach(p => { r[p] = String(PARAM_META[p].default) })
    return r
  })

  const canvasRef    = useRef(null)
  const metricsRef   = useRef(null)
  const curveRef     = useRef([])
  const popCurvesRef = useRef([])
  const overlayRef   = useRef({})
  const stateRef     = useRef({ timeScale: 8 })

  const modelKey  = buildModelKey(route, comp, clMode)
  const paramKeys = MODEL_PARAMS[modelKey] ?? []
  const isMM      = clMode === 'mm'
  const hasKa     = paramKeys.includes('ka')

  useEffect(() => {
    overlayRef.current = { mec, mtc, showCmax, showTmax, showAUC, showCss, showHalfLife }
    stateRef.current   = { timeScale }
  }, [mec, mtc, showCmax, showTmax, showAUC, showCss, showHalfLife, timeScale])

  useEffect(() => {
    if (!VALID_MODELS.has(modelKey)) return
    setComputing(true)
    setTimeout(() => {
      try {
        const full   = getFullParams(modelKey, params)
        const points = generateCurve(modelKey, full)
        const m      = calcMetrics(modelKey, full)
        metricsRef.current = m
        curveRef.current   = points
        setCurve(points)
        setMetrics(m)
        setExplanation(null)
        setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
      } catch (e) { console.error('Compute error:', e) }
      finally { setComputing(false) }
    }, 10)
  }, [modelKey, params])

  useEffect(() => {
    if (showPop) {
      generatePopulation(getFullParams(modelKey, params))
    } else {
      popCurvesRef.current = []
      setPopCurves([])
      setTimeout(() => { if (canvasRef.current) drawCanvas() }, 0)
    }
  }, [showPop, cvVd, cvCL, cvKa, nSubjects, modelKey, params])

  useEffect(() => {
    if (curveRef.current.length > 0 && canvasRef.current) drawCanvas()
  }, [popCurves, mec, mtc, showCmax, showTmax, showAUC, showCss, showHalfLife, timeScale])

  function generatePopulation(fullParams) {
    const fp = fullParams
    const n  = Math.min(Math.max(nSubjects, 2), 200)
    const curves = []
    for (let i = 0; i < n; i++) {
      const pv = { ...fp }
      if (fp.Vd)   pv.Vd   = sampleLogNormal(fp.Vd,   cvVd)
      if (fp.Vc)   pv.Vc   = sampleLogNormal(fp.Vc,   cvVd)
      if (fp.Vp)   pv.Vp   = sampleLogNormal(fp.Vp,   cvVd)
      if (fp.CL)   pv.CL   = sampleLogNormal(fp.CL,   cvCL)
      if (fp.Q)    pv.Q    = sampleLogNormal(fp.Q,    cvCL)
      if (fp.Vmax) pv.Vmax = sampleLogNormal(fp.Vmax, cvCL)
      if (fp.ka)   pv.ka   = sampleLogNormal(fp.ka,   cvKa)
      if (pv.CL && pv.Vd) pv.ke = pv.CL / pv.Vd
      if (pv.CL && pv.Vc) pv.ke = pv.CL / pv.Vc
      if (fp.R0) pv.R0 = pv.D / pv.Tinf
      try { curves.push(generateCurve(modelKey, pv)) } catch (e) {}
    }
    popCurvesRef.current = curves
    setPopCurves(curves)
  }

  function drawCanvas(exportCtx = null, exportW = 0, exportH = 0) {
    const canvas = canvasRef.current
    if (!canvas && !exportCtx) return
    const m    = metricsRef.current
    const pts  = curveRef.current
    const popc = popCurvesRef.current
    const ov   = overlayRef.current
    const ts   = stateRef.current.timeScale
    if (!pts || pts.length === 0) return

    let ctx, W, H
    if (exportCtx) {
      ctx = exportCtx; W = exportW; H = exportH
    } else {
      const dpr = window.devicePixelRatio || 1
      W = canvas.offsetWidth; H = canvas.offsetHeight
      if (W === 0 || H === 0) return
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
    }

    const pad = { top: 32, right: 28, bottom: 48, left: 68 }
    const cW  = W - pad.left - pad.right
    const cH  = H - pad.top  - pad.bottom

    const mecVal = parseFloat(ov.mec) || null
    const mtcVal = parseFloat(ov.mtc) || null

    const allConcs = [
      ...pts.map(p => p.c),
      ...(popc.length ? popc.flatMap(c => c.map(p => p.c)) : [])
    ].filter(v => isFinite(v) && v >= 0)

    const p97    = percentile(allConcs, 97)
    const rawMax = Math.max(p97 * 1.2, mecVal ? mecVal * 1.3 : 0, mtcVal ? mtcVal * 1.3 : 0, 1)
    const mag    = Math.pow(10, Math.floor(Math.log10(rawMax)))
    const maxC   = Math.ceil(rawMax / (mag * 0.5)) * (mag * 0.5)
    const maxT   = pts[pts.length - 1].t

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const nYTicks = 6
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 1
    for (let i = 0; i <= nYTicks; i++) {
      const y = pad.top + (i / nYTicks) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }
    for (let i = 0; i <= ts; i++) {
      const x = pad.left + (i / ts) * cW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    }

    const fs = exportCtx ? '14px' : '11px'
    ctx.fillStyle = '#374151'
    ctx.font = fs + ' sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= nYTicks; i++) {
      const val = maxC * (1 - i / nYTicks)
      ctx.fillText(val < 0.01 ? val.toExponential(1) : val.toFixed(val < 1 ? 2 : 1), pad.left - 8, pad.top + (i / nYTicks) * cH + 4)
    }
    ctx.textAlign = 'center'
    for (let i = 0; i <= ts; i++) {
      const val = maxT * i / ts
      ctx.fillText((val < 1 ? val.toFixed(1) : val.toFixed(0)) + 'h', pad.left + (i / ts) * cW, pad.top + cH + 20)
    }
    ctx.save()
    ctx.translate(16, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('Concentration (mg/L)', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.fillText('Time (h)', pad.left + cW / 2, H - 8)
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    const xS = x => pad.left + (x / maxT) * cW
    const yS = y => pad.top  + cH - (Math.min(Math.max(y, 0), maxC) / maxC) * cH

    // Population
    if (popc.length) {
      ctx.globalAlpha = 0.12; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = exportCtx ? 1.5 : 1
      popc.forEach(pc => {
        ctx.beginPath()
        pc.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
        ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    // AUC shading
    if (ov.showAUC) {
      ctx.globalAlpha = 0.1; ctx.fillStyle = '#2563eb'
      ctx.beginPath()
      ctx.moveTo(xS(pts[0].t), yS(0))
      pts.forEach(p => ctx.lineTo(xS(p.t), yS(p.c)))
      ctx.lineTo(xS(pts[pts.length-1].t), yS(0))
      ctx.closePath(); ctx.fill()
      ctx.globalAlpha = 1
    }

    // MEC
    if (mecVal && mecVal > 0 && mecVal <= maxC * 1.05) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = exportCtx ? 2 : 1.5; ctx.setLineDash([6,4])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(mecVal)); ctx.lineTo(pad.left+cW, yS(mecVal)); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = '#f59e0b'; ctx.font = fs+' sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('MEC '+mecVal+' mg/L', pad.left+4, yS(mecVal)-4)
    }

    // MTC
    if (mtcVal && mtcVal > 0 && mtcVal <= maxC * 1.05) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = exportCtx ? 2 : 1.5; ctx.setLineDash([4,3])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(mtcVal)); ctx.lineTo(pad.left+cW, yS(mtcVal)); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = '#ef4444'; ctx.font = fs+' sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('MTC '+mtcVal+' mg/L', pad.left+4, yS(mtcVal)-4)
    }
    ctx.setLineDash([])

    // t½ lines
    if (ov.showHalfLife && m) {
      const drawHL = (thl, label, color) => {
        if (!thl || thl <= 0) return
        const lx = xS(thl)
        if (lx <= pad.left || lx >= pad.left + cW) return
        ctx.strokeStyle = color; ctx.lineWidth = exportCtx ? 2 : 1.5; ctx.setLineDash([4,3])
        ctx.beginPath(); ctx.moveTo(lx, pad.top); ctx.lineTo(lx, pad.top+cH); ctx.stroke()
        ctx.setLineDash([]); ctx.fillStyle = color; ctx.font = fs+' sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(label, lx, pad.top+14)
      }
      if (m.thalf_alpha) {
        drawHL(m.thalf_alpha, 't½α='+m.thalf_alpha+'h', '#8b5cf6')
        drawHL(m.thalf_beta,  't½β='+m.thalf_beta+'h',  '#6d28d9')
      } else {
        drawHL(m.thalf, (m.mmNote ? 't½(app)=' : 't½=')+m.thalf+'h', '#8b5cf6')
      }
    }

    // Tmax
    if (ov.showTmax && m && m.tmax > 0) {
      const lx = xS(m.tmax)
      if (lx > pad.left && lx < pad.left+cW) {
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = exportCtx ? 2 : 1.5; ctx.setLineDash([4,3])
        ctx.beginPath(); ctx.moveTo(lx, pad.top); ctx.lineTo(lx, pad.top+cH); ctx.stroke()
        ctx.setLineDash([]); ctx.fillStyle = '#10b981'; ctx.font = fs+' sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('Tmax='+m.tmax+'h', lx, pad.top+14)
      }
    }

    // Main curve
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = exportCtx ? 3 : 2.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Cmax dot
    if (ov.showCmax && m) {
      const cx = xS(m.tmax); const cy = yS(m.cmax)
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(cx, cy, exportCtx ? 7 : 5, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#111827'; ctx.font = (exportCtx ? 'bold 13px' : 'bold 11px')+' sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Cmax '+m.cmax+' mg/L', cx, cy-(exportCtx ? 14 : 10))
    }

    // Css
    if (ov.showCss && m?.css) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = exportCtx ? 2 : 1.5; ctx.setLineDash([6,3])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(m.css)); ctx.lineTo(pad.left+cW, yS(m.css)); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = '#92400e'; ctx.font = fs+' sans-serif'; ctx.textAlign = 'right'
      ctx.fillText('Css '+m.css+' mg/L', pad.left+cW-4, yS(m.css)-4)
    }

    // Annotations
    if (!exportCtx) {
      ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
      if (m?.flipFlop) {
        ctx.fillStyle = '#f59e0b'
        ctx.fillText('⚠ Flip-flop: ke > ka', pad.left+cW-4, pad.top+cH-6)
      }
      if (m?.mmNote) {
        ctx.fillStyle = '#8b5cf6'
        ctx.fillText('MM kinetics — metrics concentration-dependent', pad.left+cW-4, pad.top+cH-6)
      }
    }
  }

  function exportGraph() {
    const scale = 3
    const W = canvasRef.current?.offsetWidth  ?? 900
    const H = canvasRef.current?.offsetHeight ?? 400
    const off = document.createElement('canvas')
    off.width = W * scale; off.height = H * scale
    const ctx = off.getContext('2d')
    ctx.scale(scale, scale)
    drawCanvas(ctx, W, H)
    const link = document.createElement('a')
    link.download = 'pharmlab-pk-curve.png'
    link.href = off.toDataURL('image/png', 1.0)
    link.click()
  }

  function switchModel(newRoute, newComp, newCl) {
    const key    = buildModelKey(newRoute, newComp, newCl)
    const valid  = VALID_MODELS.has(key)
    const finalKey = valid ? key : buildModelKey(newRoute, newComp, 'linear')
    const finalCl  = valid ? newCl : 'linear'
    const newP   = buildParams(finalKey)
    const newRaw = {}
    MODEL_PARAMS[finalKey].forEach(p => { newRaw[p] = String(newP[p]) })
    setRoute(newRoute); setComp(newComp); setClMode(finalCl)
    setParams(newP); setRawParams(newRaw)
    setPopCurves([]); popCurvesRef.current = []; setExplanation(null)
  }

  function handleParamChange(key, val) {
    setRawParams(prev => ({ ...prev, [key]: val }))
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) setParams(prev => ({ ...prev, [key]: num }))
  }

  function handleParamBlur(key) {
    const num  = parseFloat(rawParams[key])
    const meta = PARAM_META[key]
    if (isNaN(num)) { setRawParams(prev => ({ ...prev, [key]: String(params[key]) })); return }
    const clamped = Math.min(Math.max(num, meta.min), meta.max)
    setParams(prev => ({ ...prev, [key]: clamped }))
    setRawParams(prev => ({ ...prev, [key]: String(clamped) }))
  }

  async function getExplanation() {
    setLoadingExplanation(true)
    try {
      const full = getFullParams(modelKey, params)
      const res  = await fetch('/api/explain-pk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelType: modelKey, params: full, metrics })
      })
      setExplanation(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoadingExplanation(false) }
  }

  const mecVal      = parseFloat(mec) || null
  const mtcVal      = parseFloat(mtc) || null
  const statusColor = !metrics ? '#6b7280'
    : mtcVal && metrics.cmax > mtcVal ? '#ef4444'
    : mecVal && metrics.cmax < mecVal ? '#f59e0b'
    : mecVal && mtcVal ? '#22c55e' : '#6b7280'
  const statusText  = !metrics ? ''
    : mtcVal && metrics.cmax > mtcVal ? 'Toxic — Cmax exceeds MTC'
    : mecVal && metrics.cmax < mecVal ? 'Sub-therapeutic — Cmax below MEC'
    : mecVal && mtcVal ? 'Therapeutic window maintained' : ''

  const validComps = VALID_COMPARTMENTS[route] ?? ['1comp']

  const highlights = [
    { key: 'cmax',     label: 'Cmax',     state: showCmax,     set: setShowCmax,     color: '#ef4444' },
    { key: 'tmax',     label: 'Tmax',     state: showTmax,     set: setShowTmax,     color: '#10b981' },
    { key: 'auc',      label: 'AUC area', state: showAUC,      set: setShowAUC,      color: '#2563eb' },
    { key: 'halflife', label: 't½ line',  state: showHalfLife, set: setShowHalfLife, color: '#8b5cf6' },
    ...(metrics?.css != null ? [{ key: 'css', label: 'Css', state: showCss, set: setShowCss, color: '#f59e0b' }] : []),
  ]

  const btn = (active, disabled = false) => ({
    padding: '7px 14px', borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px', fontWeight: active ? '600' : '400',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    background: active ? 'rgba(42,111,219,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? '#93b4f7' : disabled ? 'rgba(255,255,255,0.15)' : 'rgba(240,244,255,0.65)',
    opacity: disabled ? 0.45 : 1,
  })

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input[type=range] { accent-color: #2a6fdb; } input::placeholder { color: rgba(240,244,255,0.25); }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#f0f4ff' }}>PK/PD Calculator</h1>
      <p style={{ color: 'rgba(240,244,255,0.45)', fontSize: '14px', marginBottom: '1.5rem' }}>
        Linear models use closed-form equations. Non-linear (MM) and 2-compartment models use RK4 numerical integration.
      </p>

      {/* Model selector */}
      <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '1.25rem' }}>

        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route of administration</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ROUTES.map(r => (
              <button key={r.key} onClick={() => switchModel(r.key, comp, clMode)} style={btn(route === r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compartmental model</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {COMPARTMENTS.map(c => {
              const disabled = !validComps.includes(c.key)
              return (
                <button key={c.key} onClick={() => !disabled && switchModel(route, c.key, clMode)} style={btn(comp === c.key, disabled)}>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clearance type</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CLEARANCE_MODES.map(cl => {
              const testKey  = buildModelKey(route, comp, cl.key)
              const disabled = !VALID_MODELS.has(testKey)
              return (
                <button key={cl.key} onClick={() => !disabled && switchModel(route, comp, cl.key)} style={btn(clMode === cl.key, disabled)}>
                  {cl.label}
                </button>
              )
            })}
          </div>
          {isMM && (
            <p style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '6px' }}>
              Non-linear kinetics active — curve computed via RK4. All metrics are concentration-dependent.
            </p>
          )}
        </div>
      </div>

      {/* Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '1.25rem' }}>
        {paramKeys.map(key => {
          const meta   = PARAM_META[key]
          const slider = SLIDER_META[key]
          return (
            <div key={key} style={{ background: '#0f1629', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>{meta.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="number" value={rawParams[key] ?? params[key]} min={meta.min} max={meta.max} step={meta.step}
                    onChange={e => handleParamChange(key, e.target.value)}
                    onBlur={() => handleParamBlur(key)}
                    style={{ width: '72px', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: '600', color: '#f0f4ff', textAlign: 'right', background: 'rgba(255,255,255,0.05)' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', minWidth: '36px' }}>{meta.unit}</span>
                </div>
              </div>
              <input type="range" min={slider.min} max={slider.max} step={slider.step}
                value={Math.min(Math.max(params[key] ?? slider.min, slider.min), slider.max)}
                onChange={e => handleParamChange(key, e.target.value)}
                style={{ width: '100%', accentColor: '#2563eb' }} />
              <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.2)', marginTop: '2px' }}>{meta.hint}</div>
            </div>
          )
        })}
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '320px', marginBottom: '10px' }}>
        {computing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,15,30,0.85)', borderRadius: '12px', zIndex: 10, fontSize: '13px', color: 'rgba(240,244,255,0.45)' }}>
            Computing...
          </div>
        )}
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: '#0f1629' }} />
      </div>

      {/* Graph controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '6px 12px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '500' }}>TIME TICKS</span>
          <input type="range" min={4} max={20} step={1} value={timeScale}
            onChange={e => setTimeScale(parseInt(e.target.value))}
            style={{ width: '80px', accentColor: '#2563eb' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.8)', minWidth: '20px' }}>{timeScale}</span>
        </div>
        <button onClick={exportGraph}
          style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.08)', color: '#f0f4ff', border: '1px solid rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
          ↓ Export PNG (3×)
        </button>
      </div>

      {/* Highlights */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem', padding: '10px 12px', background: '#0f1629', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '500', marginRight: '4px' }}>HIGHLIGHT</span>
        {highlights.map(h => (
          <button key={h.key} onClick={() => h.set(!h.state)}
            style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', border: `1.5px solid ${h.state ? h.color : '#e5e7eb'}`, background: h.state ? h.color+'18' : 'white', color: h.state ? h.color : '#6b7280', cursor: 'pointer', fontWeight: h.state ? '600' : '400' }}>
            {h.label}
          </button>
        ))}
      </div>

      {/* Status */}
      {statusText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: statusColor, fontWeight: '500' }}>{statusText}</span>
        </div>
      )}

      {/* Flip-flop notice */}
      {metrics?.flipFlop && (
        <div style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '8px', padding: '8px 14px', marginBottom: '1rem', fontSize: '13px', color: '#fdba74' }}>
          ⚠ <strong>Flip-flop kinetics detected</strong> — ke &gt; ka means elimination is faster than absorption, so absorption becomes the rate-limiting step. The terminal slope reflects ka, not ke. The displayed t½ is the absorption half-life — a common exam trap. Seen with extended-release formulations and poorly soluble compounds.
        </div>
      )}

      {/* MM notice */}
      {metrics?.mmNote && (
        <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '8px', padding: '8px 14px', marginBottom: '1rem', fontSize: '13px', color: '#c4b5fd' }}>
          ⚗ <strong>Michaelis-Menten (non-linear) kinetics</strong> — CL(C) = Vmax / (Km + C). At C &lt;&lt; Km: first-order (linear) behaviour. At C &gt;&gt; Km: zero-order (saturated enzyme) — constant elimination rate regardless of concentration. t½, AUC, and Cmax are all dose-dependent. Clinically critical for phenytoin, ethanol, and salicylate.
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '1.5rem' }}>
          {[
            ...(metrics.thalf_alpha ? [
              ['t½α (dist.)', metrics.thalf_alpha, 'h'],
              ['t½β (elim.)', metrics.thalf_beta,  'h'],
            ] : metrics.thalf != null ? [
              [metrics.mmNote ? 't½ (app.)' : 't½', metrics.thalf, 'h'],
            ] : []),
            ['Cmax', metrics.cmax,  'mg/L'],
            ['Tmax', metrics.tmax,  'h'],
            ['AUC∞', metrics.auc,   metrics.numerical ? 'mg·h/L *' : 'mg·h/L'],
            ...(metrics.css   != null ? [['Css',   metrics.css,   'mg/L']] : []),
            ...(metrics.alpha != null ? [['α',     metrics.alpha, 'h⁻¹']] : []),
            ...(metrics.beta  != null ? [['β',     metrics.beta,  'h⁻¹']] : []),
            ...(!metrics.mmNote && metrics.ke != null ? [['ke', metrics.ke, 'h⁻¹']] : []),
          ].filter(([, val]) => val != null && !isNaN(val) && isFinite(val)).map(([label, val, unit]) => (
            <div key={label} style={{ background: '#0f1629', borderRadius: '10px', padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#f0f4ff' }}>{val}</div>
              <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)' }}>{unit}</div>
            </div>
          ))}
          {metrics.numerical && (
            <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: 'rgba(240,244,255,0.3)' }}>* Numerically approximated from curve</div>
          )}
        </div>
      )}

      {/* Therapeutic Window */}
      <Section title="⚗️ Therapeutic Window" enabled={showTW} onToggle={() => setShowTW(!showTW)}>
        <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', marginBottom: '10px' }}>Set drug-specific MEC and MTC. Lines appear on the graph and status updates automatically.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.8)', display: 'block', marginBottom: '4px' }}>MEC — Minimum Effective Concentration (mg/L)</label>
            <input type="number" value={mec} onChange={e => setMec(e.target.value)} placeholder="e.g. 5" min="0"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', color: '#f0f4ff', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.8)', display: 'block', marginBottom: '4px' }}>MTC — Minimum Toxic Concentration (mg/L)</label>
            <input type="number" value={mtc} onChange={e => setMtc(e.target.value)} placeholder="e.g. 25" min="0"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', color: '#f0f4ff', boxSizing: 'border-box' }} />
          </div>
        </div>
      </Section>

      {/* Population PK */}
      <Section title="👥 Population PK Simulation" enabled={showPop} onToggle={() => setShowPop(!showPop)}>
        <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', marginBottom: '12px' }}>
          Log-normal IIV simulation. CV% for Vd applies to Vc and Vp. CV% for CL applies to CL, Q, and Vmax.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
          <PopSlider label="CV% for Vd / Vc / Vp" value={cvVd}      setValue={setCvVd}      min={1} max={100} step={0.5} suffix="%" />
          <PopSlider label="CV% for CL / Q / Vmax" value={cvCL}      setValue={setCvCL}      min={1} max={100} step={0.5} suffix="%" />
          {hasKa && <PopSlider label="CV% for ka"  value={cvKa}      setValue={setCvKa}      min={1} max={100} step={0.5} suffix="%" />}
          <PopSlider label="N subjects"             value={nSubjects} setValue={setNSubjects} min={2} max={200} step={1}   suffix=""  />
        </div>
        <button onClick={() => generatePopulation(getFullParams(modelKey, params))}
          style={{ padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
          Regenerate population
        </button>
        <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginTop: '8px', marginBottom: 0 }}>
          Individual curves semi-transparent. Solid line is the mean. Max 200 subjects.
        </p>
      </Section>



    </main>
  )
}