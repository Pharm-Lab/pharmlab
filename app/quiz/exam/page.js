'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { supabase, createClerkSupabaseClient } from '../../../lib/supabase'
import { awardXp } from '../../../lib/xp'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const TOPICS = ['PK/PD', 'Pharmacology', 'Lab techniques', 'Statistics', 'Formulation', 'ADME', 'Drug design', 'Regulatory', 'Other']
const DIFFICULTIES = ['easy', 'medium', 'hard']

function diffColor(d) {
  if (d === 'easy') return '#4ade80'
  if (d === 'hard') return '#f87171'
  return '#fb923c'
}

function pad(n) { return String(n).padStart(2, '0') }

// ── Configure screen ──────────────────────────────────────────────
function ConfigureScreen({ onStart }) {
  const [topics,      setTopics]      = useState([])
  const [difficulty,  setDifficulty]  = useState('all')
  const [count,       setCount]       = useState(10)
  const [timed,       setTimed]       = useState(false)
  const [minutes,     setMinutes]     = useState(20)
  const [qType,       setQType]       = useState('all')
  const [available,   setAvailable]   = useState(null)

  function toggleTopic(t) {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  // Preview count from DB
  useEffect(() => {
    async function check() {
      let q = supabase.from('questions').select('id', { count: 'exact', head: true }).is('group_id', null)
      if (topics.length) q = q.in('topic', topics)
      if (difficulty !== 'all') q = q.eq('difficulty', difficulty)
      if (qType !== 'all') q = q.eq('question_type', qType)
      const { count } = await q
      setAvailable(count || 0)
    }
    check()
  }, [topics, difficulty, qType])

  const canStart = available === null || available > 0

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
      <Link href="/quiz" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Quiz bank</Link>

      <h1 style={{ fontSize: '24px', fontWeight: '800', color: C.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Configure exam</h1>
      <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 2rem' }}>Set up your practice session — questions will be drawn randomly from the bank.</p>

      {/* Topics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>Topics <span style={{ color: C.textDim, fontWeight: '400', textTransform: 'none' }}>(leave empty for all)</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {TOPICS.map(t => (
            <button key={t} onClick={() => toggleTopic(t)}
              style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${topics.includes(t) ? C.blue + '88' : C.border}`, background: topics.includes(t) ? `${C.blue}18` : 'rgba(255,255,255,0.03)', color: topics.includes(t) ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>Difficulty</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', ...DIFFICULTIES].map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${difficulty === d ? C.blue + '88' : C.border}`, background: difficulty === d ? `${C.blue}18` : 'rgba(255,255,255,0.03)', color: difficulty === d ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Question type */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>Question type</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['all','All'],['multiple_choice','Multiple choice'],['free_text','Free text']].map(([val, label]) => (
            <button key={val} onClick={() => setQType(val)}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${qType === val ? C.blue + '88' : C.border}`, background: qType === val ? `${C.blue}18` : 'rgba(255,255,255,0.03)', color: qType === val ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Number of questions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>Questions</label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[5, 10, 20].map(n => (
            <button key={n} onClick={() => setCount(n)}
              style={{ padding: '6px 18px', borderRadius: '8px', border: `1px solid ${count === n ? C.blue + '88' : C.border}`, background: count === n ? `${C.blue}18` : 'rgba(255,255,255,0.03)', color: count === n ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              {n}
            </button>
          ))}
          <input type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} min={1} max={50}
            style={{ width: '70px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#060b18', color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', textAlign: 'center' }} />
          <span style={{ fontSize: '12px', color: C.textDim }}>
            {available !== null ? `(${available} available)` : ''}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>Timer</label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setTimed(false)}
            style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${!timed ? C.blue + '88' : C.border}`, background: !timed ? `${C.blue}18` : 'rgba(255,255,255,0.03)', color: !timed ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
            Untimed
          </button>
          <button onClick={() => setTimed(true)}
            style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${timed ? C.blue + '88' : C.border}`, background: timed ? `${C.blue}18` : 'rgba(255,255,255,0.03)', color: timed ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
            Timed
          </button>
          {timed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[10, 20, 30].map(m => (
                <button key={m} onClick={() => setMinutes(m)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${minutes === m ? C.purple + '88' : C.border}`, background: minutes === m ? `${C.purple}18` : 'rgba(255,255,255,0.03)', color: minutes === m ? C.purpleLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  {m} min
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Start */}
      {available === 0 ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', fontSize: '13px' }}>
          No questions match your filters. Try adjusting topic or difficulty.
        </div>
      ) : (
        <button onClick={() => onStart({ topics, difficulty, count: Math.min(count, available || count), timed, minutes, qType })}
          style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: C.blue, color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif", letterSpacing: '-0.01em' }}>
          Start exam — {Math.min(count, available || count)} questions{timed ? ` · ${minutes} min` : ''}
        </button>
      )}
    </div>
  )
}

// ── Exam screen ───────────────────────────────────────────────────
function ExamScreen({ questions, timed, minutes, onFinish }) {
  const [idx,          setIdx]          = useState(0)
  const [answers,      setAnswers]      = useState({}) // questionId → { selected, correct }
  const [mcqSelected,  setMcqSelected]  = useState(null)
  const [freeRevealed, setFreeRevealed] = useState(false)
  const [timeLeft,     setTimeLeft]     = useState(timed ? minutes * 60 : null)
  const timerRef = useRef(null)

  const q = questions[idx]
  const totalQ = questions.length
  const answered = Object.keys(answers).length

  useEffect(() => {
    if (!timed) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); onFinish(answers); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function submitMCQ() {
    if (!mcqSelected) return
    const correct = mcqSelected === q.correct_option
    const newAnswers = { ...answers, [q.id]: { selected: mcqSelected, correct, type: 'mcq', question: q } }
    setAnswers(newAnswers)
    if (idx + 1 >= totalQ) {
      clearInterval(timerRef.current)
      onFinish(newAnswers)
    } else {
      setIdx(i => i + 1)
      setMcqSelected(null)
    }
  }

  function submitFree(correct) {
    const newAnswers = { ...answers, [q.id]: { correct, type: 'free', question: q } }
    setAnswers(newAnswers)
    if (idx + 1 >= totalQ) {
      clearInterval(timerRef.current)
      onFinish(newAnswers)
    } else {
      setIdx(i => i + 1)
      setFreeRevealed(false)
    }
  }

  function skipQuestion() {
    const newAnswers = { ...answers, [q.id]: { correct: false, skipped: true, type: q.question_type === 'multiple_choice' ? 'mcq' : 'free', question: q } }
    setAnswers(newAnswers)
    if (idx + 1 >= totalQ) {
      clearInterval(timerRef.current)
      onFinish(newAnswers)
    } else {
      setIdx(i => i + 1)
      setMcqSelected(null)
      setFreeRevealed(false)
    }
  }

  const progress = ((idx) / totalQ) * 100
  const timerWarning = timed && timeLeft !== null && timeLeft < 120

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 2rem' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '13px', color: C.textDim, fontFamily: 'ui-monospace, monospace', fontWeight: '600' }}>
          {idx + 1} / {totalQ}
        </span>
        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: '999px', transition: 'width 0.3s ease' }} />
        </div>
        {timed && timeLeft !== null && (
          <span style={{ fontSize: '14px', fontWeight: '800', color: timerWarning ? '#f87171' : C.blueLight, fontFamily: 'ui-monospace, monospace', minWidth: '52px', textAlign: 'right' }}>
            {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
          </span>
        )}
        <button onClick={() => { clearInterval(timerRef.current); onFinish(answers) }}
          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '11px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif", whiteSpace: 'nowrap' }}>
          End exam
        </button>
      </div>

      {/* Question card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 8px', fontWeight: '600' }}>{q.topic}</span>
          <span style={{ fontSize: '11px', color: diffColor(q.difficulty), background: `${diffColor(q.difficulty)}18`, border: `1px solid ${diffColor(q.difficulty)}44`, borderRadius: '999px', padding: '1px 8px', fontWeight: '600' }}>{q.difficulty}</span>
          {q.question_type === 'multiple_choice' && <span style={{ fontSize: '10px', color: C.textDim, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '999px', padding: '1px 8px' }}>MCQ</span>}
        </div>

        {/* Title + content */}
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: C.text, margin: '0 0 10px', lineHeight: '1.4', letterSpacing: '-0.01em' }}>{q.title}</h2>
        <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 20px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{q.content}</p>

        {/* MCQ options */}
        {q.question_type === 'multiple_choice' && q.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {q.options.map(o => {
              const isSelected = mcqSelected === o.label
              return (
                <button key={o.label} onClick={() => setMcqSelected(o.label)}
                  style={{ padding: '11px 14px', borderRadius: '9px', border: `1px solid ${isSelected ? C.blue + '88' : C.border}`, background: isSelected ? `${C.blue}15` : 'rgba(255,255,255,0.02)', display: 'flex', gap: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',system-ui,sans-serif", transition: 'all 0.12s' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? C.blueLight : C.textDim, minWidth: '18px' }}>{o.label}</span>
                  <span style={{ fontSize: '13px', color: isSelected ? C.text : C.textMid }}>{o.text}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Free text — show answer */}
        {q.question_type === 'free_text' && !freeRevealed && (
          <button onClick={() => setFreeRevealed(true)}
            style={{ padding: '10px 20px', borderRadius: '9px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.textMid, fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
            Reveal answer
          </button>
        )}

        {q.question_type === 'free_text' && freeRevealed && (
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Model answer</p>
            <p style={{ fontSize: '14px', color: C.text, margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{q.answer}</p>
            {q.explanation && (
              <>
                <p style={{ fontSize: '11px', fontWeight: '700', color: C.blueLight, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 4px' }}>Explanation</p>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{q.explanation}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {q.question_type === 'multiple_choice' ? (
          <>
            <button onClick={submitMCQ} disabled={!mcqSelected}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: mcqSelected ? C.blue : 'rgba(255,255,255,0.06)', color: mcqSelected ? 'white' : C.textDim, fontSize: '14px', fontWeight: '600', cursor: mcqSelected ? 'pointer' : 'not-allowed', fontFamily: "'Inter',system-ui,sans-serif" }}>
              {idx + 1 === totalQ ? 'Submit & finish' : 'Submit & next →'}
            </button>
            <button onClick={skipQuestion}
              style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              Skip
            </button>
          </>
        ) : freeRevealed ? (
          <>
            <button onClick={() => submitFree(true)}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.1)', color: '#86efac', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              ✓ Got it
            </button>
            <button onClick={() => submitFree(false)}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(185,28,28,0.1)', color: '#fca5a5', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              ✗ Didn't know
            </button>
          </>
        ) : (
          <button onClick={skipQuestion}
            style={{ padding: '12px 20px', borderRadius: '10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
            Skip question
          </button>
        )}
      </div>
    </div>
  )
}

// ── Results screen ────────────────────────────────────────────────
function ResultsScreen({ answers, config, xpEarned, onRestart, onBack }) {
  const answerList = Object.values(answers)
  const total   = answerList.length
  const correct = answerList.filter(a => a.correct && !a.skipped).length
  const skipped = answerList.filter(a => a.skipped).length
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0

  // Group by topic
  const byTopic = {}
  answerList.forEach(a => {
    const t = a.question?.topic || 'Unknown'
    if (!byTopic[t]) byTopic[t] = { correct: 0, total: 0 }
    byTopic[t].total++
    if (a.correct && !a.skipped) byTopic[t].correct++
  })

  const grade = pct >= 90 ? { label: 'Excellent', color: '#4ade80' }
    : pct >= 75 ? { label: 'Good', color: '#86efac' }
    : pct >= 55 ? { label: 'Pass', color: '#fb923c' }
    : { label: 'Needs work', color: '#f87171' }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem' }}>
      {/* Score card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '64px', fontWeight: '800', color: grade.color, fontFamily: 'ui-monospace, monospace', lineHeight: 1, marginBottom: '8px' }}>
          {pct}%
        </div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: grade.color, marginBottom: '16px' }}>{grade.label}</div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#86efac', fontFamily: 'ui-monospace, monospace' }}>{correct}</div>
            <div style={{ fontSize: '12px', color: C.textDim }}>correct</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fca5a5', fontFamily: 'ui-monospace, monospace' }}>{total - correct - skipped}</div>
            <div style={{ fontSize: '12px', color: C.textDim }}>incorrect</div>
          </div>
          {skipped > 0 && (
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: C.textDim, fontFamily: 'ui-monospace, monospace' }}>{skipped}</div>
              <div style={{ fontSize: '12px', color: C.textDim }}>skipped</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: C.blueLight, fontFamily: 'ui-monospace, monospace' }}>+{xpEarned}</div>
            <div style={{ fontSize: '12px', color: C.textDim }}>XP earned</div>
          </div>
        </div>
      </div>

      {/* Topic breakdown */}
      {Object.keys(byTopic).length > 1 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score by topic</span>
          </div>
          {Object.entries(byTopic).map(([topic, stats]) => {
            const topicPct = Math.round((stats.correct / stats.total) * 100)
            return (
              <div key={topic} style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: C.textMid, flex: 1 }}>{topic}</span>
                <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${topicPct}%`, background: topicPct >= 75 ? '#4ade80' : topicPct >= 55 ? '#fb923c' : '#f87171', borderRadius: '999px' }} />
                </div>
                <span style={{ fontSize: '12px', color: C.textDim, fontFamily: 'ui-monospace, monospace', minWidth: '60px', textAlign: 'right' }}>
                  {stats.correct}/{stats.total} ({topicPct}%)
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Review wrong answers */}
      {answerList.filter(a => !a.correct || a.skipped).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Review — {answerList.filter(a => !a.correct || a.skipped).length} to revisit
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {answerList.filter(a => !a.correct || a.skipped).map((a, i) => (
              <div key={i} style={{ background: C.card, border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: C.text, margin: '0 0 6px' }}>{a.question?.title}</p>
                {a.skipped ? (
                  <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>Skipped</p>
                ) : a.type === 'mcq' ? (
                  <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>
                    Your answer: <span style={{ color: '#fca5a5' }}>{a.selected}</span> · Correct: <span style={{ color: '#86efac' }}>{a.question?.correct_option}: {a.question?.options?.find(o => o.label === a.question?.correct_option)?.text}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: C.textDim, margin: '0 0 6px' }}>Model answer:</p>
                )}
                {!a.skipped && a.question?.answer && a.type === 'free' && (
                  <p style={{ fontSize: '12px', color: C.textMid, margin: 0, lineHeight: '1.6' }}>{a.question.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onRestart}
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: C.blue, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
          New exam
        </button>
        <Link href="/quiz"
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '14px', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Browse questions
        </Link>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function QuizExamPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [phase,     setPhase]     = useState('configure') // 'configure' | 'exam' | 'results'
  const [questions, setQuestions] = useState([])
  const [config,    setConfig]    = useState(null)
  const [answers,   setAnswers]   = useState({})
  const [xpEarned,  setXpEarned]  = useState(0)
  const [loading,   setLoading]   = useState(false)

  function db() { return createClerkSupabaseClient(session) }

  async function startExam(cfg) {
    setLoading(true)
    setConfig(cfg)

    let q = supabase.from('questions').select('*').is('group_id', null)
    if (cfg.topics?.length) q = q.in('topic', cfg.topics)
    if (cfg.difficulty !== 'all') q = q.eq('difficulty', cfg.difficulty)
    if (cfg.qType !== 'all') q = q.eq('question_type', cfg.qType)

    const { data } = await q.limit(100)
    if (!data?.length) { setLoading(false); return }

    // Shuffle and take requested count
    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, cfg.count)
    setQuestions(shuffled)
    setPhase('exam')
    setLoading(false)
  }

  async function finishExam(finalAnswers) {
    setAnswers(finalAnswers)
    setPhase('results')

    if (!user) return
    // Award XP: 7 per correct, 2 per attempt, bonus for high score
    const answerList = Object.values(finalAnswers)
    const correct = answerList.filter(a => a.correct && !a.skipped).length
    const total   = answerList.length
    let xp = answerList.reduce((sum, a) => sum + (a.correct && !a.skipped ? 7 : a.skipped ? 0 : 2), 0)
    const pct = total > 0 ? (correct / total) : 0
    if (pct === 1 && total >= 5) xp += 25  // perfect score bonus
    if (pct >= 0.9 && total >= 10) xp += 15 // 90%+ on 10+ questions

    if (xp > 0) await awardXp(session, user.id, xp, 'exam_complete')

    // Log attempts to DB
    const d = db()
    for (const [qId, a] of Object.entries(finalAnswers)) {
      if (!a.skipped) {
        await d.from('question_attempts').insert({ clerk_id: user.id, question_id: qId, correct: a.correct })
      }
    }
    setXpEarned(xp)
  }

  function restart() {
    setPhase('configure')
    setQuestions([])
    setAnswers({})
    setXpEarned(0)
    setConfig(null)
  }

  if (!isLoaded) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <span style={{ color: C.textDim }}>Loading…</span>
    </div>
  )

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } button { font-family:'Inter',system-ui,sans-serif; }`}</style>

      {/* Header */}
      {phase !== 'exam' && (
        <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: '800', color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Exam mode</h1>
                <p style={{ fontSize: '11px', color: C.textDim, margin: 0 }}>Focused practice · one question at a time</p>
              </div>
            </div>
            <Link href="/quiz" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Quiz bank</Link>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <span style={{ color: C.textDim, fontSize: '14px' }}>Loading questions…</span>
        </div>
      )}

      {!loading && phase === 'configure' && <ConfigureScreen onStart={startExam} />}
      {!loading && phase === 'exam' && questions.length > 0 && (
        <ExamScreen questions={questions} timed={config?.timed} minutes={config?.minutes} onFinish={finishExam} />
      )}
      {!loading && phase === 'results' && (
        <ResultsScreen answers={answers} config={config} xpEarned={xpEarned} onRestart={restart} onBack={() => setPhase('configure')} />
      )}
    </main>
  )
}