'use client'
import { useState, useEffect, useRef, useMemo } from 'react'

// ─── BE Math ──────────────────────────────────────────────────────

// t-distribution quantile (approximation, accurate enough for df > 2)
function tQuantile(p, df) {
  // Cornish-Fisher approximation for t-quantile
  // Accurate to 4 decimal places for df > 4
  if (df <= 0) return Infinity
  if (df === 1) return Math.tan(Math.PI * (p - 0.5))

  // Wilson-Hilferty transformation approximation
  const z = normalQuantile(p)
  const a = z * z
  return z
    + (z**3 + z)        / (4 * df)
    + (5*z**5 + 16*z**3 + 3*z) / (96 * df**2)
    + (3*z**7 + 19*z**5 + 17*z**3 - 15*z) / (384 * df**3)
}

function normalQuantile(p) {
  // Rational approximation (Beasley-Springer-Moro)
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  const a = [0, -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [0, -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00]

  const pLow  = 0.02425
  const pHigh = 1 - pLow

  let q, r
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
  } else if (p <= pHigh) {
    q = p - 0.5; r = q*q
    return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q /
           (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1)
  } else {
    q = Math.sqrt(-2 * Math.log(1-p))
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
  }
}

function calcBioequivalence(subjects, metric) {
  // subjects: [{test, reference}]
  // Calculates 90% CI using TOST on log-transformed data
  const n = subjects.length
  if (n < 3) return null

  const lnRatios = subjects.map(s => Math.log(s.test / s.reference))
  const meanLn   = lnRatios.reduce((a, b) => a + b, 0) / n
  const varLn    = lnRatios.reduce((s, v) => s + (v - meanLn)**2, 0) / (n - 1)
  const seLn     = Math.sqrt(varLn / n)
  const df       = n - 1

  // 90% CI (two-sided 90% = each side 5%, so t at 0.95)
  const tCrit = tQuantile(0.95, df)
  const ciLow  = Math.exp(meanLn - tCrit * seLn)
  const ciHigh = Math.exp(meanLn + tCrit * seLn)
  const gmr    = Math.exp(meanLn)

  // TOST p-values
  const tLow  = (meanLn - Math.log(0.80)) / seLn
  const tHigh = (Math.log(1.25) - meanLn) / seLn
  const pTOST = Math.min(tLow, tHigh)  // simplified

  const isBE = ciLow >= 0.80 && ciHigh <= 1.25

  return { n, gmr, ciLow, ciHigh, df, tCrit, seLn, meanLn, varLn, isBE, pTOST, metric }
}

function parseSubjects(raw) {
  const lines = raw.trim().split(/[\n\r]+/)
  const result = []
  for (const line of lines) {
    const parts = line.trim().split(/[\t,;]+/)
    if (parts.length < 2) continue
    const test = parseFloat(parts[0].replace(',', '.'))
    const ref  = parseFloat(parts[1].replace(',', '.'))
    if (!isNaN(test) && !isNaN(ref) && test > 0 && ref > 0) {
      result.push({ test, reference: ref })
    }
  }
  return result
}

// ─── CI Plot Canvas ───────────────────────────────────────────────

