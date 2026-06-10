import { ClerkProvider } from '@clerk/nextjs'
import Navbar from './components/Navbar'
import './globals.css'

export const metadata = {
  title: 'PharmLab',
  description: 'Pharmacokinetics and lab tools for biopharmaceutical sciences students.',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body style={{
          margin: 0,
          padding: 0,
          background: '#0a0f1e',
          color: '#f0f4ff',
          fontFamily: "'Inter', system-ui, sans-serif",
          minHeight: '100vh',
        }}>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
