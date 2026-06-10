'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Image processing ─────────────────────────────────────────────

function toGrey(data, w, h) {
  const g = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++)
    g[i] = Math.round(0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2])
  return g
}

function gaussBlur(g, w, h, r = 2) {
  const out = new Uint8Array(g.length)
  const k = []; let s = 0
  for (let ky = -r; ky <= r; ky++)
    for (let kx = -r; kx <= r; kx++) {
      const v = Math.exp(-(kx*kx+ky*ky)/(2*r*r)); k.push({kx,ky,v}); s+=v
    }
  k.forEach(e => e.v /= s)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0
      for (const {kx,ky,v:kv} of k) {
        const nx = Math.min(Math.max(x+kx,0),w-1)
        const ny = Math.min(Math.max(y+ky,0),h-1)
        v += g[ny*w+nx]*kv
      }
      out[y*w+x] = Math.round(v)
    }
  return out
}

function otsu(g) {
  const h = new Array(256).fill(0); g.forEach(v => h[v]++)
  const n = g.length
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * h[i]
  let sB=0, wB=0, max=0, t=0
  for (let i = 0; i < 256; i++) {
    wB += h[i]; if (!wB) continue
    const wF = n - wB; if (!wF) break
    sB += i * h[i]
    const mB = sB/wB, mF = (sum-sB)/wF
    const bw = wB * wF * (mB-mF)**2
    if (bw > max) { max = bw; t = i }
  }
  return t
}

function cca(bin, w, h) {
  const labels = new Int32Array(w*h).fill(-1)
  const comps  = []
  const nb4 = (i) => {
    const x=i%w, y=Math.floor(i/w), r=[]
    if (x>0) r.push(i-1); if (x<w-1) r.push(i+1)
    if (y>0) r.push(i-w); if (y<h-1) r.push(i+w)
    return r
  }
  let lbl = 0
  for (let i = 0; i < bin.length; i++) {
    if (!bin[i] || labels[i] >= 0) continue
    labels[i] = lbl
    const px = [i], st = [i]
    while (st.length) {
      const c = st.pop()
      for (const nb of nb4(c))
        if (bin[nb] && labels[nb] < 0) { labels[nb]=lbl; px.push(nb); st.push(nb) }
    }
    comps.push(px); lbl++
  }
  return comps
}

function centroid(px, w) {
  let sx=0, sy=0
  px.forEach(i => { sx += i%w; sy += Math.floor(i/w) })
  return { x: sx/px.length, y: sy/px.length }
}

function circularity(px, w) {
  const area = px.length, set = new Set(px)
  let p = 0
  px.forEach(i => {
    const x=i%w, y=Math.floor(i/w)
    if (x===0   || !set.has(i-1)) p++
    if (x===w-1 || !set.has(i+1)) p++
    if (y===0   || !set.has(i-w)) p++
    if (!set.has(i+w)) p++
  })
  return p > 0 ? 4*Math.PI*area/(p*p) : 0
}

function runAutoCount({ imageData, threshold, minSize, maxSize, minCirc, darkOnLight }) {
  const { width:w, height:h } = imageData
  const grey   = toGrey(imageData.data, w, h)
  const blur   = gaussBlur(grey, w, h, 2)
  const t      = threshold ?? otsu(blur)
  const binary = new Uint8Array(w*h)
  for (let i = 0; i < binary.length; i++) binary[i] = darkOnLight ? blur[i]<t : blur[i]>t
  const comps  = cca(binary, w, h)
  const hits   = comps
    .filter(px => px.length >= minSize && px.length <= maxSize)
    .filter(px => circularity(px, w) >= minCirc)
    .map(px => ({ ...centroid(px, w), size: px.length }))
  return { colonies: hits, threshold: t, width: w, height: h }
}

// ─── Upload zone ──────────────────────────────────────────────────

