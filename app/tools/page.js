'use client'
import { useEffect, useRef } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import { awardXp } from '../../lib/xp'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', bgCard: '#0f1629', border: 'rgba(255,255,255,0.07)',
  borderHov: 'rgba(255,255,255,0.15)', blue: '#2a6fdb', blueLight: '#93b4f7',
  purple: '#7c3aed', text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)',
  textDim: 'rgba(240,244,255,0.35)',
}

function PKBackground() {
  const canvasRef = useRef(null)
  const frameRef  = useRef(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (!W || !H) return
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr; canvas.height = H * dpr
      }
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const tWin = 24, off = offsetRef.current % tWin
      const curves = [
        { F:0.85, D:500, Vd:35,  ka:1.2,  ke:0.115, alpha:0.22, width:1.8, yOff: H*0.35 },
        { F:0.7,  D:300, Vd:28,  ka:0.8,  ke:0.09,  alpha:0.12, width:1.2, yOff: H*0.55 },
        { F:0.9,  D:700, Vd:50,  ka:1.8,  ke:0.15,  alpha:0.08, width:1.0, yOff: H*0.2  },
        { F:0.6,  D:400, Vd:42,  ka:0.6,  ke:0.07,  alpha:0.07, width:1.0, yOff: H*0.65 },
      ]

      curves.forEach(({ F, D, Vd, ka, ke, alpha, width, yOff }) => {
        const conc = t => Math.abs(ka-ke)<1e-10 ? 0 : Math.max(0,(F*D*ka)/(Vd*(ka-ke))*(Math.exp(-ke*t)-Math.exp(-ka*t)))
        const tPeak = Math.log(ka/ke)/(ka-ke)
        const maxC = conc(tPeak) * 1.3
        const yS = c => yOff - (Math.min(c,maxC)/maxC) * (H * 0.28)

        for (let cycle = -1; cycle <= 1; cycle++) {
          ctx.beginPath()
          let started = false
          for (let i = 0; i <= 400; i++) {
            const t = (i/400)*tWin*2
            const ts = t - off + cycle*tWin
            if (ts < -2 || ts > tWin+2) continue
            const x = (ts/tWin)*W, y = yS(conc(t))
            if (!started) { ctx.moveTo(x,y); started=true } else ctx.lineTo(x,y)
          }
          const grad = ctx.createLinearGradient(0,0,W,0)
          grad.addColorStop(0,   `rgba(42,111,219,0)`)
          grad.addColorStop(0.2, `rgba(42,111,219,${alpha})`)
          grad.addColorStop(0.8, `rgba(124,58,237,${alpha})`)
          grad.addColorStop(1,   `rgba(124,58,237,0)`)
          ctx.strokeStyle = grad; ctx.lineWidth = width
          ctx.lineJoin = 'round'; ctx.stroke()
        }
      })

      offsetRef.current += 0.012
      ctx.setTransform(1,0,0,1,0,0)
      frameRef.current = requestAnimationFrame(draw)
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.6 }} />
}

