'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

const C = {
  bg:'#0a0f1e', border:'rgba(255,255,255,0.07)', purple:'#7c3aed', purpleLight:'#c4b5fd',
  pink:'#ec4899', text:'#f0f4ff', textMid:'rgba(240,244,255,0.65)', textDim:'rgba(240,244,255,0.35)',
}

// Purple plasma waves — same as homepage HR slide but subtler
function HRBackground() {
  const canvasRef = useRef(null)
  const frameRef  = useRef(null)
  const tRef      = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (!W || !H) return
      if (canvas.width !== W*dpr || canvas.height !== H*dpr) {
        canvas.width=W*dpr; canvas.height=H*dpr
      }
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const t = tRef.current
      const waves = [
        { amp:H*0.09, freq:0.012, speed:0.005, phase:0,           y:H*0.38, color:'#7c3aed', alpha:0.5,  width:1.8 },
        { amp:H*0.06, freq:0.018, speed:0.007, phase:Math.PI/3,   y:H*0.52, color:'#a855f7', alpha:0.35, width:1.3 },
        { amp:H*0.11, freq:0.008, speed:0.004, phase:Math.PI*0.7, y:H*0.62, color:'#6d28d9', alpha:0.3,  width:2.0 },
        { amp:H*0.05, freq:0.022, speed:0.008, phase:Math.PI*1.2, y:H*0.28, color:'#ec4899', alpha:0.2,  width:1.0 },
      ]

      waves.forEach(w => {
        ctx.beginPath()
        for (let x=0; x<=W; x+=3) {
          const y = w.y + w.amp * Math.sin(w.freq*x + t*w.speed + w.phase)
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
        }
        const grad = ctx.createLinearGradient(0,0,W,0)
        const hex = Math.round(w.alpha*255).toString(16).padStart(2,'0')
        grad.addColorStop(0,   `${w.color}00`)
        grad.addColorStop(0.1, `${w.color}${hex}`)
        grad.addColorStop(0.9, `${w.color}${hex}`)
        grad.addColorStop(1,   `${w.color}00`)
        ctx.strokeStyle=grad; ctx.lineWidth=w.width; ctx.lineJoin='round'; ctx.stroke()
      })

      tRef.current += 1
      ctx.setTransform(1,0,0,1,0,0)
      frameRef.current = requestAnimationFrame(draw)
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.7 }} />
}

const SUBSTANCES = [
  { icon:'🍺', title:'Alcohol',       desc:'BAC simulation using the Widmark model. First-order absorption and zero-order elimination with sex and weight adjustments.',                  href:'/harm-reduction/alcohol',      color:'#f59e0b', grad:'linear-gradient(135deg,#f59e0b22,#f9731611)' },
  { icon:'💊', title:'MDMA',          desc:'1-compartment plasma model with CYP2D6 autoinhibition. Serotonin syndrome risk overlay and redosing guidance.',                            href:'/harm-reduction/mdma',         color:C.purple,  grad:`linear-gradient(135deg,${C.purple}22,${C.pink}11)` },
  { icon:'🌿', title:'Cannabis',      desc:'THC plasma model for smoked and oral routes. Active metabolite 11-OH-THC tracked separately. Route comparison.',                            href:'/harm-reduction/cannabis',     color:'#16a34a', grad:'linear-gradient(135deg,#16a34a22,#0891b211)' },
  { icon:'❄️', title:'Cocaine',       desc:'Intranasal 1-compartment PK model. Cocaethylene formation on combined alcohol use. Cardiovascular risk zone overlay.',                      href:'/harm-reduction/cocaine',      color:'#e2e8f0', grad:'linear-gradient(135deg,#e2e8f011,#94a3b811)' },
  { icon:'⚡', title:'Amphetamines',  desc:'Oral amphetamine and methamphetamine with pH-dependent elimination. Vitamin C acidification comparison.',                                    href:'/harm-reduction/amphetamines', color:'#f97316', grad:'linear-gradient(135deg,#f9731622,#dc262611)' },
  { icon:'🔮', title:'Ketamine',      desc:'2-compartment intranasal model with dissociation threshold zones. K-hole concentration range visualised.',                                   href:'/harm-reduction/ketamine',     color:'#6366f1', grad:'linear-gradient(135deg,#6366f122,#7c3aed11)' },
  { icon:'🧪', title:'Cathinones',    desc:'Mephedrone plasma concentration model with wide uncertainty band. Information cards for other synthetic cathinones.',                        href:'/harm-reduction/cathinones',   color:'#f97316', grad:'linear-gradient(135deg,#f9731622,#eab30811)' },
]

const RESOURCES = [
  { icon:'⚗️', title:'Interaction checker',  desc:'Severity matrix for recreational and prescription drug combinations — mechanism, serotonin syndrome risk, respiratory depression.',  href:'/harm-reduction/interactions', color:'#dc2626', grad:'linear-gradient(135deg,#dc262622,#f9731611)' },
  { icon:'📖', title:'PK graph guide',       desc:'Plain-English explanation of concentration-time curves for non-scientists. What Cmax, Tmax, half-life, and AUC actually mean.',      href:'/harm-reduction/guide',        color:C.purple,  grad:`linear-gradient(135deg,${C.purple}22,#6366f111)` },
]

