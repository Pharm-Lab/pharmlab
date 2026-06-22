'use client'
import { useState } from 'react'
import { createClerkSupabaseClient } from '../../lib/supabase'
import { awardXp } from '../../lib/xp'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const TOPICS = ['PK/PD', 'Pharmacology', 'Lab techniques', 'Statistics', 'Formulation', 'ADME', 'Drug design', 'Regulatory', 'Other']
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function QuizUploadModal({ session, user, groupId = null, onClose, onUploaded }) {
  const [step,        setStep]        = useState(1) // 1=type, 2=question, 3=answer
  const [qType,       setQType]       = useState('free_text') // 'free_text' | 'multiple_choice'
  const [title,       setTitle]       = useState('')
  const [content,     setContent]     = useState('')
  const [topic,       setTopic]       = useState('PK/PD')
  const [difficulty,  setDifficulty]  = useState('medium')
  const [university,  setUniversity]  = useState('')
  const [answer,      setAnswer]      = useState('')
  const [explanation, setExplanation] = useState('')
  const [options,     setOptions]     = useState([
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ])
  const [correctOption, setCorrectOption] = useState('A')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  function db() { return createClerkSupabaseClient(session) }

  function updateOption(i, text) {
    setOptions(opts => opts.map((o, idx) => idx === i ? { ...o, text } : o))
  }

  async function submit() {
    if (!title.trim()) return setError('Add a title')
    if (!content.trim()) return setError('Add the question text')
    if (qType === 'free_text' && !answer.trim()) return setError('Add an answer')
    if (qType === 'multiple_choice' && options.some(o => !o.text.trim())) return setError('Fill in all options')

    setSubmitting(true); setError('')

    const payload = {
      clerk_id: user.id,
      title: title.trim(),
      content: content.trim(),
      topic,
      difficulty,
      university: university.trim() || null,
      group_id: groupId || null,
      question_type: qType,
      answer: qType === 'free_text' ? answer.trim() : correctOption,
      explanation: explanation.trim() || null,
      options: qType === 'multiple_choice' ? options : null,
      correct_option: qType === 'multiple_choice' ? correctOption : null,
      upvotes: 0,
      downvotes: 0,
    }

    const { error: err } = await db().from('questions').insert(payload)
    if (err) { setError('Could not upload — try again'); setSubmitting(false); return }

    await awardXp(session, user.id, 20, 'question_upload')
    setSubmitting(false)
    onUploaded?.()
    onClose()
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#060b18', color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', zIndex: 999, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(560px, calc(100vw - 2rem))', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', fontFamily: "'Inter',system-ui,sans-serif", maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.card, zIndex: 1 }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: C.text, margin: '0 0 2px', letterSpacing: '-0.02em' }}>Upload a question</h2>
            <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>Step {step} of 3 — {step === 1 ? 'Question type' : step === 2 ? 'Question details' : 'Answer & explanation'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* Step 1 — Question type */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 4px' }}>What kind of question are you uploading?</p>
              {[
                { id: 'free_text',       label: 'Free text',       desc: 'Open-ended question with a written answer. Best for calculation problems, explain-type questions.' },
                { id: 'multiple_choice', label: 'Multiple choice', desc: 'Four options (A–D) with one correct answer. Best for knowledge checks and definitions.' },
              ].map(t => (
                <button key={t.id} onClick={() => setQType(t.id)}
                  style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${qType === t.id ? C.blue + '88' : C.border}`, background: qType === t.id ? `${C.blue}12` : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: qType === t.id ? C.blueLight : C.text, marginBottom: '4px' }}>{t.label}</div>
                  <div style={{ fontSize: '12px', color: C.textDim }}>{t.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Question details */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Title <span style={{ color: '#fca5a5' }}>*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short descriptive title" maxLength={120} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Question <span style={{ color: '#fca5a5' }}>*</span></label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write the full question here..." rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
              </div>
              {qType === 'multiple_choice' && (
                <div>
                  <label style={labelStyle}>Options <span style={{ color: '#fca5a5' }}>*</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((o, i) => (
                      <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: C.textDim, minWidth: '20px' }}>{o.label}</span>
                        <input value={o.text} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${o.label}`} style={{ ...inputStyle }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Topic</label>
                  <select value={topic} onChange={e => setTopic(e.target.value)} style={{ ...inputStyle }}>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Difficulty</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...inputStyle }}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>University <span style={{ color: C.textDim }}>(optional)</span></label>
                <input value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. Leiden University" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Step 3 — Answer & explanation */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {qType === 'free_text' ? (
                <div>
                  <label style={labelStyle}>Answer <span style={{ color: '#fca5a5' }}>*</span></label>
                  <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write the model answer..." rows={5}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Correct option <span style={{ color: '#fca5a5' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {options.map(o => (
                      <button key={o.label} onClick={() => setCorrectOption(o.label)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${correctOption === o.label ? '#86efac' : C.border}`, background: correctOption === o.label ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.02)', color: correctOption === o.label ? '#86efac' : C.textDim, fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#86efac', margin: 0 }}><strong>{correctOption}:</strong> {options.find(o => o.label === correctOption)?.text || '—'}</p>
                  </div>
                </div>
              )}
              <div>
                <label style={labelStyle}>Explanation <span style={{ color: C.textDim }}>(optional but encouraged)</span></label>
                <textarea value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Why is this the answer? Add context, formulas, or references..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
              </div>
              {groupId && (
                <div style={{ background: `${C.blue}08`, border: `1px solid ${C.blue}28`, borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '12px', color: C.blueLight, margin: 0 }}>📢 This question will be shared in your group. It will also appear in the global quiz bank unless your group has disabled sharing.</p>
                </div>
              )}
              {error && <p style={{ fontSize: '12px', color: '#fca5a5', margin: 0 }}>{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'space-between' }}>
            <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
              style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            {step < 3
              ? <button onClick={() => { setError(''); setStep(s => s + 1) }}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  Next →
                </button>
              : <button onClick={submit} disabled={submitting}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Inter',system-ui,sans-serif", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Uploading…' : 'Upload question +20 XP'}
                </button>
            }
          </div>
        </div>
      </div>
    </>
  )
}