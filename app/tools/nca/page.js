'use client'
import { useState, useEffect, useRef, useMemo } from 'react'

// ─── NCA Math ─────────────────────────────────────────────────────

function parseData(raw) {
  const lines = raw.trim().split(/[\n\r]+/)
  const points = []
  for (const line of lines) {
    const parts = line.trim().split(/[\t,;]+/)
    if (parts.length < 2) continue
    const t = parseFloat(parts[0].replace(',', '.'))
    const c = parseFloat(parts[1].replace(',', '.'))
    if (!isNaN(t) && !isNaN(c) && c >= 0) points.push({ t, c })
  }
  return points.sort((a, b) => a.t - b.t)
}

// Linear-up / log-down trapezoidal AUC
function calcAUC(pts) {
  let auc = 0
  for (let i = 1; i < pts.length; i++) {
    const dt = pts[i].t - pts[i-1].t
    const c0 = pts[i-1].c
    const c1 = pts[i].c
    if (c1 <= c0 || c0 <= 0 || c1 <= 0) {
      // Linear trapezoid (ascending or zero)
      auc += 0.5 * (c0 + c1) * dt
    } else {
      // Log trapezoid (descending, both positive)
      auc += (c0 - c1) / Math.log(c0 / c1) * dt
    }
  }
  return auc
}

// AUMC (first moment) — linear trapezoidal
function calcAUMC(pts) {
  let aumc = 0
  for (let i = 1; i < pts.length; i++) {
    const dt   = pts[i].t   - pts[i-1].t
    const m0   = pts[i-1].t * pts[i-1].c
    const m1   = pts[i].t   * pts[i].c
    aumc += 0.5 * (m0 + m1) * dt
  }
  return aumc
}

// Log-linear regression on terminal points → λz
function calcLambdaZ(pts) {
  if (pts.length < 3) return null
  const n    = pts.length
  const lnC  = pts.map(p => Math.log(p.c))
  const t    = pts.map(p => p.t)
  const tBar = t.reduce((s, v) => s + v, 0) / n
  const lBar = lnC.reduce((s, v) => s + v, 0) / n
  const SXX  = t.reduce((s, v) => s + (v - tBar) ** 2, 0)
  const SXY  = t.reduce((s, v, i) => s + (v - tBar) * (lnC[i] - lBar), 0)
  const slope = SXY / SXX
  const intercept = lBar - slope * tBar

  // R²
  const SSres = lnC.reduce((s, v, i) => s + (v - (intercept + slope * t[i])) ** 2, 0)
  const SStot = lnC.reduce((s, v) => s + (v - lBar) ** 2, 0)
  const r2    = 1 - SSres / SStot

  return {
    lambdaZ:   -slope,         // positive value
    intercept: Math.exp(intercept),
    slope,
    r2:        Math.max(0, r2),
  }
}

function calcNCA(pts, dose, nTerminal, route) {
  if (!pts.length) return null

  // Cmax / Tmax
  const cmaxPt = pts.reduce((best, p) => p.c > best.c ? p : best, pts[0])
  const cmax   = cmaxPt.c
  const tmax   = cmaxPt.t

  // AUC0-t (all points)
  const auc0t  = calcAUC(pts)

  // Terminal regression
  // Use last nTerminal points, must be in declining phase
  const lastPts = pts.slice(-Math.min(nTerminal, pts.length))
  const termReg = calcLambdaZ(lastPts)

  let auc0inf = null, thalf = null, vdF = null, clF = null, mrt = null

  if (termReg && termReg.lambdaZ > 0) {
    const { lambdaZ } = termReg
    const clast = pts[pts.length - 1].c
    const tlast = pts[pts.length - 1].t
    const aucExtrapolated = clast / lambdaZ
    auc0inf = auc0t + aucExtrapolated
    thalf   = Math.LN2 / lambdaZ

    if (dose > 0) {
      clF  = dose / auc0inf
      vdF  = clF / lambdaZ
    }

    // MRT
    const aumc0t  = calcAUMC(pts)
    const aumcExt = clast * tlast / lambdaZ + clast / lambdaZ ** 2
    const aumc0inf = aumc0t + aumcExt
    mrt = aumc0inf / auc0inf
    if (route === 'oral') mrt = mrt - (1 / lambdaZ) // subtract MAT approximation
  }

  const pctExtrap = auc0inf ? ((auc0inf - auc0t) / auc0inf * 100) : null

  return {
    cmax:        +cmax.toFixed(4),
    tmax:        +tmax.toFixed(3),
    auc0t:       +auc0t.toFixed(4),
    auc0inf:     auc0inf  != null ? +auc0inf.toFixed(4)  : null,
    thalf:       thalf    != null ? +thalf.toFixed(3)    : null,
    lambdaZ:     termReg  ? +termReg.lambdaZ.toFixed(5)  : null,
    r2:          termReg  ? +termReg.r2.toFixed(4)       : null,
    r2adj:       termReg  ? +(1 - (1 - termReg.r2) * (nTerminal - 1) / (nTerminal - 2)).toFixed(4) : null,
    vdF:         vdF      != null ? +vdF.toFixed(3)      : null,
    clF:         clF      != null ? +clF.toFixed(4)      : null,
    mrt:         mrt      != null ? +mrt.toFixed(3)      : null,
    pctExtrap:   pctExtrap != null ? +pctExtrap.toFixed(1) : null,
    terminalPts: lastPts,
    termReg,
  }
}

