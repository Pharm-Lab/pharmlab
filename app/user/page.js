'use client'
import { useUser, useSession } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClerkSupabaseClient } from '../../lib/supabase'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const LEVELS = [
  { name: 'Pre-clinical',  min: 0     },
  { name: 'Phase I',       min: 500   },
  { name: 'Phase II',      min: 1500  },
  { name: 'Phase III',     min: 3500  },
  { name: 'NDA Filed',     min: 7000  },
  { name: 'Approved',      min: 12000 },
  { name: 'Blockbuster',   min: 20000 },
  { name: 'Off-patent',    min: 35000 },
]

const BADGES = [
  { id: 'first_login',     emoji: '🧪', name: 'First Dose',        desc: 'Joined PharmLab',                 earned: true  },
  { id: 'first_author',    emoji: '✍️', name: 'First Author',       desc: 'Uploaded your first question',    earned: false },
  { id: 'peer_reviewer',   emoji: '🔬', name: 'Peer Reviewer',      desc: 'Answered 10 community questions', earned: false },
  { id: 'clean_room',      emoji: '🧹', name: 'Clean Room',         desc: '7-day study streak',              earned: false },
  { id: 'nonmem',          emoji: '📊', name: 'NONMEM',             desc: 'Completed 50 exercises',          earned: false },
  { id: 'therapeutic_win', emoji: '🎯', name: 'Therapeutic Window', desc: '5 quizzes in a row — 100%',      earned: false },
  { id: 'adverse_event',   emoji: '⚠️', name: 'Adverse Event',      desc: 'Got the same question wrong 3×', earned: false },
  { id: 'blockbuster',     emoji: '💊', name: 'Blockbuster',        desc: 'Reached level 7',                 earned: false },
]

function getLevelInfo(xp) {
  let current = LEVELS[0], next = LEVELS[1]
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) { current = LEVELS[i]; next = LEVELS[i + 1] || null }
  }
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100
  return { current, next, progress }
}

// ── Username setup screen ──────────────────────────────────────────
function UsernameSetup({ clerkId, session, onDone }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (clean.length < 3) return setError('At least 3 characters (letters, numbers, underscores only)')
    if (clean.length > 20) return setError('Max 20 characters')
    setLoading(true); setError('')
    const db = createClerkSupabaseClient(session)
    const { error: err } = await db
      .from('user_profiles')
      .insert({ clerk_id: clerkId, username: clean, xp: 0, streak: 0 })
    if (err) {
      if (err.code === '23505') setError('Username already taken — try another')
      else setError('Something went wrong, try again')
      setLoading(false)
    } else {
      onDone({ clerk_id: clerkId, username: clean, xp: 0, streak: 0 })
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif", padding: '2rem' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '380px' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>👤</div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Choose a username</h1>
        <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 20px', lineHeight: '1.6' }}>
          This is how you'll appear in study groups and leaderboards. You can't change it later.
        </p>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#060b18', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : C.border}`, borderRadius: '9px', padding: '0 12px', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: C.textDim }}>@</span>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="yourusername"
              maxLength={20}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '11px 0', fontSize: '14px', fontWeight: '600', color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}
            />
          </div>
          {error && <p style={{ fontSize: '12px', color: '#fca5a5', margin: '6px 0 0' }}>{error}</p>}
          <p style={{ fontSize: '11px', color: C.textDim, margin: '6px 0 0' }}>Letters, numbers and underscores only · 3–20 characters</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || username.trim().length < 3}
          style={{
            width: '100%', padding: '11px', borderRadius: '9px',
            background: username.trim().length >= 3 ? C.blue : 'rgba(255,255,255,0.06)',
            color: username.trim().length >= 3 ? 'white' : C.textDim,
            border: 'none', fontSize: '14px', fontWeight: '600',
            cursor: username.trim().length >= 3 ? 'pointer' : 'not-allowed',
            fontFamily: "'Inter',system-ui,sans-serif", transition: 'background 0.15s',
          }}>
          {loading ? 'Setting up…' : 'Get started'}
        </button>
      </div>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────
