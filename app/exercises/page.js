'use client'
import { useState } from 'react'

const EXAMPLE_EXERCISES = [
  { label: 'Emax PD model', text: 'For a drug whose effect is in equilibrium with its plasma drug concentration and that has the following PD parameters: EC50 = 100 mg/L, n=1. Calculate the percent of maximum therapeutic effect when the drug (albuterol) is at a plasma concentration of 50 mg/L.' },
  { label: 'IV bolus PK', text: 'Ciprofloxacin is a quinolone antibiotic with activity against a broad spectrum of bacteria. It displays linear pharmacokinetics. When 100mg of ciprofloxacin was given as an i.v. bolus dose, the following plasma concentration-time relationship was observed: C = 7.14 · e^(−0.173·t), where C is in mg/L and t in hours. Calculate: Vd, elimination half-life, total AUC, total clearance, and concentration in plasma at 20 minutes after a bolus dose of 250mg.' },
  { label: 'Renal impairment dosing', text: 'A patient with severe renal impairment (CrCL = 20 mL/min) requires treatment with a drug that is 80% renally eliminated unchanged. In a normal patient (CrCL = 120 mL/min), the drug has a total clearance of 6 L/h and a volume of distribution of 42L. Calculate the adjusted clearance, half-life, and recommend a dosing interval adjustment to maintain the same Css as in a normal patient receiving 500mg every 8 hours.' },
  { label: 'Oral bioavailability', text: 'A drug is given as a 200mg IV bolus and produces an AUC of 80 mg·h/L. The same drug given orally at 500mg produces an AUC of 120 mg·h/L. Calculate the absolute bioavailability. If the drug undergoes significant first-pass metabolism with a hepatic extraction ratio of 0.4, what fraction of the absorbed dose survives first-pass?' },
]

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.4)',
}

