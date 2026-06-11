'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Math ─────────────────────────────────────────────────────────

function calcCrCl({ age, weightKg, serumCreatinine, sex }) {
  const base = ((140 - age) * weightKg) / (72 * serumCreatinine)
  return sex === 'female' ? base * 0.85 : base
}

function calcRenalAdjustment({ CLnormal, keNormal, Vd, fe, CrClPatient, CrClNormal = 100 }) {
  const Q      = CrClPatient / CrClNormal
  const factor = 1 - fe + fe * Q
  const CLadj  = CLnormal * factor
  const keAdj  = keNormal * factor
  const thalfAdj = Math.LN2 / keAdj
  return { CLadj, keAdj, thalfAdj, factor }
}

function calcChildPugh({ bilirubin, albumin, inr, ascites, encephalopathy }) {
  // Bilirubin (μmol/L)
  const bilScore = bilirubin < 34 ? 1 : bilirubin <= 50 ? 2 : 3
  // Albumin (g/L)
  const albScore = albumin > 35 ? 1 : albumin >= 28 ? 2 : 3
  // INR
  const inrScore = inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3
  // Ascites: 0=none, 1=mild, 2=moderate-severe
  const ascScore = ascites === 0 ? 1 : ascites === 1 ? 2 : 3
  // Encephalopathy: 0=none, 1=grade1-2, 2=grade3-4
  const encScore = encephalopathy === 0 ? 1 : encephalopathy === 1 ? 2 : 3
  const total    = bilScore + albScore + inrScore + ascScore + encScore
  const cpClass  = total <= 6 ? 'A' : total <= 9 ? 'B' : 'C'
  return { total, cpClass, bilScore, albScore, inrScore, ascScore, encScore }
}

function calcHepaticAdjustment({ CLnormal, keNormal, Vd, EH, cpClass }) {
  // Hepatic function fraction by Child-Pugh class
  const hepaticFraction = cpClass === 'A' ? 1.0 : cpClass === 'B' ? 0.6 : 0.3
  const factor  = 1 - EH + EH * hepaticFraction
  const CLadj   = CLnormal * factor
  const keAdj   = keNormal * factor
  const thalfAdj = Math.LN2 / keAdj
  return { CLadj, keAdj, thalfAdj, factor, hepaticFraction }
}

function calcSteadyState({ dose, tau, Vd, ke }) {
  // At steady state, multiple oral/IV doses
  // Cmax_ss = (D/Vd) / (1 - e^(-ke*tau))
  // Cmin_ss = Cmax_ss * e^(-ke*tau)
  const accumFactor = 1 / (1 - Math.exp(-ke * tau))
  const C0          = dose / Vd
  const Cmaxss      = C0 * accumFactor
  const Cminss      = Cmaxss * Math.exp(-ke * tau)
  const Css_avg     = (dose / Vd) / (ke * tau)
  return { Cmaxss, Cminss, Css_avg }
}

function generateMultipleDoseCurve({ dose, tau, Vd, ke, nDoses = 6, pointsPerDose = 100 }) {
  const pts = []
  let t = 0
  for (let d = 0; d < nDoses; d++) {
    for (let i = 0; i < pointsPerDose; i++) {
      const tLocal = (i / pointsPerDose) * tau
      // Superposition: sum of all previous doses
      let C = 0
      for (let j = 0; j <= d; j++) {
        const tSinceDose = tLocal + (d - j) * tau
        C += (dose / Vd) * Math.exp(-ke * tSinceDose)
      }
      pts.push({ t: t + tLocal, c: Math.max(0, C) })
    }
    t += tau
  }
  return pts
}

// ─── Components ───────────────────────────────────────────────────

