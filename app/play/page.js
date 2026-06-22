'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { createClerkSupabaseClient } from '../../lib/supabase'
import { awardXp } from '../../lib/xp'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

// ── Compound levels ───────────────────────────────────────────────
const COMPOUNDS = [
  { level: 1, name: 'H₂O',        emoji: '💧', color: '#60a5fa', points: 10,   desc: 'Water' },
  { level: 2, name: 'Ethanol',     emoji: '🍶', color: '#a78bfa', points: 25,   desc: 'C₂H₅OH' },
  { level: 3, name: 'Aspirin',     emoji: '💊', color: '#f87171', points: 60,   desc: 'Acetylsalicylic acid' },
  { level: 4, name: 'Caffeine',    emoji: '☕', color: '#fb923c', points: 150,  desc: 'C₈H₁₀N₄O₂' },
  { level: 5, name: 'Morphine',    emoji: '🌿', color: '#4ade80', points: 350,  desc: 'C₁₇H₁₉NO₃' },
  { level: 6, name: 'Penicillin',  emoji: '🔬', color: '#facc15', points: 800,  desc: 'β-lactam antibiotic' },
  { level: 7, name: 'Insulin',     emoji: '🧬', color: '#f472b6', points: 2000, desc: '51-amino acid peptide' },
  { level: 8, name: 'ATP',         emoji: '⚡', color: '#34d399', points: 5000, desc: 'Adenosine triphosphate' },
]

const GRID_SIZE = 6
const SPAWN_INTERVAL = 3500 // ms between new compound spawns

function makeGrid() {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
}

function getAdjacent(r, c) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc]) => rr>=0 && rr<GRID_SIZE && cc>=0 && cc<GRID_SIZE)
}

function emptyCells(grid) {
  const cells = []
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c]) cells.push([r,c])
  return cells
}

function hasValidMoves(grid) {
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c]) {
        for (const [ar,ac] of getAdjacent(r,c))
          if (grid[ar][ac] && grid[ar][ac].level === grid[r][c].level)
            return true
      }
  return false
}

// ── Game component ────────────────────────────────────────────────
function SynthesisGame({ onGameOver }) {
  const [grid,     setGrid]     = useState(makeGrid)
  const [selected, setSelected] = useState(null) // [r,c]
  const [score,    setScore]    = useState(0)
  const [moves,    setMoves]    = useState(0)
  const [highest,  setHighest]  = useState(1)
  const [flash,    setFlash]    = useState(null) // {r,c} for merge animation
  const spawnRef  = useRef(null)

  // Spawn a new compound
  const spawn = useCallback((currentGrid) => {
    const empty = emptyCells(currentGrid)
    if (!empty.length) return currentGrid

    // Weighted spawn — lower levels more likely
    const weights = [50, 30, 12, 5, 2, 1]
    const total = weights.reduce((a,b) => a+b, 0)
    let rand = Math.random() * total
    let level = 1
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i]
      if (rand <= 0) { level = i + 1; break }
    }

    const [r,c] = empty[Math.floor(Math.random() * empty.length)]
    const newGrid = currentGrid.map(row => [...row])
    newGrid[r][c] = { ...COMPOUNDS[level-1], id: Math.random() }
    return newGrid
  }, [])

  // Initial spawn
  useEffect(() => {
    setGrid(g => {
      let ng = g
      for (let i = 0; i < 6; i++) ng = spawn(ng)
      return ng
    })
  }, [])

  // Auto-spawn timer
  useEffect(() => {
    spawnRef.current = setInterval(() => {
      setGrid(g => {
        const empty = emptyCells(g)
        if (!empty.length) return g
        const ng = spawn(g)
        // Check game over after spawn
        const newEmpty = emptyCells(ng)
        if (!newEmpty.length && !hasValidMoves(ng)) {
          clearInterval(spawnRef.current)
          setTimeout(() => onGameOver(score), 500)
        }
        return ng
      })
    }, SPAWN_INTERVAL)
    return () => clearInterval(spawnRef.current)
  }, [score])

  function handleCellClick(r, c) {
    const cell = grid[r][c]
    if (!cell) {
      setSelected(null)
      return
    }

    if (!selected) {
      setSelected([r, c])
      return
    }

    const [sr, sc] = selected

    // Same cell — deselect
    if (sr === r && sc === c) {
      setSelected(null)
      return
    }

    // Check adjacency + same level
    const adj = getAdjacent(sr, sc)
    const isAdj = adj.some(([ar,ac]) => ar===r && ac===c)
    const sameLevel = grid[sr][sc]?.level === cell.level

    if (isAdj && sameLevel) {
      // Merge!
      const nextLevel = cell.level + 1
      const nextCompound = COMPOUNDS[nextLevel - 1] || null
      const pts = nextCompound ? nextCompound.points : cell.points * 3

      const newGrid = grid.map(row => [...row])
      newGrid[sr][sc] = null
      newGrid[r][c] = nextCompound ? { ...nextCompound, id: Math.random() } : null

      setFlash({r, c})
      setTimeout(() => setFlash(null), 400)

      setGrid(newGrid)
      setScore(s => s + pts)
      setMoves(m => m + 1)
      if (nextLevel > highest) setHighest(nextLevel)
      setSelected(null)

      // Check game over
      const newEmpty = emptyCells(newGrid)
      if (!newEmpty.length && !hasValidMoves(newGrid)) {
        clearInterval(spawnRef.current)
        setTimeout(() => onGameOver(score + pts), 600)
      }
    } else {
      // Select new cell
      setSelected([r, c])
    }
  }

  const highestCompound = COMPOUNDS[highest - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '10px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace' }}>{score.toLocaleString()}</div>
          <div style={{ fontSize: '10px', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: C.text, fontFamily: 'ui-monospace, monospace' }}>{moves}</div>
          <div style={{ fontSize: '10px', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Merges</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px' }}>{highestCompound.emoji}</div>
          <div style={{ fontSize: '10px', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Best</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.textDim, fontFamily: 'ui-monospace, monospace' }}>
            {emptyCells(grid).length}/{GRID_SIZE*GRID_SIZE}
          </div>
          <div style={{ fontSize: '10px', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Free</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '6px',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '14px',
        padding: '10px',
      }}>
        {grid.map((row, r) => row.map((cell, c) => {
          const isSelected = selected && selected[0]===r && selected[1]===c
          const isFlashing = flash && flash.r===r && flash.c===c
          const canMerge = selected && cell && grid[selected[0]][selected[1]] &&
            grid[selected[0]][selected[1]].level === cell.level &&
            getAdjacent(selected[0],selected[1]).some(([ar,ac])=>ar===r&&ac===c)

          return (
            <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
              style={{
                width: '70px', height: '70px',
                borderRadius: '10px',
                border: isSelected
                  ? `2px solid ${cell?.color || C.blue}`
                  : canMerge
                    ? `2px solid #86efac`
                    : `1px solid ${C.border}`,
                background: isFlashing
                  ? 'rgba(255,255,255,0.2)'
                  : isSelected
                    ? `${cell?.color}22`
                    : canMerge
                      ? 'rgba(134,239,172,0.1)'
                      : 'rgba(255,255,255,0.03)',
                cursor: cell ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '2px',
                transition: 'all 0.12s',
                transform: isFlashing ? 'scale(1.15)' : isSelected ? 'scale(1.05)' : 'scale(1)',
              }}>
              {cell && (
                <>
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{cell.emoji}</span>
                  <span style={{ fontSize: '9px', color: cell.color, fontWeight: '700', textAlign: 'center', lineHeight: 1.2 }}>{cell.name}</span>
                </>
              )}
            </div>
          )
        }))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '440px' }}>
        {COMPOUNDS.map(c => (
          <div key={c.level} style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: c.level <= highest ? 1 : 0.3, fontSize: '11px', color: C.textDim }}>
            <span>{c.emoji}</span>
            <span style={{ color: c.level <= highest ? c.color : C.textDim }}>{c.name}</span>
            {c.level < COMPOUNDS.length && <span style={{ color: C.textDim }}>→</span>}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '12px', color: C.textDim, margin: 0, textAlign: 'center' }}>
        Click a compound to select it, then click an adjacent matching one to merge.
      </p>
    </div>
  )
}

