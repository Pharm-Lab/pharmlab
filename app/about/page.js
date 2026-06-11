'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed', purpleLight: '#c4b5fd',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

const FLOATERS = ['🧪','⚗️','💊','🔬','🫀','📈','✨','🌙','⭐','🎵','🎹','🧬','🩺','🌿','💫','🎯','🔭','💉']

function FloatCanvas() {
  const ref = useRef(null)
  const particles = useRef([])
  const frame = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    particles.current = Array.from({ length: 18 }, (_, i) => ({
      emoji: FLOATERS[i % FLOATERS.length],
      x: 15 + Math.random() * (W - 30),
      // stagger initial positions throughout the canvas height so they don't all appear at once
      y: Math.random() * H * 2,
      size: 13 + Math.random() * 13,
      speed: 0.18 + Math.random() * 0.22,   // slower
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.006 + Math.random() * 0.008,
      wobbleAmp: 10 + Math.random() * 18,
      baseAlpha: 0.3 + Math.random() * 0.35,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.current.forEach(p => {
        p.y -= p.speed
        p.wobble += p.wobbleSpeed
        const x = p.x + Math.sin(p.wobble) * p.wobbleAmp

        // reset when fully above canvas
        if (p.y < -60) {
          p.y = H + 40 + Math.random() * 80
          p.x = 15 + Math.random() * (W - 30)
        }

        // smooth fade in from bottom, fade out near top — longer transition zone to avoid blipping
        const fadeIn  = Math.min(1, (H - p.y) / 150)
        const fadeOut = Math.min(1, (p.y + 100) / 150)
        const alpha = p.baseAlpha * Math.max(0, Math.min(fadeIn, fadeOut))

        if (alpha < 0.01) return   // skip invisible particles entirely

        ctx.globalAlpha = alpha
        ctx.font = `${p.size}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(p.emoji, x, p.y)
      })
      ctx.globalAlpha = 1
      frame.current = requestAnimationFrame(draw)
    }

    frame.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame.current)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

const sections = [
  {
    label: 'Origin',
    title: 'Why I built this',
    paras: [
      "I'm doing a master's in Biopharmaceutical Sciences at Leiden — did my bachelor's in Bio-pharmaceutische Wetenschappen (BFW) there too. This started as a way to not let that bachelor go completely to waste and stay sharp on things I'd spent four years learning.",
      "If I weren't doing this I'd be making the nth modded Minecraft server to play with friends, producing hard electronic music, or just letting it all go at a rave for a bit. I nerd out. Occasionally geek tf out. Pharmacokinetics and raves are not as far apart as they sound — and that's actually where the harm reduction side of this came from.",
      "Within my friend group — mostly pharmacy and bioscience students — we've sometimes literally modelled our own pharmacology. Because we could, and because it's useful. Meanwhile I was manually counting colonies by hand in practicals thinking 'there has to be a better way' (there was — I used ImageJ — but it still felt clunky). At some point it just seemed weird that none of this existed somewhere accessible, outside of university courses or tools built for academic and industrial labs.",
    ],
  },
  {
    label: 'For who',
    title: "Who it's for",
    paras: [
      "Primarily BFW and BPS students at Leiden, since that's where this came from — but honestly anyone in a related programme. Pharmacy, biomedical sciences, a similar HBO track, or just someone anywhere in the world following a curriculum that touches on this stuff.",
      "If you've had a PK course and want to actually interact with the equations rather than just read about them, this is for you. The lab tools are for anyone spending time at a bench. The harm reduction section has no prerequisites.",
    ],
  },
  {
    label: 'Harm reduction',
    title: 'Why that section is free',
    paras: [
      "Accurate information reduces harm better than scare tactics. That's not a take — it's the entire foundation of harm reduction as a public health field. There are plenty of harm reduction sites out there, and most of them do genuinely useful work. But I hadn't seen one approach it from a pharmacokinetics angle: actual models, actual parameters, here's what your body does and when.",
      "BPS students kind of have that background by default. It seemed worth making it more accessible to people who didn't spend three years studying drug metabolism. I go to parties. I think people deserve to understand the pharmacology of what they're taking. Those tools are free and will stay that way.",
    ],
  },
  {
    label: 'Process',
    title: 'On using Claude',
    paras: [
      "I used Claude throughout development — it made execution faster and got me to something polished without months of grinding solo. The site in its current form wouldn't exist without it.",
      "The thinking is mine though. The parameters, the framing, what to build and why — that came from four years of courses and actually caring about this stuff. Claude wrote a lot of the code. I decided what it should do.",
      "I'd rather be upfront about that than pretend otherwise. I don't think AI is magic, but taking on a large chunk of the implementation work for a project like this seems like a completely reasonable use of it.",
    ],
  },
]

export default function AboutPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .about-p { font-size: 14px; color: rgba(240,244,255,0.62); line-height: 1.8; margin: 0 0 12px; }
        .about-p:last-child { margin-bottom: 0; }
      `}</style>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '440px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>

        {/* Floating emojis — right side */}
        <div style={{ position: 'absolute', right: 0, top: 0, width: '42%', height: '100%' }}>
          <FloatCanvas />
          {/* left-edge fade */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${C.bg} 0%, transparent 40%)`, pointerEvents: 'none' }} />
          {/* bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: `linear-gradient(to bottom, transparent, ${C.bg})`, pointerEvents: 'none' }} />
        </div>

        {/* Text */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', padding: '5rem 2rem', width: '100%' }}>
          <div style={{ maxWidth: '500px' }}>
            <Link href="/" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← PharmLab</Link>
            <p style={{ fontSize: '11px', color: C.blueLight, fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px' }}>About</p>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: '800', color: C.text, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 20px' }}>
              A student project<br />
              <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                that got out of hand.
              </span>
            </h1>
            <p style={{ fontSize: '15px', color: C.textMid, lineHeight: '1.7', margin: 0 }}>
              Built in between lectures, practicals, and parties. Turned into something I actually think is useful.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem 5rem' }}>
          {sections.map((s, i) => (
            <div key={i}>
              <p style={{ fontSize: '10px', color: C.blueLight, fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
              <h2 style={{ fontSize: '19px', fontWeight: '700', color: C.text, letterSpacing: '-0.02em', margin: '0 0 14px' }}>{s.title}</h2>
              {s.paras.map((p, j) => <p key={j} className="about-p">{p}</p>)}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: '13px', color: C.textDim, lineHeight: '1.7', maxWidth: '580px', margin: '0 0 24px' }}>
            PharmLab is an independent student project — not affiliated with Leiden University or any institution. Educational purposes only. PK models use population averages. Nothing here is medical advice.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link href="/tools"          style={{ fontSize: '13px', color: C.blueLight,   textDecoration: 'none' }}>Academic tools →</Link>
            <Link href="/lab"            style={{ fontSize: '13px', color: C.blueLight,   textDecoration: 'none' }}>Lab toolkit →</Link>
            <Link href="/harm-reduction" style={{ fontSize: '13px', color: C.purpleLight, textDecoration: 'none' }}>Harm reduction →</Link>
            <Link href="/sources"        style={{ fontSize: '13px', color: C.textDim,     textDecoration: 'none' }}>Sources →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}