const TOOLS = [
  { icon:'📈', tag:'PK/PD', title:'PK/PD Calculator', desc:'Twelve models including 1- and 2-compartment, Michaelis-Menten, and population PK with RK4 integration.', href:'/calculator', color:C.blue, grad:`linear-gradient(135deg,${C.blue}22,${C.purple}11)` },
  { icon:'💊', tag:'Dosing', title:'Dosage Adjustment', desc:'Renal impairment via Cockcroft-Gault and hepatic impairment via Child-Pugh, with dose curve comparison.', href:'/tools/dosage-adjustment', color:'#16a34a', grad:'linear-gradient(135deg,#16a34a22,#0891b211)' },
  { icon:'🫀', tag:'ADME', title:'Interactive ADME', desc:'Click organs on an anatomical diagram to explore absorption, first-pass, distribution, BBB, and renal excretion.', href:'/tools/adme', color:'#f97316', grad:'linear-gradient(135deg,#f9731622,#dc262611)' },
  { icon:'📉', tag:'NCA', title:'NCA Tool', desc:'Non-compartmental analysis — trapezoidal AUC, λz regression, interactive terminal point selection.', href:'/tools/nca', color:C.blue, grad:`linear-gradient(135deg,${C.blue}22,#0891b211)` },
  { icon:'⚖️', tag:'Bioequivalence', title:'Bioequivalence Analyser', desc:'TOST procedure, 90% confidence interval plot, FDA and EMA acceptance criteria.', href:'/tools/bioequivalence', color:C.purple, grad:`linear-gradient(135deg,${C.purple}22,#ec489911)` },
  { icon:'🧪', tag:'Analytics', title:'Analytical Technique Trainer', desc:'Decision trainer, technique explorer, and quiz covering RP-HPLC, GC, IEX, SEC, CE, SPE, and LLE.', href:'/tools/analytics', color:'#0891b2', grad:'linear-gradient(135deg,#0891b222,#16a34a11)' },
  { icon:'⚗️', tag:'Physical chemistry', title:'pKa & Ionisation', desc:'pKa explorer for eight functional groups with Henderson-Hasselbalch ionisation curve and key pH table.', href:'/tools/pka', color:'#f97316', grad:'linear-gradient(135deg,#f9731622,#eab30811)' },
  { icon:'💧', tag:'Formulation', title:'Dissolution & Drug Release', desc:'Noyes-Whitney simulator, release profile modelling, and BCS classification with formulation strategy.', href:'/tools/dissolution', color:'#16a34a', grad:'linear-gradient(135deg,#16a34a22,#0891b211)' },
  { icon:'🔬', tag:'Drug design', title:'Lipinski & Drug-likeness', desc:'Rule of Five calculator with per-rule explanations and marketed drug examples.', href:'/tools/lipinski', color:C.blue, grad:`linear-gradient(135deg,${C.blue}22,#16a34a11)` },
  { icon:'🔭', tag:'Analytical', title:'Mass Spectrometry Interpreter', desc:'Neutral loss identification, isotope patterns, fragmentation rules, and six curated drug practice spectra.', href:'/tools/mass-spec', color:'#0891b2', grad:'linear-gradient(135deg,#0891b222,#6366f111)' },
  { icon:'✏️', tag:'AI-assisted', title:'Exercise Helper', desc:'Step-by-step solutions to PK/PD problems with exam tips and follow-up questions.', href:'/exercises', color:C.purple, grad:`linear-gradient(135deg,${C.purple}22,${C.blue}11)` },
  { icon:'⚗️', tag:'AI-assisted', title:'Drug Interaction Checker', desc:'Mechanism-level interaction analysis — enzyme pathway, severity, and clinical management.', href:'/interactions', color:'#dc2626', grad:'linear-gradient(135deg,#dc262622,#f9731611)' },
]

export default function ToolsPage() {
  const { user } = useUser()
  const { session } = useSession()

  useEffect(() => {
    if (!user) return
    const key = 'pharmlab_visited_tools_landing'
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      awardXp(session, user.id, 25, 'tools_landing')
    }
  }, [user])

  return (
    <main style={{ fontFamily:"'Inter',system-ui,sans-serif", background:C.bg, minHeight:'100vh', color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        .tool-card { transition: border-color 0.18s, transform 0.18s, background 0.18s; }
        .tool-card:hover { border-color: rgba(255,255,255,0.16) !important; transform: translateY(-2px); }
      `}</style>

      <div style={{ position:'relative', overflow:'hidden', borderBottom:`1px solid ${C.border}`, height:'120px' }}>
        <PKBackground />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, ${C.bg}cc, transparent 40%, transparent 60%, ${C.bg}cc)`, pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'1000px', margin:'0 auto', padding:'0 2rem', height:'100%', display:'flex', alignItems:'center', gap:'16px' }}>
          <Link href="/" style={{ fontSize:'13px', color:C.textDim, textDecoration:'none' }}>← Home</Link>
          <div style={{ width:'1px', height:'16px', background:C.border }} />
          <div>
            <p style={{ fontSize:'11px', color:C.blueLight, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'3px' }}>Academic</p>
            <h1 style={{ fontSize:'22px', fontWeight:'800', letterSpacing:'-0.03em', color:C.text, margin:0 }}>Tools</h1>
          </div>
          <div style={{ marginLeft:'auto', fontSize:'12px', color:C.textDim }}>{TOOLS.length} tools</div>
        </div>
      </div>

      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'2.5rem 2rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'12px' }}>
          {TOOLS.map(t => (
            <Link key={t.href} href={t.href} style={{ textDecoration:'none' }}>
              <div className="tool-card" style={{ background:t.grad, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'1.5rem', height:'100%', cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                  <span style={{ fontSize:'28px' }}>{t.icon}</span>
                  <span style={{ fontSize:'10px', color:t.color, fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', background:`${t.color}18`, padding:'3px 9px', borderRadius:'999px', border:`1px solid ${t.color}33` }}>{t.tag}</span>
                </div>
                <h3 style={{ fontSize:'15px', fontWeight:'700', color:C.text, marginBottom:'8px', letterSpacing:'-0.02em' }}>{t.title}</h3>
                <p style={{ fontSize:'12px', color:C.textMid, lineHeight:'1.6' }}>{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:`1px solid ${C.border}` }}>
          <Link href="/formulas" style={{ fontSize:'13px', color:C.textDim, textDecoration:'none' }}>
            Formula Reference — searchable equation database →
          </Link>
        </div>
      </div>
    </main>
  )
}