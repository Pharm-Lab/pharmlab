'use client'
import { useState, useEffect } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { createClerkSupabaseClient } from '../../lib/supabase'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function GroupsPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [myGroups, setMyGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('mine')
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function db() { return createClerkSupabaseClient(session) }

  async function fetchMyGroups() {
    if (!user) return
    const { data: memberships } = await db()
      .from('group_members').select('group_id').eq('clerk_id', user.id)
    if (!memberships?.length) { setMyGroups([]); setLoading(false); return }
    const groupIds = memberships.map(m => m.group_id)
    const { data: groups } = await db()
      .from('groups').select('*').in('id', groupIds).order('created_at', { ascending: false })
    const withCounts = await Promise.all((groups || []).map(async g => {
      const { count } = await db()
        .from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', g.id)
      return { ...g, member_count: count || 0 }
    }))
    setMyGroups(withCounts)
    setLoading(false)
  }

  useEffect(() => {
    if (isLoaded && user) fetchMyGroups()
  }, [isLoaded, user])

  async function createGroup() {
    if (!newGroupName.trim()) return setError('Enter a group name')
    setSubmitting(true); setError('')
    const code = generateCode()
    const { data: group, error: err } = await db()
      .from('groups').insert({ name: newGroupName.trim(), code, created_by: user.id })
      .select().single()
    if (err) { setError('Could not create group — try again'); setSubmitting(false); return }
    await db().from('group_members').insert({ group_id: group.id, clerk_id: user.id, role: 'owner' })
    setSuccess(`Group created! Share this code: ${code}`)
    setNewGroupName(''); setSubmitting(false)
    fetchMyGroups()
    setTimeout(() => { setSuccess(''); setView('mine') }, 3000)
  }

  async function joinGroup(codeInput) {
    const code = (codeInput || joinCode).trim().toUpperCase()
    if (code.length < 6) return setError('Enter a valid 6-character code')
    setSubmitting(true); setError('')
    const { data: group } = await db().from('groups').select('*').eq('code', code).single()
    if (!group) { setError('No group found with that code'); setSubmitting(false); return }
    const { data: existing } = await db().from('group_members').select('id')
      .eq('group_id', group.id).eq('clerk_id', user.id).single()
    if (existing) { setError("You're already in this group"); setSubmitting(false); return }
    const { error: err } = await db().from('group_members').insert({ group_id: group.id, clerk_id: user.id })
    if (err) { setError('Could not join — try again'); setSubmitting(false); return }
    setSuccess(`Joined "${group.name}"!`); setJoinCode(''); setSubmitting(false)
    fetchMyGroups()
    setTimeout(() => { setSuccess(''); setView('mine') }, 2000)
  }

  if (!isLoaded || loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <span style={{ color: C.textDim, fontSize: '14px' }}>Loading…</span>
    </div>
  )

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input::placeholder { color:rgba(240,244,255,0.25); }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 2rem 1.5rem' }}>
          <Link href="/user" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Profile</Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Study groups</h1>
              <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>Share questions, compare progress, compete with your cohort.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setView('join'); setError(''); setSuccess('') }}
                style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: view === 'join' ? `${C.blue}18` : 'rgba(255,255,255,0.04)', color: view === 'join' ? C.blueLight : C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Join group
              </button>
              <button onClick={() => { setView('create'); setError(''); setSuccess('') }}
                style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                + New group
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>

        {success && (
          <div style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#86efac' }}>
            ✓ {success}
          </div>
        )}

        {/* Create form */}
        {view === 'create' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: C.text, margin: '0 0 14px' }}>Create a new group</h2>
            <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Group name</label>
            <input value={newGroupName} onChange={e => { setNewGroupName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              placeholder="e.g. BPS2025 · Leiden" maxLength={50}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : C.border}`, background: '#060b18', color: C.text, fontSize: '14px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', marginBottom: '4px' }} />
            {error && <p style={{ fontSize: '12px', color: '#fca5a5', margin: '4px 0 10px' }}>{error}</p>}
            <p style={{ fontSize: '12px', color: C.textDim, margin: '6px 0 14px' }}>A unique 6-character code will be generated — share it with your group.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={createGroup} disabled={submitting || !newGroupName.trim()}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: newGroupName.trim() ? C.blue : 'rgba(255,255,255,0.06)', color: newGroupName.trim() ? 'white' : C.textDim, fontSize: '13px', fontWeight: '600', cursor: newGroupName.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Inter',system-ui,sans-serif" }}>
                {submitting ? 'Creating…' : 'Create group'}
              </button>
              <button onClick={() => { setView('mine'); setError('') }}
                style={{ padding: '9px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Join form */}
        {view === 'join' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: C.text, margin: '0 0 14px' }}>Join a group</h2>
            <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Group code</label>
            <input value={joinCode} onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && joinGroup()}
              placeholder="e.g. AB12CD" maxLength={6}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : C.border}`, background: '#060b18', color: C.text, fontSize: '16px', fontWeight: '700', letterSpacing: '0.15em', fontFamily: 'ui-monospace, monospace', outline: 'none', marginBottom: '4px' }} />
            {error && <p style={{ fontSize: '12px', color: '#fca5a5', margin: '4px 0 10px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => joinGroup()} disabled={submitting || joinCode.length < 6}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: joinCode.length >= 6 ? C.blue : 'rgba(255,255,255,0.06)', color: joinCode.length >= 6 ? 'white' : C.textDim, fontSize: '13px', fontWeight: '600', cursor: joinCode.length >= 6 ? 'pointer' : 'not-allowed', fontFamily: "'Inter',system-ui,sans-serif" }}>
                {submitting ? 'Joining…' : 'Join group'}
              </button>
              <button onClick={() => { setView('mine'); setError('') }}
                style={{ padding: '9px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Groups list */}
        {myGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: C.textMid, margin: '0 0 6px' }}>No groups yet</p>
            <p style={{ fontSize: '13px', color: C.textDim, margin: '0 0 20px' }}>Create a group for your cohort or join one with a code.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setView('create')}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Create group
              </button>
              <button onClick={() => setView('join')}
                style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                Join with code
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '11px', color: C.textDim, margin: '0 0 4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Your groups ({myGroups.length})
            </p>
            {myGroups.map(g => (
              <div key={g.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: C.text, margin: '0 0 6px' }}>{g.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '12px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '6px', padding: '2px 8px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>
                        {g.code}
                      </code>
                      <span style={{ fontSize: '12px', color: C.textDim }}>{g.member_count} member{g.member_count !== 1 ? 's' : ''}</span>
                      {g.created_by === user.id && <span style={{ fontSize: '10px', color: C.textDim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Owner</span>}
                    </div>
                  </div>
                  <Link href={`/groups/${g.id}`}
                    style={{ fontSize: '13px', fontWeight: '600', color: C.blueLight, textDecoration: 'none', background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '7px', padding: '6px 14px', whiteSpace: 'nowrap' }}>
                    Open →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}