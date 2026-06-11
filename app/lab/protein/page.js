'use client'
import React, { useState, useRef, useEffect } from 'react'

// ─── Amino acid data ──────────────────────────────────────────────────────────

const AA = {
  A: { name: 'Alanine',       mw: 89.09,  pKa: null,  charge: 0,   e280: 0 },
  R: { name: 'Arginine',      mw: 174.20, pKa: 12.48, charge: 1,   e280: 0 },
  N: { name: 'Asparagine',    mw: 132.12, pKa: null,  charge: 0,   e280: 0 },
  D: { name: 'Aspartate',     mw: 133.10, pKa: 3.65,  charge: -1,  e280: 0 },
  C: { name: 'Cysteine',      mw: 121.16, pKa: 8.18,  charge: 0,   e280: 0 },
  E: { name: 'Glutamate',     mw: 147.13, pKa: 4.25,  charge: -1,  e280: 0 },
  Q: { name: 'Glutamine',     mw: 128.13, pKa: null,  charge: 0,   e280: 0 },
  G: { name: 'Glycine',       mw: 75.03,  pKa: null,  charge: 0,   e280: 0 },
  H: { name: 'Histidine',     mw: 155.16, pKa: 6.00,  charge: 0.1, e280: 0 },
  I: { name: 'Isoleucine',    mw: 131.17, pKa: null,  charge: 0,   e280: 0 },
  L: { name: 'Leucine',       mw: 131.17, pKa: null,  charge: 0,   e280: 0 },
  K: { name: 'Lysine',        mw: 146.19, pKa: 10.53, charge: 1,   e280: 0 },
  M: { name: 'Methionine',    mw: 149.21, pKa: null,  charge: 0,   e280: 0 },
  F: { name: 'Phenylalanine', mw: 165.19, pKa: null,  charge: 0,   e280: 0 },
  P: { name: 'Proline',       mw: 115.13, pKa: null,  charge: 0,   e280: 0 },
  S: { name: 'Serine',        mw: 87.08,  pKa: null,  charge: 0,   e280: 0 },
  T: { name: 'Threonine',     mw: 101.10, pKa: null,  charge: 0,   e280: 0 },
  W: { name: 'Tryptophan',    mw: 186.21, pKa: null,  charge: 0,   e280: 5500 },
  Y: { name: 'Tyrosine',      mw: 163.18, pKa: 10.07, charge: -0.5,e280: 1490 },
  V: { name: 'Valine',        mw: 99.13,  pKa: null,  charge: 0,   e280: 0 },
}

// pKa values for pI calculation (Henderson-Hasselbalch)
const PKA_NTERM = 8.0
const PKA_CTERM = 3.1

function parseSequence(raw) {
  return raw.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, '')
}

function countAA(seq) {
  const counts = {}
  for (const c of seq) counts[c] = (counts[c] || 0) + 1
  return counts
}

function calcMW(seq) {
  const counts = countAA(seq)
  let mw = 18.02 // water
  for (const [aa, n] of Object.entries(counts)) {
    mw += n * (AA[aa]?.mw || 0) - n * 18.02 // subtract water per peptide bond
  }
  return mw + 18.02 // re-add one water for free termini
}

function calcE280(seq) {
  const counts = countAA(seq)
  const W = counts.W || 0
  const Y = counts.Y || 0
  const C = counts.C || 0
  // Pace formula: ε = 5500W + 1490Y + 125(C as disulfide pairs)
  // Reduced (no disulfides): 5500W + 1490Y
  // Oxidised (all Cys paired): 5500W + 1490Y + 125*(C/2)
  return {
    reduced: 5500 * W + 1490 * Y,
    oxidised: 5500 * W + 1490 * Y + 125 * Math.floor(C / 2),
    W, Y, C,
  }
}

function chargeAtPH(seq, pH) {
  const counts = countAA(seq)
  let charge = 0

  // N-terminus
  charge += 1 / (1 + Math.pow(10, pH - PKA_NTERM))
  // C-terminus
  charge -= 1 / (1 + Math.pow(10, PKA_CTERM - pH))

  for (const [aa, n] of Object.entries(counts)) {
    const data = AA[aa]
    if (!data?.pKa) continue
    if (data.charge > 0) {
      // Basic residue (R, K, H) — protonated form is +1
      charge += n / (1 + Math.pow(10, pH - data.pKa))
    } else {
      // Acidic residue (D, E, Y, C) — deprotonated form is -1
      charge -= n / (1 + Math.pow(10, data.pKa - pH))
    }
  }
  return charge
}

