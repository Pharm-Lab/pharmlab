'use client'
import { useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: '7px',
  border: `1px solid ${C.border}`, fontSize: '14px', fontWeight: '600',
  color: C.text, boxSizing: 'border-box', background: '#060b18',
}

function DilutionCalc() {
  const [mode,         setMode]         = useState('findV1')
  const [c1,           setC1]           = useState(100)
  const [v1,           setV1]           = useState('')
  const [c2,           setC2]           = useState(10)
  const [v2,           setV2]           = useState(100)
  const [unit,         setUnit]         = useState('mg/mL')
  const [serialStart,  setSerialStart]  = useState(1000)
  const [serialFactor, setSerialFactor] = useState(2)
  const [serialSteps,  setSerialSteps]  = useState(8)

  const units = ['mg/mL', 'μg/mL', 'ng/mL', 'mM', 'μM', 'nM', '%', 'mol/L']

  let result = null, dilutionFactor = null, solventVolume = null
  if (mode === 'findV1' && c1 && c2 && v2) {
    const v1calc = (c2 * v2) / c1
    result = { label: 'V₁ (volume of stock to take)', value: v1calc, unit: 'mL' }
    dilutionFactor = c1 / c2; solventVolume = v2 - v1calc
  } else if (mode === 'findC2' && c1 && v1 && v2) {
    const c2calc = (c1 * parseFloat(v1)) / v2
    result = { label: 'C₂ (final concentration)', value: c2calc, unit }
    dilutionFactor = c1 / c2calc; solventVolume = v2 - parseFloat(v1)
  } else if (mode === 'findV2' && c1 && v1 && c2) {
    const v2calc = (c1 * parseFloat(v1)) / c2
    result = { label: 'V₂ (final volume needed)', value: v2calc, unit: 'mL' }
    dilutionFactor = c1 / c2; solventVolume = v2calc - parseFloat(v1)
  }

  const serialConcs = Array.from({ length: serialSteps }, (_, i) =>
    serialStart / Math.pow(serialFactor, i)
  )

  const inp = (label, value, setValue) => (
    <div>
      <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '3px' }}>{label}</label>
      <input type="number" value={value} onChange={e => setValue(e.target.value)}
        style={inputStyle} />
    </div>
  )

  const btn = active => ({
    padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px',
    fontWeight: active ? '600' : '400',
    border: active ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
    background: active ? `${C.blue}18` : 'rgba(255,255,255,0.04)',
    color: active ? C.blueLight : C.textMid,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* C1V1 = C2V2 */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>C₁V₁ = C₂V₂</h3>
        <p style={{ fontSize: '12px', color: C.textDim, margin: '0 0 12px' }}>Solve for any one variable given the other three.</p>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Solve for</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[['findV1','V₁ (stock volume)'],['findC2','C₂ (final conc.)'],['findV2','V₂ (final volume)']].map(([val, label]) => (
              <button key={val} onClick={() => setMode(val)} style={btn(mode === val)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Concentration unit</label>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, fontSize: '13px', background: '#060b18', color: C.text }}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {inp('C₁ — Stock concentration (' + unit + ')', c1, setC1)}
          {mode === 'findV1'
            ? <div style={{ background: `${C.blue}10`, border: `1px dashed ${C.blue}44`, borderRadius: '7px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: C.blueLight }}>V₁ = ?</div>
            : inp('V₁ — Stock volume taken (mL)', v1, setV1)}
          {mode === 'findC2'
            ? <div style={{ background: `${C.blue}10`, border: `1px dashed ${C.blue}44`, borderRadius: '7px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: C.blueLight }}>C₂ = ?</div>
            : inp('C₂ — Final concentration (' + unit + ')', c2, setC2)}
          {mode === 'findV2'
            ? <div style={{ background: `${C.blue}10`, border: `1px dashed ${C.blue}44`, borderRadius: '7px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: C.blueLight }}>V₂ = ?</div>
            : inp('V₂ — Final volume (mL)', v2, setV2)}
        </div>

        {result && (
          <div style={{ background: `${C.blue}12`, border: `1px solid ${C.blue}44`, borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: C.blueLight }}>{result.label}</span>
              <span style={{ fontSize: '22px', fontWeight: '700', color: C.blueLight }}>
                {result.value < 0.001 ? result.value.toExponential(3) : result.value.toFixed(4)} {result.unit}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: C.textMid }}>
              <span>Dilution factor: <strong style={{ color: C.text }}>{dilutionFactor?.toFixed(2)}×</strong></span>
              {solventVolume != null && solventVolume > 0 && (
                <span>Solvent to add: <strong style={{ color: C.text }}>{solventVolume.toFixed(4)} mL</strong></span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Serial dilution */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>Serial dilution</h3>
        <p style={{ fontSize: '12px', color: C.textDim, margin: '0 0 12px' }}>Generate a dilution series from a starting concentration.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {inp('Starting concentration', serialStart, setSerialStart)}
          {inp('Dilution factor', serialFactor, setSerialFactor)}
          {inp('Number of steps', serialSteps, setSerialSteps)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {serialConcs.map((conc, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 10px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '2px' }}>Step {i + 1}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
                {conc >= 0.001 ? conc.toFixed(4) : conc.toExponential(2)}
              </div>
              <div style={{ fontSize: '10px', color: C.textDim }}>1:{Math.pow(serialFactor, i).toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DilutionPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input::placeholder,select option { color:rgba(240,244,255,0.25); background:#060b18; }`}</style>
      <Link href="/lab" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>Dilution calculator</h1>
      <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '1.5rem' }}>C₁V₁ = C₂V₂ solver and serial dilution generator.</p>
      <DilutionCalc />
    </main>
  )
}