// ─── Canvas ───────────────────────────────────────────────────────

function NCACanvas({ pts, result, nTerminal, logScale }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pts?.length) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    if (!W || !H) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad  = { top: 24, right: 24, bottom: 44, left: 68 }
    const cW   = W - pad.left - pad.right
    const cH   = H - pad.top  - pad.bottom

    const maxT = Math.max(...pts.map(p => p.t)) * 1.05
    const rawMaxC = Math.max(...pts.map(p => p.c))
    const maxC = logScale ? rawMaxC * 3 : rawMaxC * 1.15
    const minC = logScale ? Math.min(...pts.filter(p => p.c > 0).map(p => p.c)) * 0.5 : 0

    const xS = t => pad.left + (t / maxT) * cW
    const yS = c => {
      if (logScale) {
        if (c <= 0) return pad.top + cH
        const logMin = Math.log10(minC)
        const logMax = Math.log10(maxC)
        return pad.top + cH - ((Math.log10(c) - logMin) / (logMax - logMin)) * cH
      }
      return pad.top + cH - (Math.min(c, maxC) / maxC) * cH
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
    const nY = 5
    for (let i = 0; i <= nY; i++) {
      const y = pad.top + (i / nY) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }
    const nX = 6
    for (let i = 0; i <= nX; i++) {
      const x = pad.left + (i / nX) * cW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    }

    // Y-axis labels
    ctx.fillStyle = '#374151'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    for (let i = 0; i <= nY; i++) {
      let val
      if (logScale) {
        const logMin = Math.log10(minC)
        const logMax = Math.log10(maxC)
        val = Math.pow(10, logMin + (1 - i/nY) * (logMax - logMin))
      } else {
        val = maxC * (1 - i/nY)
      }
      const label = val < 0.001 ? val.toExponential(1) : val < 1 ? val.toFixed(3) : val.toFixed(1)
      ctx.fillText(label, pad.left - 4, pad.top + (i/nY)*cH + 3)
    }

    // X-axis labels
    ctx.textAlign = 'center'
    for (let i = 0; i <= nX; i++) {
      ctx.fillText((maxT * i / nX).toFixed(1) + 'h', pad.left + (i/nX)*cW, pad.top + cH + 16)
    }

    // Axis titles
    ctx.save()
    ctx.translate(12, pad.top + cH/2)
    ctx.rotate(-Math.PI/2)
    ctx.textAlign = 'center'; ctx.font = '10px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('Concentration', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.fillStyle = '#374151'
    ctx.fillText('Time (h)', pad.left + cW/2, H - 6)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // AUC shading
    if (result) {
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#2563eb'
      ctx.beginPath()
      ctx.moveTo(xS(pts[0].t), yS(logScale ? Math.max(pts[0].c, minC) : 0))
      pts.forEach(p => ctx.lineTo(xS(p.t), yS(logScale ? Math.max(p.c, minC) : p.c)))
      ctx.lineTo(xS(pts[pts.length-1].t), yS(logScale ? minC : 0))
      ctx.closePath(); ctx.fill()
      ctx.globalAlpha = 1
    }

    // Terminal regression line
    if (result?.termReg && result.terminalPts?.length >= 2) {
      const { slope, intercept: intRaw } = result.termReg
      // intercept is already exp'd — use original
      const logIntercept = Math.log(intRaw)
      const tFirst = result.terminalPts[0].t
      const tLast  = pts[pts.length-1].t * 1.15
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3])
      ctx.beginPath()
      ;[tFirst, tLast].forEach((t, i) => {
        const c = Math.exp(logIntercept + slope * t)
        if (i === 0) ctx.moveTo(xS(t), yS(c))
        else ctx.lineTo(xS(t), yS(c))
      })
      ctx.stroke(); ctx.setLineDash([])
    }

    // Highlight terminal points
    if (result?.terminalPts) {
      result.terminalPts.forEach(p => {
        ctx.fillStyle = '#ef4444'
        ctx.beginPath(); ctx.arc(xS(p.t), yS(p.c), 5, 0, Math.PI*2); ctx.fill()
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(xS(p.t), yS(p.c), 5, 0, Math.PI*2); ctx.stroke()
      })
    }

    // Main curve
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    ctx.beginPath()
    pts.forEach((p, i) => {
      const y = yS(logScale ? Math.max(p.c, minC*0.1) : p.c)
      i === 0 ? ctx.moveTo(xS(p.t), y) : ctx.lineTo(xS(p.t), y)
    })
    ctx.stroke()

    // Data points (non-terminal)
    const terminalSet = new Set(result?.terminalPts?.map(p => p.t) ?? [])
    pts.filter(p => !terminalSet.has(p.t)).forEach(p => {
      ctx.fillStyle = '#2563eb'
      ctx.beginPath(); ctx.arc(xS(p.t), yS(logScale ? Math.max(p.c, minC*0.1) : p.c), 4, 0, Math.PI*2); ctx.fill()
    })

    // Cmax marker
    if (result) {
        const cx = xS(result.tmax)
        const cy = yS(logScale ? Math.max(result.cmax, minC*0.1) : result.cmax)
        ctx.fillStyle = '#10b981'
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill()
        ctx.fillStyle = '#111827'; ctx.font = 'bold 10px sans-serif'
        // Place label to the right if near left edge, otherwise above
        const labelX = cx + (cx < pad.left + cW * 0.4 ? 28 : 0)
        const labelY = cy + (cx < pad.left + cW * 0.4 ? 4 : -10)
        ctx.textAlign = cx < pad.left + cW * 0.4 ? 'left' : 'center'
        ctx.fillText('Cmax', labelX, labelY)
    }

    // Legend
    ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    const lx = pad.left + cW - 4
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(lx - 46, pad.top + 4, 12, 2)
    ctx.fillStyle = '#374151'
    ctx.fillText('Data', lx, pad.top + 8)
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.setLineDash([4,2])
    ctx.beginPath(); ctx.moveTo(lx - 46, pad.top + 16); ctx.lineTo(lx - 34, pad.top + 16); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#374151'
    ctx.fillText('λz fit', lx, pad.top + 19)

  }, [pts, result, nTerminal, logScale])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '300px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white' }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────