function calcPI(seq) {
  if (!seq) return null
  let lo = 0, hi = 14
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const c = chargeAtPH(seq, mid)
    if (Math.abs(c) < 0.001) return mid
    if (c > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ─── Bradford/BCA standard curve maths ────────────────────────────────────────

function linearFit(xs, ys) {
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

// ─── Assay curve canvas ────────────────────────────────────────────────────────

const AssayCanvas = React.forwardRef(function AssayCanvas({ standards, fit, unknowns }, ref) {
  const canvasRef = useRef(null)
  React.useImperativeHandle(ref, () => canvasRef.current)

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

    const valid = standards.filter(s => s.conc > 0 && s.abs > 0)
    if (valid.length < 2) {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#9ca3af'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Add ≥2 standard points to see curve', W / 2, H / 2)
      return
    }

    const pad = { top: 20, right: 20, bottom: 44, left: 56 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    const allConc = valid.map(s => s.conc)
    const allAbs = valid.map(s => s.abs)
    const allUnkAbs = unknowns.filter(u => u.abs > 0).map(u => u.abs)

    const xMax = Math.max(...allConc) * 1.1
    const yMax = Math.max(...allAbs, ...allUnkAbs, 0.1) * 1.15
    const xMin = 0
    const yMin = 0

    const xS = x => pad.left + ((x - xMin) / (xMax - xMin)) * cW
    const yS = y => pad.top + cH - ((y - yMin) / (yMax - yMin)) * cH

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (i / 5) * cW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    }

    // Fit line
    if (fit) {
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(xS(xMin), yS(fit.m * xMin + fit.b))
      ctx.lineTo(xS(xMax), yS(fit.m * xMax + fit.b))
      ctx.stroke(); ctx.setLineDash([])
    }

    // Standard points
    valid.forEach(s => {
      ctx.fillStyle = '#111827'
      ctx.beginPath(); ctx.arc(xS(s.conc), yS(s.abs), 4, 0, Math.PI * 2); ctx.fill()
    })

    // Unknown projections
    const ukColors = ['#ef4444', '#f97316', '#8b5cf6', '#16a34a', '#0891b2']
    unknowns.filter(u => u.abs > 0 && u.estConc !== null).forEach((u, i) => {
      const col = ukColors[i % ukColors.length]
      const preDilutionConc = u.estConc / (parseFloat(u.dilution) || 1)
      const x = xS(preDilutionConc)
      const y = yS(u.absAdj)
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x, yS(yMin)); ctx.lineTo(x, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(xS(xMin), y); ctx.lineTo(x, y); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'white'
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
    })

    // Axes
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    ctx.fillStyle = '#374151'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const v = yMax * (1 - i / 5)
      ctx.fillText(v.toFixed(3), pad.left - 4, pad.top + (i / 5) * cH + 3)
    }
    ctx.textAlign = 'center'
    for (let i = 0; i <= 5; i++) {
      const v = xMax * i / 5
      ctx.fillText(v.toFixed(2), xS(v), pad.top + cH + 14)
    }

    ctx.save(); ctx.translate(12, pad.top + cH / 2); ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('Absorbance', 0, 0); ctx.restore()
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('Concentration (mg/mL)', pad.left + cW / 2, H - 6)

    if (fit) {
      ctx.fillStyle = '#2563eb'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`R² = ${fit.r2.toFixed(4)}`, pad.left + cW - 4, pad.top + 14)
    }
  }, [standards, fit, unknowns])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '240px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f0f4ff' }} />
  )
})

// ─── Main page ────────────────────────────────────────────────────────────────

