'use client'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const LEVELS = [
  { name: 'Pre-clinical',      min: 0     },
  { name: 'Phase I',           min: 500   },
  { name: 'Phase II',          min: 1500  },
  { name: 'Phase III',         min: 3500  },
  { name: 'NDA Filed',         min: 7000  },
  { name: 'Approved',          min: 12000 },
  { name: 'Blockbuster',       min: 20000 },
  { name: 'Off-patent',        min: 35000 },
]

const BADGES = [
  { id: 'first_login',     emoji: '🧪', name: 'First Dose',       desc: 'Joined PharmLab',                    earned: true  },
  { id: 'first_author',    emoji: '✍️', name: 'First Author',      desc: 'Uploaded your first question',       earned: false },
  { id: 'peer_reviewer',   emoji: '🔬', name: 'Peer Reviewer',     desc: 'Answered 10 community questions',    earned: false },
  { id: 'clean_room',      emoji: '🧹', name: 'Clean Room',        desc: '7-day study streak',                 earned: false },
  { id: 'nonmem',          emoji: '📊', name: 'NONMEM',            desc: 'Completed 50 exercises',             earned: false },
  { id: 'therapeutic_win', emoji: '🎯', name: 'Therapeutic Window',desc: '5 quizzes in a row — 100%',         earned: false },
  { id: 'adverse_event',   emoji: '⚠️', name: 'Adverse Event',     desc: 'Got the same question wrong 3×',    earned: false },
  { id: 'blockbuster',     emoji: '💊', name: 'Blockbuster',       desc: 'Reached level 7',                   earned: false },
]

function getLevelInfo(xp) {
  let current = LEVELS[0]
  let next = LEVELS[1]
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    }
  }
  const progress = next
    ? ((xp - current.min) / (next.min - current.min)) * 100
    : 100
  return { current, next, progress }
}

function StatCard({ value, label, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 20px' }}>
      <div style={{ fontSize: '28px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px', fontWeight: '500' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

export default function UserProfile() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.textDim, fontSize: '14px' }}>Loading...</div>
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

  // Placeholder XP — will come from Supabase once gamification is built
  const xp = 0
  const { current, next, progress } = getLevelInfo(xp)
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>

      {/* Header banner */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <img src={user.imageUrl} alt="Avatar"
            style={{ width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${C.border}`, flexShrink: 0 }} />

          {/* Name + level */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {user.fullName || user.username || 'PharmLab User'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: C.blueLight, fontWeight: '600', background: `${C.blue}18`, border: `1px solid ${C.blue}44`, borderRadius: '999px', padding: '2px 10px' }}>
                {current.name}
              </span>
              <span style={{ fontSize: '12px', color: C.textDim }}>Member since {joinDate}</span>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ minWidth: '220px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: C.textDim }}>{xp} XP</span>
              <span style={{ fontSize: '12px', color: C.textDim }}>{next ? `${next.min} XP — ${next.name}` : 'Max level'}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: '999px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
          <StatCard value="0"    label="XP earned"       sub="coming soon" />
          <StatCard value="—"    label="Study streak"    sub="coming soon" />
          <StatCard value="0"    label="Questions shared" sub="coming soon" />
          <StatCard value="0"    label="Quiz answers"    sub="coming soon" />
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

        {/* Coming soon sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { title: 'Study groups', desc: 'Join a cohort, share questions, compete on the leaderboard.', emoji: '👥' },
            { title: 'Quiz history', desc: 'Track which questions you got right, wrong, and need to revisit.', emoji: '📋' },
            { title: 'Pomodoro stats', desc: 'Total study time, sessions completed, longest streak.', emoji: '🍅' },
            { title: 'PK Guessr scores', desc: 'Your weekly score and ranking against your study group.', emoji: '📈' },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>{s.emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{s.title}</span>
                <span style={{ fontSize: '10px', color: C.blueLight, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 7px', marginLeft: 'auto' }}>Soon</span>
              </div>
              <p style={{ fontSize: '12px', color: C.textDim, margin: 0, lineHeight: '1.5' }}>{s.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}