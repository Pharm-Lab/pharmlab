import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PharmLab</h1>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      <SignedOut>
        <p>Your pharmacy study tools. Sign in to get started.</p>
      </SignedOut>
      <SignedIn>
        <p>Welcome to PharmLab! Your tools are coming soon.</p>
      </SignedIn>
    </main>
  )
}