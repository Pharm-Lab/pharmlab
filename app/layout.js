import { ClerkProvider } from '@clerk/nextjs'
import Navbar from './components/Navbar'
import './globals.css'

export const metadata = {
  title: 'PharmLab — Pharmacy Study Tools',
  description: 'Drug interaction checker, PK/PD calculator and exercise helper for pharmacy and biopharmaceutical science students.',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
          <Navbar />
          <div style={{ minHeight: 'calc(100vh - 56px)' }}>
            {children}
          </div>
          <footer style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem', textAlign: 'center', fontSize: '12px', color: '#9ca3af', background: 'white', marginTop: '4rem' }}>
            <p style={{ margin: '0 0 4px' }}>© 2026 PharmLab. Built for pharmacy and biopharmaceutical science students.</p>
            <p style={{ margin: 0, color: '#d1d5db' }}>Educational use only. PharmLab is not a substitute for clinical judgment, professional advice, or validated clinical decision support tools. Always verify drug information with authoritative sources.</p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