function CIPlot({ aucResult, cmaxResult }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    if (!W || !H) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0f1e'; ctx.fillRect(0, 0, W, H)

    const pad   = { top: 20, right: 40, bottom: 40, left: 80 }
    const cW    = W - pad.left - pad.right
    const cH    = H - pad.top  - pad.bottom

    // Scale: 60% to 140% of reference
    const xMin = 0.60; const xMax = 1.40
    const xS = v => pad.left + ((v - xMin) / (xMax - xMin)) * cW

    // Grid lines at key values
    const vLines = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.25, 1.3, 1.4]
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
    vLines.forEach(v => {
      if (v < xMin || v > xMax) return
      ctx.beginPath(); ctx.moveTo(xS(v), pad.top); ctx.lineTo(xS(v), pad.top + cH); ctx.stroke()
    })

    // X-axis labels
    ctx.fillStyle = 'rgba(240,244,255,0.4)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    vLines.forEach(v => {
      if (v < xMin || v > xMax) return
      ctx.fillText((v * 100).toFixed(0) + '%', xS(v), pad.top + cH + 16)
    })

    ctx.fillStyle = 'rgba(240,244,255,0.5)'; ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Ratio (Test / Reference)', pad.left + cW/2, H - 4)

    // Acceptance zone shading 80-125%
    ctx.fillStyle = 'rgba(22,163,74,0.08)'
    ctx.fillRect(xS(0.80), pad.top, xS(1.25) - xS(0.80), cH)

    // 80% and 125% boundary lines
    ;[[0.80, '#16a34a', '80%'], [1.25, '#16a34a', '125%']].forEach(([v, color, label]) => {
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4,3])
        ctx.beginPath(); ctx.moveTo(xS(v), pad.top + 20); ctx.lineTo(xS(v), pad.top + cH); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = color; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(label, xS(v), pad.top + 14)
    })

    // "Acceptance zone" label inside the green band
    ctx.fillStyle = '#15803d'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
    ctx.globalAlpha = 0.7
    ctx.fillText('Acceptance zone', xS(0.80) + 4, pad.top + cH - 8)
    ctx.globalAlpha = 1


    // Reference line at 100%
    ctx.strokeStyle = 'rgba(240,244,255,0.4)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(xS(1.0), pad.top + 20); ctx.lineTo(xS(1.0), pad.top + cH); ctx.stroke()
    ctx.fillStyle = 'rgba(240,244,255,0.6)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('100%', xS(1.0), pad.top + 14)

    // Draw CI bars
    const rows = [
      aucResult  && { result: aucResult,  label: 'AUC',  y: pad.top + cH * 0.30, color: aucResult.isBE  ? '#2563eb' : '#ef4444' },
      cmaxResult && { result: cmaxResult, label: 'Cmax', y: pad.top + cH * 0.68, color: cmaxResult.isBE ? '#2563eb' : '#ef4444' },
    ].filter(Boolean)

    rows.forEach(row => {
      const { result: r, label, y, color } = row
      const xLow  = Math.max(xS(r.ciLow),  xS(xMin))
      const xHigh = Math.min(xS(r.ciHigh), xS(xMax))
      const xGMR  = xS(r.gmr)

      // Row label
      ctx.fillStyle = 'rgba(240,244,255,0.7)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(label, pad.left - 8, y + 4)

      // CI bar
      ctx.fillStyle = color + '33'
      ctx.fillRect(xLow, y - 10, xHigh - xLow, 20)
      ctx.strokeStyle = color; ctx.lineWidth = 2
      ctx.strokeRect(xLow, y - 10, xHigh - xLow, 20)

      // Whiskers
      ctx.lineWidth = 2
      ;[xLow, xHigh].forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke()
      })

      // GMR diamond
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(xGMR, y - 8)
      ctx.lineTo(xGMR + 8, y)
      ctx.lineTo(xGMR, y + 8)
      ctx.lineTo(xGMR - 8, y)
      ctx.closePath(); ctx.fill()

      // GMR label
      ctx.fillStyle = 'rgba(240,244,255,0.8)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText((r.gmr * 100).toFixed(1) + '%', xGMR, y - 16)

      // CI values
      ctx.font = '9px sans-serif'; ctx.fillStyle = color
      ctx.textAlign = 'left';  ctx.fillText((r.ciLow  * 100).toFixed(1) + '%', xLow  - 24, y + 4)
      ctx.textAlign = 'right'; ctx.fillText((r.ciHigh * 100).toFixed(1) + '%', xHigh + 24, y + 4)

      // BE badge
      ctx.fillStyle = r.isBE ? '#16a34a' : '#dc2626'
      ctx.fillRect(pad.left + cW + 4, y - 10, 34, 20)
      ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(r.isBE ? 'PASS' : 'FAIL', pad.left + cW + 21, y + 4)
    })

  }, [aucResult, cmaxResult])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '240px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: '#0a0f1e' }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────

const EXAMPLE_AUC = `245.3\t231.8
312.1\t298.4
198.7\t205.2
267.4\t252.1
289.6\t278.3
223.8\t218.6
301.2\t287.9
256.7\t248.3
334.5\t319.7
218.9\t209.4`

const EXAMPLE_CMAX = `48.3\t45.1
61.2\t57.8
39.4\t41.2
52.7\t49.3
57.1\t54.6
44.8\t42.3
59.4\t55.9
50.2\t47.8
65.3\t61.4
43.7\t40.9`

