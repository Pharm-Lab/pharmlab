import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'

const features = [
  {
    icon: '💊',
    title: 'Drug Interaction Checker',
    description: 'Enter any drug combination and get severity, mechanism, enzyme pathway, a memory hook, and the exam angle — built for students, not clinicians.',
    href: '/interactions',
    color: '#eff6ff',
    border: '#bfdbfe',
    cta: 'Check interactions →'
  },
  {
    icon: '📈',
    title: 'PK/PD Calculator',
    description: 'Interactive plasma concentration-time curves for 5 pharmacokinetic models. Mathematically exact — all calculations use closed-form equations, never AI guesses.',
    href: '/calculator',
    color: '#f0fdf4',
    border: '#bbf7d0',
    cta: 'Open calculator →'
  },
  {
    icon: '🧮',
    title: 'Exercise Helper',
    description: 'Paste any PK/PD exercise and get full step-by-step working with formulas, substitutions, final answers, and exam insights. Handles Emax, compartmental models, renal dosing, and more.',
    href: '/exercises',
    color: '#fef9c3',
    border: '#fde047',
    cta: 'Solve an exercise →'
  },
]

const topics = [
  '1 & 2-compartment models', 'IV bolus & infusion', 'Oral single & multiple dose',
  'Bioavailability & first-pass', 'Renal & hepatic impairment', 'Protein binding',
  'Emax & Hill equation', 'PK/PD linking', 'Drug interactions & CYP450',
  'Non-linear kinetics', 'Population PK & IIV', 'Antibiotic PK/PD indices',
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '4rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: '600', padding: '4px 14px', borderRadius: '999px', marginBottom: '1.25rem', border: '1px solid #bfdbfe' }}>
            Built for pharmacy & biopharmaceutical science students
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', color: '#111827', lineHeight: '1.2', margin: '0 0 1rem' }}>
            Study smarter.<br />
            <span style={{ color: '#2563eb' }}>Understand the maths.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 2rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            PharmLab gives you interactive tools that explain the pharmacokinetics and pharmacodynamics behind your study material — not just answers, but understanding.
          </p>
          <SignedOut>
            <SignInButton>
              <button style={{ padding: '14px 32px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                Get started free →
              </button>
            </SignInButton>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>Free tier available. No credit card required.</p>
          </SignedOut>
          <SignedIn>
            <a href="/exercises" style={{ display: 'inline-block', padding: '14px 32px', background: '#2563eb', color: 'white', borderRadius: '10px', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>
              Open Exercise Helper →
            </a>
          </SignedIn>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: '1.5rem' }}>Three tools, one platform</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '3rem' }}>
          {features.map(f => (
            <div key={f.href} style={{ background: f.color, border: `1px solid ${f.border}`, borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 16px' }}>{f.description}</p>
              <SignedIn>
                <a href={f.href} style={{ fontSize: '14px', fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}>{f.cta}</a>
              </SignedIn>
              <SignedOut>
                <SignInButton>
                  <button style={{ fontSize: '14px', fontWeight: '500', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{f.cta}</button>
                </SignInButton>
              </SignedOut>
            </div>
          ))}
        </div>

        {/* Topics covered */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 1rem' }}>Topics covered</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {topics.map(t => (
              <span key={t} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '4px 14px', fontSize: '13px', color: '#374151' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}