// ── Game over screen ──────────────────────────────────────────────
function GameOverScreen({ score, onRestart, saved }) {
  const highest = [...COMPOUNDS].reverse().find(c => score >= c.points)
  return (
    <div style={{ textAlign: 'center', maxWidth: '380px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🧪</div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Bench full!</h2>
      <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 6px' }}>No more moves.</p>
      <div style={{ fontSize: '36px', fontWeight: '800', color: C.blueLight, fontFamily: 'ui-monospace, monospace', margin: '16px 0' }}>
        {score.toLocaleString()}
      </div>
      <p style={{ fontSize: '13px', color: C.textDim, margin: '0 0 24px' }}>
        {saved ? '✓ Score saved' : '— Sign in to save scores'}
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={onRestart}
          style={{ padding: '10px 24px', borderRadius: '9px', background: C.blue, color: 'white', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Play again
        </button>
        <Link href="/user" style={{ padding: '10px 18px', borderRadius: '9px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          Profile →
        </Link>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function PlayPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [gameState, setGameState] = useState('idle') // 'idle' | 'playing' | 'over'
  const [finalScore, setFinalScore] = useState(0)
  const [scoreSaved, setScoreSaved] = useState(false)

  async function handleGameOver(score) {
    setFinalScore(score)
    setGameState('over')
    if (user) {
      // Award XP based on score
      const xp = Math.floor(score / 100)
      if (xp > 0) await awardXp(session, user.id, xp, 'synthesis_rush')
      setScoreSaved(true)
    }
  }

  function restart() {
    setGameState('idle')
    setFinalScore(0)
    setScoreSaved(false)
    setTimeout(() => setGameState('playing'), 50)
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🧪</span>
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: '800', color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Synthesis Rush</h1>
              <p style={{ fontSize: '11px', color: C.textDim, margin: 0 }}>Merge compounds · fill the bench = game over</p>
            </div>
          </div>
          <Link href="/" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Home</Link>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem' }}>
        {gameState === 'idle' && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧪</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Synthesis Rush</h2>
            <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px', lineHeight: '1.7' }}>
              Combine matching compounds to synthesise bigger molecules. The bench fills up over time — keep merging before you run out of space.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
              {COMPOUNDS.map((c,i) => (
                <div key={c.level} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <span>{c.emoji}</span>
                  <span style={{ color: c.color, fontWeight: '600' }}>{c.name}</span>
                  {i < COMPOUNDS.length-1 && <span style={{ color: C.textDim, fontSize: '10px' }}>→</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setGameState('playing')}
              style={{ padding: '12px 32px', borderRadius: '10px', background: C.blue, color: 'white', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '-0.01em' }}>
              Start game
            </button>
            {!isLoaded || !user && (
              <p style={{ fontSize: '12px', color: C.textDim, marginTop: '12px' }}>
                <Link href="/sign-in" style={{ color: C.blueLight, textDecoration: 'none' }}>Sign in</Link> to earn XP from your score
              </p>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <SynthesisGame onGameOver={handleGameOver} />
        )}

        {gameState === 'over' && (
          <GameOverScreen score={finalScore} onRestart={restart} saved={scoreSaved} />
        )}
      </div>
    </main>
  )
}