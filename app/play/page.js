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
// Main chain
const COMPOUNDS = [
  { level: 1, name: 'H₂O',        emoji: '💧', color: '#60a5fa', points: 10,    desc: 'Water' },
  { level: 2, name: 'Ethanol',     emoji: '🍶', color: '#a78bfa', points: 25,    desc: 'C₂H₅OH' },
  { level: 3, name: 'Aspirin',     emoji: '💊', color: '#f87171', points: 60,    desc: 'Acetylsalicylic acid' },
  { level: 4, name: 'Caffeine',    emoji: '☕', color: '#fb923c', points: 150,   desc: 'C₈H₁₀N₄O₂' },
  { level: 5, name: 'Morphine',    emoji: '🌿', color: '#4ade80', points: 350,   desc: 'C₁₇H₁₉NO₃' },
  { level: 6, name: 'Penicillin',  emoji: '🔬', color: '#facc15', points: 800,   desc: 'β-lactam antibiotic' },
  { level: 7, name: 'Insulin',     emoji: '🧬', color: '#f472b6', points: 2000,  desc: '51-amino acid peptide' },
  { level: 8, name: 'ATP',         emoji: '⚡', color: '#34d399', points: 5000,  desc: 'Adenosine triphosphate — merge two to trigger something...' },
]

// Secret life chain — unlocked by merging two ATP
const LIFE_CHAIN = [
  { level: 9,  name: 'Bacterium',  emoji: '🦠', color: '#86efac', points: 12000,  secret: true },
  { level: 10, name: 'Amoeba',     emoji: '🔵', color: '#67e8f9', points: 28000,  secret: true },
  { level: 11, name: 'Worm',       emoji: '🪱', color: '#fde68a', points: 60000,  secret: true },
  { level: 12, name: 'Fish',       emoji: '🐟', color: '#60a5fa', points: 130000, secret: true },
  { level: 13, name: 'Mouse',      emoji: '🐭', color: '#e9d5ff', points: 280000, secret: true },
  { level: 14, name: 'Dog',        emoji: '🐕', color: '#fcd34d', points: 600000, secret: true },
  { level: 15, name: 'Elephant',   emoji: '🐘', color: '#94a3b8', points: 1200000,secret: true },
  { level: 16, name: 'Whale',      emoji: '🐋', color: '#38bdf8', points: 2500000,secret: true },
]

const ALL_COMPOUNDS = [...COMPOUNDS, ...LIFE_CHAIN]

const GRID_SIZE = 6
const SPAWN_INTERVAL = 2500 // ms between new compound spawns

function makeGrid() {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
}