export default function Exercises() {
  const [exercise, setExercise] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(null)
  const [followUp, setFollowUp] = useState('')
  const [followUpLoading, setFollowUpLoading] = useState(false)

  async function solveExercise() {
    if (!exercise.trim()) return
    setLoading(true); setError(null); setResult(null); setHistory(null)
    try {
      const res = await fetch('/api/solve-exercise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseText: exercise })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setHistory([
        { role: 'user', content: `Solve this PK/PD exercise step by step:\n\n${exercise}` },
        { role: 'assistant', content: data.rawAssistant }
      ])
    } catch (e) { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  async function askFollowUp() {
    if (!followUp.trim() || !history) return
    setFollowUpLoading(true)
    try {
      const res = await fetch('/api/solve-exercise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUp, history })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setHistory(prev => [...prev, { role: 'user', content: followUp }, { role: 'assistant', content: data.rawAssistant }])
      setFollowUp('')
    } catch (e) { setError('Something went wrong.') }
    finally { setFollowUpLoading(false) }
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } textarea::placeholder, input::placeholder { color: rgba(240,244,255,0.25); }`}</style>

      <a href="/tools" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>PK/PD Exercise Helper</h1>
      <p style={{ color: C.textMid, fontSize: '14px', marginBottom: '1.5rem', lineHeight: '1.6' }}>Paste any pharmacokinetics or pharmacodynamics exercise — get full step-by-step working with formulas, substitutions, and exam insights.</p>

      {/* Example pills */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '6px' }}>Load an example:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {EXAMPLE_EXERCISES.map((ex, i) => (
            <button key={i} onClick={() => setExercise(ex.text)}
              style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', border: `1px solid ${C.border}`, background: 'transparent', color: 'rgba(240,244,255,0.6)', cursor: 'pointer' }}>
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <textarea value={exercise} onChange={e => setExercise(e.target.value)}
        placeholder="Paste your PK/PD exercise here..."
        style={{ width: '100%', minHeight: '140px', padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', lineHeight: '1.6', background: C.card, color: C.text }} />
      <button onClick={solveExercise} disabled={loading || !exercise.trim()}
        style={{ width: '100%', padding: '12px', background: !exercise.trim() ? 'rgba(255,255,255,0.06)' : C.blue, color: !exercise.trim() ? C.textDim : 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: !exercise.trim() ? 'not-allowed' : 'pointer', marginBottom: '2rem', letterSpacing: '-0.01em' }}>
        {loading ? 'Solving...' : 'Solve exercise →'}
      </button>

      {error && <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

      {result && (
        <div>
          {/* Topic + model */}
          <div style={{ background: 'rgba(42,111,219,0.12)', border: '1px solid rgba(42,111,219,0.3)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '11px', color: C.textDim, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Topic</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: C.blueLight, margin: '0 0 8px' }}>{result.topic}</p>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}><strong style={{ color: 'rgba(240,244,255,0.7)' }}>Model:</strong> {result.model_used}</p>
          </div>

          {/* Given parameters */}
          {result.given?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Given</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                {result.given.map((g, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: '8px', padding: '8px 12px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: '700', color: C.blueLight, fontSize: '13px' }}>{g.symbol} = {g.value}</span>
                    <p style={{ fontSize: '11px', color: C.textDim, margin: '2px 0 0' }}>{g.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asked */}
          {result.asked?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Calculate</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.asked.map((q, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: '999px', padding: '3px 12px', fontSize: '12px', color: 'rgba(240,244,255,0.7)' }}>{q}</span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {result.steps?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step-by-step working</p>
              {result.steps.map((step, i) => (
                <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '8px', background: C.card }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: C.blue, color: 'white', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>{step.title}</span>
                  </div>
                  {step.formula && (
                    <div style={{ background: '#060b18', borderRadius: '7px', padding: '8px 12px', marginBottom: '6px', fontFamily: 'monospace', fontSize: '13px', color: C.blueLight, border: `1px solid ${C.border}` }}>
                      {step.formula}
                    </div>
                  )}
                  {step.substitution && (
                    <div style={{ background: 'rgba(249,115,22,0.1)', borderRadius: '7px', padding: '8px 12px', marginBottom: '6px', fontFamily: 'monospace', fontSize: '13px', color: '#fdba74', border: '1px solid rgba(249,115,22,0.25)' }}>
                      {step.substitution}
                    </div>
                  )}
                  {step.result && (
                    <div style={{ background: 'rgba(22,163,74,0.12)', borderRadius: '7px', padding: '8px 12px', marginBottom: '8px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#86efac', border: '1px solid rgba(22,163,74,0.3)' }}>
                      {step.result}
                    </div>
                  )}
                  <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: '1.6' }}>{step.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Final answers */}
          {result.answers?.length > 0 && (
            <div style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#86efac', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Final answers</p>
              {result.answers.map((a, i) => (
                <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < result.answers.length - 1 ? '1px solid rgba(22,163,74,0.2)' : 'none' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.5)', margin: '0 0 2px' }}>{a.question}</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#86efac', margin: '0 0 2px', fontFamily: 'monospace' }}>{a.answer}</p>
                  {a.note && <p style={{ fontSize: '12px', color: C.textMid, margin: 0, fontStyle: 'italic' }}>{a.note}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Exam insight */}
          {result.exam_insight && (
            <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#fde047', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exam insight</p>
              <p style={{ fontSize: '13px', color: '#fde047', margin: 0, lineHeight: '1.6' }}>{result.exam_insight}</p>
            </div>
          )}

          {/* Follow-up suggestions */}
          {result.follow_up_questions?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Explore further</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.follow_up_questions.map((q, i) => (
                  <button key={i} onClick={() => setFollowUp(q)}
                    style={{ textAlign: 'left', padding: '9px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '9px', fontSize: '13px', color: 'rgba(240,244,255,0.7)', cursor: 'pointer' }}>
                    {q} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up input */}
          {history && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.25rem', background: C.card }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ask a follow-up</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={followUp} onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askFollowUp()}
                  placeholder="e.g. What happens if the dose is doubled?"
                  style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', background: '#060b18', color: C.text }} />
                <button onClick={askFollowUp} disabled={followUpLoading || !followUp.trim()}
                  style={{ padding: '9px 18px', background: C.blue, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: '600' }}>
                  {followUpLoading ? '...' : 'Ask →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}