const EXAMPLE_DATA = `0\t0
0.25\t8.2
0.5\t14.1
1\t21.3
2\t18.7
3\t14.2
4\t10.8
6\t6.3
8\t3.7
12\t1.3
24\t0.18`

export default function NCAPage() {
  const [raw,        setRaw]        = useState(EXAMPLE_DATA)
  const [dose,       setDose]       = useState(100)
  const [route,      setRoute]      = useState('oral')
  const [nTerminal,  setNTerminal]  = useState(4)
  const [logScale,   setLogScale]   = useState(false)
  const [units,      setUnits]      = useState({ conc: 'ng/mL', time: 'h' })

  const pts    = useMemo(() => parseData(raw), [raw])
  const result = useMemo(() => pts.length >= 3 ? calcNCA(pts, dose, nTerminal, route) : null, [pts, dose, nTerminal, route])

  const maxTerminal = Math.max(3, pts.length - 1)

  const btn = active => ({
    padding: '5px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px',
    fontWeight: active ? '600' : '400',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    background: active ? '#eff6ff' : 'white',
    color: active ? '#1d4ed8' : '#374151',
  })

  const MetricCard = ({ label, value, unit, highlight, note }) => (
    <div style={{ background: highlight ? '#eff6ff' : '#f9fafb', border: `1px solid ${highlight ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '10px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: highlight ? '#1d4ed8' : '#111827' }}>
        {value != null ? value : <span style={{ color: '#d1d5db' }}>—</span>}
      </div>
      {unit && <div style={{ fontSize: '10px', color: '#9ca3af' }}>{unit}</div>}
      {note && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>{note}</div>}
    </div>
  )

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Non-Compartmental Analysis (NCA)</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Paste concentration-time data to calculate PK parameters without assuming a compartmental model. Uses linear-up/log-down trapezoidal AUC and log-linear terminal regression for λz.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>

        {/* ── Left: data entry ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Settings */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings</p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Route</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setRoute('iv')}   style={btn(route === 'iv')}>IV</button>
                <button onClick={() => setRoute('oral')} style={btn(route === 'oral')}>Oral / extravascular</button>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Dose (for CL/F and Vd/F)</label>
              <input type="number" value={dose} min={0} step={0.1}
                onChange={e => setDose(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>Set to 0 to skip CL/F and Vd/F</p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Terminal points for λz: <strong>{nTerminal}</strong>
                {result?.r2 != null && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: result.r2 >= 0.99 ? '#22c55e' : result.r2 >= 0.95 ? '#f59e0b' : '#ef4444', fontWeight: '600' }}>
                    R² = {result.r2}
                  </span>
                )}
              </label>
              <input type="range" min={3} max={Math.max(3, pts.length - 1)} step={1} value={Math.min(nTerminal, Math.max(3, pts.length - 1))}
                onChange={e => setNTerminal(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#2563eb' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db' }}>
                <span>3</span><span>{Math.max(3, pts.length - 1)}</span>
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Red points + dashed line show the terminal regression. Maximise R² while including only the true terminal phase.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="log-scale" checked={logScale} onChange={e => setLogScale(e.target.checked)}
                style={{ accentColor: '#2563eb', width: '14px', height: '14px' }} />
              <label htmlFor="log-scale" style={{ fontSize: '12px', color: '#374151', cursor: 'pointer' }}>
                Log scale (semi-log plot)
              </label>
            </div>
          </div>

          {/* Data paste */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Concentration-time data
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', lineHeight: '1.5' }}>
              Paste two columns from Excel — time (h) and concentration. Tab, comma, or semicolon separated. BQL values: enter 0.
            </p>
            <textarea
              value={raw}
              onChange={e => setRaw(e.target.value)}
              rows={14}
              style={{
                width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: '12px',
                padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db',
                resize: 'vertical', color: '#111827', background: 'white', boxSizing: 'border-box',
                lineHeight: '1.6',
              }}
              placeholder="0&#9;0&#10;0.5&#9;12.3&#10;1&#9;18.4&#10;2&#9;15.1&#10;..."
            />
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af' }}>
              <span>{pts.length} valid data points parsed</span>
              <button onClick={() => setRaw(EXAMPLE_DATA)}
                style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Load example
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {pts.length < 3 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '14px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              Enter at least 3 data points to calculate NCA parameters
            </div>
          ) : (
            <>
              {/* Graph */}
              <NCACanvas pts={pts} result={result} nTerminal={nTerminal} logScale={logScale} />

              {/* Primary metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <MetricCard label="Cmax"   value={result?.cmax}   unit="conc. units"   highlight />
                <MetricCard label="Tmax"   value={result?.tmax}   unit="h" />
                <MetricCard label="AUC₀₋ₜ" value={result?.auc0t}  unit="conc·h"        highlight />
              </div>

              {/* Terminal phase */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Terminal phase ({nTerminal} points)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <MetricCard label="λz"    value={result?.lambdaZ}  unit="h⁻¹" />
                  <MetricCard label="t½"    value={result?.thalf}    unit="h"   highlight />
                  <MetricCard label="R²"    value={result?.r2}       unit="(fit quality)"
                    note={result?.r2 != null && result.r2 < 0.95 ? 'R² < 0.95 — consider adjusting terminal points' : null} />
                </div>
              </div>

              {/* Extrapolated */}
              {result?.auc0inf != null && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <MetricCard label="AUC₀₋∞"   value={result.auc0inf}   unit="conc·h"   highlight />
                  <MetricCard label="% extrapolated" value={result.pctExtrap} unit="%"
                    note={result.pctExtrap > 20 ? '>20% — extrapolation unreliable' : null} />
                  <MetricCard label="MRT"       value={result.mrt}       unit="h" />
                </div>
              )}

              {/* CL/F and Vd/F */}
              {dose > 0 && result?.clF != null && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <MetricCard label={route === 'iv' ? 'CL' : 'CL/F'}   value={result.clF}  unit="L/h" highlight />
                  <MetricCard label={route === 'iv' ? 'Vd' : 'Vd/F'}   value={result.vdF}  unit="L" />
                </div>
              )}

              {/* Data table */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Parsed data — {pts.length} points
                </p>
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6' }}>
                        <th style={{ padding: '4px 8px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>#</th>
                        <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Time (h)</th>
                        <th style={{ padding: '4px 8px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Conc.</th>
                        <th style={{ padding: '4px 8px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>Terminal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pts.map((p, i) => {
                        const isTerminal = result?.terminalPts?.some(tp => tp.t === p.t)
                        return (
                          <tr key={i} style={{ background: isTerminal ? '#fff1f2' : 'transparent', borderTop: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '3px 8px', color: '#9ca3af' }}>{i+1}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontFamily: 'ui-monospace', color: '#374151' }}>{p.t}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontFamily: 'ui-monospace', color: '#374151' }}>{p.c}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                              {isTerminal && <span style={{ color: '#ef4444', fontSize: '14px' }}>●</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Method note */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
                <strong>Method:</strong> AUC₀₋ₜ by linear-up/log-down trapezoidal rule. λz by unweighted log-linear least-squares regression on selected terminal points. AUC₀₋∞ = AUC₀₋ₜ + Clast/λz. MRT = AUMC₀₋∞ / AUC₀₋∞{route === 'oral' ? ' − 1/λz (MAT correction)' : ''}.
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}