function getAdjacent(r, c) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1],[r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]].filter(([rr,cc]) => rr>=0 && rr<GRID_SIZE && cc>=0 && cc<GRID_SIZE)
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
function SynthesisGame({ onGameOver, onWin }) {
  const [grid,     setGrid]     = useState(makeGrid)
  const [selected, setSelected] = useState(null) // [r,c]
  const [score,    setScore]    = useState(0)
  const [moves,    setMoves]    = useState(0)
  const [highest,  setHighest]  = useState(1)
  const [flash,    setFlash]    = useState(null)
  const [blasting, setBlasting] = useState(false)
  const [lifeBegan,setLifeBegan] = useState(false)
  const [gameWon,  setGameWon]  = useState(false)
  const [paused,   setPaused]   = useState(false)
  const spawnRef    = useRef(null)
  const scoreRef    = useRef(0)
  const pausedRef   = useRef(false)
  const lifeRef     = useRef(false) // track life chain without closure staleness

  // Keep scoreRef in sync
  useEffect(() => { scoreRef.current = score }, [score])

  // On unmount — save score silently (no game over screen)
  useEffect(() => {
    return () => {
      clearInterval(spawnRef.current)
      if (scoreRef.current > 0) onGameOver(scoreRef.current, false, true)
    }
  }, [])

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

  // Pause/resume
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { lifeRef.current = lifeBegan }, [lifeBegan])

  // Auto-spawn timer — runs once on mount
  useEffect(() => {
    spawnRef.current = setInterval(() => {
      if (pausedRef.current) return
      setGrid(g => {
        const empty = emptyCells(g)
        if (!empty.length) return g
        const ng = spawn(g)
        const newEmpty = emptyCells(ng)
        // Only trigger game over on full bench if NOT in life chain phase
        if (!newEmpty.length && !lifeRef.current) {
          clearInterval(spawnRef.current)
          setTimeout(() => onGameOver(scoreRef.current), 500)
        }
        return ng
      })
    }, SPAWN_INTERVAL)
    return () => clearInterval(spawnRef.current)
  }, [])

  function handleCellClick(r, c) {
    if (paused) return
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

    if (isAdj && (sameLevel || (grid[sr][sc]?.level === 9 || cell.level === 9))) {
      // Cross-chain merge: bacterium (level 9) + anything → random outcome
      const isBacteriaCombo = !sameLevel && (grid[sr][sc]?.level === 9 || cell.level === 9)
      const currentLevel = cell.level
      const nextLevel = currentLevel + 1
      const nextCompound = ALL_COMPOUNDS.find(c => c.level === nextLevel) || null
      const pts = nextCompound ? nextCompound.points : cell.points * 3

      const newGrid = grid.map(row => [...row])
      newGrid[sr][sc] = null

      // Bacteria + anything = random: 50% worm (level 11), 50% penicillin (level 6)
      if (isBacteriaCombo) {
        const result = Math.random() < 0.5
          ? ALL_COMPOUNDS.find(c => c.level === 11) // Worm
          : ALL_COMPOUNDS.find(c => c.level === 6)  // Penicillin
        const bacteriaPts = result.points
        newGrid[r][c] = { ...result, id: Math.random() }
        setFlash({ r, c })
        setTimeout(() => setFlash(null), 400)
        setGrid(newGrid)
        setScore(s => { const n = s + bacteriaPts; scoreRef.current = n; return n })
        setMoves(m => m + 1)
        if (result.level > highest) setHighest(result.level)
        setSelected(null)
        const newEmpty = emptyCells(newGrid)
        if (!newEmpty.length && !hasValidMoves(newGrid)) {
          clearInterval(spawnRef.current)
          setTimeout(() => onGameOver(scoreRef.current), 600)
        }
        return
      }

      // Special: merging two ATP triggers energy blast
      if (currentLevel === 8) {
        newGrid[r][c] = null
        setGrid(newGrid)
        setScore(s => { const n = s + pts; scoreRef.current = n; return n })
        setMoves(m => m + 1)
        setSelected(null)
        clearInterval(spawnRef.current)

        // Blast animation — fill all cells with ⚡ then 🦠
        setBlasting(true)
        const blastGrid = newGrid.map(row => row.map(() => ({ level: 0, name: '⚡', emoji: '⚡', color: '#34d399', points: 0, id: Math.random() })))
        setGrid(blastGrid)

        setTimeout(() => {
          const bacteriaGrid = blastGrid.map(row => row.map(() => ({ ...LIFE_CHAIN[0], id: Math.random() })))
          setGrid(bacteriaGrid)
          setBlasting(false)
          setLifeBegan(true)
          setHighest(9)
          // Restart spawn
          spawnRef.current = setInterval(() => {
            setGrid(g => {
              const empty = emptyCells(g)
              if (!empty.length) return g
              const ng = g.map(row => [...row])
              // Spawn life chain creatures
              const lifeLevel = Math.min(9 + Math.floor(Math.random() * 3), 11)
              const creature = LIFE_CHAIN.find(c => c.level === lifeLevel) || LIFE_CHAIN[0]
              const [er, ec] = empty[Math.floor(Math.random() * empty.length)]
              ng[er][ec] = { ...creature, id: Math.random() }
              return ng
            })
          }, SPAWN_INTERVAL)
        }, 1200)
        return
      }

      // Merging two whales — YOU WIN
      if (currentLevel === 16) {
        newGrid[r][c] = null
        setGrid(newGrid)
        setScore(s => s + pts)
        clearInterval(spawnRef.current)
        setGameWon(true)
        setTimeout(() => onGameOver(score + pts, true), 1500)
        return
      }

      newGrid[r][c] = nextCompound ? { ...nextCompound, id: Math.random() } : null

      setFlash({r, c})
      setTimeout(() => setFlash(null), 400)

      setGrid(newGrid)
      setScore(s => { const n = s + pts; scoreRef.current = n; return n })
      setMoves(m => m + 1)
      if (nextLevel > highest) setHighest(nextLevel)
      setSelected(null)

      // Check game over — full bench = over, but not during life chain phase
      const newEmpty = emptyCells(newGrid)
      if (!newEmpty.length && !lifeRef.current) {
        clearInterval(spawnRef.current)
        setTimeout(() => onGameOver(scoreRef.current), 600)
      }
    } else {
      // Select new cell
      setSelected([r, c])
    }
  }

  const highestCompound = COMPOUNDS[Math.max(highest, 1) - 1] || COMPOUNDS[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '10px 20px', alignItems: 'center' }}>
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setPaused(p => !p)}
            style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${C.border}`, background: paused ? `${C.blue}22` : 'rgba(255,255,255,0.04)', color: paused ? C.blueLight : C.textMid, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
            ⏸ Pause
          </button>
          <button onClick={() => { clearInterval(spawnRef.current); onGameOver(scoreRef.current) }}
            style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
            Quit
          </button>
        </div>
      </div>

      {/* Pause overlay — only covers grid, has its own resume button */}

      {/* Blast overlay */}
      {blasting && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ fontSize: '48px', animation: 'pulse 0.3s infinite' }}>⚡⚡⚡</div>
        </div>
      )}

      {/* Secret chain unlocked banner */}
      {lifeBegan && (
        <div style={{ background: 'rgba(134,239,172,0.15)', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center', fontSize: '13px', color: '#86efac', fontWeight: '600' }}>
          ⚡ Energy released! Life has begun on your bench...
        </div>
      )}

      {/* Grid */}
      <div style={{ position: 'relative' }}>
      {paused && (
        <div onClick={() => setPaused(false)}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(10,15,30,0.75)', borderRadius: '14px', cursor: 'pointer' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏸</div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: C.textMid, margin: '0 0 14px' }}>Paused</p>
            <button onClick={e => { e.stopPropagation(); setPaused(false) }}
              style={{ padding: '8px 20px', borderRadius: '8px', background: C.blue, color: 'white', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              ▶ Resume
            </button>
          </div>
        </div>
      )}
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
function GameOverScreen({ score, highscore, onRestart, saved, won }) {
  const highest = [...COMPOUNDS].reverse().find(c => score >= c.points)
  return (
    <div style={{ textAlign: 'center', maxWidth: '380px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>{won ? '🐋' : '🧪'}</div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{won ? 'You created life!' : 'Bench full!'}</h2>
      <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 6px' }}>{won ? 'From H₂O to a whale. In a lab. Somehow.' : 'No more moves.'}</p>
      <div style={{ fontSize: '36px', fontWeight: '800', color: C.blueLight, fontFamily: 'ui-monospace, monospace', margin: '16px 0' }}>
        {score.toLocaleString()}
      </div>
      <p style={{ fontSize: '13px', color: C.textDim, margin: '0 0 24px' }}>
        {score > highscore && highscore > 0 && <span style={{ color: '#86efac', display: 'block', marginBottom: '4px' }}>🎉 New personal best!</span>}
        {saved ? `✓ Score saved · Best: ${Math.max(score, highscore || 0).toLocaleString()}` : '— Sign in to save scores'}
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
  const [gameState, setGameState] = useState('idle')
  const [finalScore, setFinalScore] = useState(0)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [highscore,  setHighscore]  = useState(0)
  const [loadingHS,  setLoadingHS]  = useState(true)
  const [gameWon,    setGameWon]    = useState(false)

  // Load personal highscore
  useEffect(() => {
    if (!isLoaded || !user) { setLoadingHS(false); return }
    async function loadHS() {
      const db = createClerkSupabaseClient(session)
      const { data } = await db
        .from('game_scores')
        .select('score')
        .eq('clerk_id', user.id)
        .eq('game', 'synthesis_rush')
        .order('score', { ascending: false })
        .limit(1)
        .single()
      if (data) setHighscore(data.score)
      setLoadingHS(false)
    }
    loadHS()
  }, [isLoaded, user])

  async function handleGameOver(score, won = false, silent = false) {
    if (!silent) {
      setFinalScore(score)
      setGameState('over')
      if (won) setGameWon(true)
    }
    sessionStorage.removeItem('sr_grid')
    sessionStorage.removeItem('sr_score')
    sessionStorage.removeItem('sr_highest')
    if (user) {
      const db = createClerkSupabaseClient(session)
      // XP: floor(score/500), max 50 per game, 150 daily cap
      const todayKey = `pharmlab_game_xp_${new Date().toISOString().split('T')[0]}`
      const earnedToday = parseInt(localStorage.getItem(todayKey) || '0')
      const dailyCap = 150
      const rawXp = Math.floor(score / 500)
      const gameXp = Math.min(rawXp, 50)
      const xpToAward = Math.max(0, Math.min(gameXp, dailyCap - earnedToday))
      if (xpToAward > 0) {
        await awardXp(session, user.id, xpToAward, 'synthesis_rush')
        localStorage.setItem(todayKey, String(earnedToday + xpToAward))
      }
      await db.from('game_scores').insert({ clerk_id: user.id, game: 'synthesis_rush', score })
      if (score > highscore) setHighscore(score)
      setScoreSaved(true)
    }
  }

  function restart() {
    setGameState('idle')
    setFinalScore(0)
    setScoreSaved(false)
    setGameWon(false)
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
            {user && !loadingHS && highscore > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${C.blue}12`, border: `1px solid ${C.blue}33`, borderRadius: '10px', padding: '8px 16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px' }}>🏆</span>
                <span style={{ fontSize: '13px', color: C.textMid }}>Your best:</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: C.blueLight, fontFamily: 'ui-monospace, monospace' }}>{highscore.toLocaleString()}</span>
              </div>
            )}
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
          <GameOverScreen score={finalScore} highscore={highscore} onRestart={restart} saved={scoreSaved} won={gameWon} />
        )}
      </div>
    </main>
  )
}