import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';
import NavBar from '@/components/ui/navbar/navBar';
import TopBar from '@/components/ui/navbar/topBar';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Q-SealNet',
  description: 'Post-quantum ML-DSA signing, verification, patching, and key management.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${monoFont.variable} bg-[#0A0A0E] text-white antialiased`}>
        
        <TopBar />
        
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>

        <NavBar />

      </body>
    </html>
  );
}