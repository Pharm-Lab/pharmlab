'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function Interactions() {
  const { user } = useUser()
  const [input, setInput] = useState('')
  const [drugs, setDrugs] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function addDrug() {
    const trimmed = input.trim()
    if (trimmed && !drugs.includes(trimmed)) {
      setDrugs([...drugs, trimmed])
      setInput('')
    }
  }
  function removeDrug(drug) { setDrugs(drugs.filter(d => d !== drug)); setResults(null) }
  function handleKeyDown(e) { if (e.key === 'Enter') addDrug() }

  async function checkInteractions() {
    if (drugs.length < 2) { setError('Add at least 2 drugs to check interactions.'); return }
    setLoading(true); setError(null); setResults(null)
    try {
      const res = await fetch('/api/check-interaction', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs })
      })
      const data = await res.json()
      if (data.error) { setError(data.error) } else { setResults(data) }
    } catch (err) { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const SEV = {
    major:    { bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.4)',    badge: '#ef4444', text: '#fca5a5' },
    moderate: { bg: 'rgba(234,179,8,0.12)',    border: 'rgba(234,179,8,0.4)',    badge: '#eab308', text: '#fde047' },
    minor:    { bg: 'rgba(34,197,94,0.10)',    border: 'rgba(34,197,94,0.35)',   badge: '#22c55e', text: '#86efac' },
    none:     { bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.08)', badge: '#6b7280', text: 'rgba(240,244,255,0.5)' },
  }

  const C = {
    bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
    blue: '#2a6fdb', blueLight: '#93b4f7',
    text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.4)',
  }

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input::placeholder { color: rgba(240,244,255,0.25); }`}</style>

      <a href="/tools" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>Drug Interaction Checker</h1>
      <p style={{ color: C.textMid, marginBottom: '1.5rem', fontSize: '14px', lineHeight: '1.6' }}>Enter two or more drugs to check for interactions, mechanisms, and exam angles.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type a drug name and press Enter..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '9px', border: `1px solid ${C.border}`, fontSize: '14px', outline: 'none', background: C.card, color: C.text }} />
        <button onClick={addDrug}
          style={{ padding: '10px 18px', background: C.blue, color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
          Add
        </button>
      </div>

      {drugs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {drugs.map(drug => (
            <span key={drug} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(42,111,219,0.15)', color: C.blueLight, padding: '4px 12px', borderRadius: '999px', fontSize: '13px', border: '1px solid rgba(42,111,219,0.3)' }}>
              {drug}
              <button onClick={() => removeDrug(drug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(42,111,219,0.6)', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

      <button onClick={checkInteractions} disabled={loading || drugs.length < 2}
        style={{ width: '100%', padding: '12px', background: drugs.length < 2 ? 'rgba(255,255,255,0.06)' : C.blue, color: drugs.length < 2 ? C.textDim : 'white', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '600', cursor: drugs.length < 2 ? 'not-allowed' : 'pointer', marginBottom: '2rem', letterSpacing: '-0.01em' }}>
        {loading ? 'Checking interactions...' : 'Check Interactions'}
      </button>

      {results && (
        <div>
          <p style={{ fontSize: '14px', color: C.textMid, marginBottom: '1rem', fontStyle: 'italic', lineHeight: '1.6' }}>{results.summary}</p>
          {results.pairs.map((pair, i) => {
            const s = SEV[pair.severity] ?? SEV.none
            return (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: C.text, letterSpacing: '-0.01em' }}>{pair.drug_a} + {pair.drug_b}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', background: s.badge, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{pair.severity}</span>
                </div>
                {pair.enzyme && <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '10px' }}>Enzyme: {pair.enzyme}</p>}
                {[
                  { label: 'Mechanism',     value: pair.mechanism },
                  { label: 'Clinical note', value: pair.clinical_note },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</p>
                    <p style={{ fontSize: '13px', color: C.text, margin: 0, lineHeight: '1.6' }}>{row.value}</p>
                  </div>
                ))}
                {[
                  { label: 'Memory hook', value: pair.memory_hook, italic: true },
                  { label: 'Exam angle',  value: pair.exam_angle },
                ].map(row => row.value && (
                  <div key={row.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '9px', padding: '10px 12px', marginBottom: '8px', border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</p>
                    <p style={{ fontSize: '13px', color: C.text, margin: 0, fontStyle: row.italic ? 'italic' : 'normal', lineHeight: '1.6' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}