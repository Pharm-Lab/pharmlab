'use client'
import { useState, useEffect, use } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { supabase, createClerkSupabaseClient } from '../../lib/supabase'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const LEVEL_NAMES = ['Pre-clinical','Phase I','Phase II','Phase III','NDA Filed','Approved','Blockbuster','Off-patent']
const LEVEL_MINS  = [0,500,1500,3500,7000,12000,20000,35000]
function getLevel(xp) {
  let l = 0
  for (let i = 0; i < LEVEL_MINS.length; i++) { if (xp >= LEVEL_MINS[i]) l = i }
  return LEVEL_NAMES[l]
}

export default function SearchPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState(new Set())
  const [followLoading, setFollowLoading] = useState(new Set())

  function db() { return createClerkSupabaseClient(session) }

  // Load who current user already follows
  useEffect(() => {
    if (!isLoaded || !user) return
    async function loadFollowing() {
      const { data } = await db().from('follows').select('following_id').eq('follower_id', user.id)
      setFollowing(new Set((data || []).map(f => f.following_id)))
    }
    loadFollowing()
  }, [isLoaded, user])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('user_profiles')
        .select('clerk_id, username, xp, streak, avatar_url')
        .ilike('username', `%${query.trim()}%`)
        .limit(20)
      setResults(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function toggleFollow(profileId, username) {
    if (!user) return
    setFollowLoading(prev => new Set(prev).add(profileId))
    if (following.has(profileId)) {
      await db().from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId)
      setFollowing(prev => { const s = new Set(prev); s.delete(profileId); return s })
    } else {
      await db().from('follows').insert({ follower_id: user.id, following_id: profileId })
      setFollowing(prev => new Set(prev).add(profileId))
    }
    setFollowLoading(prev => { const s = new Set(prev); s.delete(profileId); return s })
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input::placeholder { color:rgba(240,244,255,0.25); }`}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 2rem 2rem' }}>
        <Link href="/user" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>← Profile</Link>

        <h1 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Find people</h1>
        <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 1.5rem' }}>Search by username to follow people and compare stats.</p>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: C.textDim, pointerEvents: 'none' }}>@</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="username"
            autoFocus
            style={{ width: '100%', padding: '12px 14px 12px 30px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '15px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }}
          />
          {loading && (
            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: C.textDim }}>searching…</span>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map(p => {
              const isMe = user && p.clerk_id === user.id
              const isF = following.has(p.clerk_id)
              const fLoading = followLoading.has(p.clerk_id)
              return (
                <div key={p.clerk_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Avatar */}
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt={p.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{p.username?.[0]?.toUpperCase()}</div>
                    }
                    <div>
                      <Link href={`/u/${p.username}`} style={{ fontSize: '14px', fontWeight: '700', color: C.text, textDecoration: 'none', display: 'block', marginBottom: '2px' }}>
                        @{p.username}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 7px' }}>
                          {getLevel(p.xp || 0)}
                        </span>
                        <span style={{ fontSize: '11px', color: C.textDim }}>{p.xp || 0} XP</span>
                      </div>
                    </div>
                  </div>
                  {!isMe && isLoaded && user && (
                    <button onClick={() => toggleFollow(p.clerk_id, p.username)} disabled={fLoading}
                      style={{ padding: '6px 16px', borderRadius: '8px', border: isF ? `1px solid ${C.border}` : 'none', background: isF ? 'rgba(255,255,255,0.06)' : C.blue, color: isF ? C.textMid : 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif", flexShrink: 0 }}>
                      {fLoading ? '…' : isF ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {isMe && (
                    <span style={{ fontSize: '12px', color: C.textDim }}>you</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty states */}
        {query.trim() && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: C.textDim }}>
            <p style={{ fontSize: '15px', margin: '0 0 4px', color: C.textMid }}>No results for "@{query}"</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Try a different username.</p>
          </div>
        )}

        {!query.trim() && (
          <div style={{ textAlign: 'center', padding: '3rem', color: C.textDim }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
            <p style={{ fontSize: '14px', color: C.textMid, margin: 0 }}>Start typing to find people by username.</p>
          </div>
        )}
      </div>
    </main>
  )
}