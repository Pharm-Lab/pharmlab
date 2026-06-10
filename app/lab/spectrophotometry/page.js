'use client'
import { useState } from 'react'

// ─── Nucleic acid coefficients (A260) ─────────────────────────────────────────

const NUCLEIC_TYPES = {
  'dsDNA':    { e260: 50,   a260_a280_pure: 1.8, note: 'Pure dsDNA: A260/A280 = 1.8' },
  'ssDNA':    { e260: 33,   a260_a280_pure: 1.8, note: 'Pure ssDNA: A260/A280 ~1.8' },
  'RNA':      { e260: 40,   a260_a280_pure: 2.0, note: 'Pure RNA: A260/A280 = 2.0' },
  'Oligo':    { e260: 33,   a260_a280_pure: 1.8, note: 'ssDNA oligo — use OD260 × 33 μg/mL' },
}

// ─── Common ε values for Beer-Lambert ─────────────────────────────────────────

const COMMON_COMPOUNDS = [
  { name: 'NADH (340nm)',          e: 6220,   wavelength: 340, unit: 'M⁻¹cm⁻¹' },
  { name: 'NADPH (340nm)',         e: 6220,   wavelength: 340, unit: 'M⁻¹cm⁻¹' },
  { name: 'ATP (259nm)',           e: 15400,  wavelength: 259, unit: 'M⁻¹cm⁻¹' },
  { name: 'FAD (450nm)',           e: 11300,  wavelength: 450, unit: 'M⁻¹cm⁻¹' },
  { name: 'Haem (Soret, 408nm)',   e: 179000, wavelength: 408, unit: 'M⁻¹cm⁻¹' },
  { name: 'p-Nitrophenol (405nm)', e: 18300,  wavelength: 405, unit: 'M⁻¹cm⁻¹' },
  { name: 'Cytochrome c (550nm)',  e: 29500,  wavelength: 550, unit: 'M⁻¹cm⁻¹' },
  { name: 'DTNB product (412nm)',  e: 14150,  wavelength: 412, unit: 'M⁻¹cm⁻¹' },
]

function purityInterpretation(a260_280, a260_230, type) {
  const expected280 = type === 'RNA' ? 2.0 : 1.8
  const msgs = []

  if (a260_280 < 1.7) msgs.push({ text: 'A260/A280 low — likely protein contamination. Proteins absorb strongly at 280nm.', color: '#dc2626' })
  else if (a260_280 > expected280 + 0.2) msgs.push({ text: `A260/A280 high (expected ~${expected280}) — may indicate RNA contamination or single-stranded regions.`, color: '#f97316' })
  else msgs.push({ text: `A260/A280 ${a260_280.toFixed(2)} — acceptable purity.`, color: '#16a34a' })

  if (a260_230 && a260_230 < 1.7) msgs.push({ text: 'A260/A230 low — organic solvent (phenol, EDTA, guanidinium) contamination likely. Common after TRIzol extraction.', color: '#dc2626' })
  else if (a260_230 && a260_230 >= 2.0) msgs.push({ text: `A260/A230 ${a260_230.toFixed(2)} — good, minimal chaotropic salt or solvent contamination.`, color: '#16a34a' })

  return msgs
}