const EXAMPLE_BRADFORD = [
  { conc: 0,    abs: '0.062' },
  { conc: 0.125, abs: '0.143' },
  { conc: 0.25,  abs: '0.224' },
  { conc: 0.5,   abs: '0.388' },
  { conc: 0.75,  abs: '0.541' },
  { conc: 1.0,   abs: '0.698' },
  { conc: 1.5,   abs: '0.991' },
  { conc: 2.0,   abs: '1.274' },
]
const EXAMPLE_UNKNOWNS = [
  { label: 'Sample 1', abs: '0.465', dilution: 1 },
  { label: 'Sample 2', abs: '0.832', dilution: 2 },
  { label: 'Sample 3', abs: '0.291', dilution: 1 },
]

const BSA_STANDARDS_BRADFORD = [
  { conc: 0,    abs: '' },
  { conc: 0.125, abs: '' },
  { conc: 0.25,  abs: '' },
  { conc: 0.5,   abs: '' },
  { conc: 0.75,  abs: '' },
  { conc: 1.0,   abs: '' },
  { conc: 1.5,   abs: '' },
  { conc: 2.0,   abs: '' },
]

const BSA_STANDARDS_BCA = [
  { conc: 0,    abs: '' },
  { conc: 0.025, abs: '' },
  { conc: 0.125, abs: '' },
  { conc: 0.25,  abs: '' },
  { conc: 0.5,   abs: '' },
  { conc: 0.75,  abs: '' },
  { conc: 1.0,   abs: '' },
  { conc: 2.0,   abs: '' },
]

