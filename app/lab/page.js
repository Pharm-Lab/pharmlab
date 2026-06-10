export default function LabPage() {
  const cards = [
    {
      href: '/lab/dilution',
      emoji: '🧫',
      title: 'Dilution calculator',
      desc: 'C₁V₁ = C₂V₂ solver, serial dilutions, and stock solution preparation.',
      accent: '#2563eb',
    },
    {
      href: '/lab/molarity',
      emoji: '⚗️',
      title: 'Molarity calculator',
      desc: 'Interconvert mass, moles, molarity, and volume. Includes unit conversions.',
      accent: '#2563eb',
    },
    {
      href: '/lab/buffer',
      emoji: '🧪',
      title: 'Buffer preparation',
      desc: 'Henderson-Hasselbalch — find base:acid ratio for target pH or pH from volumes.',
      accent: '#2563eb',
    },
    {
      href: '/lab/converter',
      emoji: '🔄',
      title: 'Unit converter',
      desc: 'Concentration, mass, volume, pressure, and temperature — all in one place.',
      accent: '#2563eb',
    },
    {
      href: '/lab/colonies',
      emoji: '🔬',
      title: 'Colony counter',
      desc: 'Upload a plate image, click to mark colonies manually or use auto-threshold detection.',
      accent: '#7c3aed',
    },
    {
      href: '/lab/tlc',
      emoji: '🟡',
      title: 'TLC analyser',
      desc: 'Upload a TLC plate image, mark spots, and calculate Rf values with export.',
      accent: '#7c3aed',
    },
    {
      href: '/lab/gel',
      emoji: '🔬',
      title: 'Gel image analyser',
      desc: 'Upload a gel photo, mark ladder bands and unknowns, get MW estimates from a standard curve.',
      accent: '#16a34a',
    },
    {
      href: '/lab/protein',
      emoji: '🧬',
      title: 'Protein tools',
      desc: 'Bradford/BCA standard curves with concentration back-calculation, plus pI and ε₂₈₀ from sequence.',
      accent: '#16a34a',
    },
    {
      href: '/lab/spectrophotometry',
      emoji: '📊',
      title: 'Spectrophotometry',
      desc: 'Beer-Lambert calculator, nucleic acid purity (A260/A280/A230), batch samples, dilution back-calculator.',
      accent: '#16a34a',
    },
  ]

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Lab Prep Toolbox</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Calculators and image analysis tools for practical work. All calculations are exact — no AI involved.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {cards.map(card => (
          <a key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              height: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{card.emoji}</div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>{card.title}</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>{card.desc}</p>
              <span style={{ fontSize: '12px', color: card.accent, fontWeight: '500' }}>Open →</span>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}