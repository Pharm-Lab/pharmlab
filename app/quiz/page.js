'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { supabase, createClerkSupabaseClient } from '../../lib/supabase'
import { awardXp } from '../../lib/xp'
import QuizUploadModal from '../components/QuizUploadModal'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
  green: '#16a34a', greenLight: '#86efac',
}

const TOPICS = ['All', 'PK/PD', 'Pharmacology', 'Lab techniques', 'Statistics', 'Formulation', 'ADME', 'Drug design', 'Regulatory', 'Other']
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard']
const ADMIN_ID = 'user_3DUTpkSJVs5sqb6vA3qNsfor2vp' // your clerk ID

function diffColor(d) {
  if (d === 'easy') return '#4ade80'
  if (d === 'hard') return '#f87171'
  return '#fb923c'
}

function QuestionCard({ q, currentUserId, session, onVote, onReport, onDelete }) {
  const [expanded,     setExpanded]     = useState(false)
  const [revealed,     setRevealed]     = useState(false)
  const [attempted,    setAttempted]    = useState(false)
  const [reporting,    setReporting]    = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [myVote,       setMyVote]       = useState(null) // 'up' | 'down' | null
  const [localUpvotes, setLocalUpvotes] = useState(q.upvotes || 0)
  const [localDownvotes, setLocalDownvotes] = useState(q.downvotes || 0)
  const [mcqSelected, setMcqSelected]  = useState(null) // selected option label
  const [mcqSubmitted, setMcqSubmitted] = useState(false)

  // Load own vote on mount
  useEffect(() => {
    if (!currentUserId) return
    supabase.from('question_votes').select('vote_type')
      .eq('clerk_id', currentUserId).eq('question_id', q.id).single()
      .then(({ data }) => { if (data) setMyVote(data.vote_type) })
  }, [currentUserId, q.id])

  function db() { return createClerkSupabaseClient(session) }

  async function attempt(correct) {
    if (!currentUserId) return
    setAttempted(true)
    await db().from('question_attempts').insert({ clerk_id: currentUserId, question_id: q.id, correct })
    await awardXp(session, currentUserId, correct ? 7 : 2, correct ? 'quiz_correct' : 'quiz_attempt')
  }

  async function vote(type) {
    if (!currentUserId || isOwn) return
    if (myVote === type) return // already voted this way
    const d = db()
    if (myVote) {
      // Change vote — remove old, add new
      await d.from('question_votes').delete().eq('clerk_id', currentUserId).eq('question_id', q.id)
      const oldField = myVote === 'up' ? 'upvotes' : 'downvotes'
      await d.from('questions').update({ [oldField]: Math.max(0, (myVote === 'up' ? localUpvotes : localDownvotes) - 1) }).eq('id', q.id)
      if (myVote === 'up') setLocalUpvotes(v => Math.max(0, v - 1))
      else setLocalDownvotes(v => Math.max(0, v - 1))
    }
    await d.from('question_votes').insert({ clerk_id: currentUserId, question_id: q.id, vote_type: type })
    const newField = type === 'up' ? 'upvotes' : 'downvotes'
    const newVal = (type === 'up' ? localUpvotes : localDownvotes) + 1
    await d.from('questions').update({ [newField]: newVal }).eq('id', q.id)
    if (type === 'up') setLocalUpvotes(v => v + 1)
    else setLocalDownvotes(v => v + 1)
    setMyVote(type)
  }

  async function submitReport() {
    if (!reportReason.trim()) return
    await db().from('questions').update({ reported: true, report_reason: reportReason }).eq('id', q.id)
    setReporting(false)
  }

  const isOwn = q.clerk_id === currentUserId
  const isAdmin = currentUserId === ADMIN_ID
  const netVotes = localUpvotes - localDownvotes

  return (
    <div style={{ background: C.card, border: `1px solid ${q.reported ? 'rgba(239,68,68,0.4)' : C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Question header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 8px', fontWeight: '600' }}>{q.topic}</span>
            <span style={{ fontSize: '11px', color: diffColor(q.difficulty), background: `${diffColor(q.difficulty)}18`, border: `1px solid ${diffColor(q.difficulty)}44`, borderRadius: '999px', padding: '1px 8px', fontWeight: '600' }}>{q.difficulty}</span>
            {q.question_type === 'multiple_choice' && <span style={{ fontSize: '10px', color: C.textDim, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '999px', padding: '1px 8px' }}>MCQ</span>}
            {q.university && <span style={{ fontSize: '10px', color: C.textDim }}>{q.university}</span>}
            {q.reported && isAdmin && <span style={{ fontSize: '10px', color: '#fca5a5', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '999px', padding: '1px 8px' }} title={q.report_reason || 'No reason given'}>⚠ Reported{q.report_reason ? ': ' + q.report_reason : ''}</span>}
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 3px', lineHeight: '1.4' }}>{q.title}</p>
          <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>by @{q.username || 'unknown'} · {new Date(q.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: netVotes >= 0 ? C.greenLight : '#fca5a5', fontWeight: '600', fontFamily: 'ui-monospace, monospace' }}>{netVotes > 0 ? '+' : ''}{netVotes}</span>
          <span style={{ fontSize: '12px', color: C.textDim }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px' }}>
          {/* Question body */}
          <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 16px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{q.content}</p>

          {/* MCQ options — clickable, auto-graded */}
          {q.question_type === 'multiple_choice' && q.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {q.options.map(o => {
                const isCorrect = o.label === q.correct_option
                const isSelected = mcqSelected === o.label
                const showResult = mcqSubmitted
                let bg = 'rgba(255,255,255,0.02)', border = C.border, color = C.textMid, labelColor = C.textDim
                if (showResult) {
                  if (isCorrect) { bg = 'rgba(22,163,74,0.1)'; border = 'rgba(22,163,74,0.5)'; color = C.text; labelColor = C.greenLight }
                  else if (isSelected) { bg = 'rgba(185,28,28,0.1)'; border = 'rgba(239,68,68,0.4)'; color = C.textMid; labelColor = '#fca5a5' }
                } else if (isSelected) {
                  bg = `${C.blue}15`; border = `${C.blue}55`; color = C.text; labelColor = C.blueLight
                }
                return (
                  <div key={o.label}
                    onClick={() => { if (!mcqSubmitted && currentUserId) { setMcqSelected(o.label) } }}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, display: 'flex', gap: '10px', cursor: mcqSubmitted || !currentUserId ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: labelColor, minWidth: '18px' }}>{o.label}</span>
                    <span style={{ fontSize: '13px', color }}>{o.text}</span>
                    {showResult && isCorrect && <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.greenLight }}>✓</span>}
                    {showResult && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#fca5a5' }}>✗</span>}
                  </div>
                )
              })}
              {/* Submit MCQ button */}
              {currentUserId && mcqSelected && !mcqSubmitted && (
                <button onClick={async () => {
                  setMcqSubmitted(true)
                  const correct = mcqSelected === q.correct_option
                  await attempt(correct)
                }}
                  style={{ padding: '9px', borderRadius: '8px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '4px', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  Submit answer
                </button>
              )}
              {mcqSubmitted && (
                <p style={{ fontSize: '12px', color: mcqSelected === q.correct_option ? C.greenLight : '#fca5a5', margin: '4px 0 0', fontWeight: '600' }}>
                  {mcqSelected === q.correct_option ? '✓ Correct! +7 XP' : `✗ Incorrect — correct answer was ${q.correct_option}`}
                </p>
              )}
            </div>
          )}

          {/* Reveal answer — hide for MCQ once submitted */}
          {q.question_type === 'multiple_choice' && mcqSubmitted ? null : !revealed ? (
            <button onClick={() => setRevealed(true)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.textMid, fontSize: '13px', cursor: 'pointer', marginBottom: '12px', fontFamily: "'Inter',system-ui,sans-serif" }}>
              Reveal answer
            </button>
          ) : (
            <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.greenLight, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Answer</p>
              <p style={{ fontSize: '13px', color: C.text, margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{q.answer}</p>
              {q.explanation && (
                <>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: C.blueLight, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '10px 0 4px' }}>Explanation</p>
                  <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{q.explanation}</p>
                </>
              )}
            </div>
          )}

          {/* Attempt buttons — free text only */}
          {q.question_type !== 'multiple_choice' && revealed && !attempted && currentUserId && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => attempt(true)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.1)', color: C.greenLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                ✓ Got it +7 XP
              </button>
              <button onClick={() => attempt(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(185,28,28,0.1)', color: '#fca5a5', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                ✗ Didn't know +2 XP
              </button>
            </div>
          )}

          {attempted && (
            <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '12px' }}>✓ Attempt recorded</p>
          )}

          {/* Actions row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
            {currentUserId && !isOwn && (
              <>
                <button onClick={() => vote('up')} disabled={myVote === 'up'}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${myVote === 'up' ? 'rgba(22,163,74,0.5)' : C.border}`, background: myVote === 'up' ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.04)', color: C.greenLight, fontSize: '12px', cursor: myVote === 'up' ? 'default' : 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  ▲ {localUpvotes}
                </button>
                <button onClick={() => vote('down')} disabled={myVote === 'down'}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${myVote === 'down' ? 'rgba(239,68,68,0.5)' : C.border}`, background: myVote === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', color: '#fca5a5', fontSize: '12px', cursor: myVote === 'down' ? 'default' : 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  ▼ {localDownvotes}
                </button>
              </>
            )}
            {!isOwn && currentUserId && !reporting && (
              <button onClick={() => setReporting(true)}
                style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '11px', cursor: 'pointer', marginLeft: 'auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Report
              </button>
            )}
            {isAdmin && (
              <button onClick={() => onDelete(q.id)}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '11px', cursor: 'pointer', marginLeft: isOwn ? 'auto' : '0', fontFamily: "'Inter',system-ui,sans-serif" }}>
                🗑 Remove
              </button>
            )}
          </div>

          {/* Report form */}
          {reporting && (
            <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#fca5a5', margin: '0 0 8px' }}>Why are you reporting this?</p>
              <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Incorrect answer, inappropriate content, duplicate..." rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: '#060b18', color: C.text, fontSize: '12px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={submitReport} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#dc2626', color: 'white', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>Submit</button>
                <button onClick={() => setReporting(false)} style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuizPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [questions,    setQuestions]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [topicFilter,  setTopicFilter]  = useState('All')
  const [diffFilter,   setDiffFilter]   = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [sortBy,       setSortBy]       = useState('newest')
  const [showUpload,   setShowUpload]   = useState(false)

  function db() { return createClerkSupabaseClient(session) }

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    // Use public client for reading questions
    let q = supabase
      .from('questions')
      .select('*')
      .is('group_id', null)

    if (topicFilter !== 'All') q = q.eq('topic', topicFilter)
    if (diffFilter !== 'all') q = q.eq('difficulty', diffFilter)
    if (typeFilter !== 'all') q = q.eq('question_type', typeFilter)
    if (sortBy === 'newest') q = q.order('created_at', { ascending: false })
    if (sortBy === 'top') q = q.order('upvotes', { ascending: false })

    const { data, error } = await q.limit(50)
    if (error) { console.error('Questions load error:', error); setLoading(false); return }

    // Fetch usernames separately
    const clerkIds = [...new Set((data || []).map(q => q.clerk_id))]
    let usernameMap = {}
    if (clerkIds.length) {
      const { data: profiles } = await supabase
        .from('user_profiles').select('clerk_id, username').in('clerk_id', clerkIds)
      ;(profiles || []).forEach(p => { usernameMap[p.clerk_id] = p.username })
    }

    setQuestions((data || []).map(q => ({ ...q, username: usernameMap[q.clerk_id] || 'unknown' })))
    setLoading(false)
  }, [topicFilter, diffFilter, typeFilter, sortBy])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  async function deleteQuestion(id) {
    if (!confirm('Remove this question?')) return
    await db().from('questions').delete().eq('id', id)
    loadQuestions()
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } textarea,input { color-scheme:dark; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 2rem 1.5rem' }}>
          <Link href="/user" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Profile</Link>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Quiz bank</h1>
              <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>{questions.length} question{questions.length !== 1 ? 's' : ''} · community-contributed · attempt and earn XP</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/quiz/exam"
                style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.textMid, fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                📋 Exam mode
              </Link>
              {isLoaded && user && (
                <button onClick={() => setShowUpload(true)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  + Upload question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }}>
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }}>
            <option value="all">All difficulties</option>
            {DIFFICULTIES.slice(1).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }}>
            <option value="all">All types</option>
            <option value="free_text">Free text</option>
            <option value="multiple_choice">Multiple choice</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            {['newest', 'top'].map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${sortBy === s ? C.blue : C.border}`, background: sortBy === s ? `${C.blue}18` : 'transparent', color: sortBy === s ? C.blueLight : C.textDim, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                {s === 'newest' ? 'Newest' : 'Top rated'}
              </button>
            ))}
          </div>
        </div>

        {/* Questions */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: C.textDim, fontSize: '14px' }}>Loading…</div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: C.textMid, margin: '0 0 6px' }}>No questions yet</p>
            <p style={{ fontSize: '13px', color: C.textDim, margin: '0 0 20px' }}>Be the first to contribute a question.</p>
            {isLoaded && user && (
              <button onClick={() => setShowUpload(true)}
                style={{ padding: '9px 20px', borderRadius: '9px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Upload a question
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {questions.map(q => (
              <QuestionCard key={q.id} q={q}
                currentUserId={user?.id}
                session={session}
                onVote={loadQuestions}
                onReport={loadQuestions}
                onDelete={deleteQuestion}
              />
            ))}
          </div>
        )}
      </div>

      {showUpload && user && (
        <QuizUploadModal
          session={session} user={user}
          onClose={() => setShowUpload(false)}
          onUploaded={loadQuestions}
        />
      )}
    </main>
  )
}