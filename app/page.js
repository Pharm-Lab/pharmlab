import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>PharmLab 💊</h1>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      <SignedOut>
        <p style={{ color: '#6b7280' }}>Your pharmacy study tools. Sign in to get started.</p>
      </SignedOut>

      <SignedIn>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Welcome back. What do you want to study today?</p>
        <div style={{ display: 'grid', gap: '12px' }}>
          <a href="/interactions" style={{ display: 'block', padding: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', textDecoration: 'none', color: '#1e40af' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Drug Interaction Checker →</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Check mechanisms, severity, enzyme pathways and exam angles for any drug combination</div>
          </a>
          <a href="/calculator" style={{ display: 'block', padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textDecoration: 'none', color: '#15803d' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>PK/PD Calculator →</div>
           <div style={{ fontSize: '14px', color: '#6b7280' }}>Interactive plasma concentration curves with AI explanations</div>
          </a>
          <a href="/exercises" style={{ display: 'block', padding: '1.25rem', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '12px', textDecoration: 'none', color: '#854d0e' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>PK/PD Exercise Helper →</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Paste any exercise — get full step-by-step working, formulas, substitutions and exam insights</div>
          </a>
        </div>
      </SignedIn>
    </main>
  )
}