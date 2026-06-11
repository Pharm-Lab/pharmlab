'use client'
import { useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState('concentration')
  const [inputValue,     setInputValue]     = useState(1)
  const [inputUnit,      setInputUnit]      = useState('')

  const CATEGORIES = {
    concentration: {
      label: 'Concentration',
      units: [
        { id: 'mol_L',   label: 'mol/L (M)',   toBase: v => v },
        { id: 'mmol_L',  label: 'mmol/L (mM)', toBase: v => v / 1e3 },
        { id: 'umol_L',  label: 'μmol/L (μM)', toBase: v => v / 1e6 },
        { id: 'nmol_L',  label: 'nmol/L (nM)', toBase: v => v / 1e9 },
        { id: 'pmol_L',  label: 'pmol/L (pM)', toBase: v => v / 1e12 },
        { id: 'mg_mL',   label: 'mg/mL',       toBase: v => v * 1000, note: '÷ MW for molar' },
        { id: 'ug_mL',   label: 'μg/mL',       toBase: v => v },
        { id: 'ng_mL',   label: 'ng/mL',       toBase: v => v / 1000 },
        { id: 'pg_mL',   label: 'pg/mL',       toBase: v => v / 1e6 },
      ],
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
      ],
      baseId: 'uL',
    },
    pressure: {
      label: 'Pressure',
      units: [
        { id: 'Pa',   label: 'Pa',   toBase: v => v },
        { id: 'kPa',  label: 'kPa',  toBase: v => v * 1e3 },
        { id: 'bar',  label: 'bar',  toBase: v => v * 1e5 },
        { id: 'atm',  label: 'atm',  toBase: v => v * 101325 },
        { id: 'mmHg', label: 'mmHg', toBase: v => v * 133.322 },
        { id: 'psi',  label: 'psi',  toBase: v => v * 6894.76 },
      ],
      baseId: 'Pa',
    },
    temperature: {
      label: 'Temperature',
      units: [
        { id: 'C', label: '°C', toBase: v => v + 273.15 },
        { id: 'K', label: 'K',  toBase: v => v },
        { id: 'F', label: '°F', toBase: v => (v - 32) * 5/9 + 273.15 },
      ],
      fromBase: { C: v => v - 273.15, K: v => v, F: v => (v - 273.15) * 9/5 + 32 },
      baseId: 'K',
    },
  }

  const cat      = CATEGORIES[activeCategory]
  const fromUnit = inputUnit || cat.baseId
  const fromDef  = cat.units.find(u => u.id === fromUnit)
  const baseVal  = fromDef ? fromDef.toBase(inputValue) : inputValue

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Object.entries(CATEGORIES).map(([id, c]) => (
          <button key={id} onClick={() => { setActiveCategory(id); setInputUnit(CATEGORIES[id].baseId) }}
            style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              fontWeight: activeCategory === id ? '600' : '400',
              border: activeCategory === id ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
              background: activeCategory === id ? `${C.blue}18` : 'rgba(255,255,255,0.04)',
              color: activeCategory === id ? C.blueLight : C.textMid }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '3px' }}>Value</label>
          <input type="number" value={inputValue} onChange={e => setInputValue(parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`,
              fontSize: '16px', fontWeight: '700', color: C.text, boxSizing: 'border-box', background: '#060b18' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '3px' }}>From unit</label>
          <select value={fromUnit} onChange={e => setInputUnit(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`,
              fontSize: '14px', color: C.text, background: '#060b18', boxSizing: 'border-box' }}>
            {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
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
              style={{ background: isActive ? `${C.blue}18` : C.card,
                border: `1px solid ${isActive ? C.blue + '55' : C.border}`,
                borderRadius: '8px', padding: '10px 12px', cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s' }}>
              <div style={{ fontSize: '11px', color: C.textDim, marginBottom: '2px' }}>{u.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: isActive ? C.blueLight : C.text }}>
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

export default function ConverterPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>
      <Link href="/lab" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>Unit converter</h1>
      <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '1.5rem' }}>Concentration, mass, volume, pressure, and temperature conversions.</p>
      <UnitConverter />
    </main>
  )
}