'use client'
import { useState, useEffect, use } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { createClerkSupabaseClient, supabase } from '../../../lib/supabase'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const LEVEL_NAMES = ['Pre-clinical','Phase I','Phase II','Phase III','NDA Filed','Approved','Blockbuster','Off-patent']
const LEVEL_MINS  = [0, 500, 1500, 3500, 7000, 12000, 20000, 35000]

const BADGES = [
  { id: 'first_login',     emoji: '🧪', name: 'First Dose' },
  { id: 'first_author',    emoji: '✍️', name: 'First Author' },
  { id: 'peer_reviewer',   emoji: '🔬', name: 'Peer Reviewer' },
  { id: 'clean_room',      emoji: '🧹', name: 'Clean Room' },
  { id: 'nonmem',          emoji: '📊', name: 'NONMEM' },
  { id: 'therapeutic_win', emoji: '🎯', name: 'Therapeutic Window' },
  { id: 'blockbuster',     emoji: '💊', name: 'Blockbuster' },
]

function getLevelInfo(xp) {
  let current = LEVEL_NAMES[0], idx = 0
  for (let i = 0; i < LEVEL_MINS.length; i++) { if (xp >= LEVEL_MINS[i]) { current = LEVEL_NAMES[i]; idx = i } }
  const next = LEVEL_MINS[idx + 1]
  const progress = next ? ((xp - LEVEL_MINS[idx]) / (next - LEVEL_MINS[idx])) * 100 : 100
  return { name: current, progress, nextXp: next || null }
}

export default function PublicProfilePage({ params: paramsPromise }) {
  const { username } = use(paramsPromise)
  const { user: currentUser, isLoaded } = useUser()
  const { session } = useSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  function db() { return createClerkSupabaseClient(session) }
  const isOwnProfile = currentUser && profile && currentUser.id === profile.clerk_id

  useEffect(() => {
    async function load() {
      // Public read — no auth needed for profile
      const { data: prof } = await supabase
        .from('user_profiles').select('*').eq('username', username).single()
      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      // Follower / following counts
      const { count: fc } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', prof.clerk_id)
      const { count: fg } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', prof.clerk_id)
      setFollowerCount(fc || 0)
      setFollowingCount(fg || 0)

      setLoading(false)
    }
    load()
  }, [username])

  // Check if current user follows this profile
  useEffect(() => {
    if (!isLoaded || !currentUser || !profile || isOwnProfile) return
    async function checkFollow() {
      const { data } = await db()
        .from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', profile.clerk_id).single()
      setIsFollowing(!!data)
    }
    checkFollow()
  }, [isLoaded, currentUser, profile])

  async function toggleFollow() {
    if (!currentUser || isOwnProfile) return
    setFollowLoading(true)
    if (isFollowing) {
      await db().from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.clerk_id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await db().from('follows').insert({ follower_id: currentUser.id, following_id: profile.clerk_id })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <span style={{ color: C.textDim, fontSize: '14px' }}>Loading…</span>
    </div>
  )

  if (notFound) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.textMid, marginBottom: '4px', fontSize: '15px', fontWeight: '600' }}>User not found</p>
        <p style={{ color: C.textDim, fontSize: '13px', marginBottom: '16px' }}>@{username} doesn't exist.</p>
        <Link href="/" style={{ color: C.blueLight, textDecoration: 'none', fontSize: '13px' }}>← PharmLab</Link>
      </div>
    </div>
  )

  const { name: levelName, progress, nextXp } = getLevelInfo(profile.xp || 0)
  const earnedBadges = ['first_login'] // hardcoded for now, will come from DB later

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>

            {/* Avatar placeholder */}
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
              {profile.username?.[0]?.toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: C.text, margin: 0, letterSpacing: '-0.02em' }}>@{profile.username}</h1>
                {!isOwnProfile && isLoaded && currentUser && (
                  <button onClick={toggleFollow} disabled={followLoading}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: isFollowing ? `1px solid ${C.border}` : 'none', background: isFollowing ? 'rgba(255,255,255,0.06)' : C.blue, color: isFollowing ? C.textMid : 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                    {followLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                {isOwnProfile && (
                  <Link href="/user" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '5px 12px' }}>Edit profile</Link>
                )}
              </div>

              {/* Level + XP bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: C.blueLight, fontWeight: '600' }}>{levelName}</span>
                  <span style={{ fontSize: '12px', color: C.textDim }}>{profile.xp || 0} XP{nextXp ? ` / ${nextXp}` : ''}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: '999px' }} />
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace' }}>{followerCount}</span>
                  <span style={{ fontSize: '12px', color: C.textDim, marginLeft: '4px' }}>followers</span>
                </div>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace' }}>{followingCount}</span>
                  <span style={{ fontSize: '12px', color: C.textDim, marginLeft: '4px' }}>following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem' }}>

        {/* Badges */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Badges</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {BADGES.map(b => {
              const earned = earnedBadges.includes(b.id)
              return (
                <div key={b.id} title={b.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: earned ? `${C.blue}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${earned ? C.blue + '44' : C.border}`, opacity: earned ? 1 : 0.35 }}>
                  <span style={{ fontSize: '16px', filter: earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</span>
                  <span style={{ fontSize: '12px', color: earned ? C.text : C.textDim, fontWeight: earned ? '600' : '400' }}>{b.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '2rem' }}>
          {[
            { value: profile.xp || 0, label: 'XP earned' },
            { value: profile.streak || 0, label: 'Day streak' },
            { value: '—', label: 'Questions shared', sub: 'coming soon' },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: C.textMid, marginTop: '3px' }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: '11px', color: C.textDim, marginTop: '1px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Compare button if viewing someone else */}
        {!isOwnProfile && isLoaded && currentUser && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 2px' }}>Compare stats</p>
              <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>See how you stack up against @{profile.username}</p>
            </div>
            <span style={{ fontSize: '10px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '2px 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Soon</span>
          </div>
        )}

      </div>
    </main>
  )
}