function ParamInput({ label, value, setValue, min, max, step, unit, hint }) {
  const [raw, setRaw] = useState(String(value))
  useEffect(() => { setRaw(String(value)) }, [value])
  return (
    <div style={{ background: '#0f1629', borderRadius: '8px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.5)', display: 'block', marginBottom: '4px' }}>
        {label} {unit && <span style={{ color: 'rgba(240,244,255,0.3)' }}>({unit})</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <input type="number" value={raw} min={min} max={max} step={step}
          onChange={e => { setRaw(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) setValue(n) }}
          onBlur={() => { const n = parseFloat(raw); if (isNaN(n)) { setRaw(String(value)); return } const c = Math.min(Math.max(n, min), max); setValue(c); setRaw(String(c)) }}
          style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#f0f4ff', textAlign: 'right', background: 'rgba(255,255,255,0.05)' }} />
        <input type="range" min={min} max={max} step={step}
          value={Math.min(Math.max(value, min), max)}
          onChange={e => { const n = parseFloat(e.target.value); setValue(n); setRaw(String(n)) }}
          style={{ flex: 1, accentColor: '#2563eb' }} />
      </div>
      {hint && <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)' }}>{hint}</div>}
    </div>
  )
}

function ResultCard({ label, normal, adjusted, unit, highlight = false }) {
  const pct    = normal > 0 ? ((adjusted - normal) / normal * 100) : 0
  const color  = adjusted < normal ? '#2563eb' : adjusted > normal ? '#ef4444' : '#22c55e'
  return (
    <div style={{ background: highlight ? 'rgba(42,111,219,0.12)' : '#0f1629', border: `1px solid ${highlight ? 'rgba(42,111,219,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.4)', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginBottom: '1px' }}>Normal</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'rgba(240,244,255,0.7)' }}>{normal.toFixed(3)}</div>
        </div>
        <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.2)' }}>→</div>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginBottom: '1px' }}>Adjusted</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color }}>{adjusted.toFixed(3)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginBottom: '1px' }}>Change</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color }}>{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</div>
        </div>
      </div>
      {unit && <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', marginTop: '2px' }}>{unit}</div>}
    </div>
  )
}

function MiniCanvas({ normalPts, adjustedPts, mec, mtc }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !normalPts?.length) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    if (!W || !H) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad  = { top: 16, right: 16, bottom: 32, left: 56 }
    const cW   = W - pad.left - pad.right
    const cH   = H - pad.top  - pad.bottom

    const allPts = [...normalPts, ...adjustedPts]
    const maxC   = Math.max(...allPts.map(p => p.c), 0.1) * 1.15
    const maxT   = Math.max(...allPts.map(p => p.t))

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0f1e'; ctx.fillRect(0, 0, W, H)

    const xS = t => pad.left + (t / maxT) * cW
    const yS = c => pad.top  + cH - (Math.min(Math.max(c, 0), maxC) / maxC) * cH

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }

    // Y labels
    ctx.fillStyle = 'rgba(240,244,255,0.4)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = maxC * (1 - i / 4)
      ctx.fillText(val < 0.01 ? val.toExponential(1) : val.toFixed(2), pad.left - 3, pad.top + (i / 4) * cH + 3)
    }
    ctx.textAlign = 'center'
    for (let i = 0; i <= 4; i++) {
      ctx.fillText((maxT * i / 4).toFixed(0) + 'h', pad.left + (i / 4) * cW, pad.top + cH + 14)
    }

    // MEC / MTC
    if (mec && mec > 0 && mec <= maxC) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(mec)); ctx.lineTo(pad.left + cW, yS(mec)); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = '#f59e0b'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('MEC', pad.left + 2, yS(mec) - 2)
    }
    if (mtc && mtc > 0 && mtc <= maxC) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(pad.left, yS(mtc)); ctx.lineTo(pad.left + cW, yS(mtc)); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = '#ef4444'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('MTC', pad.left + 2, yS(mtc) - 2)
    }
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Normal curve (grey)
    ctx.strokeStyle = 'rgba(240,244,255,0.3)'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    normalPts.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Adjusted curve (blue)
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    ctx.beginPath()
    adjustedPts.forEach((p, i) => i === 0 ? ctx.moveTo(xS(p.t), yS(p.c)) : ctx.lineTo(xS(p.t), yS(p.c)))
    ctx.stroke()

    // Legend
    ctx.font = '9px sans-serif'; ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(240,244,255,0.4)'
    ctx.fillRect(pad.left + 4, pad.top + 4, 12, 2)
    ctx.fillText('Normal', pad.left + 18, pad.top + 8)
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(pad.left + 4, pad.top + 14, 12, 2)
    ctx.fillText('Adjusted', pad.left + 18, pad.top + 18)

  }, [normalPts, adjustedPts, mec, mtc])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '200px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: '#0a0f1e' }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────

export default function DosageAdjustment() {
  // Drug PK parameters
  const [dose,    setDose]    = useState(500)
  const [tau,     setTau]     = useState(8)
  const [Vd,      setVd]      = useState(35)
  const [CL,      setCL]      = useState(4)
  const [fe,      setFe]      = useState(0.7)
  const [EH,      setEH]      = useState(0.3)
  const [mec,     setMec]     = useState('')
  const [mtc,     setMtc]     = useState('')

  // Renal inputs
  const [age,        setAge]        = useState(65)
  const [weight,     setWeight]     = useState(70)
  const [creatinine, setCreatinine] = useState(1.5)
  const [sex,        setSex]        = useState('male')
  const [useRenal,   setUseRenal]   = useState(true)

  // Hepatic inputs
  const [bilirubin,      setBilirubin]      = useState(20)
  const [albumin,        setAlbumin]        = useState(38)
  const [inr,            setInr]            = useState(1.2)
  const [ascites,        setAscites]        = useState(0)
  const [encephalopathy, setEncephalopathy] = useState(0)
  const [useHepatic,     setUseHepatic]     = useState(false)

  // Derived
  const ke      = CL / Vd
  const tHalf   = Math.LN2 / ke

  const CrCl    = calcCrCl({ age, weightKg: weight, serumCreatinine: creatinine, sex })
  const cpResult = calcChildPugh({ bilirubin, albumin, inr, ascites, encephalopathy })

  const renalAdj   = calcRenalAdjustment({ CLnormal: CL, keNormal: ke, Vd, fe, CrClPatient: CrCl })
  const hepaticAdj = calcHepaticAdjustment({ CLnormal: CL, keNormal: ke, Vd, EH, cpClass: cpResult.cpClass })

  // Combined adjustment
  let CLadj = CL
  let keAdj = ke
  if (useRenal)   { CLadj = CLadj * renalAdj.factor;   keAdj = keAdj * renalAdj.factor }
  if (useHepatic) { CLadj = CLadj * hepaticAdj.factor; keAdj = keAdj * hepaticAdj.factor }
  const tHalfAdj = Math.LN2 / keAdj

  // Regimen adjustments
  const doseReduced   = dose * (keAdj / ke)
  const tauExtended   = tau  * (ke / keAdj)

  // Steady state
  const ssNormal   = calcSteadyState({ dose, tau, Vd, ke })
  const ssReduced  = calcSteadyState({ dose: doseReduced, tau, Vd, ke: keAdj })
  const ssExtended = calcSteadyState({ dose, tau: tauExtended, Vd, ke: keAdj })

  // Curves
  const normalCurve   = generateMultipleDoseCurve({ dose, tau, Vd, ke })
  const reducedCurve  = generateMultipleDoseCurve({ dose: doseReduced, tau, Vd, ke: keAdj })
  const extendedCurve = generateMultipleDoseCurve({ dose, tau: tauExtended, Vd, ke: keAdj })

  const mecVal = parseFloat(mec) || null
  const mtcVal = parseFloat(mtc) || null

  const adjustmentActive = useRenal || useHepatic
  const combinedFactor   = keAdj / ke

  const cpColors = { A: '#22c55e', B: '#f59e0b', C: '#ef4444' }

  const btn = active => ({
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
    fontWeight: active ? '600' : '400',
    border: active ? '2px solid #2a6fdb' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(42,111,219,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? '#93b4f7' : 'rgba(240,244,255,0.6)',
  })

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input[type=range]{ accent-color:#2a6fdb; } input::placeholder{ color:rgba(240,244,255,0.25); }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Dosage Adjustment Calculator</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Renal (Cockcroft-Gault) and hepatic (Child-Pugh) dose adjustment using pharmacokinetic principles. All calculations are deterministic — no AI involved.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>

        {/* ── Left: inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Drug PK parameters */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Drug PK parameters</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ParamInput label="Dose"              value={dose}  setValue={setDose}  min={1}    max={2000} step={1}    unit="mg"  hint="Standard dose" />
              <ParamInput label="Dosing interval τ" value={tau}   setValue={setTau}   min={1}    max={48}   step={0.5}  unit="h"   hint="Standard interval" />
              <ParamInput label="Volume of distribution Vd" value={Vd} setValue={setVd} min={0.1} max={500} step={0.1} unit="L"   hint="0.1–500 L" />
              <ParamInput label="Clearance CL"      value={CL}    setValue={setCL}    min={0.01} max={300}  step={0.01} unit="L/h" hint="Total body clearance" />
              <ParamInput label="Fraction excreted unchanged (fe)" value={fe} setValue={setFe} min={0} max={1} step={0.01} unit="" hint="0 = fully hepatic, 1 = fully renal" />
              <ParamInput label="Hepatic extraction ratio (EH)"    value={EH} setValue={setEH} min={0} max={1} step={0.01} unit="" hint="0 = low extraction, 1 = high extraction" />
            </div>

            {/* Derived normal PK */}
            <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', fontSize: '12px', color: 'rgba(240,244,255,0.65)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'rgba(240,244,255,0.45)' }}>ke (normal)</span>
                <span style={{ fontWeight: '600' }}>{ke.toFixed(4)} h⁻¹</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(240,244,255,0.45)' }}>t½ (normal)</span>
                <span style={{ fontWeight: '600' }}>{tHalf.toFixed(2)} h</span>
              </div>
            </div>

            {/* Optional MEC/MTC */}
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', display: 'block', marginBottom: '3px' }}>MEC (mg/L)</label>
                <input type="number" value={mec} onChange={e => setMec(e.target.value)} placeholder="optional"
                  style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(240,244,255,0.45)', display: 'block', marginBottom: '3px' }}>MTC (mg/L)</label>
                <input type="number" value={mtc} onChange={e => setMtc(e.target.value)} placeholder="optional"
                  style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Renal impairment */}
          <div style={{ background: '#0f1629', border: `1px solid ${useRenal ? 'rgba(42,111,219,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setUseRenal(!useRenal)}
              style={{ width: '100%', padding: '12px 16px', background: useRenal ? 'rgba(42,111,219,0.15)' : 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '500', color: useRenal ? '#93b4f7' : 'rgba(240,244,255,0.65)' }}>
              <span>🫘 Renal impairment (Cockcroft-Gault)</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: useRenal ? '#2a6fdb' : 'rgba(255,255,255,0.1)', color: useRenal ? 'white' : 'rgba(240,244,255,0.4)' }}>
                {useRenal ? 'Active' : 'Off'}
              </span>
            </button>
            {useRenal && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.6)', display: 'block', marginBottom: '4px' }}>Biological sex</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setSex('male')}   style={btn(sex === 'male')}>Male</button>
                    <button onClick={() => setSex('female')} style={btn(sex === 'female')}>Female (×0.85)</button>
                  </div>
                </div>
                <ParamInput label="Age"               value={age}        setValue={setAge}        min={18}  max={100} step={1}   unit="years" hint="18–100" />
                <ParamInput label="Weight"            value={weight}     setValue={setWeight}     min={30}  max={200} step={1}   unit="kg"    hint="30–200 kg" />
                <ParamInput label="Serum creatinine"  value={creatinine} setValue={setCreatinine} min={0.1} max={15}  step={0.1} unit="mg/dL" hint="Normal ~0.7–1.2 mg/dL" />

                {/* CrCl result */}
                <div style={{ padding: '8px 10px', background: 'rgba(42,111,219,0.08)', borderRadius: '8px', border: '1px solid rgba(42,111,219,0.3)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#1d4ed8', fontWeight: '500' }}>CrCl (Cockcroft-Gault)</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: CrCl >= 60 ? '#22c55e' : CrCl >= 30 ? '#f59e0b' : '#ef4444' }}>
                      {CrCl.toFixed(1)} mL/min
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {CrCl >= 90 ? 'Normal renal function'
                      : CrCl >= 60 ? 'Mild impairment (CKD G2)'
                      : CrCl >= 30 ? 'Moderate impairment (CKD G3)'
                      : CrCl >= 15 ? 'Severe impairment (CKD G4)'
                      : 'Kidney failure (CKD G5)'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hepatic impairment */}
          <div style={{ background: '#0f1629', border: `1px solid ${useHepatic ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setUseHepatic(!useHepatic)}
              style={{ width: '100%', padding: '12px 16px', background: useHepatic ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '500', color: useHepatic ? '#c4b5fd' : 'rgba(240,244,255,0.65)' }}>
              <span>🫀 Hepatic impairment (Child-Pugh)</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: useHepatic ? '#7c3aed' : 'rgba(255,255,255,0.1)', color: useHepatic ? 'white' : 'rgba(240,244,255,0.4)' }}>
                {useHepatic ? 'Active' : 'Off'}
              </span>
            </button>
            {useHepatic && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ParamInput label="Bilirubin"  value={bilirubin} setValue={setBilirubin} min={1}   max={200} step={1}   unit="μmol/L" hint="Normal <21 μmol/L" />
                <ParamInput label="Albumin"    value={albumin}   setValue={setAlbumin}   min={10}  max={55}  step={0.5} unit="g/L"    hint="Normal 35–50 g/L" />
                <ParamInput label="INR"        value={inr}       setValue={setInr}       min={0.5} max={5}   step={0.1} unit=""       hint="Normal 0.8–1.2" />

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.6)', display: 'block', marginBottom: '4px' }}>Ascites</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[['None', 0], ['Mild', 1], ['Moderate–severe', 2]].map(([label, val]) => (
                      <button key={val} onClick={() => setAscites(val)} style={btn(ascites === val)}>{label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(240,244,255,0.6)', display: 'block', marginBottom: '4px' }}>Hepatic encephalopathy</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[['None', 0], ['Grade 1–2', 1], ['Grade 3–4', 2]].map(([label, val]) => (
                      <button key={val} onClick={() => setEncephalopathy(val)} style={btn(encephalopathy === val)}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Child-Pugh result */}
                <div style={{ padding: '8px 10px', background: 'rgba(124,58,237,0.08)', borderRadius: '8px', border: '1px solid rgba(124,58,237,0.3)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: '#5b21b6', fontWeight: '500' }}>Child-Pugh Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#f0f4ff' }}>{cpResult.total}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', padding: '2px 10px', borderRadius: '999px', background: cpColors[cpResult.cpClass], color: 'white' }}>
                        Class {cpResult.cpClass}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {cpResult.cpClass === 'A' ? 'Mild hepatic impairment — minimal adjustment usually needed'
                      : cpResult.cpClass === 'B' ? 'Moderate hepatic impairment — dose reduction recommended (~25–50%)'
                      : 'Severe hepatic impairment — significant dose reduction required or drug contraindicated'}
                  </div>
                  {/* Score breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginTop: '8px' }}>
                    {[
                      ['Bili', cpResult.bilScore],
                      ['Alb', cpResult.albScore],
                      ['INR', cpResult.inrScore],
                      ['Asc', cpResult.ascScore],
                      ['Enc', cpResult.encScore],
                    ].map(([label, score]) => (
                      <div key={label} style={{ textAlign: 'center', background: score === 1 ? '#f0fdf4' : score === 2 ? '#fefce8' : '#fef2f2', borderRadius: '4px', padding: '3px' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(240,244,255,0.35)' }}>{label}</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: score === 1 ? '#16a34a' : score === 2 ? '#ca8a04' : '#dc2626' }}>{score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {!adjustmentActive && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(240,244,255,0.3)', fontSize: '14px', background: '#0f1629', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
              Enable renal or hepatic impairment on the left to see adjustments
            </div>
          )}

          {adjustmentActive && (
            <>
              {/* Summary banner */}
              <div style={{ padding: '12px 16px', background: combinedFactor < 0.5 ? 'rgba(239,68,68,0.12)' : combinedFactor < 0.8 ? 'rgba(249,115,22,0.12)' : 'rgba(22,163,74,0.12)', border: `1px solid ${combinedFactor < 0.5 ? 'rgba(239,68,68,0.4)' : combinedFactor < 0.8 ? 'rgba(249,115,22,0.4)' : 'rgba(22,163,74,0.4)'}`, borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f0f4ff', marginBottom: '4px' }}>
                  Combined adjustment factor: {(combinedFactor * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)' }}>
                  {useRenal && `CrCl: ${CrCl.toFixed(1)} mL/min (fe = ${fe})`}
                  {useRenal && useHepatic && ' + '}
                  {useHepatic && `Child-Pugh Class ${cpResult.cpClass} (EH = ${EH})`}
                </div>
              </div>

              {/* PK parameter changes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <ResultCard label="Clearance CL"  normal={CL}    adjusted={CLadj}    unit="L/h" highlight />
                <ResultCard label="ke"             normal={ke}    adjusted={keAdj}    unit="h⁻¹" />
                <ResultCard label="Half-life t½"   normal={tHalf} adjusted={tHalfAdj} unit="h"   highlight />
              </div>

              {/* Regimen options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {/* Option A: dose reduction */}
                <div style={{ background: 'rgba(42,111,219,0.1)', border: '1px solid rgba(42,111,219,0.35)', borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#93b4f7', margin: '0 0 8px' }}>
                    Option A — Reduce dose, keep interval
                  </p>
                  <div style={{ fontSize: '13px', color: '#f0f4ff', marginBottom: '6px' }}>
                    <span style={{ color: 'rgba(240,244,255,0.45)' }}>Adjusted dose: </span>
                    <strong>{doseReduced.toFixed(1)} mg</strong>
                    <span style={{ color: 'rgba(240,244,255,0.3)', fontSize: '11px' }}> every {tau}h</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.5)', marginBottom: '10px' }}>
                    Maintains same dosing interval — preferred for drugs where consistent plasma levels matter (time-dependent kill). Cmax is lower, Cmin is lower.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '10px' }}>
                    {[
                      ['Cmax SS', ssNormal.Cmaxss.toFixed(3), ssReduced.Cmaxss.toFixed(3), 'mg/L'],
                      ['Cmin SS', ssNormal.Cminss.toFixed(3), ssReduced.Cminss.toFixed(3), 'mg/L'],
                      ['Css avg', ssNormal.Css_avg.toFixed(3), ssReduced.Css_avg.toFixed(3), 'mg/L'],
                    ].map(([label, norm, adj, unit]) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)' }}>{label}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.25)', textDecoration: 'line-through' }}>{norm}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#93b4f7' }}>{adj}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(240,244,255,0.2)' }}>{unit}</div>
                      </div>
                    ))}
                  </div>
                  <MiniCanvas normalPts={normalCurve} adjustedPts={reducedCurve} mec={mecVal} mtc={mtcVal} />
                </div>

                {/* Option B: interval extension */}
                <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.35)', borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#86efac', margin: '0 0 8px' }}>
                    Option B — Keep dose, extend interval
                  </p>
                  <div style={{ fontSize: '13px', color: '#f0f4ff', marginBottom: '6px' }}>
                    <span style={{ color: 'rgba(240,244,255,0.45)' }}>Adjusted interval: </span>
                    <strong>{tauExtended.toFixed(1)}h</strong>
                    <span style={{ color: 'rgba(240,244,255,0.3)', fontSize: '11px' }}> at {dose}mg</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.5)', marginBottom: '10px' }}>
                    Maintains same dose peak — preferred for concentration-dependent drugs (aminoglycosides). Cmax unchanged, Cmin is lower, larger fluctuations.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '10px' }}>
                    {[
                      ['Cmax SS', ssNormal.Cmaxss.toFixed(3), ssExtended.Cmaxss.toFixed(3), 'mg/L'],
                      ['Cmin SS', ssNormal.Cminss.toFixed(3), ssExtended.Cminss.toFixed(3), 'mg/L'],
                      ['Css avg', ssNormal.Css_avg.toFixed(3), ssExtended.Css_avg.toFixed(3), 'mg/L'],
                    ].map(([label, norm, adj, unit]) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)' }}>{label}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(240,244,255,0.25)', textDecoration: 'line-through' }}>{norm}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#86efac' }}>{adj}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(240,244,255,0.2)' }}>{unit}</div>
                      </div>
                    ))}
                  </div>
                  <MiniCanvas normalPts={normalCurve} adjustedPts={extendedCurve} mec={mecVal} mtc={mtcVal} />
                </div>
              </div>

              {/* Concept explanation */}
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'rgba(240,244,255,0.65)' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600' }}>How this is calculated</p>
                <p style={{ margin: '0 0 6px', color: 'rgba(240,244,255,0.5)', lineHeight: '1.6' }}>
                  <strong>Renal adjustment</strong> uses the Cockcroft-Gault equation to estimate CrCl, then scales clearance by the fraction of drug eliminated renally:
                  <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', fontSize: '11px', color: '#93b4f7', display: 'block', margin: '4px 0' }}>
                    CL_adj = CL_normal × (1 − fe + fe × CrCl_patient/100)
                  </code>
                </p>
                <p style={{ margin: '0 0 6px', color: 'rgba(240,244,255,0.5)', lineHeight: '1.6' }}>
                  <strong>Hepatic adjustment</strong> uses Child-Pugh class to estimate remaining hepatic function (Class A ≈ 100%, B ≈ 60%, C ≈ 30%) and scales via extraction ratio:
                  <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', fontSize: '11px', color: '#93b4f7', display: 'block', margin: '4px 0' }}>
                    CL_adj = CL_normal × (1 − EH + EH × hepatic_function)
                  </code>
                </p>
                <p style={{ margin: 0, color: 'rgba(240,244,255,0.5)', lineHeight: '1.6' }}>
                  <strong>fe</strong> (fraction excreted unchanged) tells you how much renal impairment matters: fe = 0 means fully hepatically metabolised (renal impairment irrelevant), fe = 1 means fully renally excreted (renal impairment directly proportional). <strong>EH</strong> (hepatic extraction ratio) similarly determines hepatic sensitivity.
                </p>
              </div>

              {/* Disclaimer */}
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', padding: '8px 14px', fontSize: '11px', color: '#fde047' }}>
                ⚠ This tool uses population-average pharmacokinetic models. Clinical dose adjustment requires therapeutic drug monitoring, drug-specific dosing guidelines, and assessment of individual patient factors not captured here. Do not use for actual clinical decisions.
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}