export default function ProteinToolsPage() {
  const [tab, setTab] = useState('assay')

  // ── Assay / standard curve state ──
  const [assayType, setAssayType] = useState('Bradford')
  const [standards, setStandards] = useState(BSA_STANDARDS_BRADFORD.map(s => ({ ...s })))
  const [unknowns, setUnknowns] = useState([
    { label: 'Sample 1', abs: '', dilution: 1 },
    { label: 'Sample 2', abs: '', dilution: 1 },
    { label: 'Sample 3', abs: '', dilution: 1 },
  ])
  const [blankAbs, setBlankAbs] = useState('')

  // ── pI / sequence state ──
  const [sequence, setSequence] = useState('MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR')
  const [seqError, setSeqError] = useState('')

  const canvasRef = useRef(null)

  function exportCurvePNG() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'standard-curve.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function loadExample() {
    setStandards(EXAMPLE_BRADFORD.map(s => ({ ...s })))
    setUnknowns(EXAMPLE_UNKNOWNS.map(u => ({ ...u })))
    setBlankAbs('0.062')
    setAssayType('Bradford')
  }

  function clearExample() {
    setStandards(BSA_STANDARDS_BRADFORD.map(s => ({ ...s })))
    setUnknowns([
      { label: 'Sample 1', abs: '', dilution: 1 },
      { label: 'Sample 2', abs: '', dilution: 1 },
      { label: 'Sample 3', abs: '', dilution: 1 },
    ])
    setBlankAbs('')
  }

  function handleAssayTypeChange(type) {
    setAssayType(type)
    setStandards((type === 'Bradford' ? BSA_STANDARDS_BRADFORD : BSA_STANDARDS_BCA).map(s => ({ ...s })))
    setUnknowns([
      { label: 'Sample 1', abs: '', dilution: 1 },
      { label: 'Sample 2', abs: '', dilution: 1 },
      { label: 'Sample 3', abs: '', dilution: 1 },
    ])
  }

  // Blank subtraction
  const blankVal = parseFloat(blankAbs) || 0
  const adjustedStandards = standards.map(s => ({
    ...s,
    abs: parseFloat(s.abs) > 0 ? parseFloat(s.abs) - blankVal : parseFloat(s.abs) || 0,
  }))

  const validStds = adjustedStandards.filter(s => s.conc > 0 && s.abs > 0)
  const fit = validStds.length >= 2
    ? linearFit(validStds.map(s => s.conc), validStds.map(s => s.abs))
    : null

  const stdConcMax = validStds.length > 0 ? Math.max(...validStds.map(s => s.conc)) : 0
  const stdConcMin = validStds.length > 0 ? Math.min(...validStds.map(s => s.conc)) : 0

  const unknownResults = unknowns.map(u => {
    const absVal = (parseFloat(u.abs) || 0) - blankVal
    const dilution = parseFloat(u.dilution) || 1
    let estConc = null
    if (fit && absVal > 0 && fit.m !== 0) {
      estConc = ((absVal - fit.b) / fit.m) * dilution
    }
    const concBeforeDilution = estConc !== null ? estConc / dilution : null
    const inRange = concBeforeDilution !== null
      && concBeforeDilution >= stdConcMin
      && concBeforeDilution <= stdConcMax * 1.05 // 5% tolerance
    return { ...u, absAdj: absVal, estConc, inRange }
  })

  // pI / e280 calculations
  const cleanSeq = parseSequence(sequence)
  const seqMW = cleanSeq.length > 0 ? calcMW(cleanSeq) : null
  const seqPI = cleanSeq.length > 0 ? calcPI(cleanSeq) : null
  const seqE280 = cleanSeq.length > 0 ? calcE280(cleanSeq) : null
  const counts = cleanSeq.length > 0 ? countAA(cleanSeq) : {}

  const tabBtn = active => ({
    padding: '8px 20px', cursor: 'pointer', fontSize: '13px',
    fontWeight: tab === active ? '600' : '400',
    border: 'none', borderBottom: tab === active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'transparent', color: tab === active ? '#93b4f7' : 'rgba(240,244,255,0.4)', marginBottom: '-1px',
  })

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <a href="/lab" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', textDecoration: 'none' }}>← Lab Prep</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '1rem 0 4px' }}>Protein Tools</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Bradford and BCA standard curves with automatic concentration back-calculation, plus isoelectric point and extinction coefficient from protein sequence.
      </p>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.5rem', display: 'flex' }}>
        <button onClick={() => setTab('assay')} style={tabBtn('assay')}>Protein assay (Bradford / BCA)</button>
        <button onClick={() => setTab('sequence')} style={tabBtn('sequence')}>pI & extinction coefficient</button>
      </div>

      {/* ── TAB 1: Assay standard curve ── */}
      {tab === 'assay' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left: inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Example toggle */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={loadExample}
                style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid rgba(42,111,219,0.35)', background: 'rgba(42,111,219,0.1)', color: '#93b4f7', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                ↓ Load example
              </button>
              <button onClick={clearExample}
                style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(240,244,255,0.4)', fontSize: '12px', cursor: 'pointer' }}>
                Clear
              </button>
            </div>

            {/* Assay type */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assay type</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {['Bradford', 'BCA', 'Lowry'].map(t => (
                  <button key={t} onClick={() => handleAssayTypeChange(t)}
                    style={{ flex: 1, padding: '7px', borderRadius: '8px', border: assayType === t ? '2px solid #2a6fdb' : '1px solid rgba(255,255,255,0.1)', background: assayType === t ? 'rgba(42,111,219,0.18)' : 'rgba(255,255,255,0.04)', color: assayType === t ? '#93b4f7' : 'rgba(240,244,255,0.65)', fontSize: '12px', fontWeight: assayType === t ? '600' : '400', cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', lineHeight: '1.5', padding: '8px 10px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '7px' }}>
                {assayType === 'Bradford' && 'Coomassie Blue binding · A595 · BSA or γ-globulin standards · range 0.1–1.4 mg/mL'}
                {assayType === 'BCA' && 'Cu²⁺ reduction + bicinchoninic acid · A562 · BSA standards · range 20–2000 μg/mL · compatible with reducing agents'}
                {assayType === 'Lowry' && 'Folin-Ciocalteu · A750 · BSA standards · most sensitive · sensitive to detergents and reducing agents'}
              </div>
            </div>

            {/* Blank */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blank absorbance</p>
              <input type="number" step="0.001" value={blankAbs} onChange={e => setBlankAbs(e.target.value)}
                placeholder="0.000"
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', boxSizing: 'border-box', background: '#0f1629' }} />
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', margin: '4px 0 0' }}>Subtracted from all readings automatically.</p>
            </div>

            {/* Standards table */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BSA standards</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>Conc (mg/mL)</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>Absorbance</th>
                  </tr>
                </thead>
                <tbody>
                  {standards.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: 'rgba(240,244,255,0.75)' }}>
                        {s.conc === 0 ? 'Blank (0)' : s.conc}
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <input type="number" step="0.001" value={s.abs} placeholder="—"
                          onChange={e => setStandards(prev => prev.map((row, j) => j === i ? { ...row, abs: e.target.value } : row))}
                          style={{ width: '100%', padding: '3px 6px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', textAlign: 'right', background: parseFloat(s.abs) > 0 ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.05)', color: '#f0f4ff' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setStandards(prev => [...prev, { conc: '', abs: '' }])}
                style={{ marginTop: '8px', width: '100%', padding: '6px', borderRadius: '7px', border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', fontSize: '12px', color: 'rgba(240,244,255,0.45)', cursor: 'pointer' }}>
                + Add row
              </button>
            </div>
          </div>

          {/* Right: curve + unknowns + results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Standard curve plot */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#f0f4ff', margin: '0 0 8px' }}>Standard curve</p>
              <AssayCanvas ref={canvasRef} standards={adjustedStandards} fit={fit} unknowns={unknownResults} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              {fit && (
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', margin: '0' }}>
                  A = {fit.m.toFixed(4)} × [conc] + {fit.b.toFixed(4)} · R² = {fit.r2.toFixed(4)}
                  {fit.r2 < 0.99 && <span style={{ color: '#f97316', marginLeft: '8px' }}>⚠ R² below 0.99</span>}
                </p>
              )}
              {fit && <button onClick={exportCurvePNG}
                style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.55)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                ↓ Export PNG
              </button>}
            </div>
            </div>

            {/* Unknown samples */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#f0f4ff', margin: '0 0 10px' }}>Unknown samples</p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'rgba(240,244,255,0.45)', fontWeight: '600', width: '35%' }}>Sample</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600', width: '22%' }}>Absorbance</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600', width: '18%' }}>Dilution ×</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(240,244,255,0.45)', fontWeight: '600', width: '25%' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {unknowns.map((u, i) => {
                    const res = unknownResults[i]
                    const colors = ['#ef4444', '#f97316', '#8b5cf6', '#16a34a', '#0891b2']
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px 8px' }}>
                          <input value={u.label} onChange={e => setUnknowns(prev => prev.map((r, j) => j === i ? { ...r, label: e.target.value } : r))}
                            style={{ width: '100%', padding: '3px 6px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', fontSize: '12px', background: '#0f1629', color: '#f0f4ff', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input type="number" step="0.001" value={u.abs} placeholder="—"
                            onChange={e => setUnknowns(prev => prev.map((r, j) => j === i ? { ...r, abs: e.target.value } : r))}
                            style={{ width: '100%', padding: '3px 6px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', textAlign: 'right', background: parseFloat(u.abs) > 0 ? 'rgba(42,111,219,0.15)' : 'rgba(255,255,255,0.05)', color: '#f0f4ff', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input type="number" step="1" min="1" value={u.dilution}
                            onChange={e => setUnknowns(prev => prev.map((r, j) => j === i ? { ...r, dilution: e.target.value } : r))}
                            style={{ width: '100%', padding: '3px 6px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', fontSize: '12px', textAlign: 'right', background: '#0f1629', color: '#f0f4ff', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                          {res.estConc !== null && res.estConc > 0
                            ? <span style={{ fontSize: '13px', fontWeight: '700', color: colors[i % colors.length] }}>
                                {res.estConc.toFixed(3)} mg/mL
                                {!res.inRange && <span title="Outside standard range — dilute sample and re-measure" style={{ fontSize: '10px', color: '#f97316', marginLeft: '4px', cursor: 'help' }}>⚠ extrapolated</span>}
                              </span>
                            : <span style={{ color: 'rgba(240,244,255,0.3)' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <button onClick={() => setUnknowns(prev => [...prev, { label: `Sample ${prev.length + 1}`, abs: '', dilution: 1 }])}
                style={{ width: '100%', padding: '6px', borderRadius: '7px', border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', fontSize: '12px', color: 'rgba(240,244,255,0.45)', cursor: 'pointer' }}>
                + Add sample
              </button>
            </div>

            {/* Results summary */}
            {unknownResults.some(r => r.estConc !== null && r.estConc > 0) && (
              <div style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.35)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#86efac', margin: '0 0 10px' }}>Results summary</p>
                {unknownResults.filter(r => r.estConc !== null && r.estConc > 0).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(240,244,255,0.75)' }}>{r.label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#86efac' }}>{r.estConc.toFixed(3)}</span>
                      <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', marginLeft: '4px' }}>mg/mL</span>
                      {!r.inRange && <div style={{ fontSize: '10px', color: '#f97316' }}>⚠ outside standard range — dilute and re-measure</div>}
                      {parseFloat(r.dilution) > 1 && (
                        <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)' }}>(× {r.dilution} dilution applied)</div>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bbf7d0', fontSize: '11px', color: 'rgba(240,244,255,0.45)' }}>
                  Equation: A = {fit?.m.toFixed(4)} × [protein] + {fit?.b.toFixed(4)} · R² = {fit?.r2.toFixed(4)}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: 'rgba(240,244,255,0.45)', lineHeight: '1.7' }}>
              <strong style={{ color: 'rgba(240,244,255,0.75)' }}>Tips:</strong>{' '}
              Absorbances should be measured within the linear range of your curve (ideally 0.1–0.9). Values above this range are unreliable — dilute and re-measure. If your R² is below 0.99, the most common cause is inaccurate pipetting of the lowest standards; remake the 0.125 and 0.25 mg/mL dilutions.
            </div>
          </div>
        </div>
      )}{/* end assay tab */}
      {tab === 'sequence' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left: sequence input + composition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protein sequence (single-letter)</p>
              <textarea value={sequence} onChange={e => setSequence(e.target.value)} rows={6}
                placeholder="Paste or type amino acid sequence..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box', background: '#0f1629', resize: 'vertical', lineHeight: '1.6' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px', color: 'rgba(240,244,255,0.45)' }}>
                <span>{cleanSeq.length} residues</span>
                {seqMW && <span>MW: {(seqMW / 1000).toFixed(2)} kDa</span>}
              </div>

              {/* Quick-load examples */}
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', margin: '0 0 5px' }}>Quick load:</p>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Haemoglobin α', seq: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
                    { name: 'Lysozyme', seq: 'KVFGRCELAAAFMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL' },
                    { name: 'GFP', seq: 'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK' },
                  ].map(ex => (
                    <button key={ex.name} onClick={() => setSequence(ex.seq)}
                      style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', background: '#0f1629', cursor: 'pointer', color: 'rgba(240,244,255,0.75)' }}>
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amino acid composition */}
            {cleanSeq.length > 0 && (
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amino acid composition</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([aa, n]) => (
                    <div key={aa} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 6px', background: '#0f1629', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#f0f4ff', fontFamily: 'monospace', minWidth: '14px' }}>{aa}</span>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${(n / Math.max(...Object.values(counts))) * 100}%`, height: '100%', background: '#2563eb', borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', minWidth: '16px', textAlign: 'right' }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cleanSeq.length > 0 ? (
              <>
                {/* Key metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Molecular weight', value: seqMW ? `${(seqMW / 1000).toFixed(2)} kDa` : '—', sub: seqMW ? `${Math.round(seqMW)} Da` : '' },
                    { label: 'Isoelectric point (pI)', value: seqPI ? seqPI.toFixed(2) : '—', sub: seqPI != null ? (seqPI < 7 ? 'Acidic protein' : 'Basic protein') : '' },
                    { label: 'ε₂₈₀ (reduced, no SS)', value: seqE280 ? seqE280.reduced.toLocaleString() : '—', sub: 'M⁻¹cm⁻¹' },
                    { label: 'ε₂₈₀ (oxidised, SS bonds)', value: seqE280 ? seqE280.oxidised.toLocaleString() : '—', sub: 'M⁻¹cm⁻¹' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', marginBottom: '3px' }}>{m.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#f0f4ff' }}>{m.value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ε280 breakdown */}
                {seqE280 && (
                  <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extinction coefficient breakdown</p>
                    <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', margin: '0 0 8px', lineHeight: '1.6' }}>
                      Calculated by the Pace method: ε = 5500W + 1490Y + 125(C/2 as disulfide pairs)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[
                        { label: `Trp (W) × ${seqE280.W}`, value: `${seqE280.W} × 5500 = ${(seqE280.W * 5500).toLocaleString()}`, color: '#7c3aed' },
                        { label: `Tyr (Y) × ${seqE280.Y}`, value: `${seqE280.Y} × 1490 = ${(seqE280.Y * 1490).toLocaleString()}`, color: '#2a6fdb' },
                        { label: `Cys pairs × ${Math.floor(seqE280.C / 2)}`, value: `${Math.floor(seqE280.C / 2)} × 125 = ${(Math.floor(seqE280.C / 2) * 125).toLocaleString()}`, color: '#16a34a' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#0f1629', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                          <span style={{ color: row.color, fontWeight: '500' }}>{row.label}</span>
                          <span style={{ color: 'rgba(240,244,255,0.75)', fontFamily: 'monospace' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beer-Lambert back-calculator */}
                <BeerLambertCalc seqMW={seqMW} seqE280={seqE280} />

                {/* pI context */}
                {seqPI !== null && (
                  <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>pI interpretation</p>
                    <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', lineHeight: '1.65', margin: 0 }}>
                      pI = {seqPI.toFixed(2)} — the protein carries <strong>zero net charge at this pH</strong>, minimum solubility, maximum aggregation tendency.
                      {' '}At physiological pH 7.4, this protein is <strong>{seqPI < 7.4 ? 'negatively charged (anionic)' : 'positively charged (cationic)'}</strong>.
                      {' '}For ion-exchange chromatography: use {seqPI < 7.4 ? 'anion exchange (AEX)' : 'cation exchange (CEX)'} to bind this protein at pH 7.4.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: '#0f1629', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'rgba(240,244,255,0.3)' }}>
                <p style={{ fontSize: '14px', margin: '0 0 4px', color: 'rgba(240,244,255,0.45)' }}>Enter a protein sequence</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Or load one of the examples above</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

// ─── Beer-Lambert quick calculator ───────────────────────────────────────────

function BeerLambertCalc({ seqMW, seqE280 }) {
  const [a280, setA280] = useState('')
  const [pathlength, setPathlength] = useState('1')
  const [useSS, setUseSS] = useState(false)

  const epsilon = seqE280 ? (useSS ? seqE280.oxidised : seqE280.reduced) : null
  const absVal = parseFloat(a280)
  const l = parseFloat(pathlength) || 1

  // Beer-Lambert: A = ε × c × l  →  c = A / (ε × l)  [mol/L]
  // Then convert to mg/mL: c_mgmL = c_molL × MW(g/mol) / 1000
  const concMolar = epsilon && absVal > 0 ? absVal / (epsilon * l) : null
  const concMgMl = concMolar && seqMW ? concMolar * seqMW : null

  return (
    <div style={{ background: 'rgba(42,111,219,0.18)', border: '1px solid rgba(42,111,219,0.35)', borderRadius: '12px', padding: '12px 14px' }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>A₂₈₀ → concentration</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '3px' }}>Absorbance at 280nm</label>
          <input type="number" step="0.001" value={a280} onChange={e => setA280(e.target.value)}
            placeholder="0.000"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid rgba(42,111,219,0.35)', fontSize: '13px', boxSizing: 'border-box', background: '#0f1629' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.75)', display: 'block', marginBottom: '3px' }}>Path length (cm)</label>
          <input type="number" step="0.1" value={pathlength} onChange={e => setPathlength(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid rgba(42,111,219,0.35)', fontSize: '13px', boxSizing: 'border-box', background: '#0f1629' }} />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(240,244,255,0.75)', marginBottom: '8px', cursor: 'pointer' }}>
        <input type="checkbox" checked={useSS} onChange={e => setUseSS(e.target.checked)} />
        Use oxidised ε (with disulfide bonds)
      </label>
      {concMgMl !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: '#0f1629', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(42,111,219,0.35)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.45)' }}>Concentration</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#93b4f7' }}>{concMgMl.toFixed(3)}</div>
            <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)' }}>mg/mL</div>
          </div>
          <div style={{ background: '#0f1629', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(42,111,219,0.35)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.45)' }}>Molar concentration</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#93b4f7' }}>{(concMolar * 1e6).toFixed(3)}</div>
            <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)' }}>μM</div>
          </div>
        </div>
      )}
      {!epsilon && <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', margin: 0 }}>Enter a sequence above to calculate ε₂₈₀.</p>}
    </div>
  )
}