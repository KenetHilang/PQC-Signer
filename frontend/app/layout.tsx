import type { Metadata } from 'next'
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google'
import type { ReactNode } from 'react'

// @ts-ignore
import './globals.css'
import NavBar from '@/components/ui/navbar/navBar'
import TopBar from '@/components/ui/navbar/topBar'
import HeroBackground from '@/components/background/heroBg'
import { ToastProvider } from '@/components/hooks/pushToast'
import { ModeProvider } from '@/components/ui/context/modeContext'

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})


export const metadata: Metadata = {
  title: 'Q-SealNet',
  description: 'Post-quantum ML-DSA signing, verification, patching, and key management.',
  icons: 'PQC_SVG.svg'
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" >
      <body className={`text-white antialiased`}>
        <ModeProvider>
          <TopBar />

          <div className="absolute inset-0 z-0 bg-black">
            {/* <HeroBackground /> */}
          </div>
          
          <main className="relative h-screen">
            <ToastProvider>
              {children}
            </ToastProvider>
          </main>

          <NavBar />
        </ModeProvider>
      </body>
    </html>
  )
}