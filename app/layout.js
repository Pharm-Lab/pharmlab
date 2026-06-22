import { ClerkProvider } from '@clerk/nextjs'
import Navbar from './components/Navbar'
import MobileRotatePrompt from './components/MobileRotatePrompt'
import WelcomePopup from './components/WelcomePopup'
import PomodoroTimer from './components/PomodoroTimer'
import './globals.css'

export const metadata = {
  title: 'PharmLab',
  description: 'Pharmacokinetics and lab tools for biopharmaceutical sciences students.',
  icons: {
    icon: '/pharmlab_logo.png',
    apple: '/pharmlab_logo.png',
  },
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
          <MobileRotatePrompt />
          <WelcomePopup />
          <Navbar />
          <PomodoroTimer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
