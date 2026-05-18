'use client'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/interactions', label: 'Interactions' },
    { href: '/calculator', label: 'Calculator' },
    { href: '/exercises', label: 'Exercise Helper' },
    { href: '/harm-reduction', label: 'Harm Reduction' },
  ]

  return (
    <nav style={{
      borderBottom: '1px solid #e5e7eb',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <a href="/" style={{ fontWeight: '700', fontSize: '16px', color: '#111827', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💊 PharmLab
        </a>
        <SignedIn>
          <div style={{ display: 'flex', gap: '4px' }}>
            {links.map(({ href, label }) => (
              <a key={href} href={href} style={{
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: pathname === href ? '#2563eb' : '#6b7280',
                background: pathname === href ? '#eff6ff' : 'transparent',
                fontWeight: pathname === href ? '500' : '400',
              }}>
                {label}
              </a>
            ))}
          </div>
        </SignedIn>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SignedOut>
          <SignInButton>
            <button style={{ padding: '7px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  )
}