'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { createClerkSupabaseClient } from '../../lib/supabase'
import { awardXp } from '../../lib/xp'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const WORK_MINS  = 25
const BREAK_MINS = 5

function pad(n) { return String(n).padStart(2, '0') }

export default function PomodoroTimer() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()

  const [expanded,  setExpanded]  = useState(false)
  const [running,   setRunning]   = useState(false)
  const [isBreak,   setIsBreak]   = useState(false)
  const [secs,      setSecs]      = useState(WORK_MINS * 60)
  const [sessions,  setSessions]  = useState(0)
  const [pos,       setPos]       = useState({ x: null, y: null })
  const [dragging,  setDragging]  = useState(false)
  const dragStart   = useRef(null)
  const widgetRef   = useRef(null)
  const intervalRef = useRef(null)

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem('pharmlab_pomo_pos')
    if (saved) {
      try { setPos(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Tick
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          handleSessionEnd()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, isBreak])

  async function handleSessionEnd() {
    setRunning(false)
    if (!isBreak) {
      // Work session complete — award XP, log to DB
      setSessions(n => n + 1)
      if (user) {
        awardXp(session, user.id, 25, 'pomodoro_complete')
        const db = createClerkSupabaseClient(session)
        await db.from('sessions').insert({ clerk_id: user.id, duration_mins: WORK_MINS })
      }
      // Switch to break
      setIsBreak(true)
      setSecs(BREAK_MINS * 60)
      setExpanded(true) // pop open break screen
    } else {
      // Break over — back to work
      setIsBreak(false)
      setSecs(WORK_MINS * 60)
    }
  }

  function toggle() { setRunning(r => !r) }

  function reset() {
    setRunning(false)
    setIsBreak(false)
    setSecs(WORK_MINS * 60)
  }

  function skipToBreak() {
    setRunning(false)
    setIsBreak(true)
    setSecs(BREAK_MINS * 60)
  }

  // Dragging
  function onMouseDown(e) {
    if (e.target.closest('button') || e.target.closest('a')) return
    setDragging(true)
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      wx: pos.x ?? (window.innerWidth - 280),
      wy: pos.y ?? (window.innerHeight - 80),
    }
  }

  useEffect(() => {
    if (!dragging) return
    function onMove(e) {
      const dx = e.clientX - dragStart.current.mx
      const dy = e.clientY - dragStart.current.my
      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - 260, dragStart.current.wx + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.wy + dy)),
      }
      setPos(newPos)
      localStorage.setItem('pharmlab_pomo_pos', JSON.stringify(newPos))
    }
    function onUp() { setDragging(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  if (!isLoaded || !user) return null

  const mins = Math.floor(secs / 60)
  const secR = secs % 60
  const totalSecs = isBreak ? BREAK_MINS * 60 : WORK_MINS * 60
  const progress = ((totalSecs - secs) / totalSecs) * 100
  const accentColor = isBreak ? C.purple : C.blue
  const defaultX = typeof window !== 'undefined' ? window.innerWidth - 280 : 800
  const defaultY = typeof window !== 'undefined' ? window.innerHeight - 80 : 700
  const left = pos.x ?? defaultX
  const top  = pos.y ?? defaultY

  return (
    <div ref={widgetRef}
      style={{
        position: 'fixed', left, top, zIndex: 500,
        userSelect: 'none', cursor: dragging ? 'grabbing' : 'grab',
        fontFamily: "'Inter',system-ui,sans-serif",
        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
      }}
      onMouseDown={onMouseDown}>

      {expanded ? (
        // ── Expanded card ───────────────────────────────────────────
        <div style={{ width: '260px', background: C.card, border: `1px solid ${accentColor}44`, borderRadius: '16px', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>{isBreak ? '☕' : '🍅'}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: isBreak ? '#c4b5fd' : C.blueLight, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isBreak ? 'Break time' : 'Focus'}
              </span>
              {sessions > 0 && <span style={{ fontSize: '11px', color: C.textDim }}>#{sessions}</span>}
            </div>
            <button onClick={() => setExpanded(false)}
              style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>
              ×
            </button>
          </div>

          {/* Timer */}
          <div style={{ padding: '20px 14px 14px', textAlign: 'center' }}>
            {/* Progress ring */}
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="50" cy="50" r="44" fill="none" stroke={accentColor} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em' }}>
                  {pad(mins)}:{pad(secR)}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: isBreak ? '14px' : '0' }}>
              <button onClick={toggle}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: accentColor, color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                {running ? '⏸ Pause' : secs === 0 ? '↺ Reset' : '▶ Start'}
              </button>
              <button onClick={reset}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '13px', cursor: 'pointer' }}>
                ↺
              </button>
              {!isBreak && running && (
                <button onClick={skipToBreak}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '12px', cursor: 'pointer' }}>
                  Skip
                </button>
              )}
            </div>

            {/* Break: play now button */}
            {isBreak && (
              <Link href="/play"
                style={{ display: 'block', marginTop: '8px', padding: '9px', borderRadius: '9px', background: `${C.purple}20`, border: `1px solid ${C.purple}44`, color: '#c4b5fd', fontSize: '13px', fontWeight: '600', textAlign: 'center', textDecoration: 'none' }}>
                🧪 Play Synthesis Rush
              </Link>
            )}
          </div>

          {/* Sessions + XP */}
          <div style={{ padding: '8px 14px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: C.textDim }}>
              {sessions} session{sessions !== 1 ? 's' : ''} today
            </span>
            <span style={{ fontSize: '11px', color: C.textDim }}>
              +{sessions * 25} XP earned
            </span>
          </div>
        </div>

      ) : (
        // ── Collapsed pill ──────────────────────────────────────────
        <div onClick={() => setExpanded(true)}
          style={{ background: C.card, border: `1px solid ${accentColor}44`, borderRadius: '999px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: '130px' }}>
          <span style={{ fontSize: '14px' }}>{isBreak ? '☕' : '🍅'}</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: C.text, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.01em' }}>
            {pad(mins)}:{pad(secR)}
          </span>
          {running
            ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
            : <span style={{ fontSize: '11px', color: C.textDim }}>tap</span>
          }
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        </div>
      )}
    </div>
  )
}