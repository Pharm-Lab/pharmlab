'use client'
import { useState } from 'react'

const EXAMPLE_EXERCISES = [
  {
    label: 'Emax PD model',
    text: 'For a drug whose effect is in equilibrium with its plasma drug concentration and that has the following PD parameters: EC50 = 100 mg/L, n=1. Calculate the percent of maximum therapeutic effect when the drug (albuterol) is at a plasma concentration of 50 mg/L.'
  },
  {
    label: 'IV bolus PK',
    text: 'Ciprofloxacin is a quinolone antibiotic with activity against a broad spectrum of bacteria. It displays linear pharmacokinetics. When 100mg of ciprofloxacin was given as an i.v. bolus dose, the following plasma concentration-time relationship was observed: C = 7.14 · e^(−0.173·t), where C is in mg/L and t in hours. Calculate: Vd, elimination half-life, total AUC, total clearance, and concentration in plasma at 20 minutes after a bolus dose of 250mg.'
  },
  {
    label: 'Renal impairment dosing',
    text: 'A patient with severe renal impairment (CrCL = 20 mL/min) requires treatment with a drug that is 80% renally eliminated unchanged. In a normal patient (CrCL = 120 mL/min), the drug has a total clearance of 6 L/h and a volume of distribution of 42L. Calculate the adjusted clearance, half-life, and recommend a dosing interval adjustment to maintain the same Css as in a normal patient receiving 500mg every 8 hours.'
  },
  {
    label: 'Oral bioavailability',
    text: 'A drug is given as a 200mg IV bolus and produces an AUC of 80 mg·h/L. The same drug given orally at 500mg produces an AUC of 120 mg·h/L. Calculate the absolute bioavailability. If the drug undergoes significant first-pass metabolism with a hepatic extraction ratio of 0.4, what fraction of the absorbed dose survives first-pass?'
  },
]

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
    setLoading(true)
    setError(null)
    setResult(null)
    setHistory(null)

    try {
      const res = await fetch('/api/solve-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseText: exercise })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setHistory([
        { role: 'user', content: `Solve this PK/PD exercise step by step:\n\n${exercise}` },
        { role: 'assistant', content: data.rawAssistant }
      ])
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function askFollowUp() {
    if (!followUp.trim() || !history) return
    setFollowUpLoading(true)
    try {
      const res = await fetch('/api/solve-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUp, history })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setHistory(prev => [
        ...prev,
        { role: 'user', content: followUp },
        { role: 'assistant', content: data.rawAssistant }
      ])
      setFollowUp('')
    } catch (e) {
      setError('Something went wrong.')
    } finally {
      setFollowUpLoading(false)
    }
  }

  const severityStyle = {
    major:    { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
    moderate: { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
    default:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>← Back to home</a>
      <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '1rem 0 0.25rem' }}>PK/PD Exercise Helper</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>Paste any pharmacokinetics or pharmacodynamics exercise — get full step-by-step working with formulas, substitutions, and exam insights.</p>

      {/* Example exercises */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Load an example:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {EXAMPLE_EXERCISES.map((ex, i) => (
            <button key={i} onClick={() => setExercise(ex.text)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', border: '1px solid #d1d5db', background: 'transparent', color: '#374151', cursor: 'pointer' }}>
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <textarea
        value={exercise}
        onChange={e => setExercise(e.target.value)}
        placeholder="Paste your PK/PD exercise here..."
        style={{ width: '100%', minHeight: '140px', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', lineHeight: '1.6' }}
      />
      <button
        onClick={solveExercise}
        disabled={loading || !exercise.trim()}
        style={{ width: '100%', padding: '12px', background: !exercise.trim() ? '#e5e7eb' : '#2563eb', color: !exercise.trim() ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '500', cursor: !exercise.trim() ? 'not-allowed' : 'pointer', marginBottom: '2rem' }}
      >
        {loading ? 'Solving...' : 'Solve exercise →'}
      </button>

      {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

      {result && (
        <div>
          {/* Topic + model */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Topic</p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px' }}>{result.topic}</p>
            <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}><strong>Model:</strong> {result.model_used}</p>
          </div>

          {/* Given parameters */}
          {result.given?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Given</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                {result.given.map((g, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: '600', color: '#2563eb', fontSize: '13px' }}>{g.symbol} = {g.value}</span>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{g.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asked */}
          {result.asked?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Calculate</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.asked.map((q, i) => (
                  <span key={i} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '3px 12px', fontSize: '12px', color: '#374151' }}>{q}</span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {result.steps?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Step-by-step working</p>
              {result.steps.map((step, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '8px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb', color: 'white', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{step.title}</span>
                  </div>
                  {step.formula && (
                    <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px', fontFamily: 'monospace', fontSize: '13px', color: '#1e40af' }}>
                      {step.formula}
                    </div>
                  )}
                  {step.substitution && (
                    <div style={{ background: '#fff7ed', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px', fontFamily: 'monospace', fontSize: '13px', color: '#9a3412' }}>
                      {step.substitution}
                    </div>
                  )}
                  {step.result && (
                    <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '600', color: '#15803d' }}>
                      {step.result}
                    </div>
                  )}
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{step.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Final answers */}
          {result.answers?.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#15803d', marginBottom: '10px' }}>Final answers</p>
              {result.answers.map((a, i) => (
                <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < result.answers.length - 1 ? '1px solid #bbf7d0' : 'none' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px' }}>{a.question}</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#15803d', margin: '0 0 2px', fontFamily: 'monospace' }}>{a.answer}</p>
                  {a.note && <p style={{ fontSize: '12px', color: '#374151', margin: 0, fontStyle: 'italic' }}>{a.note}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Exam insight */}
          {result.exam_insight && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#854d0e', marginBottom: '4px' }}>Exam insight</p>
              <p style={{ fontSize: '13px', color: '#854d0e', margin: 0 }}>{result.exam_insight}</p>
            </div>
          )}

          {/* Follow-up questions */}
          {result.follow_up_questions?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Explore further</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.follow_up_questions.map((q, i) => (
                  <button key={i} onClick={() => setFollowUp(q)} style={{ textAlign: 'left', padding: '9px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                    {q} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up input */}
          {history && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem 1.25rem', background: '#f9fafb' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Ask a follow-up question</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askFollowUp()}
                  placeholder="e.g. What happens if the dose is doubled?"
                  style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
                />
                <button
                  onClick={askFollowUp}
                  disabled={followUpLoading || !followUp.trim()}
                  style={{ padding: '9px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
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