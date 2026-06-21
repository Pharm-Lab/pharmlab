'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

export default function WelcomePopup() {
  const { isSignedIn, isLoaded } = useUser()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) return
    const seen = sessionStorage.getItem('pharmlab_welcome')
    if (!seen) setTimeout(() => setShow(true), 1200)
  }, [isLoaded, isSignedIn])

  function dismiss() {
    sessionStorage.setItem('pharmlab_welcome', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      <div onClick={dismiss} style={{
        position: 'fixed', inset: 0, zIndex: 998,
        background: 'rgba(10,15,30,0.75)',
        backdropFilter: 'blur(6px)',
      }} />

      <div style={{
        position: 'fixed', zIndex: 999,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(380px, calc(100vw - 2rem))',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '18px',
        padding: '26px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        fontFamily: "'Inter',system-ui,sans-serif",
      }}>

        {/* Close */}
        <button onClick={dismiss} style={{
          position: 'absolute', top: '14px', right: '16px',
          background: 'none', border: 'none', color: C.textDim,
          fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '2px 6px',
        }}>×</button>

        {/* Header */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '26px', marginBottom: '10px' }}>👋</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Welcome to PharmLab
          </h2>
          <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: '1.65' }}>
            PK tools, lab calculators, and harm reduction resources built by a BPS student at Leiden. Create an account to access the academic and lab tools, save your progress, and unlock features as they roll out.
          </p>
        </div>

        {/* Free tools box */}
        <div style={{
          background: `${C.blue}10`, border: `1px solid ${C.blue}28`,
          borderRadius: '10px', padding: '12px 14px', marginBottom: '8px'
        }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: C.blueLight, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
            Free during early access
          </p>
          {[
            { emoji: '📐', text: 'All academic PK/PD tools' },
            { emoji: '🧪', text: 'All lab prep calculators' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
              <span style={{ fontSize: '14px' }}>{item.emoji}</span>
              <span style={{ fontSize: '13px', color: C.textMid }}>{item.text}</span>
            </div>
          ))}
          {/* Coming soon — greyed */}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.45 }}>
              <span style={{ fontSize: '14px' }}>👥</span>
              <span style={{ fontSize: '13px', color: C.textMid }}>Study groups</span>
              <span style={{ fontSize: '10px', color: C.textDim, marginLeft: 'auto', fontStyle: 'italic' }}>in development</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.45 }}>
              <span style={{ fontSize: '14px' }}>📋</span>
              <span style={{ fontSize: '13px', color: C.textMid }}>Quiz bank</span>
              <span style={{ fontSize: '10px', color: C.textDim, marginLeft: 'auto', fontStyle: 'italic' }}>in development</span>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: C.textDim, margin: '10px 0 0', lineHeight: '1.5' }}>
            Early users will be rewarded — sign up now to lock in free access before full launch.
          </p>
        </div>

        {/* Always free box */}
        <div style={{
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '10px', padding: '12px 14px', marginBottom: '16px'
        }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
            Always free — no account needed
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>💊</span>
            <span style={{ fontSize: '13px', color: C.textMid }}>All harm reduction tools</span>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SignInButton mode="modal">
            <button style={{
              width: '100%', padding: '11px', borderRadius: '10px',
              background: C.blue, color: 'white', border: 'none',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              fontFamily: "'Inter',system-ui,sans-serif",
              letterSpacing: '-0.01em',
            }}>
              Create free account
            </button>
          </SignInButton>
          <SignInButton mode="modal">
            <button style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              background: 'transparent', color: C.textMid,
              border: `1px solid ${C.border}`,
              fontSize: '13px', cursor: 'pointer',
              fontFamily: "'Inter',system-ui,sans-serif",
            }}>
              Sign in
            </button>
          </SignInButton>
          <button onClick={dismiss} style={{
            width: '100%', padding: '8px', borderRadius: '10px',
            background: 'transparent', color: C.textDim,
            border: 'none', fontSize: '12px', cursor: 'pointer',
            fontFamily: "'Inter',system-ui,sans-serif",
          }}>
            Continue without account
          </button>
        </div>

      </div>
    </>
  )
}