function UploadZone({ onFile }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  function handle(file) {
    if (!file?.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = e => onFile(e.target.result)
    r.readAsDataURL(file)
  }
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      style={{
        border: `2px dashed ${drag ? '#2563eb' : '#d1d5db'}`,
        borderRadius: '10px', padding: '1.25rem',
        background: drag ? '#eff6ff' : '#f9fafb',
        cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
      }}>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => handle(e.target.files[0])} />
      <div style={{ fontSize:'24px', marginBottom:'4px' }}>📁</div>
      <p style={{ fontSize:'12px', fontWeight:'600', color:'#374151', margin:'0 0 2px' }}>Click to upload or drag & drop</p>
      <p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>JPG, PNG — any image format</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────

export default function ColoniesPage() {
  // Image
  const [imageSrc,    setImageSrc]    = useState(null)
  const [mode,        setMode]        = useState('manual')

  // Crop
  const [cropShape,   setCropShape]   = useState('circle')
  const [cropRect,    setCropRect]    = useState(null)
  const [circleCrop,  setCircleCrop]  = useState(null)
  const [cropHistory, setCropHistory] = useState([])
  const [cropMode,    setCropMode]    = useState(false)
  const [cropStart,   setCropStart]   = useState(null)
  const [cropDraft,   setCropDraft]   = useState(null)

  // Canvas
  const canvasRef = useRef(null)
  const imgRef    = useRef(null)
  const offRef    = useRef(null)
  const [zoom,    setZoom]    = useState(1)

  // Manual
  const [dots,    setDots]    = useState([])
  const [dotSize, setDotSize] = useState(14)

  // Auto
  const [darkOnLight,    setDarkOnLight]    = useState(true)
  const [useManualThr,   setUseManualThr]   = useState(false)
  const [threshold,      setThreshold]      = useState(128)
  const [debouncedThr,   setDebouncedThr]   = useState(128)
  const [minSize,        setMinSize]        = useState(80)
  const [maxSize,        setMaxSize]        = useState(8000)
  const [minCirc,        setMinCirc]        = useState(0.25)
  const [showMask,       setShowMask]       = useState(false)
  const [autoResult,     setAutoResult]     = useState(null)
  const [running,        setRunning]        = useState(false)

  const maskDebounceRef = useRef(null)

  // Debounce threshold for mask
  useEffect(() => {
    if (maskDebounceRef.current) clearTimeout(maskDebounceRef.current)
    maskDebounceRef.current = setTimeout(() => setDebouncedThr(threshold), 80)
    return () => clearTimeout(maskDebounceRef.current)
  }, [threshold])

  // ── Load image ──
  function loadImage(src) {
    setImageSrc(src); setDots([]); setAutoResult(null)
    setCropRect(null); setCircleCrop(null); setCropHistory([])
    setCropDraft(null); setCropMode(false)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const off = document.createElement('canvas')
      off.width = img.width; off.height = img.height
      off.getContext('2d').drawImage(img, 0, 0)
      offRef.current = off
      const maxW = Math.min(typeof window !== 'undefined' ? window.innerWidth - 320 : 800, 800)
      setZoom(parseFloat(Math.min(1, maxW / img.width).toFixed(2)))
    }
    img.src = src
  }

  // ── Get effective image data for processing ──
  function getEffectiveImageData() {
    const off = offRef.current; if (!off) return null
    const ctx = off.getContext('2d')

    if (circleCrop) {
      const { cx, cy, r } = circleCrop
      const x0 = Math.max(0, Math.round(cx - r))
      const y0 = Math.max(0, Math.round(cy - r))
      const sz = Math.round(r * 2)
      const w  = Math.min(sz, off.width  - x0)
      const h  = Math.min(sz, off.height - y0)
      const raw = ctx.getImageData(x0, y0, w, h)
      const ocx = r, ocy = r
      for (let py = 0; py < raw.height; py++) {
        for (let px = 0; px < raw.width; px++) {
          if (Math.hypot(px - ocx, py - ocy) > r) {
            const i = (py * raw.width + px) * 4
            raw.data[i]=255; raw.data[i+1]=255; raw.data[i+2]=255; raw.data[i+3]=255
          }
        }
      }
      return raw
    }

    const region = cropRect ?? { x:0, y:0, w:off.width, h:off.height }
    return ctx.getImageData(region.x, region.y, region.w, region.h)
  }

  // ── Draw ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return

    const dpr   = window.devicePixelRatio || 1
    const viewW = circleCrop && !cropRect ? img.width  : (cropRect?.w ?? img.width)
    const viewH = circleCrop && !cropRect ? img.height : (cropRect?.h ?? img.height)
    const dispW = Math.round(viewW * zoom)
    const dispH = Math.round(viewH * zoom)
    canvas.style.width  = dispW + 'px'
    canvas.style.height = dispH + 'px'
    canvas.width  = dispW * dpr
    canvas.height = dispH * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Draw image
    const srcX = circleCrop && !cropRect ? 0 : (cropRect?.x ?? 0)
    const srcY = circleCrop && !cropRect ? 0 : (cropRect?.y ?? 0)
    ctx.drawImage(img, srcX, srcY, viewW, viewH, 0, 0, dispW, dispH)

    // Circle crop — darken outside
    if (circleCrop) {
      const cx = (circleCrop.cx - srcX) * zoom
      const cy = (circleCrop.cy - srcY) * zoom
      const r  = circleCrop.r * zoom
      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, dispW, dispH)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill()
      ctx.restore()
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke()
    }

    // Live mask overlay
    if (showMask && mode === 'auto') {
      const idata = getEffectiveImageData()
      if (idata) {
        const grey = toGrey(idata.data, idata.width, idata.height)
        const blur = gaussBlur(grey, idata.width, idata.height, 2)
        const t    = useManualThr ? debouncedThr : otsu(blur)
        const mc   = document.createElement('canvas')
        mc.width = idata.width; mc.height = idata.height
        const mctx  = mc.getContext('2d')
        const mdata = mctx.createImageData(idata.width, idata.height)
        for (let i = 0; i < blur.length; i++) {
          const hit = darkOnLight ? blur[i] < t : blur[i] > t
          mdata.data[i*4]   = hit ? 34  : 0
          mdata.data[i*4+1] = hit ? 197 : 0
          mdata.data[i*4+2] = hit ? 94  : 0
          mdata.data[i*4+3] = hit ? 150 : 0
        }
        mctx.putImageData(mdata, 0, 0)
        // Position mask relative to circle crop offset
        if (circleCrop) {
          const cx = (circleCrop.cx - srcX) * zoom
          const cy = (circleCrop.cy - srcY) * zoom
          const r  = circleCrop.r * zoom
          const ox = cx - r; const oy = cy - r
          ctx.drawImage(mc, ox, oy, r*2, r*2)
        } else {
          ctx.drawImage(mc, 0, 0, dispW, dispH)
        }
      }
    }

    // Auto result overlay
    if (autoResult && mode === 'auto' && !showMask) {
      autoResult.colonies.forEach((c, i) => {
        const ox = circleCrop ? (circleCrop.cx - circleCrop.r) : (cropRect?.x ?? 0)
        const oy = circleCrop ? (circleCrop.cy - circleCrop.r) : (cropRect?.y ?? 0)
        const x  = (c.x - (cropRect ? 0 : 0)) * zoom
        const y  = (c.y - (cropRect ? 0 : 0)) * zoom
        const r  = Math.max(6, Math.sqrt(c.size / Math.PI) * zoom)
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2)
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = 'rgba(34,197,94,0.15)'; ctx.fill()
        ctx.fillStyle = '#15803d'
        ctx.font = `bold ${Math.min(10, Math.max(7, r*.8))}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(i+1, x, y)
      })
    }

    // Manual dots
    if (mode === 'manual') {
      dots.forEach((d, i) => {
        const x = d.x * zoom, y = d.y * zoom, r = dotSize / 2
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(239,68,68,0.85)'; ctx.fill()
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.font = `bold ${Math.max(7, r-1)}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = 'white'; ctx.fillText(i+1, x, y)
      })
    }

    // Crop draft
    if (cropMode && cropDraft) {
      if (cropDraft.type === 'circle') {
        const cx = cropDraft.cx * zoom, cy = cropDraft.cy * zoom, r = cropDraft.r * zoom
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2)
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([6,4]); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(245,158,11,0.08)'; ctx.fill()
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(cx-8, cy); ctx.lineTo(cx+8, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy-8); ctx.lineTo(cx, cy+8); ctx.stroke()
      } else {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([6,4])
        ctx.strokeRect(cropDraft.x*zoom, cropDraft.y*zoom, cropDraft.w*zoom, cropDraft.h*zoom)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(245,158,11,0.08)'
        ctx.fillRect(cropDraft.x*zoom, cropDraft.y*zoom, cropDraft.w*zoom, cropDraft.h*zoom)
      }
    }
  }, [imageSrc, zoom, dots, dotSize, autoResult, showMask, debouncedThr, darkOnLight,
      useManualThr, mode, cropRect, circleCrop, cropMode, cropDraft])

  useEffect(() => { draw() }, [draw])

  // ── Canvas coords (accounting for crop offset) ──
  function canvasCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const cx   = (e.clientX - rect.left) / zoom
    const cy   = (e.clientY - rect.top)  / zoom
    const offX = circleCrop && !cropRect ? 0 : (cropRect?.x ?? 0)
    const offY = circleCrop && !cropRect ? 0 : (cropRect?.y ?? 0)
    return { x: cx + offX, y: cy + offY }
  }

  // ── Mouse handlers ──
  function handleMouseDown(e) {
    if (!imgRef.current || !cropMode) return
    const { x, y } = canvasCoords(e)
    setCropStart({ x, y }); setCropDraft(null)
  }

  function handleMouseMove(e) {
    if (!cropMode || !cropStart) return
    const { x, y } = canvasCoords(e)
    if (cropShape === 'circle') {
      const r = Math.hypot(x - cropStart.x, y - cropStart.y)
      setCropDraft({ type:'circle', cx: cropStart.x, cy: cropStart.y, r })
    } else {
      setCropDraft({
        type: 'rect',
        x: Math.min(x, cropStart.x), y: Math.min(y, cropStart.y),
        w: Math.abs(x - cropStart.x), h: Math.abs(y - cropStart.y),
      })
    }
  }

  function handleMouseUp(e) {
    if (!cropMode || !cropStart) return
    const { x, y } = canvasCoords(e)
    const img = imgRef.current

    if (cropShape === 'circle') {
      const r = Math.hypot(x - cropStart.x, y - cropStart.y)
      if (r > 10) {
        setCropHistory(h => [...h, { type:'circle', data: circleCrop }])
        setCircleCrop({ cx: cropStart.x, cy: cropStart.y, r })
        setCropRect(null); setDots([]); setAutoResult(null)
      }
    } else {
      const rx = Math.max(0, Math.min(cropStart.x, x))
      const ry = Math.max(0, Math.min(cropStart.y, y))
      const rw = Math.min(Math.abs(x - cropStart.x), img.width  - rx)
      const rh = Math.min(Math.abs(y - cropStart.y), img.height - ry)
      if (rw > 10 && rh > 10) {
        setCropHistory(h => [...h, { type:'rect', data: cropRect }])
        setCropRect({ x:Math.round(rx), y:Math.round(ry), w:Math.round(rw), h:Math.round(rh) })
        setCircleCrop(null); setDots([]); setAutoResult(null)
      }
    }
    setCropStart(null); setCropDraft(null); setCropMode(false)
  }

  function handleCanvasClick(e) {
    if (cropMode || !imgRef.current) return
    if (mode !== 'manual') return
    const rect = canvasRef.current.getBoundingClientRect()
    const cx   = (e.clientX - rect.left) / zoom
    const cy   = (e.clientY - rect.top)  / zoom
    const thr  = (dotSize/2 + 4) / zoom
    const idx  = dots.findIndex(d => Math.hypot(d.x - cx, d.y - cy) < thr)
    if (idx >= 0) setDots(p => p.filter((_,i) => i !== idx))
    else           setDots(p => [...p, { x: cx, y: cy }])
  }

  function undoCrop() {
    const prev = cropHistory[cropHistory.length - 1]
    if (prev?.type === 'circle') { setCircleCrop(prev.data); setCropRect(null) }
    else if (prev?.type === 'rect') { setCropRect(prev.data); setCircleCrop(null) }
    else { setCropRect(null); setCircleCrop(null) }
    setCropHistory(h => h.slice(0, -1))
    setDots([]); setAutoResult(null)
  }

  function clearCrop() {
    setCropRect(null); setCircleCrop(null); setCropHistory([])
    setDots([]); setAutoResult(null)
  }

  // ── Auto run ──
  function runAuto() {
    if (!offRef.current) return
    setRunning(true); setAutoResult(null)
    setTimeout(() => {
      const idata = getEffectiveImageData()
      if (!idata) { setRunning(false); return }
      const r = runAutoCount({
        imageData: idata,
        threshold: useManualThr ? threshold : null,
        minSize, maxSize, minCirc, darkOnLight,
      })
      if (!useManualThr) setThreshold(r.threshold)
      setAutoResult(r); setRunning(false)
    }, 50)
  }

  function exportPNG() {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'colony-count.png'
    link.href = canvasRef.current.toDataURL('image/png', 1.0); link.click()
  }

  const count = mode === 'manual' ? dots.length : (autoResult?.colonies.length ?? 0)

  // ── UI helpers ──
  const modeBtn = (m, label, col) => (
    <button onClick={() => { setMode(m); setAutoResult(null); setDots([]) }}
      style={{ flex:1, padding:'7px', borderRadius:'7px', cursor:'pointer', fontSize:'13px',
        fontWeight: mode===m ? '600' : '400',
        border: `${mode===m?2:1}px solid ${mode===m?col:'#e5e7eb'}`,
        background: mode===m ? col+'18' : 'white',
        color: mode===m ? col : '#374151',
        transition: 'all .12s' }}>
      {label}
    </button>
  )

  const sldr = (label, val, set, min, max, step, fmt) => (
    <div style={{ marginBottom:'8px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}>
        <span style={{ fontSize:'11px', color:'#6b7280' }}>{label}</span>
        <span style={{ fontSize:'11px', fontFamily:'ui-monospace,monospace', color:'#374151', fontWeight:'600' }}>
          {fmt ? fmt(val) : val}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(parseFloat(e.target.value))}
        style={{ width:'100%', accentColor:'#16a34a' }} />
    </div>
  )

  const panel = (title, children) => (
    <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'12px' }}>
      <p style={{ fontSize:'11px', fontWeight:'600', color:'#9ca3af', textTransform:'uppercase',
        letterSpacing:'.06em', margin:'0 0 10px' }}>{title}</p>
      {children}
    </div>
  )

  return (
    <main style={{ maxWidth:'1200px', margin:'0 auto', padding:'2rem 1rem', fontFamily:'sans-serif' }}>
      <Link href="/lab" style={{ fontSize:'13px', color:'#6b7280', textDecoration:'none' }}>← Lab Prep</Link>
      <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#111827', margin:'1rem 0 4px' }}>Colony counter</h1>
      <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'1.5rem', lineHeight:1.6 }}>
        Manual: click each colony to mark it. Auto: threshold-based detection with live mask preview.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:'16px', alignItems:'start' }}>

        {/* ── Left panel ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

          {/* Upload */}
          {panel('Image',
            imageSrc
              ? <button onClick={() => { setImageSrc(null); setDots([]); setAutoResult(null); clearCrop() }}
                  style={{ width:'100%', padding:'6px', borderRadius:'7px', border:'1px solid #e5e7eb',
                    background:'#f9fafb', fontSize:'12px', cursor:'pointer', color:'#6b7280' }}>
                  ↩ Upload new image
                </button>
              : <UploadZone onFile={loadImage} />
          )}

          {imageSrc && <>

            {/* Crop */}
            {panel('Crop area', <>
              {/* Shape toggle */}
              <div style={{ display:'flex', gap:'4px', marginBottom:'8px' }}>
                {[['circle','⬤ Circle'],['rect','⬜ Rectangle']].map(([s, label]) => (
                  <button key={s} onClick={() => setCropShape(s)}
                    style={{ flex:1, padding:'4px', borderRadius:'6px', fontSize:'11px', cursor:'pointer',
                      border:`${cropShape===s?2:1}px solid ${cropShape===s?'#f59e0b':'#e5e7eb'}`,
                      background: cropShape===s ? '#fffbeb' : 'white',
                      fontWeight: cropShape===s ? '600' : '400',
                      color: cropShape===s ? '#d97706' : '#374151' }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', gap:'6px' }}>
                <button onClick={() => setCropMode(!cropMode)}
                  style={{ flex:1, padding:'6px', borderRadius:'7px', fontSize:'12px', cursor:'pointer',
                    border:`${cropMode?2:1}px solid ${cropMode?'#f59e0b':'#e5e7eb'}`,
                    background: cropMode ? '#fffbeb' : 'white',
                    fontWeight: cropMode ? '600' : '400',
                    color: cropMode ? '#d97706' : '#374151' }}>
                  {cropMode ? 'Drawing…' : `✂ Draw ${cropShape}`}
                </button>
                {cropHistory.length > 0 && (
                  <button onClick={undoCrop}
                    style={{ padding:'6px 10px', borderRadius:'7px', border:'1px solid #e5e7eb',
                      background:'white', fontSize:'12px', cursor:'pointer', color:'#374151' }}>
                    ↩
                  </button>
                )}
                {(cropRect || circleCrop) && (
                  <button onClick={clearCrop}
                    style={{ padding:'6px 10px', borderRadius:'7px', border:'1px solid #fecaca',
                      background:'#fef2f2', fontSize:'12px', cursor:'pointer', color:'#dc2626' }}>
                    ✕
                  </button>
                )}
              </div>
              {cropMode && (
                <p style={{ fontSize:'11px', color:'#d97706', margin:'6px 0 0', lineHeight:1.4 }}>
                  {cropShape === 'circle'
                    ? 'Click the centre of the dish, drag to set radius.'
                    : 'Click and drag to select area.'}
                </p>
              )}
              {circleCrop && <p style={{ fontSize:'11px', color:'#16a34a', margin:'6px 0 0' }}>Circle active — r={Math.round(circleCrop.r)}px</p>}
              {cropRect   && <p style={{ fontSize:'11px', color:'#16a34a', margin:'6px 0 0' }}>Rect active — {cropRect.w}×{cropRect.h}px</p>}
            </>)}

            {/* Mode */}
            {panel('Counting mode',
              <div style={{ display:'flex', gap:'6px' }}>
                {modeBtn('manual','✋ Manual','#2563eb')}
                {modeBtn('auto','🤖 Auto','#16a34a')}
              </div>
            )}

            {/* Manual controls */}
            {mode === 'manual' && panel('Manual settings', <>
              {sldr('Dot size', dotSize, setDotSize, 6, 32, 1)}
              <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
                <button onClick={() => setDots(p => p.slice(0,-1))} disabled={!dots.length}
                  style={{ flex:1, padding:'6px', borderRadius:'7px', border:'1px solid #e5e7eb',
                    background:'white', fontSize:'12px',
                    cursor: dots.length ? 'pointer' : 'not-allowed',
                    color: dots.length ? '#374151' : '#d1d5db' }}>
                  ↩ Undo
                </button>
                <button onClick={() => setDots([])} disabled={!dots.length}
                  style={{ flex:1, padding:'6px', borderRadius:'7px', border:'1px solid #fecaca',
                    background:'#fef2f2', fontSize:'12px',
                    cursor: dots.length ? 'pointer' : 'not-allowed',
                    color: dots.length ? '#dc2626' : '#d1d5db' }}>
                  Clear
                </button>
              </div>
              <p style={{ fontSize:'11px', color:'#9ca3af', margin:'8px 0 0', lineHeight:1.5 }}>
                Click a colony to place a dot. Click an existing dot to remove it.
              </p>
            </>)}

            {/* Auto controls */}
            {mode === 'auto' && panel('Auto settings', <>
              <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px',
                color:'#374151', cursor:'pointer', marginBottom:'10px' }}>
                <input type="checkbox" checked={darkOnLight} onChange={e => setDarkOnLight(e.target.checked)}
                  style={{ accentColor:'#16a34a' }} />
                Dark colonies on light background
              </label>

              {/* Threshold block */}
              <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'8px 10px',
                marginBottom:'8px', border:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontSize:'11px', fontWeight:'600', color:'#374151' }}>Threshold</span>
                  <label style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px',
                    color:'#16a34a', cursor:'pointer', fontWeight:'600' }}>
                    <input type="checkbox" checked={showMask} onChange={e => setShowMask(e.target.checked)}
                      style={{ accentColor:'#16a34a', width:'12px', height:'12px' }} />
                    Live mask
                  </label>
                </div>

                <label style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px',
                  color:'#6b7280', cursor:'pointer', marginBottom:'6px' }}>
                  <input type="checkbox" checked={useManualThr} onChange={e => setUseManualThr(e.target.checked)}
                    style={{ accentColor:'#16a34a', width:'12px', height:'12px' }} />
                  Manual threshold
                </label>

                {useManualThr ? (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <input type="range" min={0} max={255} step={1} value={threshold}
                        onChange={e => setThreshold(parseInt(e.target.value))}
                        style={{ flex:1, accentColor:'#16a34a' }} />
                      <input type="number" min={0} max={255} step={1} value={threshold}
                        onChange={e => { const n=parseInt(e.target.value); if(!isNaN(n)&&n>=0&&n<=255) setThreshold(n) }}
                        style={{ width:'48px', padding:'3px 6px', borderRadius:'5px',
                          border:'1px solid #d1d5db', fontSize:'12px', fontWeight:'600',
                          color:'#111827', textAlign:'right', background:'white' }} />
                    </div>
                    {showMask && <p style={{ fontSize:'10px', color:'#16a34a', margin:'2px 0 0' }}>
                      Green = detected colony pixels
                    </p>}
                  </div>
                ) : (
                  <p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>Otsu's method — automatic</p>
                )}
              </div>

              {sldr('Min size (px²)', minSize, setMinSize, 5, 1000, 5)}
              {sldr('Max size (px²)', maxSize, setMaxSize, 100, 20000, 100)}
              {sldr('Min circularity', minCirc, setMinCirc, 0.05, 1, 0.05, v => v.toFixed(2))}

              <button onClick={runAuto} disabled={running}
                style={{ width:'100%', padding:'9px', borderRadius:'8px', border:'none',
                  background: running ? '#e5e7eb' : '#16a34a',
                  color: running ? '#9ca3af' : 'white',
                  fontSize:'13px', fontWeight:'600',
                  cursor: running ? 'not-allowed' : 'pointer', marginTop:'4px' }}>
                {running ? 'Detecting…' : '▶ Run detection'}
              </button>

              {autoResult && (
                <p style={{ fontSize:'11px', color:'#6b7280', margin:'6px 0 0', textAlign:'center' }}>
                  Threshold used: {autoResult.threshold}
                </p>
              )}

              <div style={{ marginTop:'8px', background:'#fffbeb', border:'1px solid #fde68a',
                borderRadius:'7px', padding:'8px 10px', fontSize:'11px', color:'#92400e', lineHeight:1.5 }}>
                Best results on well-separated colonies. Touching colonies count as one — switch to Manual to correct.
              </div>
            </>)}

            {/* Count + zoom + export */}
            {panel('Result', <>
              <div style={{ background:'#eff6ff', borderRadius:'8px', padding:'10px',
                textAlign:'center', marginBottom:'10px' }}>
                <span style={{ fontSize:'42px', fontWeight:'700', color:'#1d4ed8',
                  fontFamily:'ui-monospace,monospace', lineHeight:1 }}>{count}</span>
                <div style={{ fontSize:'12px', color:'#2563eb', marginTop:'2px' }}>colonies counted</div>
              </div>
              {sldr('Zoom', zoom, setZoom, 0.1, 3, 0.05, v => Math.round(v*100)+'%')}
              <button onClick={exportPNG}
                style={{ width:'100%', padding:'8px', borderRadius:'8px', border:'none',
                  background:'#111827', color:'white', fontSize:'13px',
                  fontWeight:'500', cursor:'pointer' }}>
                ↓ Export PNG
              </button>
            </>)}

          </>}
        </div>

        {/* ── Right: canvas ── */}
        <div>
          {!imageSrc
            ? <div style={{ background:'#f9fafb', border:'2px dashed #e5e7eb', borderRadius:'12px',
                padding:'5rem', textAlign:'center', color:'#9ca3af' }}>
                <div style={{ fontSize:'48px', marginBottom:'12px' }}>🔬</div>
                <p style={{ fontSize:'15px', fontWeight:'500', color:'#6b7280', margin:'0 0 4px' }}>
                  Upload a plate image to begin
                </p>
                <p style={{ fontSize:'12px', margin:0 }}>Use the panel on the left</p>
              </div>
            : <div
                style={{ overflowX:'auto', overflowY:'auto', maxHeight:'80vh',
                  border:'1px solid #e5e7eb', borderRadius:'12px', background:'#1a1a1a',
                  cursor: cropMode ? 'crosshair' : mode==='manual' ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}>
                <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ display:'block' }} />
              </div>
          }
        </div>

      </div>
    </main>
  )
}