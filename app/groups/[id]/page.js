'use client'
import React, { useState, useEffect, use } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { createClerkSupabaseClient } from '../../../lib/supabase'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const LEVEL_NAMES = ['Pre-clinical','Phase I','Phase II','Phase III','NDA Filed','Approved','Blockbuster','Off-patent']
const LEVEL_MINS  = [0, 500, 1500, 3500, 7000, 12000, 20000, 35000]
const EMOJIS = ['👥','🧪','⚗️','💊','🔬','🧬','🫀','📈','🎯','🏆','⭐','🌿','🎓','🔭','💡','🧠','🩺','📋']

function getLevel(xp) {
  let l = 0
  for (let i = 0; i < LEVEL_MINS.length; i++) { if (xp >= LEVEL_MINS[i]) l = i }
  return LEVEL_NAMES[l]
}

function SynthesisLeaderboard({ members, userId }) {
  const [expanded, setExpanded] = React.useState(false)
  const sorted = [...members].filter(m => m.gameScore > 0).sort((a, b) => b.gameScore - a.gameScore)
  const myEntry = sorted.find(m => m.clerk_id === userId)
  const myGameRank = myEntry ? sorted.indexOf(myEntry) + 1 : null

  const C = {
    border: 'rgba(255,255,255,0.07)', card: '#0f1629',
    purple: '#7c3aed', purpleLight: '#c4b5fd',
    text: '#f0f4ff', textDim: 'rgba(240,244,255,0.35)',
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header — always visible, click to toggle */}
      <button onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', padding: '12px 16px', background: `${C.purple}08`, border: 'none', borderBottom: expanded ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
        <span style={{ fontSize: '14px' }}>🧪</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: C.purpleLight, textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1, textAlign: 'left' }}>
          Synthesis Rush — group best scores
        </span>
        {/* Show your rank when collapsed */}
        {!expanded && myGameRank && (
          <span style={{ fontSize: '12px', color: C.purpleLight, fontFamily: 'ui-monospace, monospace', fontWeight: '700' }}>
            you #{myGameRank} · {myEntry.gameScore.toLocaleString()}
          </span>
        )}
        <span style={{ fontSize: '12px', color: C.textDim, marginLeft: '4px' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded list */}
      {expanded && sorted.map((m, i) => {
        const isMe = m.clerk_id === userId
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
        return (
          <div key={m.clerk_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none', background: isMe ? `rgba(124,58,237,0.06)` : 'transparent' }}>
            <span style={{ fontSize: '14px', minWidth: '24px' }}>{medal || `${i + 1}`}</span>
            <span style={{ fontSize: '13px', fontWeight: isMe ? '700' : '500', color: isMe ? C.purpleLight : C.text, flex: 1 }}>@{m.username}</span>
            {isMe && <span style={{ fontSize: '10px', color: C.purpleLight, background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.33)', borderRadius: '999px', padding: '1px 6px' }}>you</span>}
            <span style={{ fontSize: '13px', fontWeight: '700', color: C.purpleLight, fontFamily: 'ui-monospace, monospace' }}>{m.gameScore.toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function GroupDetailPage({ params: paramsPromise }) {
  const { id } = use(paramsPromise)
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState('member')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState('leaderboard') // 'leaderboard' | 'members' | 'settings'
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editEmoji, setEditEmoji] = useState('👥')
  const [editUni, setEditUni] = useState('')
  const [saving, setSaving] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function db() { return createClerkSupabaseClient(session) }

  async function load() {
    const { data: grp } = await db().from('groups').select('*').eq('id', id).single()
    if (!grp) { setNotFound(true); setLoading(false); return }
    setGroup(grp)
    setEditName(grp.name)
    setEditDesc(grp.description || '')
    setEditEmoji(grp.icon_emoji || '👥')
    setEditUni(grp.university || '')

    const { data: memberRows } = await db()
      .from('group_members').select('clerk_id, joined_at, role').eq('group_id', id)

    const clerkIds = memberRows?.map(m => m.clerk_id) || []
    const { data: profiles } = await db()
      .from('user_profiles').select('clerk_id, username, xp').in('clerk_id', clerkIds)

    // Best Synthesis Rush score per member
    const { data: gameScores } = await db()
      .from('game_scores').select('clerk_id, score')
      .eq('game', 'synthesis_rush').in('clerk_id', clerkIds)
    const bestScores = {}
    ;(gameScores || []).forEach(g => {
      if (!bestScores[g.clerk_id] || g.score > bestScores[g.clerk_id]) bestScores[g.clerk_id] = g.score
    })

    const merged = (memberRows || []).map(m => {
      const p = profiles?.find(p => p.clerk_id === m.clerk_id)
      return { ...m, username: p?.username || 'Unknown', xp: p?.xp || 0, gameScore: bestScores[m.clerk_id] || 0 }
    }).sort((a, b) => b.xp - a.xp)

    setMembers(merged)
    const me = memberRows?.find(m => m.clerk_id === user.id)
    setMyRole(me?.role || 'member')
    setLoading(false)
  }

  useEffect(() => { if (isLoaded && user) load() }, [isLoaded, user])

  function copyCode() {
    navigator.clipboard.writeText(group.code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function saveSettings() {
    setSaving(true); setError('')
    const { error: err } = await db().from('groups').update({
      name: editName.trim(),
      description: editDesc.trim(),
      icon_emoji: editEmoji,
      university: editUni.trim(),
    }).eq('id', id)
    if (err) { setError('Could not save — try again'); setSaving(false); return }
    setSuccess('Saved!'); setSaving(false)
    load()
    setTimeout(() => setSuccess(''), 2000)
  }

  async function kickMember(clerkId, username) {
    if (!confirm(`Remove @${username} from the group?`)) return
    await db().from('group_members').delete().eq('group_id', id).eq('clerk_id', clerkId)
    load()
  }

  async function changeRole(clerkId, newRole) {
    await db().from('group_members').update({ role: newRole }).eq('group_id', id).eq('clerk_id', clerkId)
    load()
  }

  async function transferOwnership() {
    if (!transferTo) return setError('Select a member to transfer to')
    if (!confirm('Transfer ownership? You will become an admin.')) return
    await db().from('group_members').update({ role: 'owner' }).eq('group_id', id).eq('clerk_id', transferTo)
    await db().from('group_members').update({ role: 'admin' }).eq('group_id', id).eq('clerk_id', user.id)
    await db().from('groups').update({ created_by: transferTo }).eq('id', id)
    setSuccess('Ownership transferred'); load()
    setTimeout(() => setSuccess(''), 2000)
  }

  async function leaveGroup() {
    if (myRole === 'owner') return setError('Transfer ownership before leaving.')
    if (!confirm('Leave this group?')) return
    await db().from('group_members').delete().eq('group_id', id).eq('clerk_id', user.id)
    window.location.href = '/groups'
  }

  async function deleteGroup() {
    if (myRole !== 'owner') return
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return
    await db().from('group_members').delete().eq('group_id', id)
    await db().from('groups').delete().eq('id', id)
    window.location.href = '/groups'
  }

  if (!isLoaded || loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <span style={{ color: C.textDim, fontSize: '14px' }}>Loading…</span>
    </div>
  )

  if (notFound) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.textMid, marginBottom: '12px' }}>Group not found.</p>
        <Link href="/groups" style={{ color: C.blueLight, textDecoration: 'none', fontSize: '14px' }}>← Back to groups</Link>
      </div>
    </div>
  )

  const isPrivileged = myRole === 'owner' || myRole === 'admin'
  const myRank = members.findIndex(m => m.clerk_id === user.id) + 1

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input::placeholder,textarea::placeholder { color:rgba(240,244,255,0.25); }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 2rem 0' }}>
          <Link href="/groups" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Groups</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '36px', lineHeight: 1 }}>{group.icon_emoji || '👥'}</span>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{group.name}</h1>
                {group.description && <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 4px' }}>{group.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {group.university && <span style={{ fontSize: '11px', color: C.textDim, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '999px', padding: '1px 8px' }}>{group.university}</span>}
                  <code style={{ fontSize: '12px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '6px', padding: '2px 8px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em' }}>{group.code}</code>
                  <button onClick={copyCode} style={{ fontSize: '12px', color: copied ? '#86efac' : C.textDim, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
                    {copied ? '✓ Copied' : 'Copy code'}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {isPrivileged && (
                <button onClick={() => setView(view === 'settings' ? 'leaderboard' : 'settings')}
                  style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${C.border}`, background: view === 'settings' ? `${C.blue}18` : 'rgba(255,255,255,0.04)', color: view === 'settings' ? C.blueLight : C.textMid, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  ⚙ Settings
                </button>
              )}
              {myRole !== 'owner' && (
                <button onClick={leaveGroup}
                  style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  Leave
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0', borderTop: `1px solid ${C.border}` }}>
            {['leaderboard', 'members'].map(t => (
              <button key={t} onClick={() => setView(t)}
                style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: view === t ? `2px solid ${C.blue}` : '2px solid transparent', color: view === t ? C.blueLight : C.textDim, fontSize: '13px', fontWeight: view === t ? '600' : '400', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif", textTransform: 'capitalize', marginBottom: '-1px' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>

        {/* Feedback */}
        {(error || success) && (
          <div style={{ background: error ? 'rgba(185,28,28,0.2)' : 'rgba(22,163,74,0.15)', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(22,163,74,0.4)'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: error ? '#fca5a5' : '#86efac' }}>
            {error || `✓ ${success}`}
          </div>
        )}

        {/* Leaderboard */}
        {view === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Top cards row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Your rank */}
              <div style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}28`, borderRadius: '12px', padding: '14px 18px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Your rank</p>
                <span style={{ fontSize: '26px', fontWeight: '800', color: C.blueLight, fontFamily: 'ui-monospace, monospace' }}>
                  {myRank > 0 ? `#${myRank}` : '—'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: C.textDim, marginLeft: '6px' }}>of {members.length}</span>
              </div>

              {/* Quiz bank placeholder */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 18px', opacity: 0.6 }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Quiz bank</p>
                <span style={{ fontSize: '13px', color: C.textDim }}>Coming soon</span>
                <span style={{ fontSize: '10px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 7px', marginLeft: '8px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Soon</span>
              </div>
            </div>

            {/* Synthesis Rush leaderboard — collapsible */}
            {members.some(m => m.gameScore > 0) && <SynthesisLeaderboard members={members} userId={user.id} />}

            {/* Main XP leaderboard */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                XP leaderboard — {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto auto', gap: '12px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)' }}>
                  {['#','Member','Level','XP'].map((h, i) => (
                    <span key={h} style={{ fontSize: '11px', color: C.textDim, fontWeight: '600', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</span>
                  ))}
                </div>
                {members.map((m, i) => {
                  const isMe = m.clerk_id === user.id
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                  return (
                    <div key={m.clerk_id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto auto', gap: '12px', padding: '12px 16px', alignItems: 'center', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none', background: isMe ? `${C.blue}08` : 'transparent' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: C.textDim, fontFamily: 'ui-monospace, monospace' }}>{medal || `${i + 1}`}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/u/${m.username}`} style={{ fontSize: '14px', fontWeight: isMe ? '700' : '500', color: isMe ? C.blueLight : C.text, textDecoration: 'none' }}>@{m.username}</Link>
                        {isMe && <span style={{ fontSize: '10px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '1px 6px' }}>you</span>}
                        {m.role === 'owner' && <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '999px', padding: '1px 6px' }}>owner</span>}
                        {m.role === 'admin' && <span style={{ fontSize: '10px', color: C.purpleLight, background: `${C.purple}18`, border: `1px solid ${C.purple}33`, borderRadius: '999px', padding: '1px 6px' }}>admin</span>}
                      </div>
                      <span style={{ fontSize: '12px', color: C.textDim, whiteSpace: 'nowrap' }}>{getLevel(m.xp)}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: C.text, textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{m.xp}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Members management */}
        {view === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: C.textDim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
            {members.map(m => {
              const isMe = m.clerk_id === user.id
              const canManage = isPrivileged && !isMe && m.role !== 'owner'
              return (
                <div key={m.clerk_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link href={`/u/${m.username}`} style={{ fontSize: '14px', fontWeight: '600', color: isMe ? C.blueLight : C.text, textDecoration: 'none' }}>@{m.username}</Link>
                    {m.role === 'owner' && <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '999px', padding: '1px 6px' }}>owner</span>}
                    {m.role === 'admin' && <span style={{ fontSize: '10px', color: C.purpleLight, background: `${C.purple}18`, border: `1px solid ${C.purple}33`, borderRadius: '999px', padding: '1px 6px' }}>admin</span>}
                    <span style={{ fontSize: '12px', color: C.textDim }}>{m.xp} XP</span>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {myRole === 'owner' && (
                        <button onClick={() => changeRole(m.clerk_id, m.role === 'admin' ? 'member' : 'admin')}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.textMid, cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                          {m.role === 'admin' ? 'Demote' : 'Make admin'}
                        </button>
                      )}
                      <button onClick={() => kickMember(m.clerk_id, m.username)}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Settings */}
        {view === 'settings' && isPrivileged && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Edit details */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.text, margin: '0 0 14px' }}>Group details</h3>

              {/* Emoji picker */}
              <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '6px' }}>Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setEditEmoji(e)}
                    style={{ fontSize: '20px', padding: '4px 6px', borderRadius: '7px', border: `1px solid ${editEmoji === e ? C.blue : C.border}`, background: editEmoji === e ? `${C.blue}18` : 'rgba(255,255,255,0.03)', cursor: 'pointer', lineHeight: 1 }}>
                    {e}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={50}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#060b18', color: C.text, fontSize: '14px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', marginBottom: '12px' }} />

              <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>Description <span style={{ color: C.textDim, fontWeight: '400' }}>(optional)</span></label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={200} rows={2}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#060b18', color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', resize: 'vertical', marginBottom: '12px' }} />

              <label style={{ fontSize: '12px', color: C.textDim, display: 'block', marginBottom: '4px' }}>University / institution <span style={{ color: C.textDim, fontWeight: '400' }}>(optional)</span></label>
              <input value={editUni} onChange={e => setEditUni(e.target.value)} maxLength={80} placeholder="e.g. Leiden University"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#060b18', color: C.text, fontSize: '14px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', marginBottom: '14px' }} />

              <button onClick={saveSettings} disabled={saving}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: C.blue, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            {/* Transfer ownership */}
            {myRole === 'owner' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.text, margin: '0 0 4px' }}>Transfer ownership</h3>
                <p style={{ fontSize: '12px', color: C.textDim, margin: '0 0 12px' }}>You'll become an admin after transferring.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={transferTo} onChange={e => setTransferTo(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: '#060b18', color: C.text, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }}>
                    <option value="">Select member…</option>
                    {members.filter(m => m.clerk_id !== user.id).map(m => (
                      <option key={m.clerk_id} value={m.clerk_id}>@{m.username}</option>
                    ))}
                  </select>
                  <button onClick={transferOwnership}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                    Transfer
                  </button>
                </div>
              </div>
            )}

            {/* Danger zone */}
            {myRole === 'owner' && (
              <div style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fca5a5', margin: '0 0 4px' }}>Danger zone</h3>
                <p style={{ fontSize: '12px', color: 'rgba(252,165,165,0.6)', margin: '0 0 12px' }}>Deleting the group removes all members and cannot be undone.</p>
                <button onClick={deleteGroup}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
                  Delete group
                </button>
              </div>
            )}
          </div>
        )}



      </div>
    </main>
  )
}