export default function BioequivalencePage() {
  const [aucRaw,  setAucRaw]  = useState(EXAMPLE_AUC)
  const [cmaxRaw, setCmaxRaw] = useState(EXAMPLE_CMAX)
  const [showBoth, setShowBoth] = useState(true)

  const aucSubjects  = useMemo(() => parseSubjects(aucRaw),  [aucRaw])
  const cmaxSubjects = useMemo(() => parseSubjects(cmaxRaw), [cmaxRaw])

  const aucResult  = useMemo(() => calcBioequivalence(aucSubjects,  'AUC'),  [aucSubjects])
  const cmaxResult = useMemo(() => calcBioequivalence(cmaxSubjects, 'Cmax'), [cmaxSubjects])

  const overallBE = aucResult?.isBE && cmaxResult?.isBE

  const ResultRow = ({ label, value, good, bad }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'ui-monospace, monospace', color: good ? '#86efac' : bad ? '#fca5a5' : '#f0f4ff' }}>
        {value}
      </span>
    </div>
  )

  const DataPane = ({ label, raw, setRaw, result, example }) => (
    <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
        <button onClick={() => setRaw(example)}
          style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
          Load example
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginBottom: '6px' }}>
        Two columns: Test | Reference. One subject per row.
      </p>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={8}
        style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: '12px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', resize: 'vertical', boxSizing: 'border-box', background: '#060b18', color: '#f0f4ff', lineHeight: '1.6' }} />
      <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginTop: '4px' }}>{result?.n ?? 0} subjects parsed</p>

      {result && (
        <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${result.isBE ? 'rgba(22,163,74,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
          <ResultRow label="n subjects"          value={result.n} />
          <ResultRow label="GMR (Test/Reference)" value={(result.gmr * 100).toFixed(2) + '%'}
            good={result.gmr >= 0.9 && result.gmr <= 1.1}
            bad={result.gmr < 0.8 || result.gmr > 1.25} />
          <ResultRow label="90% CI — lower"      value={(result.ciLow  * 100).toFixed(2) + '%'}
            good={result.ciLow  >= 0.80} bad={result.ciLow  < 0.80} />
          <ResultRow label="90% CI — upper"      value={(result.ciHigh * 100).toFixed(2) + '%'}
            good={result.ciHigh <= 1.25} bad={result.ciHigh > 1.25} />
          <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>BE decision</span>
            <span style={{ fontSize: '13px', fontWeight: '700', padding: '2px 12px', borderRadius: '999px', background: result.isBE ? '#16a34a' : '#dc2626', color: 'white' }}>
              {result.isBE ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } textarea::placeholder { color: rgba(240,244,255,0.25); }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Bioequivalence Analyser</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        Calculates 90% confidence intervals using the TOST (Two One-Sided t-Tests) procedure on log-transformed AUC and Cmax data. FDA/EMA standard: both 90% CIs must fall within 80.00–125.00% for bioequivalence.
      </p>

      <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 16px', marginBottom: '1.5rem', fontSize: '12px', color: 'rgba(240,244,255,0.65)', lineHeight: '1.6' }}>
        <strong>Study design assumption:</strong> This tool assumes a standard 2×2 crossover design — each subject receives both test and reference formulations. Enter matched pairs (same subject, Test vs Reference). For parallel design studies, the calculation differs.
      </div>

      {/* Overall verdict */}
      {aucResult && cmaxResult && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px', marginBottom: '1.5rem',
          background: overallBE ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
          border: `2px solid ${overallBE ? 'rgba(22,163,74,0.6)' : 'rgba(239,68,68,0.6)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: overallBE ? '#86efac' : '#fca5a5' }}>
              {overallBE ? '✓ Bioequivalent' : '✗ Not bioequivalent'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', marginTop: '2px' }}>
              {overallBE
                ? 'Both AUC and Cmax 90% CIs fall within the 80–125% acceptance zone'
                : 'One or both parameters fail the 80–125% acceptance criterion'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[['AUC', aucResult], ['Cmax', cmaxResult]].map(([label, r]) => (
              <div key={label} style={{ textAlign: 'center', padding: '6px 12px', background: r.isBE ? '#16a34a' : '#dc2626', borderRadius: '8px', color: 'white' }}>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{r.isBE ? 'PASS' : 'FAIL'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CI Plot */}
      {(aucResult || cmaxResult) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <CIPlot aucResult={aucResult} cmaxResult={cmaxResult} />
        </div>
      )}

      {/* Data entry */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
        <DataPane label="AUC data"  raw={aucRaw}  setRaw={setAucRaw}  result={aucResult}  example={EXAMPLE_AUC} />
        <DataPane label="Cmax data" raw={cmaxRaw} setRaw={setCmaxRaw} result={cmaxResult} example={EXAMPLE_CMAX} />
      </div>

      {/* Method explanation */}
      <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px 16px', fontSize: '12px', color: 'rgba(240,244,255,0.65)', lineHeight: '1.7' }}>
        <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '13px', color: '#f0f4ff' }}>How this is calculated</p>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Step 1 — Log transformation:</strong> AUC and Cmax are log-transformed before analysis. This is required by FDA/EMA guidelines because PK parameters are log-normally distributed.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Step 2 — Mean ln-ratio:</strong> μ = mean(ln(Test/Reference)) across all subjects.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Step 3 — 90% CI:</strong> CI = exp(μ ± t(0.95, n−1) × SE) where SE = s/√n. The t-value at 95th percentile (not 97.5th) gives a 90% CI — equivalent to two one-sided 5% tests.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Step 4 — TOST decision:</strong> Both lower and upper bounds of the 90% CI must fall within [0.80, 1.25] for bioequivalence. This simultaneously tests that the ratio is not too low AND not too high.
        </p>
        <p style={{ margin: 0 }}>
          <strong>GMR (Geometric Mean Ratio):</strong> exp(μ) — the point estimate of the Test/Reference ratio. Not sufficient alone — the CI must fall within bounds.
        </p>
      </div>
    </main>
  )
}