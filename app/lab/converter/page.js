'use client'
import { useState } from 'react'
import Link from 'next/link'

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
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Object.entries(CATEGORIES).map(([id, c]) => (
          <button key={id} onClick={() => { setActiveCategory(id); setInputUnit(CATEGORIES[id].baseId) }}
            style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              fontWeight: activeCategory === id ? '600' : '400',
              border: activeCategory === id ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: activeCategory === id ? '#eff6ff' : 'white',
              color: activeCategory === id ? '#1d4ed8' : '#374151' }}>
            {c.label}
          </button>
        ))}
      </div>

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

export default function ConverterPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <Link href="/lab" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Unit converter</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem' }}>Concentration, mass, volume, pressure, and temperature conversions.</p>
      <UnitConverter />
    </main>
  )
}