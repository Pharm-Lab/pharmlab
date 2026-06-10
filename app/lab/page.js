'use client'
import { useState } from 'react'

// ─── Dilution calculator ──────────────────────────────────────────

function DilutionCalc() {
  const [mode,   setMode]   = useState('c2v2') // solve for C2V2 or C1V1
  const [c1,     setC1]     = useState(100)
  const [v1,     setV1]     = useState('')
  const [c2,     setC2]     = useState(10)
  const [v2,     setV2]     = useState(100)
  const [unit,   setUnit]   = useState('mg/mL')

  // Serial dilution
  const [serialStart,  setSerialStart]  = useState(1000)
  const [serialFactor, setSerialFactor] = useState(2)
  const [serialSteps,  setSerialSteps]  = useState(8)

  const units = ['mg/mL', 'μg/mL', 'ng/mL', 'mM', 'μM', 'nM', '%', 'mol/L']

  // C1V1 = C2V2 solver
  let result = null
  let dilutionFactor = null
  let solventVolume = null

  if (mode === 'findV1' && c1 && c2 && v2) {
    const v1calc = (c2 * v2) / c1
    result = { label: 'V1 (volume of stock to take)', value: v1calc, unit: 'mL' }
    dilutionFactor = c1 / c2
    solventVolume = v2 - v1calc
  } else if (mode === 'findC2' && c1 && v1 && v2) {
    const c2calc = (c1 * parseFloat(v1)) / v2
    result = { label: 'C2 (final concentration)', value: c2calc, unit }
    dilutionFactor = c1 / c2calc
    solventVolume = v2 - parseFloat(v1)
  } else if (mode === 'findV2' && c1 && v1 && c2) {
    const v2calc = (c1 * parseFloat(v1)) / c2
    result = { label: 'V2 (final volume needed)', value: v2calc, unit: 'mL' }
    dilutionFactor = c1 / c2
    solventVolume = v2calc - parseFloat(v1)
  }

  const serialConcs = Array.from({ length: serialSteps }, (_, i) =>
    serialStart / Math.pow(serialFactor, i)
  )

  const inp = (label, value, setValue, placeholder = '') => (
    <div>
      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>{label}</label>
      <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* C1V1 = C2V2 */}
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>C₁V₁ = C₂V₂</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>Solve for any one variable given the other three.</p>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Solve for</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[['findV1', 'V₁ (stock volume)'], ['findC2', 'C₂ (final conc.)'], ['findV2', 'V₂ (final volume)']].map(([val, label]) => (
              <button key={val} onClick={() => setMode(val)}
                style={{ padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: mode === val ? '600' : '400', border: mode === val ? '2px solid #2563eb' : '1px solid #d1d5db', background: mode === val ? '#eff6ff' : 'white', color: mode === val ? '#1d4ed8' : '#374151' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Concentration unit</label>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '13px', background: 'white', color: '#111827' }}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {inp('C₁ — Stock concentration (' + unit + ')', c1, setC1)}
          {mode === 'findV1'
            ? <div style={{ background: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '7px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#9ca3af' }}>V₁ = ?</div>
            : inp('V₁ — Stock volume taken (mL)', v1, setV1)}
          {mode === 'findC2'
            ? <div style={{ background: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '7px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#9ca3af' }}>C₂ = ?</div>
            : inp('C₂ — Final concentration (' + unit + ')', c2, setC2)}
          {mode === 'findV2'
            ? <div style={{ background: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '7px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#9ca3af' }}>V₂ = ?</div>
            : inp('V₂ — Final volume (mL)', v2, setV2)}
        </div>

        {result && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#1e40af' }}>{result.label}</span>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#1d4ed8' }}>
                {result.value < 0.001 ? result.value.toExponential(3) : result.value.toFixed(4)} {result.unit}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
              <span>Dilution factor: <strong>{dilutionFactor?.toFixed(2)}×</strong></span>
              {solventVolume != null && solventVolume > 0 && (
                <span>Solvent to add: <strong>{solventVolume.toFixed(4)} mL</strong></span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Serial dilution */}
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Serial dilution</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>Generate a dilution series from a starting concentration.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {inp('Starting concentration', serialStart, setSerialStart)}
          {inp('Dilution factor (e.g. 2 = 1:2)', serialFactor, setSerialFactor)}
          {inp('Number of steps', serialSteps, setSerialSteps)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {serialConcs.map((c, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 10px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Step {i + 1}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                {c >= 0.001 ? c.toFixed(4) : c.toExponential(2)}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>1:{Math.pow(serialFactor, i).toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Molarity calculator ──────────────────────────────────────────

function MolarityCalc() {
  const [mw,     setMw]     = useState(180.16) // glucose default
  const [mass,   setMass]   = useState(1.8016)
  const [volume, setVolume] = useState(100)
  const [molar,  setMolar]  = useState(0.1)
  const [solve,  setSolve]  = useState('molarity')

  let result = null

  if (solve === 'molarity' && mw && mass && volume) {
    const moles    = (mass / 1000) / mw  // mass in mg → g, mw in g/mol
    const molarCalc = moles / (volume / 1000)  // volume in mL → L
    result = {
      label: 'Molarity',
      value: molarCalc,
      unit: 'mol/L (M)',
      extra: [
        { label: 'moles', value: moles.toExponential(4), unit: 'mol' },
        { label: 'mM',    value: (molarCalc * 1000).toFixed(4), unit: 'mM' },
        { label: 'μM',    value: (molarCalc * 1e6).toFixed(2),  unit: 'μM' },
      ]
    }
  } else if (solve === 'mass' && mw && molar && volume) {
    const massCalc = molar * (volume / 1000) * mw * 1000  // result in mg
    result = {
      label: 'Mass to weigh',
      value: massCalc,
      unit: 'mg',
      extra: [
        { label: 'grams', value: (massCalc / 1000).toFixed(6), unit: 'g' },
        { label: 'μg',    value: (massCalc * 1000).toFixed(2),  unit: 'μg' },
      ]
    }
  } else if (solve === 'volume' && mw && mass && molar) {
    const moles      = (mass / 1000) / mw
    const volumeCalc = (moles / molar) * 1000  // result in mL
    result = {
      label: 'Volume needed',
      value: volumeCalc,
      unit: 'mL',
      extra: [
        { label: 'litres', value: (volumeCalc / 1000).toFixed(6), unit: 'L' },
        { label: 'μL',     value: (volumeCalc * 1000).toFixed(2),  unit: 'μL' },
      ]
    }
  }

  const inp = (label, value, setValue, unit) => (
    <div>
      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>{label} {unit && <span style={{ color: '#9ca3af' }}>({unit})</span>}</label>
      <input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value) || 0)}
        style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
    </div>
  )

  return (
    <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Molarity calculator</h3>
      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
        Interconvert between mass, moles, molarity, and volume. Molarity (M) = moles / litres.
      </p>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Solve for</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['molarity', 'Molarity (M)'], ['mass', 'Mass (mg)'], ['volume', 'Volume (mL)']].map(([val, label]) => (
            <button key={val} onClick={() => setSolve(val)}
              style={{ padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: solve === val ? '600' : '400', border: solve === val ? '2px solid #2563eb' : '1px solid #d1d5db', background: solve === val ? '#eff6ff' : 'white', color: solve === val ? '#1d4ed8' : '#374151' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {inp('Molecular weight', mw, setMw, 'g/mol')}
        {solve !== 'mass'   && inp('Mass', mass, setMass, 'mg')}
        {solve !== 'volume' && inp('Volume', volume, setVolume, 'mL')}
        {solve !== 'molarity' && inp('Molarity', molar, setMolar, 'mol/L')}
      </div>

      {result && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#1e40af' }}>{result.label}</span>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#1d4ed8' }}>
              {typeof result.value === 'number' && (result.value < 0.0001 ? result.value.toExponential(4) : result.value.toFixed(6))} {result.unit}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {result.extra?.map(e => (
              <span key={e.label} style={{ fontSize: '12px', color: '#6b7280' }}>
                {e.label}: <strong>{e.value} {e.unit}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Buffer calculator ────────────────────────────────────────────

function BufferCalc() {
  const [pKa,    setPKa]    = useState(7.2)   // phosphate buffer default
  const [pH,     setPH]     = useState(7.4)
  const [mode,   setMode]   = useState('ratio') // solve ratio or solve pH
  const [acidV,  setAcidV]  = useState(1)
  const [baseV,  setBaseV]  = useState(1)

  // Henderson-Hasselbalch: pH = pKa + log([A-]/[HA])
  const ratio = Math.pow(10, pH - pKa)  // [base]/[acid]
  const pHfromRatio = pKa + Math.log10(baseV / acidV)
  const percentBase = (ratio / (1 + ratio)) * 100

  const BUFFERS = [
    { name: 'Phosphate (pKa 7.20)',  pKa: 7.20, use: 'Biological buffers, cell culture media' },
    { name: 'Tris-HCl (pKa 8.06)',   pKa: 8.06, use: 'Molecular biology, electrophoresis' },
    { name: 'HEPES (pKa 7.55)',      pKa: 7.55, use: 'Cell culture, does not penetrate cells' },
    { name: 'Citrate (pKa 6.40)',    pKa: 6.40, use: 'Low pH buffers, pharmaceutical formulations' },
    { name: 'Acetate (pKa 4.76)',    pKa: 4.76, use: 'pH 3.6–5.6 range' },
    { name: 'Bicarbonate (pKa 6.35)',pKa: 6.35, use: 'Physiological pH, CO₂ equilibrium' },
    { name: 'MOPS (pKa 7.20)',       pKa: 7.20, use: 'Cell culture, good biological buffer' },
    { name: 'MES (pKa 6.15)',        pKa: 6.15, use: 'pH 5.5–6.7 range' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Henderson-Hasselbalch */}
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Henderson-Hasselbalch</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>
          pH = pKₐ + log([A⁻]/[HA])
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 12px' }}>
          Where [A⁻] is the conjugate base (deprotonated form) and [HA] is the weak acid.
        </p>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mode</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setMode('ratio')} style={{ padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: mode === 'ratio' ? '600' : '400', border: mode === 'ratio' ? '2px solid #2563eb' : '1px solid #d1d5db', background: mode === 'ratio' ? '#eff6ff' : 'white', color: mode === 'ratio' ? '#1d4ed8' : '#374151' }}>
              Find base:acid ratio for target pH
            </button>
            <button onClick={() => setMode('ph')} style={{ padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: mode === 'ph' ? '600' : '400', border: mode === 'ph' ? '2px solid #2563eb' : '1px solid #d1d5db', background: mode === 'ph' ? '#eff6ff' : 'white', color: mode === 'ph' ? '#1d4ed8' : '#374151' }}>
              Find pH from volumes
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>pKₐ of buffer</label>
            <input type="number" value={pKa} step={0.01} onChange={e => setPKa(parseFloat(e.target.value) || 7)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
          </div>
          {mode === 'ratio' ? (
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Target pH</label>
              <input type="number" value={pH} step={0.01} onChange={e => setPH(parseFloat(e.target.value) || 7)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Volume of acid (parts)</label>
                <input type="number" value={acidV} step={0.1} onChange={e => setAcidV(parseFloat(e.target.value) || 1)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
              </div>
            </>
          )}
          {mode === 'ph' && (
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Volume of base (parts)</label>
              <input type="number" value={baseV} step={0.1} onChange={e => setBaseV(parseFloat(e.target.value) || 1)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
            </div>
          )}
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px' }}>
          {mode === 'ratio' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#1e40af' }}>Base:Acid ratio [A⁻]/[HA]</span>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#1d4ed8' }}>{ratio.toFixed(4)}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Mix {ratio.toFixed(3)} parts base : 1 part acid — or {percentBase.toFixed(1)}% base form
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Effective buffer range: pH {(pKa - 1).toFixed(2)} – {(pKa + 1).toFixed(2)}
                {(pH < pKa - 1 || pH > pKa + 1) && (
                  <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⚠ Target pH outside effective range</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#1e40af' }}>Resulting pH</span>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#1d4ed8' }}>{pHfromRatio.toFixed(3)}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Ratio [base]/[acid] = {(baseV / acidV).toFixed(4)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buffer reference table */}
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Common buffers — click to load pKₐ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {BUFFERS.map(b => (
            <button key={b.name} onClick={() => setPKa(b.pKa)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: pKa === b.pKa ? '#eff6ff' : 'white', border: pKa === b.pKa ? '1px solid #bfdbfe' : '1px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: '#111827' }}>{b.name}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{b.use}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Unit converter ───────────────────────────────────────────────

function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState('concentration')
  const [inputValue,     setInputValue]     = useState(1)
  const [inputUnit,      setInputUnit]      = useState('')

  const CATEGORIES = {
    concentration: {
      label: 'Concentration',
      units: [
        { id: 'mol_L',    label: 'mol/L (M)',       toBase: v => v },
        { id: 'mmol_L',   label: 'mmol/L (mM)',     toBase: v => v / 1e3 },
        { id: 'umol_L',   label: 'μmol/L (μM)',     toBase: v => v / 1e6 },
        { id: 'nmol_L',   label: 'nmol/L (nM)',     toBase: v => v / 1e9 },
        { id: 'pmol_L',   label: 'pmol/L (pM)',     toBase: v => v / 1e12 },
        { id: 'percent',  label: '% (w/v)',          toBase: v => v * 10 },  // % w/v → g/L, not mol
        { id: 'mg_mL',    label: 'mg/mL',            toBase: v => v * 1000, note: '÷ MW for molar' },
        { id: 'ug_mL',    label: 'μg/mL',            toBase: v => v,        note: '= mg/L' },
        { id: 'ng_mL',    label: 'ng/mL',            toBase: v => v / 1000, note: '= μg/L' },
        { id: 'pg_mL',    label: 'pg/mL',            toBase: v => v / 1e6,  note: '= ng/L' },
      ],
      baseUnit: 'μg/mL',
      baseId: 'ug_mL',
    },
    mass: {
      label: 'Mass',
      units: [
        { id: 'kg',  label: 'kg',  toBase: v => v * 1e6 },
        { id: 'g',   label: 'g',   toBase: v => v * 1e3 },
        { id: 'mg',  label: 'mg',  toBase: v => v },
        { id: 'ug',  label: 'μg',  toBase: v => v / 1e3 },
        { id: 'ng',  label: 'ng',  toBase: v => v / 1e6 },
        { id: 'pg',  label: 'pg',  toBase: v => v / 1e9 },
        { id: 'lb',  label: 'lb',  toBase: v => v * 453591 },
        { id: 'oz',  label: 'oz',  toBase: v => v * 28349.5 },
      ],
      baseUnit: 'mg',
      baseId: 'mg',
    },
    volume: {
      label: 'Volume',
      units: [
        { id: 'L',   label: 'L',   toBase: v => v * 1e6 },
        { id: 'dL',  label: 'dL',  toBase: v => v * 1e5 },
        { id: 'mL',  label: 'mL',  toBase: v => v * 1e3 },
        { id: 'uL',  label: 'μL',  toBase: v => v },
        { id: 'nL',  label: 'nL',  toBase: v => v / 1e3 },
        { id: 'pL',  label: 'pL',  toBase: v => v / 1e6 },
        { id: 'fl_oz', label: 'fl oz (US)', toBase: v => v * 29573.5 },
      ],
      baseUnit: 'μL',
      baseId: 'uL',
    },
    pressure: {
      label: 'Pressure',
      units: [
        { id: 'Pa',   label: 'Pa',    toBase: v => v },
        { id: 'kPa',  label: 'kPa',   toBase: v => v * 1e3 },
        { id: 'MPa',  label: 'MPa',   toBase: v => v * 1e6 },
        { id: 'bar',  label: 'bar',   toBase: v => v * 1e5 },
        { id: 'mbar', label: 'mbar',  toBase: v => v * 100 },
        { id: 'atm',  label: 'atm',   toBase: v => v * 101325 },
        { id: 'mmHg', label: 'mmHg',  toBase: v => v * 133.322 },
        { id: 'psi',  label: 'psi',   toBase: v => v * 6894.76 },
      ],
      baseUnit: 'Pa',
      baseId: 'Pa',
    },
    temperature: {
      label: 'Temperature',
      units: [
        { id: 'C',  label: '°C',  toBase: v => v + 273.15 },
        { id: 'K',  label: 'K',   toBase: v => v },
        { id: 'F',  label: '°F',  toBase: v => (v - 32) * 5/9 + 273.15 },
      ],
      fromBase: {
        C:  v => v - 273.15,
        K:  v => v,
        F:  v => (v - 273.15) * 9/5 + 32,
      },
      baseUnit: 'K',
      baseId: 'K',
    },
  }

  const cat     = CATEGORIES[activeCategory]
  const fromUnit = inputUnit || cat.baseId
  const fromDef  = cat.units.find(u => u.id === fromUnit)
  const baseVal  = fromDef ? fromDef.toBase(inputValue) : inputValue

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Object.entries(CATEGORIES).map(([id, c]) => (
          <button key={id} onClick={() => { setActiveCategory(id); setInputUnit(CATEGORIES[id].baseId) }}
            style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: activeCategory === id ? '600' : '400', border: activeCategory === id ? '2px solid #2563eb' : '1px solid #d1d5db', background: activeCategory === id ? '#eff6ff' : 'white', color: activeCategory === id ? '#1d4ed8' : '#374151' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Value</label>
          <input type="number" value={inputValue} onChange={e => setInputValue(parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', fontWeight: '700', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>From unit</label>
          <select value={fromUnit} onChange={e => setInputUnit(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', background: 'white', boxSizing: 'border-box' }}>
            {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
        {cat.units.map(u => {
          let converted
          if (activeCategory === 'temperature' && cat.fromBase) {
            converted = cat.fromBase[u.id]?.(baseVal) ?? baseVal
          } else {
            converted = baseVal / u.toBase(1)
          }
          const isActive = u.id === fromUnit
          return (
            <div key={u.id} onClick={() => setInputUnit(u.id)}
              style={{ background: isActive ? '#eff6ff' : '#f9fafb', border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{u.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: isActive ? '#1d4ed8' : '#111827' }}>
                {Math.abs(converted) < 0.0001 || Math.abs(converted) >= 1e8
                  ? converted.toExponential(4)
                  : converted.toFixed(6).replace(/\.?0+$/, '')}
              </div>
              {u.note && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>{u.note}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────

const TABS = [
  { id: 'dilution',   label: '🧫 Dilution',    component: DilutionCalc },
  { id: 'molarity',   label: '⚗️ Molarity',    component: MolarityCalc },
  { id: 'buffer',     label: '🧪 Buffer',       component: BufferCalc },
  { id: 'converter',  label: '🔄 Unit converter', component: UnitConverter },
]

export default function LabPrep() {
  const [activeTab, setActiveTab] = useState('dilution')
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? DilutionCalc

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Lab Prep Toolbox</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Dilution, molarity, buffer preparation, and unit conversion. All calculations are instant and exact — no AI involved.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? '600' : '400',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              background: 'transparent', color: activeTab === tab.id ? '#1d4ed8' : '#6b7280',
              marginBottom: '-1px', transition: 'all 0.1s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </main>
  )
}