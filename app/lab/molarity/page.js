'use client'
import { useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

function MolarityCalc() {
  const [mw,     setMw]     = useState(180.16)
  const [mass,   setMass]   = useState(1.8016)
  const [volume, setVolume] = useState(100)
  const [molar,  setMolar]  = useState(0.1)
  const [solve,  setSolve]  = useState('molarity')

  let result = null
  if (solve === 'molarity' && mw && mass && volume) {
    const moles = (mass / 1000) / mw
    const molarCalc = moles / (volume / 1000)
    result = {
      label: 'Molarity', value: molarCalc, unit: 'mol/L (M)',
      extra: [
        { label: 'moles', value: moles.toExponential(4),        unit: 'mol' },
        { label: 'mM',    value: (molarCalc * 1000).toFixed(4), unit: 'mM'  },
        { label: 'μM',    value: (molarCalc * 1e6).toFixed(2),  unit: 'μM'  },
      ]
    }
  } else if (solve === 'mass' && mw && molar && volume) {
    const massCalc = molar * (volume / 1000) * mw * 1000
    result = {
      label: 'Mass to weigh', value: massCalc, unit: 'mg',
      extra: [
        { label: 'grams', value: (massCalc / 1000).toFixed(6), unit: 'g'  },
        { label: 'μg',    value: (massCalc * 1000).toFixed(2), unit: 'μg' },
      ]
    }
  } else if (solve === 'volume' && mw && mass && molar) {
    const moles = (mass / 1000) / mw
    const volumeCalc = (moles / molar) * 1000
    result = {
      label: 'Volume needed', value: volumeCalc, unit: 'mL',
      extra: [
        { label: 'litres', value: (volumeCalc / 1000).toFixed(6), unit: 'L'  },
        { label: 'μL',     value: (volumeCalc * 1000).toFixed(2), unit: 'μL' },
      ]
    }
  }

  const inp = (label, value, setValue, unit) => (
    <div>
      <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '3px' }}>
        {label} {unit && <span style={{ color: 'rgba(240,244,255,0.2)' }}>({unit})</span>}
      </label>
      <input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value) || 0)}
        style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: `1px solid ${C.border}`,
          fontSize: '14px', fontWeight: '600', color: C.text, boxSizing: 'border-box', background: '#060b18' }} />
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
    <div style={{ background: C.card, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '12px', color: C.textDim, margin: '0 0 12px', fontFamily: 'ui-monospace, monospace' }}>
        M = moles / L = (mass / MW) / volume
      </p>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Solve for</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['molarity','Molarity (M)'],['mass','Mass (mg)'],['volume','Volume (mL)']].map(([val, label]) => (
            <button key={val} onClick={() => setSolve(val)} style={btn(solve === val)}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {inp('Molecular weight', mw, setMw, 'g/mol')}
        {solve !== 'mass'     && inp('Mass', mass, setMass, 'mg')}
        {solve !== 'volume'   && inp('Volume', volume, setVolume, 'mL')}
        {solve !== 'molarity' && inp('Molarity', molar, setMolar, 'mol/L')}
      </div>
      {result && (
        <div style={{ background: `${C.blue}12`, border: `1px solid ${C.blue}44`, borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: C.blueLight }}>{result.label}</span>
            <span style={{ fontSize: '22px', fontWeight: '700', color: C.blueLight }}>
              {result.value < 0.0001 ? result.value.toExponential(4) : result.value.toFixed(6)} {result.unit}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {result.extra?.map(e => (
              <span key={e.label} style={{ fontSize: '12px', color: C.textMid }}>
                {e.label}: <strong style={{ color: C.text }}>{e.value} {e.unit}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MolarityPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>
      <Link href="/lab" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>Molarity calculator</h1>
      <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '1.5rem' }}>Interconvert between mass, moles, molarity, and volume.</p>
      <MolarityCalc />
    </main>
  )
}