'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
  blue: '#2a6fdb', blueLight: '#93b4f7',
}

function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => onFile(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
      style={{
        border: `2px dashed ${dragging ? C.blue : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '12px', padding: '3rem 1rem',
        background: dragging ? 'rgba(42,111,219,0.08)' : C.card,
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
      }}>
      <input ref={inputRef} type="file" accept="image/*"
        onChange={e => handleFile(e.target.files[0])}
        style={{ display: 'none' }} />
      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
      <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>
        Click to upload or drag and drop
      </p>
      <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>
        JPG, PNG, or any image format — photograph plate against a uniform background
      </p>
    </div>
  )
}

const MODES = ['baseline', 'solvent_front', 'spot']
const MODE_INFO = {
  baseline:      { label: 'Step 1', desc: 'Click anywhere on the baseline (where spots were applied)', color: '#f97316' },
  solvent_front: { label: 'Step 2', desc: 'Click anywhere on the solvent front (top line)',            color: C.blue },
  spot:          { label: 'Step 3', desc: 'Click the centre of each spot — click again to remove',    color: '#7c3aed' },
}

export default function TLCPage() {
  const [imageSrc,     setImageSrc]     = useState(null)
  const [mode,         setMode]         = useState('baseline')
  const [baseline,     setBaseline]     = useState(null)
  const [solventFront, setSolventFront] = useState(null)
  const [spots,        setSpots]        = useState([])
  const [zoom,         setZoom]         = useState(1)
  const canvasRef = useRef(null)
  const imgRef    = useRef(null)

  function fitZoom(img) {
    const maxW = Math.min(window.innerWidth - 80, 860)
    setZoom(parseFloat(Math.min(1, maxW / img.width).toFixed(2)))
  }

  function handleFile(src) {
    setImageSrc(src)
    setBaseline(null); setSolventFront(null); setSpots([]); setMode('baseline')
  }

  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = () => { imgRef.current = img; fitZoom(img) }
    img.src = imageSrc
  }, [imageSrc])

  useEffect(() => { if (imgRef.current) draw() }, [baseline, solventFront, spots, zoom])

  function draw() {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return
    const dpr   = window.devicePixelRatio || 1
    const dispW = Math.round(img.width  * zoom)
    const dispH = Math.round(img.height * zoom)
    canvas.style.width  = dispW + 'px'
    canvas.style.height = dispH + 'px'
    canvas.width  = dispW * dpr
    canvas.height = dispH * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.drawImage(img, 0, 0, dispW, dispH)

    if (baseline) {
      const y = baseline.y * zoom
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dispW, y); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f97316'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('Baseline', 4, y - 5)
      ctx.beginPath(); ctx.arc(baseline.x * zoom, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#f97316'; ctx.fill()
    }

    if (solventFront) {
      const y = solventFront.y * zoom
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dispW, y); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = C.blue; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('Solvent front', 4, y - 5)
      ctx.beginPath(); ctx.arc(solventFront.x * zoom, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = C.blue; ctx.fill()
    }

    spots.forEach((s, i) => {
      const x = s.x * zoom, y = s.y * zoom
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,58,237,0.7)'; ctx.fill()
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke()
      if (baseline && solventFront) {
        const rf = calcRf(s.y)
        ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`Rf ${rf.toFixed(2)}`, x, y - 13)
      }
      ctx.fillStyle = 'white'; ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(String.fromCharCode(65 + i), x, y)
      ctx.textBaseline = 'alphabetic'
    })
  }

  function calcRf(spotY) {
    if (!baseline || !solventFront) return null
    return Math.min(1, Math.max(0, (baseline.y - spotY) / (baseline.y - solventFront.y)))
  }

  function handleClick(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const cx   = (e.clientX - rect.left) / zoom
    const cy   = (e.clientY - rect.top)  / zoom
    if (mode === 'baseline') {
      setBaseline({ x: cx, y: cy }); setMode('solvent_front')
    } else if (mode === 'solvent_front') {
      setSolventFront({ x: cx, y: cy }); setMode('spot')
    } else {
      const thr = 12 / zoom
      const idx = spots.findIndex(s => Math.hypot(s.x - cx, s.y - cy) < thr)
      if (idx >= 0) setSpots(p => p.filter((_, i) => i !== idx))
      else           setSpots(p => [...p, { x: cx, y: cy }])
    }
  }

  function exportPNG() {
    const link = document.createElement('a')
    link.download = 'pharmlab-tlc.png'
    link.href = canvasRef.current.toDataURL('image/png', 1.0); link.click()
  }

  const rfValues = spots
    .map((s, i) => ({ label: String.fromCharCode(65 + i), rf: calcRf(s.y) }))
    .filter(s => s.rf !== null)

  const m = MODE_INFO[mode]

  return (
    <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input[type=range]{ accent-color:${C.blue}; }`}</style>
      <Link href="/lab" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: C.text, margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>TLC analyser</h1>
      <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Mark the baseline and solvent front, then click each spot for instant Rf values. Rf = distance travelled by spot / distance travelled by solvent.
      </p>

      {!imageSrc && <UploadZone onFile={handleFile} />}

      {imageSrc && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', flexWrap: 'wrap' }}>
            {MODES.map((md, i) => {
              const done   = (md === 'baseline' && baseline) || (md === 'solvent_front' && solventFront)
              const active = mode === md
              const col    = MODE_INFO[md].color
              return (
                <div key={md} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? col : active ? col : 'rgba(255,255,255,0.1)', color: (done || active) ? 'white' : C.textDim, fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', color: active ? col : done ? C.textMid : C.textDim, fontWeight: active ? '600' : '400' }}>
                    {md === 'baseline' ? 'Baseline' : md === 'solvent_front' ? 'Solvent front' : 'Spots'}
                  </span>
                  {i < 2 && <span style={{ color: C.border, margin: '0 4px' }}>→</span>}
                </div>
              )
            })}

            {/* Toolbar right */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '11px', color: C.textDim }}>Zoom</span>
                <input type="range" min={0.1} max={4} step={0.05} value={zoom}
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  style={{ width: '80px' }} />
                <span style={{ fontSize: '11px', color: C.textMid, minWidth: '36px' }}>{Math.round(zoom * 100)}%</span>
              </div>
              <button onClick={() => { setImageSrc(null); setBaseline(null); setSolventFront(null); setSpots([]); setMode('baseline') }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', fontSize: '12px', cursor: 'pointer', color: C.textMid }}>
                New image
              </button>
              <button onClick={exportPNG}
                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: C.blue, color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                ↓ Export
              </button>
            </div>
          </div>

          {/* Current instruction */}
          <div style={{ padding: '8px 14px', borderRadius: '8px', background: m.color + '12', border: `1px solid ${m.color}33`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: m.color, flexShrink: 0 }}>{m.label}</span>
            <span style={{ fontSize: '12px', color: C.textMid }}>{m.desc}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
            {/* Canvas */}
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh', border: `1px solid ${C.border}`, borderRadius: '10px', background: '#1a1a1a', cursor: 'crosshair' }}>
              <canvas ref={canvasRef} onClick={handleClick} style={{ display: 'block' }} />
            </div>

            {/* Rf panel */}
            {baseline && solventFront && (
              <div style={{ minWidth: '160px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Rf values</p>
                <div style={{ marginBottom: '8px', padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: `1px solid ${C.border}`, fontSize: '11px', color: C.textDim, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total dist.</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: '600', color: C.textMid }}>
                    {Math.abs(Math.round(baseline.y - solventFront.y))}px
                  </span>
                </div>
                {rfValues.length === 0
                  ? <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>Click spots on the plate.</p>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {rfValues.map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '7px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {s.label}
                            </div>
                            <span style={{ fontSize: '11px', color: C.textMid }}>Spot {s.label}</span>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#c4b5fd', fontFamily: 'ui-monospace, monospace' }}>{s.rf.toFixed(3)}</span>
                        </div>
                      ))}
                      <div style={{ padding: '5px 8px', background: '#060b18', borderRadius: '5px', border: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace', color: '#93b4f7', margin: 0 }}>Rf = d_spot / d_front</p>
                      </div>
                    </div>
                  )
                }
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}