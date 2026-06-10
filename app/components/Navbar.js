'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const LINKS = [
  { href: '/tools',          label: 'Tools' },
  { href: '/lab',            label: 'Lab Prep' },
  { href: '/formulas',       label: 'Formulas' },
  { href: '/harm-reduction', label: 'Harm Reduction' },
  { href: '/sources',        label: 'Sources' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const isHR = pathname?.startsWith('/harm-reduction')
  const accentColor = isHR ? '#7c3aed' : '#2a6fdb'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: rgba(240,244,255,0.6);
          text-decoration: none;
          padding: 6px 2px;
          position: relative;
          transition: color 0.15s;
          letter-spacing: -0.01em;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .nav-link:hover { color: rgba(240,244,255,0.95); }
        .nav-link.active { color: #f0f4ff; }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0; right: 0;
          height: 2px;
          border-radius: 999px;
          background: var(--nav-accent);
        }
        .nav-logo {
          font-size: 17px;
          font-weight: 800;
          color: #f0f4ff;
          text-decoration: none;
          letter-spacing: -0.04em;
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-logo:hover { color: #fff; }
        @media (max-width: 680px) {
          .nav-links-desktop { display: none !important; }
          .nav-menu-btn { display: flex !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        background: scrolled
          ? 'rgba(10,15,30,0.92)'
          : 'rgba(10,15,30,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.25s, border-color 0.25s',
        '--nav-accent': accentColor,
      }}>

        {/* Logo */}
        <Link href="/" className="nav-logo">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke={accentColor} strokeWidth="1.5" fill="none"/>
            <path d="M6 13 Q8 7 10 10 Q12 13 14 7" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          PharmLab
        </Link>

        {/* Desktop links */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '28px', marginLeft: '36px', flex: 1 }}>
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link${pathname?.startsWith(l.href) ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right: user button */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserButton afterSignOutUrl="/" appearance={{
            elements: {
              avatarBox: { width: 30, height: 30 },
            }
          }} />
        </div>

        {/* Mobile menu button */}
        <button
          className="nav-menu-btn"
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'none',
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'rgba(240,244,255,0.7)',
            cursor: 'pointer',
            padding: '6px',
            flexDirection: 'column',
            gap: '4px',
          }}
          aria-label="Menu"
        >
          {[0,1,2].map(i => (
            <span key={i} style={{ display: 'block', width: '20px', height: '2px', background: 'currentColor', borderRadius: '999px', transition: 'opacity 0.15s' }} />
          ))}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '56px', left: 0, right: 0,
          zIndex: 99,
          background: 'rgba(10,15,30,0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 0',
        }}>
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'block',
                padding: '12px 1.5rem',
                fontSize: '15px',
                fontWeight: '500',
                color: pathname?.startsWith(l.href) ? '#f0f4ff' : 'rgba(240,244,255,0.6)',
                textDecoration: 'none',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Spacer so content clears the fixed nav */}
      <div style={{ height: '56px' }} />
    </>
  )
}