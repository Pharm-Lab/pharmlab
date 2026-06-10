'use client'
import { useState } from 'react'
import Link from 'next/link'

function DilutionCalc() {
  const [mode,   setMode]   = useState('findV1')
  const [c1,     setC1]     = useState(100)
  const [v1,     setV1]     = useState('')
  const [c2,     setC2]     = useState(10)
  const [v2,     setV2]     = useState(100)
  const [unit,   setUnit]   = useState('mg/mL')
  const [serialStart,  setSerialStart]  = useState(1000)
  const [serialFactor, setSerialFactor] = useState(2)
  const [serialSteps,  setSerialSteps]  = useState(8)

  const units = ['mg/mL', 'μg/mL', 'ng/mL', 'mM', 'μM', 'nM', '%', 'mol/L']

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

  const btn = active => ({
    padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px',
    fontWeight: active ? '600' : '400',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    background: active ? '#eff6ff' : 'white',
    color: active ? '#1d4ed8' : '#374151',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>C₁V₁ = C₂V₂</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>Solve for any one variable given the other three.</p>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Solve for</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[['findV1', 'V₁ (stock volume)'], ['findC2', 'C₂ (final conc.)'], ['findV2', 'V₂ (final volume)']].map(([val, label]) => (
              <button key={val} onClick={() => setMode(val)} style={btn(mode === val)}>{label}</button>
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

      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Serial dilution</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>Generate a dilution series from a starting concentration.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {inp('Starting concentration', serialStart, setSerialStart)}
          {inp('Dilution factor', serialFactor, setSerialFactor)}
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

export default function DilutionPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <Link href="/lab" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Dilution calculator</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem' }}>C₁V₁ = C₂V₂ solver and serial dilution generator.</p>
      <DilutionCalc />
    </main>
  )
}