'use client'
import { useState, useEffect } from 'react'

export default function MobileRotatePrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function check() {
      const isMobile = window.innerWidth < 768
      const isPortrait = window.innerHeight > window.innerWidth
      setShow(isMobile && isPortrait)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,15,30,0.96)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px', padding: '2rem', textAlign: 'center',
      fontFamily: "'Inter',system-ui,sans-serif",
    }}>
      {/* Rotating phone icon */}
      <div style={{ fontSize: '52px', animation: 'rotatePhone 2s ease-in-out infinite' }}>📱</div>
      <style>{`
        @keyframes rotatePhone {
          0%   { transform: rotate(0deg);   }
          30%  { transform: rotate(0deg);   }
          60%  { transform: rotate(-90deg); }
          90%  { transform: rotate(-90deg); }
          100% { transform: rotate(0deg);   }
        }
      `}</style>

      <div>
        <p style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Rotate your phone
        </p>
        <p style={{ fontSize: '14px', color: 'rgba(240,244,255,0.55)', margin: 0, lineHeight: '1.6' }}>
          PharmLab works best in landscape mode.<br />
          Flip your phone sideways to continue.
        </p>
      </div>

      <button
        onClick={() => setShow(false)}
        style={{
          marginTop: '8px', padding: '8px 20px',
          fontSize: '12px', color: 'rgba(240,244,255,0.35)',
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', cursor: 'pointer',
        }}>
        Continue anyway
      </button>
    </div>
  )
}