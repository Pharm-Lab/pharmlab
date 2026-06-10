'use client'
import { useState } from 'react'
import Link from 'next/link'

function BufferCalc() {
  const [pKa,   setPKa]   = useState(7.2)
  const [pH,    setPH]    = useState(7.4)
  const [mode,  setMode]  = useState('ratio')
  const [acidV, setAcidV] = useState(1)
  const [baseV, setBaseV] = useState(1)

  const ratio        = Math.pow(10, pH - pKa)
  const pHfromRatio  = pKa + Math.log10(baseV / acidV)
  const percentBase  = (ratio / (1 + ratio)) * 100

  const BUFFERS = [
    { name: 'Phosphate (pKa 7.20)',   pKa: 7.20, use: 'Biological buffers, cell culture' },
    { name: 'Tris-HCl (pKa 8.06)',    pKa: 8.06, use: 'Molecular biology, electrophoresis' },
    { name: 'HEPES (pKa 7.55)',       pKa: 7.55, use: 'Cell culture, does not penetrate cells' },
    { name: 'Citrate (pKa 6.40)',     pKa: 6.40, use: 'Low pH buffers, pharma formulations' },
    { name: 'Acetate (pKa 4.76)',     pKa: 4.76, use: 'pH 3.6–5.6 range' },
    { name: 'Bicarbonate (pKa 6.35)', pKa: 6.35, use: 'Physiological, CO₂ equilibrium' },
    { name: 'MOPS (pKa 7.20)',        pKa: 7.20, use: 'Cell culture, good biological buffer' },
    { name: 'MES (pKa 6.15)',         pKa: 6.15, use: 'pH 5.5–6.7 range' },
  ]

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
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Henderson-Hasselbalch</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>pH = pKₐ + log([A⁻]/[HA])</p>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mode</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setMode('ratio')} style={btn(mode === 'ratio')}>Find base:acid ratio</button>
            <button onClick={() => setMode('ph')}    style={btn(mode === 'ph')}>Find pH from volumes</button>
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
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Volume of base (parts)</label>
                <input type="number" value={baseV} step={0.1} onChange={e => setBaseV(parseFloat(e.target.value) || 1)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', color: '#111827', boxSizing: 'border-box', background: 'white' }} />
              </div>
            </>
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
                Mix {ratio.toFixed(3)} parts base : 1 part acid — {percentBase.toFixed(1)}% base form
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
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Ratio [base]/[acid] = {(baseV / acidV).toFixed(4)}</div>
            </>
          )}
        </div>
      </div>

      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>Common buffers — click to load pKₐ</h3>
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

export default function BufferPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <Link href="/lab" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Buffer preparation</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem' }}>Henderson-Hasselbalch calculator and common buffer reference.</p>
      <BufferCalc />
    </main>
  )
}