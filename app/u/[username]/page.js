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
  return { name: current, progress, nextXp: next || null, idx }
}

// ── Compare section ───────────────────────────────────────────────
function CompareView({ theirProfile, myProfile, theirFollowers, myFollowers, theirFollowing, myFollowing }) {
  const earnedBadges = ['first_login']
  const theirXp = theirProfile.xp || 0
  const myXp    = myProfile.xp    || 0
  const maxXp   = Math.max(theirXp, myXp, 1)

  const rows = [
    { label: 'XP',         mine: myXp,                    theirs: theirXp,                format: v => `${v}` },
    { label: 'Streak',     mine: myProfile.streak || 0,   theirs: theirProfile.streak || 0, format: v => `${v}d` },
    { label: 'Followers',  mine: myFollowers,              theirs: theirFollowers,           format: v => `${v}` },
    { label: 'Following',  mine: myFollowing,              theirs: theirFollowing,           format: v => `${v}` },
  ]

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {myProfile.avatar_url
            ? <img src={myProfile.avatar_url} alt="you" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'white' }}>{myProfile.username?.[0]?.toUpperCase()}</div>
          }
          <span style={{ fontSize: '13px', fontWeight: '700', color: C.blueLight }}>@{myProfile.username}</span>
        </div>
        <span style={{ fontSize: '11px', color: C.textDim, textAlign: 'center' }}>vs</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>@{theirProfile.username}</span>
          {theirProfile.avatar_url
            ? <img src={theirProfile.avatar_url} alt="them" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'white' }}>{theirProfile.username?.[0]?.toUpperCase()}</div>
          }
        </div>
      </div>

      {/* XP bar comparison */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '11px', color: C.textDim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>XP</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: C.blueLight, minWidth: '40px', textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{myXp}</span>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
            {/* My bar from left */}
            <div style={{ width: `${(myXp / maxXp) * 50}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.blueLight})`, borderRadius: '999px 0 0 999px', marginLeft: 'auto', transition: 'width 0.6s ease' }} />
            {/* Their bar from right — we use a reversed flex trick */}
          </div>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${(theirXp / maxXp) * 50}%`, height: '100%', background: `linear-gradient(90deg, ${C.purple}, ${C.purpleLight})`, borderRadius: '999px', transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: C.text, minWidth: '40px', fontFamily: 'ui-monospace, monospace' }}>{theirXp}</span>
        </div>
      </div>

      {/* Stats rows */}
      {rows.slice(1).map((r, i) => {
        const mine = r.mine, theirs = r.theirs
        const myWins = mine > theirs, theyWin = theirs > mine
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', padding: '10px 16px', borderBottom: i < rows.length - 2 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: myWins ? C.blueLight : C.textMid, fontFamily: 'ui-monospace, monospace', textAlign: 'right' }}>
              {r.format(mine)} {myWins && '▲'}
            </span>
            <span style={{ fontSize: '11px', color: C.textDim, textAlign: 'center', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: theyWin ? C.text : C.textDim, fontFamily: 'ui-monospace, monospace' }}>
              {theyWin && '▲'} {r.format(theirs)}
            </span>
          </div>
        )
      })}

      {/* Badges comparison */}
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: '11px', color: C.textDim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Badges</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {BADGES.map(b => {
            const iHave    = earnedBadges.includes(b.id)
            const theyHave = earnedBadges.includes(b.id) // both have first_login for now
            return (
              <div key={b.id} title={`${b.name}${iHave ? ' — you have this' : ''}${theyHave ? ` — @${theirProfile.username} has this` : ''}`}
                style={{ fontSize: '18px', padding: '4px', borderRadius: '6px', background: iHave && theyHave ? `${C.blue}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${iHave || theyHave ? C.border : 'transparent'}`, opacity: iHave || theyHave ? 1 : 0.25, position: 'relative' }}>
                {b.emoji}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function PublicProfilePage({ params: paramsPromise }) {
  const { username } = use(paramsPromise)
  const { user: currentUser, isLoaded } = useUser()
  const { session } = useSession()
  const [profile, setProfile] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [myFollowerCount, setMyFollowerCount] = useState(0)
  const [myFollowingCount, setMyFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [modal, setModal] = useState(null) // 'followers' | 'following' | null
  const [followerList, setFollowerList] = useState([])
  const [followingList, setFollowingList] = useState([])

  function db() { return createClerkSupabaseClient(session) }
  const isOwnProfile = currentUser && profile && currentUser.id === profile.clerk_id

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase
        .from('user_profiles').select('*').eq('username', username).single()
      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      const { count: fc } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', prof.clerk_id)
      const { count: fg } = await supabase
        .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', prof.clerk_id)
      setFollowerCount(fc || 0)
      setFollowingCount(fg || 0)

      // Load follower/following lists
      const { data: followerRows } = await supabase.from('follows').select('follower_id').eq('following_id', prof.clerk_id)
      const { data: followingRows } = await supabase.from('follows').select('following_id').eq('follower_id', prof.clerk_id)
      if (followerRows?.length) {
        const { data: fProfiles } = await supabase.from('user_profiles').select('username, avatar_url, xp').in('clerk_id', followerRows.map(r => r.follower_id))
        setFollowerList(fProfiles || [])
      }
      if (followingRows?.length) {
        const { data: gProfiles } = await supabase.from('user_profiles').select('username, avatar_url, xp').in('clerk_id', followingRows.map(r => r.following_id))
        setFollowingList(gProfiles || [])
      }
      setLoading(false)
    }
    load()
  }, [username])

  // Load current user's profile + social counts for comparison
  useEffect(() => {
    if (!isLoaded || !currentUser || !profile || isOwnProfile) return
    async function loadMyProfile() {
      const { data } = await db().from('user_profiles').select('*').eq('clerk_id', currentUser.id).single()
      setMyProfile(data)
      const { count: fc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', currentUser.id)
      const { count: fg } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', currentUser.id)
      setMyFollowerCount(fc || 0)
      setMyFollowingCount(fg || 0)
      const { data: followRow } = await db().from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', profile.clerk_id).single()
      setIsFollowing(!!followRow)
    }
    loadMyProfile()
  }, [isLoaded, currentUser, profile])

  async function toggleFollow() {
    if (!currentUser || isOwnProfile) return
    setFollowLoading(true)
    if (isFollowing) {
      await db().from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.clerk_id)
      setIsFollowing(false); setFollowerCount(c => c - 1)
    } else {
      await db().from('follows').insert({ follower_id: currentUser.id, following_id: profile.clerk_id })
      setIsFollowing(true); setFollowerCount(c => c + 1)
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
  const earnedBadges = ['first_login']

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${C.border}` }} />
              : <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{profile.username?.[0]?.toUpperCase()}</div>
            }
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
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
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: C.blueLight, fontWeight: '600' }}>{levelName}</span>
                  <span style={{ fontSize: '12px', color: C.textDim }}>{profile.xp || 0} XP{nextXp ? ` / ${nextXp}` : ''}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius: '999px' }} />
                </div>
              </div>

              {/* Follower/following counts — clickable */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => setModal('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace' }}>{followerCount}</span>
                  <span style={{ fontSize: '12px', color: C.textDim }}>followers</span>
                </button>
                <button onClick={() => setModal('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace' }}>{followingCount}</span>
                  <span style={{ fontSize: '12px', color: C.textDim }}>following</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <>
          <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', zIndex: 999, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(360px, calc(100vw - 2rem))', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', fontFamily: "'Inter',system-ui,sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: C.text, margin: 0 }}>
                {modal === 'followers' ? `Followers of @${profile.username}` : `@${profile.username} follows`}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px 0' }}>
              {(modal === 'followers' ? followerList : followingList).length === 0 ? (
                <p style={{ textAlign: 'center', color: C.textDim, fontSize: '13px', padding: '2rem' }}>
                  {modal === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
              ) : (
                (modal === 'followers' ? followerList : followingList).map(u => (
                  <Link key={u.username} href={`/u/${u.username}`} onClick={() => setModal(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.username} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{u.username?.[0]?.toUpperCase()}</div>
                    }
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>@{u.username}</div>
                      <div style={{ fontSize: '12px', color: C.textDim }}>{u.xp || 0} XP</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}

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

        {/* Stats */}
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

        {/* Compare section */}
        {!isOwnProfile && isLoaded && currentUser && myProfile && (
          <div>
            <button onClick={() => setShowCompare(v => !v)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${showCompare ? C.blue + '44' : C.border}`, background: showCompare ? `${C.blue}10` : C.card, color: showCompare ? C.blueLight : C.textMid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif", marginBottom: showCompare ? '12px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚔️ Compare with @{profile.username}</span>
              <span style={{ fontSize: '12px' }}>{showCompare ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showCompare && (
              <CompareView
                theirProfile={profile}
                myProfile={myProfile}
                theirFollowers={followerCount}
                myFollowers={myFollowerCount}
                theirFollowing={followingCount}
                myFollowing={myFollowingCount}
              />
            )}
          </div>
        )}

        {/* Prompt to sign in for comparison */}
        {!isOwnProfile && isLoaded && !currentUser && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: C.textDim, margin: '0 0 10px' }}>Sign in to follow @{profile.username} and compare stats</p>
            <Link href="/sign-in" style={{ fontSize: '13px', color: C.blueLight, textDecoration: 'none', fontWeight: '600' }}>Sign in →</Link>
          </div>
        )}

      </div>
    </main>
  )
}