function StatCard({ value, label, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 20px' }}>
      <div style={{ fontSize: '26px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px', fontWeight: '500' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

// ── Main profile page ──────────────────────────────────────────────
export default function UserProfile() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return
    async function fetchProfile() {
      const db = createClerkSupabaseClient(session)
      const { data } = await db
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single()
      if (!data) {
        setNeedsUsername(true)
      } else {
        setProfile(data)
        await db
          .from('user_profiles')
          .update({ last_active: new Date().toISOString().split('T')[0] })
          .eq('clerk_id', user.id)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [isLoaded, user])

  if (!isLoaded || loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.textDim, fontSize: '14px', fontFamily: "'Inter',system-ui,sans-serif" }}>Loading…</div>
    </div>
  )

  if (!user) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.textMid, marginBottom: '16px' }}>You need to be signed in to view your profile.</p>
        <Link href="/sign-in" style={{ color: C.blueLight, textDecoration: 'none', fontSize: '14px' }}>Sign in →</Link>
      </div>
    </div>
  )

  if (needsUsername) return <UsernameSetup clerkId={user.id} session={session} onDone={p => { setProfile(p); setNeedsUsername(false) }} />

  const xp = profile?.xp ?? 0
  const streak = profile?.streak ?? 0
  const { current, next, progress } = getLevelInfo(xp)
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <img src={user.imageUrl} alt="Avatar"
            style={{ width: '76px', height: '76px', borderRadius: '50%', border: `2px solid ${C.border}`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: '180px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              {user.fullName || profile?.username}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', color: C.textDim }}>@{profile?.username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: C.blueLight, fontWeight: '600', background: `${C.blue}18`, border: `1px solid ${C.blue}44`, borderRadius: '999px', padding: '2px 10px' }}>
                {current.name}
              </span>
              <span style={{ fontSize: '12px', color: C.textDim }}>Member since {joinDate}</span>
            </div>
          </div>
          <div style={{ minWidth: '200px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: C.textDim }}>{xp} XP</span>
              <span style={{ fontSize: '12px', color: C.textDim }}>{next ? `${next.min} XP — ${next.name}` : 'Max level'}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
          <StatCard value={xp}    label="XP earned" />
          <StatCard value={streak === 0 ? '—' : `${streak}d`} label="Study streak" />
          <StatCard value="0"     label="Questions shared" sub="coming soon" />
          <StatCard value="0"     label="Quiz answers"     sub="coming soon" />
        </div>

        {/* Badges */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: C.text, margin: '0 0 14px', letterSpacing: '-0.01em' }}>Badges</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {BADGES.map(b => (
              <div key={b.id} style={{
                background: b.earned ? `${C.blue}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${b.earned ? `${C.blue}33` : C.border}`,
                borderRadius: '10px', padding: '12px 14px',
                opacity: b.earned ? 1 : 0.45,
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <span style={{ fontSize: '22px', flexShrink: 0, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: b.earned ? C.text : C.textMid, marginBottom: '2px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: C.textDim, lineHeight: '1.4' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { title: 'Study groups',    desc: 'Join a cohort, share questions, compete on the leaderboard.', emoji: '👥', href: '/groups', live: true },
            { title: 'Quiz history',    desc: 'Track which questions you got right, wrong, and need to revisit.', emoji: '📋' },
            { title: 'Pomodoro stats',  desc: 'Total study time, sessions completed, longest streak.', emoji: '🍅' },
            { title: 'PK Guessr',       desc: 'Your weekly score and ranking against your study group.', emoji: '📈' },
          ].map((s, i) => {
            const inner = (
              <div key={i} style={{ background: C.card, border: `1px solid ${s.live ? C.blue + '44' : C.border}`, borderRadius: '12px', padding: '16px 18px', opacity: s.live ? 1 : 0.6, transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>{s.emoji}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{s.title}</span>
                  {s.live
                    ? <span style={{ fontSize: '10px', color: '#86efac', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.35)', borderRadius: '999px', padding: '1px 7px', marginLeft: 'auto' }}>Live</span>
                    : <span style={{ fontSize: '10px', color: C.blueLight, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 7px', marginLeft: 'auto' }}>Soon</span>
                  }
                </div>
                <p style={{ fontSize: '12px', color: C.textDim, margin: 0, lineHeight: '1.5' }}>{s.desc}</p>
              </div>
            )
            return s.href
              ? <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>{inner}</Link>
              : <div key={i}>{inner}</div>
          })}
        </div>

      </div>
    </main>
  )
}