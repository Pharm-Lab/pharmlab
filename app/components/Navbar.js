'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'

const LINKS = [
  { href: '/tools',          label: 'Tools' },
  { href: '/lab',            label: 'Lab Prep' },
  { href: '/formulas',       label: 'Formulas' },
  { href: '/quiz',           label: 'Quiz' },
  { href: '/play',           label: 'Play' },
  { href: '/harm-reduction', label: 'Harm Reduction' },
  { href: '/sources',        label: 'Sources' },
  { href: '/about',          label: 'About' },
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
          gap: 10px;
          line-height: 1;
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
          <svg width="32" height="32" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
            <ellipse cx="399.99999" cy="400.00001" rx="256" ry="256" stroke={accentColor} strokeWidth="38" fill="none"/>
            <path d="M188.33331,519.6217 C202.83331,517.6217 218.33331,499.6217 239.08331,459.6217 C257.20831,427.6217 268.08331,369.6217 293.45831,344.6217 C311.58331,321.6217 329.70831,321.6217 347.83331,337.6217 C369.58331,357.6217 384.08331,399.6217 405.83331,439.6217 C427.58331,477.6217 450.45831,504.6217 482.95831,517.6217 C515.45831,527.6217 551.95831,531.6217 624.45832,533.6217" stroke={accentColor} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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

        {/* Right: auth */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{
              elements: { avatarBox: { width: 30, height: 30 } }
            }}>
              <UserButton.MenuItems>
                <UserButton.Link label="My Profile" labelIcon={<span>👤</span>} href="/user" />
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{
                padding: '6px 16px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(240,244,255,0.8)',
                fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>Sign in</button>
            </SignInButton>
          </SignedOut>
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