export default function SpectrophotometryPage() {
  const [tab, setTab] = useState('beerlambert')

  // Beer-Lambert state
  const [blAbs, setBlAbs] = useState('')
  const [blEpsilon, setBlEpsilon] = useState('')
  const [blLength, setBlLength] = useState('1')
  const [blMW, setBlMW] = useState('')
  const [blMode, setBlMode] = useState('conc') // conc | abs | epsilon

  // Nucleic acid state
  const [naType, setNaType] = useState('dsDNA')
  const [naA260, setNaA260] = useState('')
  const [naA280, setNaA280] = useState('')
  const [naA230, setNaA230] = useState('')
  const [naDilution, setNaDilution] = useState('1')
  const [naLength, setNaLength] = useState('1')

  // Multi-sample batch state
  const [batchSamples, setBatchSamples] = useState([
    { label: 'Sample 1', abs: '', blank: '0' },
    { label: 'Sample 2', abs: '', blank: '0' },
    { label: 'Sample 3', abs: '', blank: '0' },
  ])
  const [batchEpsilon, setBatchEpsilon] = useState('')
  const [batchLength, setBatchLength] = useState('1')
  const [batchMW, setBatchMW] = useState('')

  // Dilution back-calculator
  const [dilTarget, setDilTarget] = useState('')
  const [dilCurrent, setDilCurrent] = useState('')
  const [dilVolume, setDilVolume] = useState('')

  const tabBtn = active => ({
    padding: '8px 18px', cursor: 'pointer', fontSize: '13px',
    fontWeight: tab === active ? '600' : '400',
    border: 'none', borderBottom: tab === active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'transparent', color: tab === active ? '#1d4ed8' : '#6b7280', marginBottom: '-1px',
  })

  // Beer-Lambert calculations
  const blAbsNum = parseFloat(blAbs)
  const blEpsNum = parseFloat(blEpsilon)
  const blLenNum = parseFloat(blLength) || 1
  const blMWNum = parseFloat(blMW)

  let blConc = null, blConcMgMl = null, blAbsCalc = null, blEpsCalc = null
  if (blMode === 'conc' && blAbsNum > 0 && blEpsNum > 0) {
    blConc = blAbsNum / (blEpsNum * blLenNum)              // mol/L
    if (blMWNum > 0) blConcMgMl = blConc * blMWNum         // g/L = mg/mL
  }
  if (blMode === 'abs' && blEpsNum > 0 && parseFloat(blAbs) > 0) {
    // treating blAbs input as concentration in μM
    const cMol = parseFloat(blAbs) * 1e-6
    blAbsCalc = blEpsNum * cMol * blLenNum
  }
  if (blMode === 'epsilon' && blAbsNum > 0 && parseFloat(blLength) > 0 && blMWNum > 0) {
    // treating blEpsilon input as concentration in mg/mL
    const cMgMl = parseFloat(blEpsilon)
    const cMol = cMgMl / blMWNum
    blEpsCalc = blAbsNum / (cMol * blLenNum)
  }

  // Nucleic acid calculations
  const naInfo = NUCLEIC_TYPES[naType]
  const naA260Num = parseFloat(naA260) || 0
  const naA280Num = parseFloat(naA280) || 0
  const naA230Num = parseFloat(naA230) || 0
  const naDilNum = parseFloat(naDilution) || 1
  const naLenNum = parseFloat(naLength) || 1

  const naConc = naA260Num * naInfo.e260 * naDilNum / naLenNum  // μg/mL
  const na260_280 = naA280Num > 0 ? naA260Num / naA280Num : null
  const na260_230 = naA230Num > 0 ? naA260Num / naA230Num : null
  const purityMsgs = na260_280 ? purityInterpretation(na260_280, na260_230, naType) : []

  // Batch results
  const batchEpsNum = parseFloat(batchEpsilon)
  const batchLenNum = parseFloat(batchLength) || 1
  const batchMWNum = parseFloat(batchMW)
  const batchResults = batchSamples.map(s => {
    const adj = (parseFloat(s.abs) || 0) - (parseFloat(s.blank) || 0)
    const cMol = batchEpsNum > 0 && adj > 0 ? adj / (batchEpsNum * batchLenNum) : null
    const cMgMl = cMol && batchMWNum > 0 ? cMol * batchMWNum : null
    return { ...s, adj, cMol, cMgMl }
  })

  // Dilution
  const dilTargetNum = parseFloat(dilTarget)
  const dilCurrentNum = parseFloat(dilCurrent)
  const dilVolumeNum = parseFloat(dilVolume)
  let dilVStock = null, dilVDiluent = null
  if (dilTargetNum > 0 && dilCurrentNum > dilTargetNum && dilVolumeNum > 0) {
    dilVStock = (dilTargetNum * dilVolumeNum) / dilCurrentNum
    dilVDiluent = dilVolumeNum - dilVStock
  }

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/lab" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Lab Prep</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Spectrophotometry</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Beer-Lambert calculator, nucleic acid quantification with purity interpretation, batch concentration mode, and dilution back-calculator.
      </p>

      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: 0 }}>
        {[['beerlambert', 'Beer-Lambert'], ['nucleic', 'Nucleic acids (A260)'], ['batch', 'Batch samples'], ['dilution', 'Dilution calculator']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={tabBtn(key)}>{label}</button>
        ))}
      </div>

      {/* ── TAB 1: Beer-Lambert ── */}
      {tab === 'beerlambert' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Mode selector */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solve for</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {[['conc', 'Concentration'], ['abs', 'Absorbance'], ['epsilon', 'Extinction ε']].map(([m, label]) => (
                  <button key={m} onClick={() => setBlMode(m)}
                    style={{ padding: '7px 4px', borderRadius: '8px', border: blMode === m ? '2px solid #2563eb' : '1px solid #e5e7eb', background: blMode === m ? '#eff6ff' : 'white', color: blMode === m ? '#1d4ed8' : '#374151', fontSize: '11px', fontWeight: blMode === m ? '600' : '400', cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>A = ε × c × l</p>

              {[
                { label: 'Absorbance (A)', key: 'abs', val: blAbs, set: setBlAbs, disabled: blMode === 'abs', placeholder: blMode === 'abs' ? 'calculated' : '0.000', unit: '' },
                { label: 'Extinction coefficient (ε)', key: 'eps', val: blEpsilon, set: setBlEpsilon, disabled: blMode === 'epsilon', placeholder: blMode === 'epsilon' ? 'calculated' : '5500', unit: 'M⁻¹cm⁻¹' },
                { label: 'Path length (l)', key: 'len', val: blLength, set: setBlLength, disabled: false, placeholder: '1', unit: 'cm' },
                { label: 'Molecular weight (optional)', key: 'mw', val: blMW, set: setBlMW, disabled: false, placeholder: 'e.g. 14300', unit: 'g/mol' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="number" step="any" value={f.val} onChange={e => !f.disabled && f.set(e.target.value)}
                      placeholder={f.placeholder} disabled={f.disabled}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: `1px solid ${f.disabled ? '#f3f4f6' : '#d1d5db'}`, fontSize: '13px', background: f.disabled ? '#f3f4f6' : 'white', color: f.disabled ? '#9ca3af' : '#111827' }} />
                    {f.unit && <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '55px' }}>{f.unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Common ε quick-load */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Common ε values</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {COMMON_COMPOUNDS.map(c => (
                  <button key={c.name} onClick={() => setBlEpsilon(String(c.e))}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '6px', border: '1px solid #f3f4f6', background: 'white', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}>
                    <span style={{ color: '#374151' }}>{c.name}</span>
                    <span style={{ color: '#6b7280', fontFamily: 'monospace' }}>{c.e.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0 0 16px' }}>Result</p>

              {blMode === 'conc' && (
                <>
                  {blConc !== null ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Molar concentration', value: blConc < 1e-3 ? `${(blConc * 1e6).toFixed(3)} μM` : blConc < 1 ? `${(blConc * 1e3).toFixed(3)} mM` : `${blConc.toFixed(4)} M` },
                        { label: 'In μM', value: `${(blConc * 1e6).toFixed(3)} μM` },
                        ...(blConcMgMl !== null ? [{ label: 'Concentration (mg/mL)', value: `${blConcMgMl.toFixed(4)} mg/mL` }] : []),
                      ].map(m => (
                        <div key={m.label} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{m.label}</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1d4ed8' }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Enter absorbance and ε to calculate concentration.</p>
                  )}
                </>
              )}

              {blMode === 'abs' && (
                <>
                  {blAbsCalc !== null ? (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Expected absorbance</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#1d4ed8' }}>{blAbsCalc.toFixed(4)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {blAbsCalc > 1.0 && '⚠ Above 1.0 — dilute sample before measuring (Beer-Lambert is linear only below ~1.5)'}
                        {blAbsCalc < 0.05 && '⚠ Below 0.05 — very low signal, concentrate sample or use longer path length'}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Enter concentration (μM) as the first field and ε to calculate expected absorbance.</p>
                  )}
                </>
              )}

              {blMode === 'epsilon' && (
                <>
                  {blEpsCalc !== null ? (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Extinction coefficient (ε)</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#1d4ed8' }}>{blEpsCalc.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>M⁻¹cm⁻¹ — enter A, concentration in mg/mL as the ε field, and MW to calculate.</div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Enter absorbance, known concentration (mg/mL in the ε field), and MW to derive ε.</p>
                  )}
                </>
              )}
            </div>

            {/* Beer-Lambert equation reminder */}
            <div style={{ background: '#0a0f1e', borderRadius: '10px', padding: '12px 16px' }}>
              <p style={{ fontSize: '10px', color: '#93b4f7', fontWeight: '600', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beer-Lambert law</p>
              <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#93b4f7', margin: '0 0 4px' }}>A = ε × c × l</p>
              <p style={{ fontSize: '11px', color: '#60a5fa', margin: 0, lineHeight: 1.7 }}>
                A = absorbance (dimensionless)<br />
                ε = molar extinction coefficient (M⁻¹cm⁻¹)<br />
                c = molar concentration (mol/L)<br />
                l = path length (cm, usually 1)
              </p>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400e', lineHeight: '1.65' }}>
              <strong>Practical notes:</strong> Beer-Lambert is linear only when A is between ~0.05 and 1.5. Above 1.5, detector saturation causes underestimation. Below 0.05, noise dominates. Ideally measure at A = 0.1–0.8 by adjusting dilution or path length.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Nucleic acids ── */}
      {tab === 'nucleic' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample type</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.keys(NUCLEIC_TYPES).map(t => (
                  <button key={t} onClick={() => setNaType(t)}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: naType === t ? '2px solid #2563eb' : '1px solid #e5e7eb', background: naType === t ? '#eff6ff' : 'white', color: naType === t ? '#1d4ed8' : '#374151', fontSize: '12px', fontWeight: naType === t ? '600' : '400', cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Absorbance readings</p>
              {[
                { label: 'A260', val: naA260, set: setNaA260, required: true },
                { label: 'A280', val: naA280, set: setNaA280, required: false },
                { label: 'A230', val: naA230, set: setNaA230, required: false },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '3px' }}>
                    {f.label} {!f.required && <span style={{ color: '#9ca3af' }}>(optional — for purity)</span>}
                  </label>
                  <input type="number" step="0.001" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder="0.000"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box', background: 'white' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '3px' }}>Dilution factor</label>
                  <input type="number" step="1" min="1" value={naDilution} onChange={e => setNaDilution(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box', background: 'white' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '3px' }}>Path length (cm)</label>
                  <input type="number" step="0.1" value={naLength} onChange={e => setNaLength(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box', background: 'white' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {naA260Num > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Concentration', value: naConc >= 1000 ? `${(naConc / 1000).toFixed(3)} mg/mL` : `${naConc.toFixed(1)} μg/mL` },
                    { label: 'A260/A280', value: na260_280 ? na260_280.toFixed(2) : '—' },
                    { label: 'A260/A230', value: na260_230 ? na260_230.toFixed(2) : '—' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>{m.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {purityMsgs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {purityMsgs.map((m, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: '10px', background: m.color === '#16a34a' ? '#f0fdf4' : m.color === '#f97316' ? '#fff7ed' : '#fef2f2', border: `1px solid ${m.color}44`, fontSize: '13px', color: m.color === '#16a34a' ? '#15803d' : m.color === '#f97316' ? '#c2410c' : '#991b1b', lineHeight: '1.6' }}>
                        {m.text}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>Conversion</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                    {[
                      { label: 'μg/mL', value: naConc.toFixed(2) },
                      { label: 'ng/μL', value: naConc.toFixed(2) },
                      { label: 'mg/mL', value: (naConc / 1000).toFixed(4) },
                      { label: 'μg/μL', value: (naConc / 1000).toFixed(4) },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'white', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#9ca3af' }}>{r.label}</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#111827' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: '#1e40af', lineHeight: '1.7' }}>
                  <strong>For {naType}:</strong> {naInfo.note}. Concentration = A260 × {naInfo.e260} μg/mL × dilution factor / path length.
                  {naType === 'dsDNA' && ' For copy number, divide total mass by (MW per bp × 660 Da/bp × number of base pairs).'}
                </div>
              </>
            ) : (
              <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontSize: '14px', margin: '0 0 4px', color: '#6b7280' }}>Enter your A260 reading</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Add A280 and A230 for purity assessment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Batch samples ── */}
      {tab === 'batch' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared parameters</p>
              {[
                { label: 'ε (M⁻¹cm⁻¹)', val: batchEpsilon, set: setBatchEpsilon, placeholder: '5500' },
                { label: 'Path length (cm)', val: batchLength, set: setBatchLength, placeholder: '1' },
                { label: 'MW (g/mol, optional)', val: batchMW, set: setBatchMW, placeholder: 'e.g. 14300' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                  <input type="number" step="any" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box', background: 'white' }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '8px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left', color: '#6b7280', fontWeight: '600', borderRadius: '8px 0 0 0' }}>Sample</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Absorbance</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Blank</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Adj. A</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>μM</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600', borderRadius: '0 8px 0 0' }}>mg/mL</th>
                </tr>
              </thead>
              <tbody>
                {batchSamples.map((s, i) => {
                  const res = batchResults[i]
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px' }}>
                        <input value={s.label} onChange={e => setBatchSamples(prev => prev.map((r, j) => j === i ? { ...r, label: e.target.value } : r))}
                          style={{ width: '110px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <input type="number" step="0.001" value={s.abs} placeholder="—"
                          onChange={e => setBatchSamples(prev => prev.map((r, j) => j === i ? { ...r, abs: e.target.value } : r))}
                          style={{ width: '70px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #e5e7eb', fontSize: '12px', textAlign: 'right' }} />
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <input type="number" step="0.001" value={s.blank} placeholder="0"
                          onChange={e => setBatchSamples(prev => prev.map((r, j) => j === i ? { ...r, blank: e.target.value } : r))}
                          style={{ width: '60px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #e5e7eb', fontSize: '12px', textAlign: 'right' }} />
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#374151' }}>{res.adj.toFixed(3)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: res.cMol ? '#2563eb' : '#9ca3af' }}>
                        {res.cMol ? (res.cMol * 1e6).toFixed(2) : '—'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: res.cMgMl ? '#16a34a' : '#9ca3af' }}>
                        {res.cMgMl ? res.cMgMl.toFixed(4) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <button onClick={() => setBatchSamples(prev => [...prev, { label: `Sample ${prev.length + 1}`, abs: '', blank: '0' }])}
              style={{ padding: '6px 14px', borderRadius: '7px', border: '1px dashed #d1d5db', background: 'transparent', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
              + Add sample
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 4: Dilution calculator ── */}
      {tab === 'dilution' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0 0 14px' }}>C₁V₁ = C₂V₂ — dilution calculator</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {[
                { label: 'Stock concentration (C₁)', val: dilCurrent, set: setDilCurrent, placeholder: 'e.g. 10' },
                { label: 'Target concentration (C₂)', val: dilTarget, set: setDilTarget, placeholder: 'e.g. 1' },
                { label: 'Final volume (V₂)', val: dilVolume, set: setDilVolume, placeholder: 'e.g. 1000' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input type="number" step="any" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', background: 'white' }} />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ padding: '8px 10px', background: '#f3f4f6', borderRadius: '8px', fontSize: '12px', color: '#6b7280', width: '100%' }}>
                  Concentrations in same units; volume in μL or mL
                </div>
              </div>
            </div>

            {dilVStock !== null && dilVDiluent !== null ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#15803d', margin: '0 0 10px' }}>Preparation</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'white', borderRadius: '8px', padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>Stock to add (V₁)</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#15803d' }}>{dilVStock.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>same units as V₂</div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '8px', padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>Diluent to add</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#15803d' }}>{dilVDiluent.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>same units as V₂</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '10px 0 0' }}>
                  Dilution factor: ×{(dilCurrentNum / dilTargetNum).toFixed(1)}
                </p>
              </div>
            ) : (
              dilTarget && dilCurrent && parseFloat(dilTarget) >= parseFloat(dilCurrent) && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', color: '#dc2626' }}>
                  Target concentration must be lower than stock concentration.
                </div>
              )
            )}
          </div>

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#6b7280', lineHeight: '1.7' }}>
            <strong style={{ color: '#374151' }}>Serial dilutions:</strong> For a 1:10 serial dilution, take 10 μL of stock + 90 μL diluent, mix, take 10 μL from that + 90 μL diluent, and so on. Each step reduces concentration by 10×.
          </div>
        </div>
      )}
    </main>
  )
}