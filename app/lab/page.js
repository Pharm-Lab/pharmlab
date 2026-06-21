'use client'
import { useEffect, useRef } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import { awardXp } from '../../lib/xp'
import Link from 'next/link'

const C = {
  bg:'#0a0f1e', border:'rgba(255,255,255,0.07)', green:'#16a34a', greenLight:'#86efac',
  teal:'#0891b2', text:'#f0f4ff', textMid:'rgba(240,244,255,0.65)', textDim:'rgba(240,244,255,0.35)',
}

// Colony particle field — same as homepage lab slide but subtle
function ColonyBackground() {
  const canvasRef = useRef(null)
  const frameRef  = useRef(null)
  const pts       = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W*dpr; canvas.height = H*dpr

    pts.current = Array.from({ length:90 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: 1.2 + Math.random()*3,
      vx:(Math.random()-0.5)*0.14, vy:(Math.random()-0.5)*0.14,
      alpha: 0.15 + Math.random()*0.45,
      color: Math.random()>0.55 ? '#16a34a' : Math.random()>0.5 ? '#0891b2' : '#2a6fdb',
      pulse: Math.random()*Math.PI*2,
    }))

    const draw = () => {
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0,0,W,H)

      pts.current.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.pulse+=0.018
        if(p.x<0) p.x=W; if(p.x>W) p.x=0
        if(p.y<0) p.y=H; if(p.y>H) p.y=0
      })

      for(let i=0;i<pts.current.length;i++) {
        for(let j=i+1;j<pts.current.length;j++) {
          const dx=pts.current[i].x-pts.current[j].x, dy=pts.current[i].y-pts.current[j].y
          const d=Math.sqrt(dx*dx+dy*dy)
          if(d<90) {
            ctx.strokeStyle=`rgba(22,163,74,${0.08*(1-d/90)})`
            ctx.lineWidth=0.7
            ctx.beginPath(); ctx.moveTo(pts.current[i].x,pts.current[i].y)
            ctx.lineTo(pts.current[j].x,pts.current[j].y); ctx.stroke()
          }
        }
      }

      pts.current.forEach(p => {
        const pulse = 0.85+0.15*Math.sin(p.pulse)
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2)
        ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha*pulse*0.7; ctx.fill()
        ctx.globalAlpha=1
      })

      ctx.setTransform(1,0,0,1,0,0)
      frameRef.current = requestAnimationFrame(draw)
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />
}

const TOOLS = [
  // Calculators
  { icon:'🧫', tag:'Calculations', title:'Dilution calculator',     desc:'C₁V₁ = C₂V₂ solver, serial dilutions, and stock solution preparation.',                                                    href:'/lab/dilution',         color:C.green,  grad:`linear-gradient(135deg,${C.green}22,${C.teal}11)` },
  { icon:'⚗️', tag:'Calculations', title:'Molarity calculator',     desc:'Interconvert mass, moles, molarity, and volume with unit conversions.',                                                     href:'/lab/molarity',         color:C.teal,   grad:`linear-gradient(135deg,${C.teal}22,${C.green}11)` },
  { icon:'🧪', tag:'Calculations', title:'Buffer preparation',      desc:'Henderson-Hasselbalch — target pH from ratio or ratio from pH.',                                                            href:'/lab/buffer',           color:C.green,  grad:`linear-gradient(135deg,${C.green}22,#2a6fdb11)` },
  { icon:'🔄', tag:'Calculations', title:'Unit converter',          desc:'Concentration, mass, volume, pressure, temperature — all in one place.',                                                   href:'/lab/converter',        color:C.teal,   grad:`linear-gradient(135deg,${C.teal}22,${C.green}11)` },
  // Image analysis
  { icon:'🔬', tag:'Image analysis',title:'Colony counter',         desc:'Upload a plate photo, mark colonies manually or use auto Otsu threshold detection. Live count with crop and mask preview.', href:'/lab/colonies',         color:'#f97316', grad:'linear-gradient(135deg,#f9731622,#16a34a11)' },
  { icon:'🟡', tag:'Image analysis',title:'TLC analyser',           desc:'Upload a TLC plate, mark spots, and calculate Rf values with PNG export.',                                                  href:'/lab/tlc',              color:'#eab308', grad:'linear-gradient(135deg,#eab30822,#f9731611)' },
  { icon:'🔬', tag:'Image analysis',title:'Gel image analyser',     desc:'MW estimation from SDS-PAGE and agarose gels using ladder standard curve. Log(MW) vs Rf linear regression.',               href:'/lab/gel',              color:C.teal,   grad:`linear-gradient(135deg,${C.teal}22,${C.green}11)` },
  // Biochemistry
  { icon:'🧬', tag:'Biochemistry', title:'Protein tools',           desc:'Bradford/BCA standard curves with concentration back-calculation, plus pI and ε₂₈₀ from sequence.',                       href:'/lab/protein',          color:C.green,  grad:`linear-gradient(135deg,${C.green}22,#7c3aed11)` },
  { icon:'📊', tag:'Biochemistry', title:'Spectrophotometry',       desc:'Beer-Lambert, nucleic acid purity (A260/A280/A230 with contamination interpretation), batch mode, dilution back-calculator.',href:'/lab/spectrophotometry',color:C.teal,   grad:`linear-gradient(135deg,${C.teal}22,${C.green}11)` },
]

