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

  function removeDrug(drug) {
    setDrugs(drugs.filter(d => d !== drug))
    setResults(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addDrug()
  }

  async function checkInteractions() {
    if (drugs.length < 2) {
      setError('Add at least 2 drugs to check interactions.')
      return
    }
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResults(data)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const severityColor = {
    major: '#fee2e2',
    moderate: '#fef9c3',
    minor: '#dcfce7',
    none: '#f3f4f6'
  }

  const severityBorder = {
    major: '#ef4444',
    moderate: '#eab308',
    minor: '#22c55e',
    none: '#d1d5db'
  }

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>← Back to home</a>
      <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '1rem 0 0.25rem' }}>Drug Interaction Checker</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '14px' }}>Enter two or more drugs to check for interactions, mechanisms, and exam angles.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a drug name and press Enter..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
        />
        <button
          onClick={addDrug}
          style={{ padding: '10px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          Add
        </button>
      </div>

      {drugs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {drugs.map(drug => (
            <span key={drug} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', border: '1px solid #bfdbfe' }}>
              {drug}
              <button onClick={() => removeDrug(drug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
      )}

      <button
        onClick={checkInteractions}
        disabled={loading || drugs.length < 2}
        style={{ width: '100%', padding: '12px', background: drugs.length < 2 ? '#e5e7eb' : '#2563eb', color: drugs.length < 2 ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: drugs.length < 2 ? 'not-allowed' : 'pointer', marginBottom: '2rem' }}
      >
        {loading ? 'Checking interactions...' : 'Check Interactions'}
      </button>

      {results && (
        <div>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1rem', fontStyle: 'italic' }}>{results.summary}</p>
          {results.pairs.map((pair, i) => (
            <div key={i} style={{ background: severityColor[pair.severity], border: `1px solid ${severityBorder[pair.severity]}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{pair.drug_a} + {pair.drug_b}</span>
                <span style={{ fontSize: '12px', fontWeight: '500', padding: '2px 10px', borderRadius: '999px', background: severityBorder[pair.severity], color: 'white', textTransform: 'uppercase' }}>{pair.severity}</span>
              </div>
              {pair.enzyme && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Enzyme: {pair.enzyme}</p>
              )}
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Mechanism</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{pair.mechanism}</p>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Clinical note</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{pair.clinical_note}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Memory hook</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0, fontStyle: 'italic' }}>{pair.memory_hook}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Exam angle</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{pair.exam_angle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}