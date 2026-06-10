import Link from 'next/link'

const TOOLS = [
  {
    href: '/lab/dilution',
    icon: '🧫',
    label: 'Dilution calculator',
    desc: 'C₁V₁ = C₂V₂ solver and serial dilution generator.',
    color: '#2563eb',
  },
  {
    href: '/lab/molarity',
    icon: '⚗️',
    label: 'Molarity calculator',
    desc: 'Interconvert mass, moles, molarity, and volume.',
    color: '#2563eb',
  },
  {
    href: '/lab/buffer',
    icon: '🧪',
    label: 'Buffer preparation',
    desc: 'Henderson-Hasselbalch, pH from volumes, common buffer reference.',
    color: '#2563eb',
  },
  {
    href: '/lab/converter',
    icon: '🔄',
    label: 'Unit converter',
    desc: 'Concentration, mass, volume, pressure, temperature.',
    color: '#2563eb',
  },
  {
    href: '/lab/colonies',
    icon: '🔬',
    label: 'Colony counter',
    desc: 'Upload a plate image, click to mark colonies, export annotated PNG with count.',
    color: '#16a34a',
  },
  {
    href: '/lab/tlc',
    icon: '📊',
    label: 'TLC analyser',
    desc: 'Upload a TLC plate, mark baseline and solvent front, click spots for instant Rf values.',
    color: '#7c3aed',
  },
]

export default function LabPrep() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Lab Prep Toolbox</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Calculators and image tools for practical lab work. All calculations are instant — no AI involved.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {TOOLS.map(t => (
          <Link key={t.href} href={t.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{t.icon}</div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>{t.label}</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px', lineHeight: '1.5' }}>{t.desc}</p>
              <span style={{ fontSize: '12px', color: t.color, fontWeight: '500' }}>Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}