export default function HarmReductionPage() {
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
        <HRBackground />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, ${C.bg}dd, transparent 35%, transparent 65%, ${C.bg}dd)`, pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'1000px', margin:'0 auto', padding:'0 2rem', height:'100%', display:'flex', alignItems:'center', gap:'16px' }}>
          <Link href="/" style={{ fontSize:'13px', color:C.textDim, textDecoration:'none' }}>← Home</Link>
          <div style={{ width:'1px', height:'16px', background:C.border }} />
          <div>
            <p style={{ fontSize:'11px', color:C.purpleLight, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'3px' }}>Evidence-based</p>
            <h1 style={{ fontSize:'22px', fontWeight:'800', letterSpacing:'-0.03em', color:C.text, margin:0 }}>Harm Reduction</h1>
          </div>
          <div style={{ marginLeft:'auto', fontSize:'12px', color:C.textDim }}>{SUBSTANCES.length} calculators</div>
        </div>
      </div>

      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'2.5rem 2rem' }}>

        {/* Context note */}
        <div style={{ background:`${C.purple}12`, border:`1px solid ${C.purple}30`, borderRadius:'12px', padding:'14px 18px', marginBottom:'2.5rem', display:'flex', gap:'12px', alignItems:'flex-start' }}>
          <span style={{ fontSize:'18px', flexShrink:0 }}>ℹ️</span>
          <p style={{ fontSize:'13px', color:C.textMid, lineHeight:'1.65', margin:0 }}>
            These calculators model pharmacokinetic behaviour based on published clinical data. They are educational tools — not medical advice. Accurate information reduces harm more effectively than abstinence messaging. All sources are listed on the <Link href="/sources" style={{ color:C.purpleLight, textDecoration:'none' }}>Sources page</Link>.
          </p>
        </div>

        {/* Substance calculators */}
        <p style={{ fontSize:'11px', color:C.textDim, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px' }}>Substance calculators</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:'12px', marginBottom:'2.5rem' }}>
          {SUBSTANCES.map(s => <HRCard key={s.href} t={s} />)}
        </div>

        {/* Resources */}
        <p style={{ fontSize:'11px', color:C.textDim, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px' }}>Resources</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:'12px', marginBottom:'2.5rem' }}>
          {RESOURCES.map(s => <HRCard key={s.href} t={s} />)}
        </div>

        {/* Support section — prominent */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:'2rem', marginTop:'1rem' }}>
          <p style={{ fontSize:'11px', color:C.textDim, fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px' }}>Support & Information</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'10px' }}>
            {[
              { name:'Jellinek', desc:'Addiction care and advice — Netherlands', url:'https://www.jellinek.nl', flag:'🇳🇱' },
              { name:'Trimbos Instituut', desc:'National drug monitor, research, and helpline', url:'https://www.trimbos.nl', flag:'🇳🇱' },
              { name:'Drugsinfo.nl', desc:'Independent drug information and testing info', url:'https://www.drugsinfo.nl', flag:'🇳🇱' },
              { name:'TripSit', desc:'Real-time drug information and harm reduction chat', url:'https://tripsit.me', flag:'🌍' },
              { name:'DanceSafe', desc:'Harm reduction at events — drug checking, info', url:'https://dancesafe.org', flag:'🌍' },
              { name:'The Loop', desc:'Festival drug checking and welfare services', url:'https://wearetheloop.org', flag:'🌍' },
            ].map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener" style={{ textDecoration:'none' }}>
                <div style={{
                  display:'flex', alignItems:'flex-start', gap:'12px',
                  padding:'14px 16px', borderRadius:'12px',
                  background:`${C.purple}0a`, border:`1px solid ${C.purple}22`,
                  transition:'border-color 0.15s, background 0.15s',
                  cursor:'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background=`${C.purple}18`; e.currentTarget.style.borderColor=`${C.purple}44` }}
                onMouseLeave={e => { e.currentTarget.style.background=`${C.purple}0a`; e.currentTarget.style.borderColor=`${C.purple}22` }}
                >
                  <span style={{ fontSize:'20px', flexShrink:0 }}>{s.flag}</span>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:C.purpleLight, marginBottom:'3px' }}>{s.name}</div>
                    <div style={{ fontSize:'12px', color:'rgba(240,244,255,0.5)', lineHeight:'1.5' }}>{s.desc}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p style={{ fontSize:'12px', color:C.textDim, marginTop:'16px', lineHeight:'1.65' }}>
            If you or someone you know is in crisis, please reach out to one of the services above or contact your local emergency services.
          </p>
        </div>
      </div>
    </main>
  )
}

function HRCard({ t }) {
  return (
    <Link href={t.href} style={{ textDecoration:'none' }}>
      <div className="tool-card" style={{ background:t.grad, border:`1px solid rgba(255,255,255,0.07)`, borderRadius:'14px', padding:'1.5rem', height:'100%', cursor:'pointer' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
          <span style={{ fontSize:'28px' }}>{t.icon}</span>
        </div>
        <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#f0f4ff', marginBottom:'8px', letterSpacing:'-0.02em' }}>{t.title}</h3>
        <p style={{ fontSize:'12px', color:'rgba(240,244,255,0.65)', lineHeight:'1.6' }}>{t.desc}</p>
      </div>
    </Link>
  )
}