export default function LabPage() {
  const { user } = useUser()
  const { session } = useSession()
  useEffect(() => {
    if (!user) return
    const key = 'pharmlab_visited_lab_landing'
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      awardXp(session, user.id, 25, 'lab_landing')
    }
  }, [user])

  return (
    <main style={{ fontFamily:"'Inter',system-ui,sans-serif", background:C.bg, minHeight:'100vh', color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        .tool-card { transition: border-color 0.18s, transform 0.18s; }
        .tool-card:hover { border-color: rgba(255,255,255,0.16) !important; transform: translateY(-2px); }
      `}</style>

      {/* Header bar */}
      <div style={{ position:'relative', overflow:'hidden', borderBottom:`1px solid ${C.border}`, height:'120px' }}>
        <ColonyBackground />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, ${C.bg}cc, transparent 40%, transparent 60%, ${C.bg}cc)`, pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'1000px', margin:'0 auto', padding:'0 2rem', height:'100%', display:'flex', alignItems:'center', gap:'16px' }}>
          <Link href="/" style={{ fontSize:'13px', color:C.textDim, textDecoration:'none' }}>← Home</Link>
          <div style={{ width:'1px', height:'16px', background:C.border }} />
          <div>
            <p style={{ fontSize:'11px', color:C.greenLight, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'3px' }}>Lab Prep</p>
            <h1 style={{ fontSize:'22px', fontWeight:'800', letterSpacing:'-0.03em', color:C.text, margin:0 }}>Toolbox</h1>
          </div>
          <div style={{ marginLeft:'auto', fontSize:'12px', color:C.textDim }}>{TOOLS.length} tools</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'2.5rem 2rem' }}>
        {/* Image Analysis first */}
        <p style={{ fontSize:'11px', color:C.textDim, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px' }}>Image Analysis</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'12px', marginBottom:'2.5rem' }}>
          {TOOLS.filter(t=>t.tag==='Image analysis').map(t => <ToolCard key={t.href} t={t} />)}
        </div>

        <p style={{ fontSize:'11px', color:C.textDim, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px' }}>Calculators</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'12px', marginBottom:'2.5rem' }}>
          {TOOLS.filter(t=>t.tag==='Calculations').map(t => <ToolCard key={t.href} t={t} />)}
        </div>

        <p style={{ fontSize:'11px', color:C.textDim, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px' }}>Biochemistry</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'12px' }}>
          {TOOLS.filter(t=>t.tag==='Biochemistry').map(t => <ToolCard key={t.href} t={t} />)}
        </div>
      </div>
    </main>
  )
}

function ToolCard({ t }) {
  return (
    <Link href={t.href} style={{ textDecoration:'none' }}>
      <div className="tool-card" style={{ background:t.grad, border:`1px solid rgba(255,255,255,0.07)`, borderRadius:'14px', padding:'1.5rem', height:'100%', cursor:'pointer' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
          <span style={{ fontSize:'28px' }}>{t.icon}</span>
          <span style={{ fontSize:'10px', color:t.color, fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', background:`${t.color}18`, padding:'3px 9px', borderRadius:'999px', border:`1px solid ${t.color}33` }}>{t.tag}</span>
        </div>
        <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#f0f4ff', marginBottom:'8px', letterSpacing:'-0.02em' }}>{t.title}</h3>
        <p style={{ fontSize:'12px', color:'rgba(240,244,255,0.65)', lineHeight:'1.6' }}>{t.desc}</p>
      </div>
    </Link>
  )
}